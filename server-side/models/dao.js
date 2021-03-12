// dao /sqlMapping.js
// var sql = require('./sql.js');

const ORGIDS021 = 'MINGDONG';
const dao = {};


// 查询用户
dao.findOperByLoginname = function(request, loginname, callback) {
    request
        .input('ORGIDS021', ORGIDS021)
        .input('LOGINNAME', loginname)
        .query("SELECT OPERID FROM OA_OPER WHERE ORGIDS021 = @ORGIDS021 AND LOGINNAME = @LOGINNAME", function(err, result) {  
            if (err) {  
                console.error(err);  
                callback(err, null);  
                return;  
            }  
            callback(null, result)  
        });  
}

// 在用户定义表插入用户
dao.addOperByLoginname = function(request, loginname, callback) {
    request
        .input('ORGIDS021', ORGIDS021)
        .input('OPERID', loginname)
        .input('LOGINNAME', loginname)
        .input('USEIND', 'Y')
        .query("INSERT INTO OA_OPER (ORGIDS021, OPERID, LOGINNAME, USEIND) VALUES (@ORGIDS021, @OPERID, @LOGINNAME, @USEIND)", function(err, result) {  
            if (err) {  
                console.error(err);  
                callback(err, null);  
                return;  
            }  
            callback(null, result)  
        }); 
}

// 更新用户昵称
dao.updateNamecnByOperid = function(request, namecn, operid, callback) {
    request
        .input('ORGIDS021', ORGIDS021)
        .input('OPERID', operid)
        .input('NAMECN', namecn)
        .query("UPDATE OA_OPER SET NAMECN = @NAMECN, BSLSTMNTTIME=GETDATE() WHERE ORGIDS021 = @ORGIDS021 AND OPERID = @OPERID", function(err, result) {  
            if (err) {  
                console.error(err);  
                callback(err, null);  
                return;  
            }  
            callback(null, result)  
        });
}

// 获取用户的成员角色
dao.findRole = function(request, operid, callback) {
    var command = "SELECT * FROM OA_OPRL WHERE ORGIDS021=@ORGIDS021 AND OPERID=@OPERID";

    request
        .input('ORGIDS021', ORGIDS021)
        .input('OPERID', operid)
        .query(command, function(err, result) {  
            if (err) {  
                console.error(err);  
                callback(err, null);  
                return;  
            }  
            callback(null, result)  
        });

};

// 获取成员列表
dao.findOpers = function(request, callback) {
    var command = "SELECT * FROM OA_OPER WHERE ORGIDS021=@ORGIDS021 AND USEIND=@USEIND";

    request
        .input('ORGIDS021', ORGIDS021)
        .input('USEIND', 'Y')                   // 只显示启用的用户
        .query(command, function(err, result) {  
            if (err) {  
                console.error(err);  
                callback(err, null);     
                return;  
            }  
            callback(null, result)  
        });
}

// 根据 项目ID查询一条项目信息
dao.findProjectById = function(request, projectid, callback) {
    request
        .input('ORGIDS021', ORGIDS021)
        .input('PROJECTID', projectid)
        .query("SELECT * FROM OA_PROJ WHERE ORGIDS021 = @ORGIDS021 AND PROJECTID = @PROJECTID", function(err, result) {  
            if (err) {  
                console.error(err);  
                callback(err, null);  
                return;  
            }  
            callback(null, result)  
        });
}

// 根据用户ID查询一条用户信息
dao.findOperById = function(request, operid, callback) {
    request
        .input('ORGIDS021', ORGIDS021)
        .input('OPERID', operid)
        .query("SELECT * FROM OA_OPER WHERE ORGIDS021 = @ORGIDS021 AND OPERID = @OPERID", function(err, result) {  
            if (err) {  
                console.error(err);  
                callback(err, null);  
                return;  
            }  
            callback(null, result)  
        });
}


