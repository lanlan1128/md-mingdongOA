const mssql = require('mssql');
const async = require('async');
const dao = require('./dao.js');
const sql = require('./sql.js');
var debug = require('debug')('dev:server');

var server = {};

// 事务类
server.transaction = function(processfunc, func) {
    sql.connect(function(err, pool) {
        if(err) {
            func(err);
            return;
        }

        // 开始事务  
        const transaction = new mssql.Transaction(pool);
        transaction.begin(function(err) {  
            if (err) {  
                console.error(err); 
                return;  
            }  

            var rolledBack = false;  

            //监听回滚事件  
            transaction.on('rollback', function(aborted) {
                rolledBack = true;
                debug('rollback success.'); 
            });

            //监听提交事件  
            transaction.on('commit', function() {  
                debug('Transaction committed.'); 
            });  

            // 执行数据库操作
            var request = new mssql.Request(transaction);  
            var rollbackErr;

            // 回滚回调
            function rolledBackCallback(err, result) {
                // 预处理
                if(!err && rolledBackCallback.lastProcessfunc) {
                    var scope = {err: err, result: result};
                    rolledBackCallback.lastProcessfunc.call(scope);
                    err = scope.err;
                    result = scope.result;
                } 

                if (err) {  
                    debug('出现错误,执行回滚');
                    rollbackErr = err;

                    if (!rolledBack) {  
                        transaction.rollback(function(err) {
                            if (err) {
                                console.log('rollback err :', err);
                                func(err);
                                return;
                            }

                            func(rollbackErr);
                        });
                    }
                } else {  
                    debug('提交事务');

                    transaction.commit(function(err) {
                        if (err) {
                            console.log('commit err :', err);
                            func(err);
                            return;
                        }

                        func(null, result)
                    });
                } 
            }

            // 执行数据库操作函数
            processfunc(request, rolledBackCallback)

        }) // transaction begin
    });
}

// 登录
server.login = function(loginname, func) {
    var processfunc = function(request, rolledBackCallback) {
        async.waterfall([
            // 查询用户
            async.apply(dao.findOperByLoginname, request, loginname),

            function(result, callback) {
                if(result.recordset.length === 0) {
                    // 插入用户
                    dao.addOperByLoginname(request, loginname, callback);
                    return;

                }else {
                    // 查询用户信息
                    dao.findOperById(request, result.recordset[0].OPERID, callback)
                    return;
                }
            }
            
        ], rolledBackCallback);
    }

    // 调用事务类
    server.transaction(processfunc, func);
}


// 更新用户昵称
server.updateNickname = function(namecn, operid, func) {
    var processfunc = function(request, rolledBackCallback) {
        async.waterfall([
            async.apply(dao.updateNamecnByOperid, request, namecn, operid),

            function(result, callback) {
                if(result && result.rowsAffected[0] == 1) {
                    dao.findOperById(request, operid, callback);
                    return;
                }

                callback({retmsg: '更新用户昵称失败'});   // error callback 
            }

        ], rolledBackCallback);
    }

    // 调用事务类
    server.transaction(processfunc, func);
}


// 获取用户的成员角色
server.queryRole = function(operid, func) {
    var processfunc = function(request, rolledBackCallback) {
        async.waterfall([
            async.apply(dao.findRole, request, operid)

        ], rolledBackCallback);
    }

    // 调用事务类
    server.transaction(processfunc, func);
}

// 获取成员列表
server.queryOpers = function(func) {
    var processfunc = function(request, rolledBackCallback) {
        async.waterfall([
            async.apply(dao.findOpers, request)

        ], rolledBackCallback);
    }

    // 调用事务类
    server.transaction(processfunc, func);
}

// 获取用户所属的项目
server.queryProjects = function(operid, func) {
    var processfunc = function(request, rolledBackCallback) {
        async.waterfall([
            async.apply(dao.findProjectsByOperid, request, operid)

        ], rolledBackCallback);
    }

    // 调用事务类
    server.transaction(processfunc, func);
}


// 获取周报需要填写的录入项
server.getRptites = function(func) {
    var processfunc = function(request, rolledBackCallback) {
        async.waterfall([
            async.apply(dao.findRptites, request)

        ], rolledBackCallback);
    }

    // 调用事务类
    server.transaction(processfunc, func);
}

// 查询周报头表列表
server.queryPrts = function(queryParam, func) {
    var processfunc = function(request, rolledBackCallback) {
        async.waterfall([
            async.apply(dao.findPrts, request, queryParam)

        ], rolledBackCallback);
    }

    // 调用事务类
    server.transaction(processfunc, func);
}