// 获取用户所属的项目列表
dao.findProjectsByOperid = function(request, operid, callback) {
    var command = "SELECT A.ORGIDS021,A.OPERID,A.PROJECTID,B.PROJECTNAME " +
        "FROM OA_PJMB A,OA_PROJ B " +
        "WHERE A.ORGIDS021=@param1 " +
            "AND A.OPERID=@param2 " +
            "AND B.ORGIDS021=@param1 " +
            "AND A.PROJECTID=B.PROJECTID ";

    request
        .input('param1', ORGIDS021)
        .input('param2', operid)
        .query(command, function(err, result) {  
            if (err) {  
                console.error(err);  
                callback(err, null);  
                return;  
            }  
            callback(null, result)  
        }); 

}

// 查询周报需要填写的录入项
dao.findRptites = function(request, callback) {
    var command = "SELECT A.ORGIDS021,A.RPTTEMPLATECODE,A.SEQ,A.RPTITEMCODE,B.RPTITEMNAME,B.ISREQUIRE " +
        "FROM OA_RPTM A,OA_RPTI B " +
        "WHERE A.ORGIDS021 =@param1 " +
        "AND A.RPTTEMPLATECODE = @param2 " +
        "AND A.ISUSE = @param3 " +
        "AND B.ORGIDS021 = @param4 " +
        "AND A.RPTITEMCODE=B.RPTITEMCODE " +
        "ORDER BY A.SEQ";

    request
        .input('param1', ORGIDS021)
        .input('param2', 'WEEK')
        .input('param3', 'Y')
        .input('param4', ORGIDS021)
        .query(command, function(err, result) {  
            if (err) {  
                console.error(err);  
                callback(err, null);  
                return;  
            }  
            callback(null, result)  
        }); 
}

// 查询周报列表
dao.findPrts = function(request, queryParam, callback) {
    var command = "SELECT A.RPTID,A.RPTNAME,A.OPERID,A.PROJECTID,B.PROJECTNAME,A.RPTDATE,A.RPTBEGINDATE,A.RPTENDDATE,A.RPTCOMMITIND,A.RPTCOMMITID,A.RPTCOMMITTIME " +
        "FROM OA_RPTH A LEFT JOIN OA_PROJ B ON A.ORGIDS021=B.ORGIDS021 AND A.PROJECTID=B.PROJECTID " +
        "WHERE A.ORGIDS021=@ORGIDS021";

    if(queryParam.memberid) {
        if(queryParam.memberid !== 'all') {
            command += " AND OPERID=@memberid";
        }

    }else if(queryParam.operid) {
        command += " AND OPERID=@OPERID";
    }

    if(queryParam.projectid) 
        command += " AND A.PROJECTID=@projectid";

    if(queryParam.prtdateBegin && queryParam.prtdateEnd) {
        command += " AND A.RPTDATE BETWEEN @prtdateBegin AND @prtdateEnd";

    }else if(queryParam.prtdateBegin) {
         command += " AND A.RPTDATE=@prtdateBegin";

    }else if(queryParam.prtdateEnd) {
         command += " AND A.RPTDATE=@prtdateEnd";
    }

    request
        .input('ORGIDS021', ORGIDS021)
        .input('OPERID', queryParam.operid)
        .input('memberid', queryParam.memberid)
        .input('projectid', queryParam.projectid)
        .input('prtdateBegin', queryParam.prtdateBegin)
        .input('prtdateEnd', queryParam.prtdateEnd)
        .query(command + " ORDER BY A.RPTDATE DESC,A.RPTNAME", function(err, result) {  
            if (err) {  
                console.error(err);  
                callback(err, null);  
                return;  
            }  
            callback(null, result)  
        }); 
}

// 新增周报头表
dao.addPrt = function(request, prt, callback) {
    var command = "INSERT INTO OA_RPTH(ORGIDS021,RPTID,RPTNAME,OPERID," +
            "PROJECTID,RPTTEMPLATECODE,RPTDATE,RPTBEGINDATE," +
            "RPTENDDATE,RPTCOMMITIND,RPTCOMMITID,RPTCOMMITTIME," +
            "BSSYSCODE,BSMO,BSINPUTOPER,BSINPUTDATE,BSINPUTTIME," +
            "BSLSTMNTOPER,BSLSTMNTDATE,BSLSTMNTTIME) " +
        "VALUES(@ORGIDS021, @prtid, @prtname, @operid, @projectid,'WEEK', @prtdate,NULL,NULL,'I',NULL,NULL," +
            "NULL,NULL, @operid,NULL,GETDATE(), @operid,NULL,GETDATE())";

    request
        .input('ORGIDS021', ORGIDS021)
        .input('prtid', prt.prtid)
        .input('prtname', prt.prtname)
        .input('operid', prt.operid)
        .input('projectid', prt.projectid)
        .input('prtdate', prt.prtdate)
        .query(command, function(err, result) {  
            if (err) {  
                console.error(err);  
                callback(err, null);  
                return;  
            }  
            callback(null, result)  
        }); 
}