// 新增周报头表
server.addPrt = function(prt, func) {
    var processfunc = function(request, rolledBackCallback) {
        async.waterfall([
            // 查询用户名
            async.apply(dao.findOperById, request, prt.operid),

            function(result, callback) {
                if(!result.recordset.length) {
                    return callback({retmsg: '不存在此用户'}, result);
                }

                // 获取用户名
                prt.namecn = result.recordset[0].NAMECN || 
                    result.recordset[0].LOGINNAME;

                // 查询项目名
                dao.findProjectById(request, prt.projectid, callback);
            },

            function(result, callback) {
                if(!result.recordset.length) {
                    return callback({err: '不存在此项目'}, result);
                }

                // 获取项目名
                prt.projectname = result.recordset[0].PROJECTNAME;

                // 添加周报头表
                prt.prtname = prt.projectname + '-周报－' + prt.namecn;
                dao.addPrt(request, prt, callback);
            }
            
        ], rolledBackCallback);
    }

    // 调用事务类
    server.transaction(processfunc, func);
}

// 新增周报录入明细项
server.addPrtcontent = function(prtcontent, func) {
    var prtcontentorder = prtcontent.prtcontentorder;
    var prtid = prtcontent.prtid;
    var prtcontentid = prtcontent.prtcontentid;

    var processfunc = function(request, rolledBackCallback) {
        async.waterfall([
            // 检查是否有重复项
            async.apply(dao.findPrtcontentIsExist, request, prtcontent),

            function(result, callback) {
                if(result.recordset.length) {
                    var preErr = {retmsg: '明细项内容重复'};
                    callback(preErr);
                    return;
                }

                // 新增明细项
                dao.addPrtcontent(request, prtcontent, callback);
            },

            function(result, callback) {
                // 更新明细项排序字段
                dao.updatePrtcontentDisplayOrder(request, prtcontentorder, prtid, prtcontentid, callback)
            }
        ], rolledBackCallback);
    }

    // 调用事务类
    server.transaction(processfunc, func);
}

// 批量新增周报录入明细项
server.addPrtcontentList = function(prtcontentList, func) {
    var processfunc = function(request, rolledBackCallback) {
        var processfuncArr = [];
        for(var i = 0, len = prtcontentList.length; i < len; i++) {
            (function(i) {
                var prtcontent = prtcontentList[i];
                var prtcontentorder = prtcontent.prtcontentorder;
                var prtid = prtcontent.prtid;
                var prtcontentid = prtcontent.prtcontentid;

                // 检查是否有重复项
                if(i == 0) {
                    var waterfallFunc1 = async.apply(dao.findPrtcontentIsExist, request, prtcontent);
                }else {
                    var waterfallFunc1 = function(result, callback) {
                        dao.findPrtcontentIsExist(request, prtcontent, callback);
                    }
                }

                // 新增明细项
                var waterfallFunc2 = function(result, callback) {
                    if(result.recordset.length) {
                        var preErr = {retmsg: '第' + (i+1) +'条明细项内容重复'};
                        callback(preErr);
                        return;
                    }

                    dao.addPrtcontent(request, prtcontent, callback);
                };

                // 更新明细项排序字段
                var waterfallFunc3 = function(result, callback) {
                    dao.updatePrtcontentDisplayOrder(request, prtcontentorder, prtid, prtcontentid, callback)
                }

                var waterfallFunc = [waterfallFunc1, waterfallFunc2, waterfallFunc3]

                processfuncArr = processfuncArr.concat(waterfallFunc);
            })(i)
        }

        async.waterfall(processfuncArr, rolledBackCallback);
    }

    // 调用事务类
    server.transaction(processfunc, func);
}


// 修改周报录入明细项
server.updatePrtcontent = function(prtcontent, func) {
    var processfunc = function(request, rolledBackCallback) {
        async.waterfall([
            // 检查是否有重复项
            async.apply(dao.findPrtcontentIsExist, request, prtcontent),

            function(result, callback) {
                if(result.recordset.length) {
                    callback({retmsg: '明细项内容重复'});
                    return;
                }

                // 修改明细项
                dao.updatePrtcontent(request, prtcontent, callback);
            }
        ], rolledBackCallback);
    }

    // 调用事务类
    server.transaction(processfunc, func);
}


// 删除周报录入明细项
server.deletePrtcontent = function(prtcontentid, prtcontentList, prtid, func) {
    var processfunc = function(request, rolledBackCallback) {
        // 处理排序需要调用的dao
        var processfuncArr = [];
        if(prtcontentList)
            for(var i = 0, len = prtcontentList.length; i < len; i++) {
                (function(i) {
                    // 更新明细项排序字段的栈函数
                    var waterfallFunc = function(result, callback) {
                        if(result && result.rowsAffected[0] == 1) {
                            dao.updatePrtcontentDisplayOrder(request, i, prtid, prtcontentList[i], callback);
                            return;
                        }

                        if(i == 0) {
                            var preErr = {retmsg: '删除的明细项不存在'}
                        }else {
                            var preErr = {retmsg: '第' + (i) + '个需要更新排序的明细项不存在'};   // 最后一个result值待判断
                        }

                        callback(preErr);   // error callback 
                    }

                    processfuncArr.push(waterfallFunc);
                })(i)
            }

        async.waterfall([
            // 删除周报明细项
            async.apply(dao.deletePrtcontentByID, request, prtcontentid)

        ].concat(processfuncArr), rolledBackCallback);
    }

    // 调用事务类
    server.transaction(processfunc, func);
}