// 新增周报录入明细项
dao.addPrtcontent = function(request, prtcontent, callback) {
    var command = "INSERT INTO OA_RPTDT(ORGIDS021,RPTCONTENTID,RPTCONTENTDESCR,RPTID," +
            "RPTTEMPLATECODE,RPTITEMCODE,ISREFTASK,TASKID,BSSYSCODE," +
            "BSMO,BSINPUTOPER,BSINPUTDATE,BSINPUTTIME,BSLSTMNTOPER,BSLSTMNTDATE,BSLSTMNTTIME,DISPLAYORDER) " +
        "VALUES(@ORGIDS021, @prtcontentid, @prtcontentdescr, @prtid, 'WEEK', @prtitemcode, 'N',NULL,NULL,NULL," 
                + " @operid, NULL,GETDATE(), @operid,NULL,GETDATE(), @prtcontentorder)";

    request
        .input('ORGIDS021', ORGIDS021)
        .input('prtcontentid', prtcontent.prtcontentid)
        .input('prtcontentdescr', prtcontent.prtcontentdescr)
        .input('prtcontentorder', prtcontent.prtcontentorder)
        .input('prtid', prtcontent.prtid)
        .input('prtitemcode', prtcontent.prtitemcode)
        .input('operid', prtcontent.operid)
        .query(command, function(err, result) {  
            if (err) {  
                console.error(err);  
                callback(err, null);  
                return;  
            }  
            callback(null, result)  
        }); 

}

// 修改周报录入明细项
dao.updatePrtcontent = function(request, prtcontent, callback) {
    var command = "UPDATE OA_RPTDT SET RPTCONTENTDESCR =@prtcontentdescr, BSLSTMNTOPER= @operid, BSLSTMNTTIME=GETDATE(), DISPLAYORDER=@prtcontentorder " + 
            "WHERE ORGIDS021=@ORGIDS021 AND RPTCONTENTID=@prtcontentid";

    request
        .input('ORGIDS021', ORGIDS021)
        .input('prtcontentid', prtcontent.prtcontentid)
        .input('operid', prtcontent.operid)
        .input('prtcontentdescr', prtcontent.prtcontentdescr)
        .input('prtcontentorder', prtcontent.prtcontentorder)
        .query(command, function(err, result) {  
            if (err) {  
                console.error(err);  
                callback(err, null);  
                return;  
            }  
            callback(null, result)  
        });
}

// 检查 项目报表明细表中是否有重新的报表事项描述(同一条同一个用户同一个明细项中不能有两条事项描述相同) 如果查询到记录，就表示有相同的
dao.findPrtcontentIsExist = function(request, prtcontent, callback) {
    var command = "SELECT * FROM OA_RPTDT " +
                  "WHERE ORGIDS021=@ORGIDS021 AND RPTID=@prtid AND RPTTEMPLATECODE='WEEK' AND RPTITEMCODE=@prtitemcode " +
                     "AND RPTCONTENTDESCR=@prtcontentdescr " + 
                     "AND RPTCONTENTID !=@prtcontentid";

    request
        .input('ORGIDS021', ORGIDS021)
        .input('prtid', prtcontent.prtid)
        .input('prtcontentid', prtcontent.prtcontentid)
        .input('prtitemcode', prtcontent.prtitemcode)
        .input('prtcontentdescr', prtcontent.prtcontentdescr)
        .query(command, function(err, result) {  
            if (err) {  
                console.error(err);  
                callback(err, null);  
                return;  
            }  
            callback(null, result)  
        });
}

// 删除周报录入明细项
dao.deletePrtcontentByID = function(request, prtcontentid, callback) {
    var command = "DELETE FROM  OA_RPTDT " + 
            "WHERE ORGIDS021=@ORGIDS021 AND RPTCONTENTID=@prtcontentid";

    request
        .input('ORGIDS021', ORGIDS021)
        .input('prtcontentid', prtcontentid)
        .query(command, function(err, result) {  
            if (err) {  
                console.error(err);  
                callback(err, null);  
                return;  
            }  
            callback(null, result)  
        });
}

// 周报头信息提取
dao.findPrthById = function(request, prtid, callback) {
    var command = "SELECT A.RPTID,A.RPTNAME,A.OPERID,ISNULL(C.NAMECN,C.LOGINNAME) AS NAMECN,A.PROJECTID,B.PROJECTNAME,A.RPTDATE,A.RPTBEGINDATE,A.RPTENDDATE,A.RPTCOMMITIND,A.RPTCOMMITID,A.RPTCOMMITTIME " +
        "FROM OA_RPTH A LEFT JOIN OA_PROJ B ON A.ORGIDS021=B.ORGIDS021 AND A.PROJECTID=B.PROJECTID " +
        "LEFT JOIN OA_OPER C ON A.ORGIDS021=C.ORGIDS021 AND A.OPERID=C.OPERID " + 
        "WHERE A.ORGIDS021=@ORGIDS021 " +
            "AND RPTID=@prtid";

    request
        .input('ORGIDS021', ORGIDS021)
        .input('prtid', prtid)
        .query(command, function(err, result) {  
            if (err) {  
                console.error(err);  
                callback(err, null);  
                return;  
            }  
            callback(null, result)  
        });
}


// 周报明细表（个人编辑）详情提取
dao.findPrtdtById = function(request, prtid, callback) {
    var command = "SELECT R.* ,A.SEQ,A.RPTITEMCODE,B.RPTITEMNAME " +
        "FROM OA_RPTDT R  " +
        "LEFT JOIN OA_RPTM A ON R.ORGIDS021=A.ORGIDS021 AND R.RPTTEMPLATECODE=A.RPTTEMPLATECODE AND R.RPTITEMCODE=A.RPTITEMCODE " +
        "LEFT JOIN OA_RPTI B ON R.ORGIDS021=B.ORGIDS021 AND A.RPTITEMCODE=B.RPTITEMCODE " +
        "WHERE  R.ORGIDS021= @ORGIDS021 AND R.RPTID= @prtid ORDER BY A.SEQ, R.DISPLAYORDER";

    request
        .input('ORGIDS021', ORGIDS021)
        .input('prtid', prtid)
        .query(command, function(err, result) {  
            if (err) {  
                console.error(err);  
                callback(err, null);  
                return;  
            }  
            callback(null, result)  
        });
}

// 周报明细表（提交）详情提取
dao.findPrtdcById = function(request, prtid, callback) {
    var command = "SELECT R.* ,A.SEQ,A.RPTITEMCODE,B.RPTITEMNAME " + 
        "FROM OA_RPTDC R  " + 
        "LEFT JOIN OA_RPTM A ON R.ORGIDS021=A.ORGIDS021 AND R.RPTTEMPLATECODE=A.RPTTEMPLATECODE AND R.RPTITEMCODE=A.RPTITEMCODE " + 
        "LEFT JOIN OA_RPTI B ON R.ORGIDS021=B.ORGIDS021 AND A.RPTITEMCODE=B.RPTITEMCODE " + 
        "WHERE  R.ORGIDS021= @ORGIDS021 " + 
        "AND RPTCOMMITID IN (SELECT RPTCOMMITID FROM OA_RPTH  WHERE ORGIDS021=@ORGIDS021 AND RPTID=@prtid) " + 
        "ORDER BY A.SEQ, R.DISPLAYORDER";

    request
        .input('ORGIDS021', ORGIDS021)
        .input('prtid', prtid)
        .query(command, function(err, result) {  
            if (err) {  
                console.error(err);  
                callback(err, null);  
                return;  
            }  
            callback(null, result)  
        });
}