// 提交周报明细表
server.addPrtdc = function(prtdc, func) {
    var processfunc = function(request, rolledBackCallback) {
        async.series([
            // 新增提交报表
            async.apply(dao.addPrtdcRecord, request, prtdc),

            //新增项目报表明细提交表
            async.apply(dao.addPrtdcDetail, request, prtdc),

            // 更新项目报表头表
            async.apply(dao.updatePrtByPrtdcid, request, prtdc)

        ], rolledBackCallback);
    }

    // 调用事务类
    server.transaction(processfunc, func);
}


// 周报明细表（个人编辑）详情提取
server.getPrtdt = function(prtid, func) {
    var processfunc = function(request, rolledBackCallback) {
        async.series([
            // 提取周报头表信息
            async.apply(dao.findPrthById, request, prtid),

            // 提取周报事项明细
            async.apply(dao.findPrtdtById, request, prtid)

        ], rolledBackCallback);


        // 最后一个series函数执行后的处理
        rolledBackCallback.lastProcessfunc = function() {
            if(!this.result[0].rowsAffected[0]) {        // 提取周报头表失败
                this.err = {retmsg: '提取周报头表失败'};

            }
        };
    }

    // 调用事务类
    server.transaction(processfunc, func);
}


// 周报明细表（提交）详情提取
server.getPrtdc = function(prtid, func) {
    var processfunc = function(request, rolledBackCallback) {
        async.series([
            // 提取周报头表信息
            async.apply(dao.findPrthById, request, prtid),

            // 提取周报事项明细
            async.apply(dao.findPrtdcById, request, prtid)

        ], rolledBackCallback);


        // 最后一个series函数执行后的处理
        rolledBackCallback.lastProcessfunc = function() {
            if(!this.result[0].rowsAffected[0]) {        // 提取周报头表失败
                this.err = {retmsg: '提取周报头表失败'};
            }
        };
    }

    // 调用事务类
    server.transaction(processfunc, func);
}

// 更新周报明细表中的显示排序
server.updatePrtcontentsDisplayOrder = function(prtcontentList, prtid, func) {
    var processfunc = function(request, rolledBackCallback) {
        // 处理排序需要调用的dao
        var processfuncArr = [];
        for(var i = 0, len = prtcontentList.length; i < len; i++) {
            (function(i) {
                // 更新明细项排序字段的栈函数
                if(i == 0) {    // 第一个函数
                    var waterfallFunc = async.apply(dao.updatePrtcontentDisplayOrder, request, i, prtid, prtcontentList[i]);
                
                } else {
                    var waterfallFunc = function(result, callback) {
                        if(result && result.rowsAffected[0] == 1) {
                            dao.updatePrtcontentDisplayOrder(request, i, prtid, prtcontentList[i], callback);
                            return;
                        }

                        if(i == 0) {
                            var preErr = {retmsg: '删除的明细项不存在'}
                        }else {
                            var preErr = {retmsg: '第' + (i) + '个需要更新排序的明细项不存在'};   // 最后一个result值待判断
                        }

                        callback(preErr);   // error callback 
                    }
                }

                processfuncArr.push(waterfallFunc);
            })(i)
        }

        async.waterfall(processfuncArr, rolledBackCallback);
    }

    // 调用事务类
    server.transaction(processfunc, func);
}


// 批量获取周报头信息
server.getPrtths = function(prtidList, prtdate, func) {
    var processfunc = function(request, rolledBackCallback) {
        var processfuncArr = [];
        for(var i = 0, len = prtidList.length; i < len; i++) {
            (function(i) {

                var waterfallFunc = [async.apply(dao.findPrthById, request, prtidList[i]),
                                     async.apply(dao.findPrtdcById, request, prtidList[i])];

                processfuncArr = processfuncArr.concat(waterfallFunc);
            })(i)
        }

        async.series(processfuncArr, rolledBackCallback);

        // 最后一个series函数执行后的处理
        rolledBackCallback.lastProcessfunc = function() {
            for(var i = 0; i < this.result.length; i++){
                if(i%2 == 0) {
                    if(!this.result[i].recordset.length) {
                        this.err = {retmsg: 'id为:' + prtidList[i/2] + '的周报不存在'};  
                    }

                    if(this.result[i].recordset[0].RPTDATE.getTime() !== new Date(prtdate).getTime()) {
                        this.err = {retmsg: 'id为:' + prtidList[i/2] + '的周报日期不为' + prtdate};
                    }

                    if(this.result[i].recordset[0].RPTCOMMITIND == 'I') {
                        this.err = {retmsg: 'id为:' + prtidList[i/2] + '的周报尚未提交'};
                    }
                }
            }
        }
    }

    // 调用事务类
    server.transaction(processfunc, func);           
}

module.exports = server;