// 新增提交报表
dao.addPrtdcRecord = function(request, prtdc, callback) {
    var command = "INSERT INTO OA_RPTC(ORGIDS021,RPTID,RPTCOMMITID,RPTCOMMITTIME, " +
            "BSSYSCODE,BSMO,BSINPUTOPER,BSINPUTDATE,BSINPUTTIME,BSLSTMNTOPER,BSLSTMNTDATE,BSLSTMNTTIME) " +
        "VALUES(@ORGIDS021, @prtid, @prtdcid,GETDATE(), " +
            "NULL,NULL, @operid,NULL,GETDATE(), @operid,NULL,GETDATE()) ";

    request
        .input('ORGIDS021', ORGIDS021)
        .input('prtid', prtdc.prtid)
        .input('prtdcid', prtdc.prtdcid)
        .input('operid', prtdc.operid)
        .query(command, function(err, result) {  
            if (err) {  
                console.error(err);  
                callback(err, null);  
                return;  
            }  
            callback(null, result)  
        });
}

        
// 新增项目报表明细提交表
dao.addPrtdcDetail = function(request, prtdc, callback) {
    var command = "INSERT INTO OA_RPTDC(ORGIDS021,RPTCOMMITID,RPTCONTENTID,RPTCONTENTDESCR,RPTID,RPTTEMPLATECODE,RPTITEMCODE,ISREFTASK,TASKID,BSSYSCODE,BSMO,BSINPUTOPER,BSINPUTDATE,BSINPUTTIME,BSLSTMNTOPER,BSLSTMNTDATE,BSLSTMNTTIME,DISPLAYORDER) " + 
        "SELECT ORGIDS021, @prtdcid,RPTCONTENTID,RPTCONTENTDESCR,RPTID,RPTTEMPLATECODE,RPTITEMCODE,ISREFTASK,TASKID,BSSYSCODE,BSMO,BSINPUTOPER,BSINPUTDATE,BSINPUTTIME,BSLSTMNTOPER,BSLSTMNTDATE,BSLSTMNTTIME,DISPLAYORDER " + 
        "FROM OA_RPTDT WHERE ORGIDS021 =@ORGIDS021 AND RPTID =@prtid";

    request
        .input('ORGIDS021', ORGIDS021)
        .input('prtid', prtdc.prtid)
        .input('prtdcid', prtdc.prtdcid)
        .query(command, function(err, result) {  
            if (err) {  
                console.error(err);  
                callback(err, null);  
                return;  
            }  
            callback(null, result)  
        });
}

//  更新项目报表头表  
dao.updatePrtByPrtdcid = function(request, prtdc, callback) {
    var command = "UPDATE OA_RPTH " +
        "SET RPTCOMMITIND='V', " +
            "RPTCOMMITID=@prtdcid, " +
            "RPTCOMMITTIME=GETDATE() " +
        "WHERE ORGIDS021=@ORGIDS021  " +
            "AND RPTID=@prtid"; 

    request
        .input('ORGIDS021', ORGIDS021)
        .input('prtid', prtdc.prtid)
        .input('prtdcid', prtdc.prtdcid)
        .query(command, function(err, result) {  
            if (err) {  
                console.error(err);  
                callback(err, null);  
                return;  
            }  
            callback(null, result)  
        });    
}

// 更新周报明细表中的显示排序
dao.updatePrtcontentDisplayOrder = function(request, order, prtid, prtcontentid, callback) {
    var command = "UPDATE OA_RPTDT " +
        "SET DISPLAYORDER=@order " +
        "WHERE ORGIDS021=@ORGIDS021 AND RPTCONTENTID=@prtcontentid AND RPTID=@prtid";

    request
        .input('ORGIDS021', ORGIDS021)
        .input('order', order)
        .input('prtid', prtid)
        .input('prtcontentid', prtcontentid)
        .query(command, function(err, result) {  
            if (err) {  
                console.error(err);  
                callback(err, null);  
                return;  
            }  
            callback(null, result)  
        });    
}

module.exports = dao;