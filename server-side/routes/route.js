var express = require('express');
var http = require('http');
var uuid = require('node-uuid');
var server = require('../models/server.js'); 
var moment = require('moment');

var router = express.Router();

// 登录用例
router.post('/login', function(req, res, next) {
	// 有效性验证
	if(!req.body) return res.status(400).send('请求参数错误');

	var username = req.body.username;
	var password = req.body.password;

	if (!username || username == '') {
		return res.status(400).send('用户名不能为空');
	} 

	if (!password || password == '') {
		return res.status(400).send('密码不能为空');
	} 

	// svn登录验证
	var base64str = new Buffer(username + ':' + password).toString('base64');
	const options = {
		hostname: 'www.letouke.com',
		port: 911,
		path: '/svn',
		method: 'POST',
		headers: {
			'Authorization': 'Basic ' + base64str
		}
	};

	var loginReq = http.request(options, (loginRes) => {
		var statusCode = loginRes.statusCode;

		if (statusCode == 401) {
			return res.status(401).send('用户认证失败');

		} else if (statusCode == 200 || statusCode == 301) {
			var loginname = username.toUpperCase();

			server.login(loginname, function(err, result) {
				if(handleError(err, res))
					return;(err, res)

				if(result.recordset[0].OPERID) {   // 查询但未新增用户
					res.status(200);
					return res.json({
						retflag: true,
						retmsg: '登录成功',
						nickname: result.recordset[0].NAMECN || result.recordset[0].LOGINNAME
					})
				}

				if(result.rowsAffected[0] === 1) {          // 新增用户
					res.status(200);
					return res.json({
						retflag: true,
						retmsg: '登录成功',
						insertOper: true
					})
				}
			});
		}
	});

	loginReq.on('error', function(err) {
		console.error(err);
	});

	loginReq.end();
});

// 设置用户昵称(并获取用户昵称)
router.put('/nickname', function(req, res) {
	// 有效性验证
	if(!req.body) return res.status(400).send('请求参数错误');

	var nickname = req.body.nickname;  
	var operid = req.body.operid;

	if (!operid || operid == '') {
		return res.status(400).send('用户id不能为空');
	}

	if (!nickname || nickname == '') {
		return res.status(400).send('昵称不能为空');
	}

	// 更新用户定义表
	server.updateNickname(nickname, operid, function(err, result) {
		if(handleError(err, res))
			return;

		if(result.rowsAffected[0] === 1) {
			return res.json({
				retflag: true,
				retmsg: '更新用户昵称成功',
				nickname: result.recordset[0].NAMECN
			})
		}

		return res.json({
			retflag: false,
			retmsg: '更新用户昵称失败'
		})
	})
});


/*
 * 获取用户的成员角色
 * 参数 用户id  OPERID
 */
router.get('/role', function(req, res) {
	// 有效性验证
	var operid = req.headers.operid;

	if (!operid || operid == '') {
		return res.status(400).send('用户id不能为空');
	} 

	server.queryRole(operid, function(err, result) {
		if(handleError(err, res))
			return;

		// A则表示为管理员，M表示为成员
		// 可能一个用户会有多条记录
		var roles = result.recordset;
		var role, rolecode;
		for(var i = 0, len = roles.length; i < len; i++) {
			if(roles[i].ROLECODE === 'A') {
				role = '管理员';
				rolecode = 'A';
				break;
			}

			if(roles[i].ROLECODE === 'M') {
				role = '成员';
				rolecode = 'M';
			}
		}

		return res.json({
			retflag: true,
			retmsg: role,
			rolecode: rolecode
		})
	})
});

/*
 * 获取成员列表
 */
router.get('/opers', function(req, res) {
	server.queryOpers(function(err, result) {
		if(handleError(err, res))
			return;

		var opers = [];
		result.recordset.map(function(oper) {
			if(!oper.NAMECN) {
				oper.NAMECN = oper.LOGINNAME;
			}

			opers.push({
				namecn: oper.NAMECN,
				operid: oper.OPERID
			})
		});

		res.json({
			retflag: true,
			retmsg: '获取成员列表成功',
			datalist: opers,
		})
	})
});


/*
 * 查询用户所属的项目
 * 参数 用户id  OPERID    // 需要验证用户吗
 */
router.get('/projects', function(req, res) {
	// 有效性验证
	var operid = req.headers.operid;

	if (!operid || operid == '') {
		return res.status(400).send('用户id不能为空');
	}

	server.queryProjects(operid, function(err, result) {
		if(handleError(err, res))
			return;

		var arr = []
		result.recordset.map(function(project) {
			arr.push({
				projectid: project.PROJECTID,
				projectname: project.PROJECTNAME
			})
		})

		return res.json({
			retflag: true,
			retmsg: '查询成功',
			datalist: arr
		});

	})
});


/*
 * 查询周报需要填写的录入项
 * 参数 无
 */
router.get('/rptites', function(req, res) {
	server.getRptites(function(err, result) {
		if(handleError(err, res))
			return;
		
		var arr = []
		result.recordset.map(function(rpttite) {
			var isrequirename = ''
			if(rpttite.ISREQUIRE == 'Y') {
				isrequirename = '必填项';
			}
			if(rpttite.ISREQUIRE == 'N') {
				prtcommitname = '选填项';
			}

			var isrequire_E = {
				isrequire: rpttite.ISREQUIRE,
				name: isrequirename
			}

			arr.push({
				rptitemcode: rpttite.RPTITEMCODE,
				rptitemname: rpttite.RPTITEMNAME,
				isrequire_E: isrequire_E,
				seq: rpttite.SEQ
			})
		})

		return res.json({
			retflag: true,
			retmsg: '查询成功',
			datalist: arr
		});
	});
})

/*
 * 查询周报头表列表
 * 参数 周报id   周报日期  用户id  项目id
 */
router.get('/prts', function(req, res) {
	var queryParam = {
		operid: req.headers.operid,
		memberid: req.headers.memberid,
		projectid: req.headers.projectid,
		prtdateBegin: req.headers.prtdatebegin,
		prtdateEnd: req.headers.prtdateend
	}

	server.queryPrts(queryParam, function(err, result) {
		if(handleError(err, res))
			return;

		var arr = []
		result.recordset.map(function(prt) {
			var rptcommitname = ''
			if(prt.RPTCOMMITIND == 'I') {
				rptcommitname = '尚未提交';
			}
			if(prt.RPTCOMMITIND == 'V') {
				rptcommitname = '已提交';
			}

			rptcommit_E = {
				rptcommitind: prt.RPTCOMMITIND,
				name: rptcommitname
			}

			arr.push({
				rptname: prt.RPTNAME,
				rptid: prt.RPTID,
				projectname: prt.PROJECTNAME,
				projectid: prt.PROJECTID,
				rptdate: moment(prt.RPTDATE).format('YYYY-MM-DD'),
				rptcommit_E: rptcommit_E,
				rptcommittime: prt.RPTCOMMITTIME,   // 提交时间
				// 是否是自己的周报
				editabled: prt.OPERID == req.headers.operid 
			})
		})

		return res.json({
			retflag: true,
			retmsg: '查询成功',
			prtList: arr
		});
	});
})


/*
 * 新增周报头表
 * 参数 周报日期  用户id  项目id
 */
router.post('/prt', function(req, res) {
	if(!req.body) return res.status(400).send('请求参数错误');

	var prtdate = req.body.prtdate;  
	var operid = req.body.operid;
	var projectid = req.body.projectid;

	// 有效性验证
	if (!prtdate || prtdate == '') {
		return res.status(400).send('周报日期不能为空');
	}

	if (!operid || operid == '') {
		return res.status(400).send('用户id不能为空');
	}

	if (!projectid || projectid == '') {
		return res.status(400).send('项目id不能为空');
	}

	var prtid = uuid.v1();
	var prt = new Object({
		prtid: prtid,
		prtdate: req.body.prtdate,
		operid: req.body.operid,
		projectid: req.body.projectid
	});

	server.addPrt(prt, function(err, result) {
		if(handleError(err, res))
			return;

		res.json({
			retflag: true,
			retmsg: '新增周报头表成功',
			prtid: prt.prtid
		})
	})
})

/*
 * 周报明细表（个人编辑）详情提取
 */
router.get('/prtdt/:id', function(req, res) {
	var prtid = req.params.id;

	// 有效性验证
	if (!prtid || prtid == '') {
		return res.status(400).send('周报id不能为空')
	} 

	server.getPrtdt(prtid, function(err, result) {
		if(handleError(err, res))
			return;

		var prt = {};

		// 周报头详细信息
		var prtth = result[0].recordset[0]
		parsePrtthToPrt(prt, prtth);

		// 周报事项明细
		var prtcontentList = result[1].recordset;
		parsePrtcontentToPrt(prt, prtcontentList)

		return res.json({
			retflag: true,
			retmsg: '获取成功',
			datalist: prt
		})
	});
});

/*
 * 周报明细表（提交）详情提取
 */
router.get('/prtdc/:id', function(req, res) {
	var prtid = req.params.id;

	// 有效性验证
	if (!prtid || prtid == '') {
		return res.status(400).send('周报id不能为空')
	} 

	server.getPrtdc(prtid, function(err, result) {
		if(handleError(err, res))
			return;

		var prt = {};

		// 周报头详细信息
		var prtth = result[0].recordset[0]
		parsePrtthToPrt(prt, prtth);

		// 周报事项明细
		var prtcontentList = result[1].recordset;
		parsePrtcontentToPrt(prt, prtcontentList)

		return res.json({
			retflag: true,
			retmsg: '获取成功',
			datalist: prt
		})
	});
});


/*
 * 新增周报录入明细项
 */
router.post('/prtcontent', function(req, res) {
	if(!req.body) return res.status(400).send('请求参数错误');

	var prtcontentdescr = req.body.prtcontentdescr;  
	var prtcontentorder = req.body.prtcontentorder;
	var prtid = req.body.prtid;
	var prtitemcode = req.body.prtitemcode;
	var operid = req.body.operid;

	// 有效性验证
	if (!prtcontentdescr || prtcontentdescr == '') {
		return res.status(400).send('周报事项明细不能为空');
	}

	if (!prtcontentorder || prtcontentorder == '') {
		return res.status(400).send('周报事项明细排序值不能为空');
	}

	if (!prtid || prtid == '') {
		return res.status(400).send('周报id不能为空');
	}

	if (!prtitemcode || prtitemcode == '') {
		return res.status(400).send('周报事项代码不能为空');
	}

	if (!operid || operid == '') {
		return res.status(400).send('用户id不能为空');
	}

	// 处理明细项内容 - 去除首字符是编号(例如（1）)的字符串
	prtcontentdescr = prtcontentdescr.replace(/^[(\(|\（)][\d]*[(\)|\）)]/, '');

	// 处理明细项内容 - 如果字符串里存在[换行+编号(例如（1）)]的，则把明细项分割成数组
	var patt = /\n\n*[(\(|\（)][\d]*[(\)|\）)]/;   
	if(prtcontentdescr.search(patt) > -1) {
		prtcontentdescr = prtcontentdescr.split(patt);
		var prtcontent = [];
		var index = 0;
		prtcontentdescr.forEach(function() {
			prtcontent.push({
				prtcontentid: uuid.v1(),
				prtcontentdescr: prtcontentdescr[index++],
				prtcontentorder: prtcontentorder++,
				prtid: prtid,
				prtitemcode: prtitemcode,
				operid: operid
			});
		});

	}else {
		var prtcontent = new Object({
			prtcontentid: uuid.v1(),
			prtcontentdescr: prtcontentdescr,
			prtcontentorder: prtcontentorder,
			prtid: prtid,
			prtitemcode: prtitemcode,
			operid: operid
		});
	}

	// 批量
	if(prtcontent instanceof Array) {
		server.addPrtcontentList(prtcontent, function(err, result) {
			if(handleError(err, res))
				return;

			if(result.rowsAffected.length) {
				var bathPrtcontent = [];
				prtcontent.forEach(function(prtcontent) {
					bathPrtcontent.push({
						prtcontentid: prtcontent.prtcontentid,
						prtcontentdescr: prtcontent.prtcontentdescr,
					});
				});

				return res.json({
					retflag: true,
					retmsg: '批量新增周报录入明细项成功',
					prtcontent: bathPrtcontent
				})
			}

			return res.json({
				retflag: false,
				retmsg: '批量新增周报录入明细项失败'
			})
		});

	// 单条
	}else {
		server.addPrtcontent(prtcontent, function(err, result) {
			if(handleError(err, res))
				return;

			if(result.rowsAffected.length) {
				return res.json({
					retflag: true,
					retmsg: '新增周报录入明细项成功',
					prtcontent: {
						prtcontentid: prtcontent.prtcontentid,
						prtcontentdescr: prtcontent.prtcontentdescr,
					} 
				})
			}

			return res.json({
				retflag: false,
				retmsg: '新增周报录入明细项失败'
			})
		});
	}
})

/*
 * 修改周报录入明细项
 */
router.put('/prtcontent/:id', function(req, res) {
	if(!req.body) return res.status(400).send('请求参数错误');

	var prtcontentid = req.params.id;
	var prtcontentdescr = req.body.prtcontentdescr;
	var prtcontentorder = req.body.prtcontentorder;
	var operid = req.body.operid;
	var prtid = req.body.prtid;
	var prtitemcode = req.body.prtitemcode;

	// 有效性验证
	if (!prtid || prtid == '') {
		return res.status(400).send('周报id不能为空')
	}

	if (!prtcontentdescr || prtcontentdescr == '') {
		return res.status(400).send('事项描述不能为空')
	} 

	if (!prtcontentorder || prtcontentorder == '') {
		return res.status(400).send('周报事项明细排序值不能为空');
	}

	if (!operid || operid == '') {
		return res.status(400).send('用户id不能为空')
	}  

	if (!prtcontentid || prtcontentid == '') {
		return res.status(400).send('事项id不能为空')
	} 
	
	if (!prtitemcode || prtitemcode == '') {
		returnBean.retflag = false;
		returnBean.retmsg = '周报事项代码不能为空';
		return res.json(returnBean);
	}

	var prtcontent = new Object({
		prtcontentid: prtcontentid,
		prtid: prtid,
		prtcontentdescr: prtcontentdescr,
		operid: operid,
		prtcontentorder: prtcontentorder,
		prtitemcode: prtitemcode
	});

	server.updatePrtcontent(prtcontent, function(err, result) {
		if(handleError(err, res))
			return;

		if(result.rowsAffected.length) {
			return res.json({
				retflag: true,
				retmsg: '修改周报录入明细项成功'
			})
		}

		return res.json({
			retflag: false,
			retmsg: '修改周报录入明细项失败'
		})
	});
})

/*
 * 删除周报录入明细项  <application/json>
 */
router.delete('/prtcontent/:id', function(req, res) {
	if(!req.body) return res.status(400).send('请求参数错误');

	var prtcontentid = req.params.id;
	var prtcontentList = req.body.prtcontentList;
	var prtid = req.body.prtid;

	// 有效性验证
	if (!prtcontentid || prtcontentid == '') {
		return res.status(400).send('事项id不能为空')
	}

	if (!prtid || prtid == '') {
		return res.status(400).send('周报id不能为空')
	}

	if (prtcontentList && !(prtcontentList instanceof Array)) {
		return res.status(400).send('周报事项列表必须是数组')
	} 

	// 去除删除事项的id
	if(prtcontentList) {
		var index = Array.prototype.indexOf.call(prtcontentList, prtcontentid);
		prtcontentList.splice(index, 1);
	}

	server.deletePrtcontent(prtcontentid, prtcontentList, prtid, function(err, result) {
		if(handleError(err, res))
			return;

		if(result) {
			return res.json({
				retflag: true,
				retmsg: '删除周报录入明细项成功'
			})
		}

		return res.status(400).send('删除失败');
	});
})


/*
 * 提交周报明细表
 */
router.post('/prtdc', function(req, res) {
	var prtdcid = uuid.v1();
	var prtdc = {
		prtid:  req.body.prtid,
		prtdcid: prtdcid,
		operid: req.body.operid
	}

	// 有效性验证
	if (!prtdc.prtid || prtdc.prtid == '') {
		return res.status(400).send('周报id不能为空')
	} 

	if (!prtdc.operid || prtdc.operid == '') {
		return res.status(400).send('用户id不能为空')
	} 

	server.addPrtdc(prtdc, function(err, result) {
		if(handleError(err, res))
			return;

		if(result[0].rowsAffected[0] == 1 && result[2].rowsAffected[0] == 1) {
			return res.json({
				retflag: true,
				retmsg: '提交周报明细表成功'
			})
		}

		return res.json({
			retflag: true,
			retmsg: '提交周报明细表失败'
		})
	});
	
})

/*
 * 更新周报明细表中的显示排序
 */
router.put('/prtcontentsDisplayOrder', function(req, res) {
	if(!req.body) return res.status(400).send('请求参数错误');
	
	var prtcontentList = req.body.prtcontentList;
	var	prtid = req.body.prtid;

	// 有效性验证
	if (!prtcontentList) {
		return res.status(400).send('周报事项列表不能为空')
	} 

	if (!(prtcontentList instanceof Array)) {
		return res.status(400).send('周报事项列表必须是数组')
	} 

	if (!prtid || prtid == '') {
		return res.status(400).send('周报id不能为空')
	} 

	server.updatePrtcontentsDisplayOrder(prtcontentList, prtid, function(err, result) {
		if(handleError(err, res))
			return;

		return res.json({
			retflag: true,
			retmsg: '更新报表事项排序成功'
		})

	});
	
})

/*
 * 批量导出同一天的周报明细表
 */
router.post('/batchExportPrt', function(req, res) {
	if(!req.body) return res.status(400).send('请求参数错误');
	
	var prtidList = req.body.prtidList;
	var prtdate = req.body.prtdate;

	// 有效性验证
	if (!(prtidList instanceof Array) || prtidList.length == 0) {
		return res.status(400).send('周报id列表必须是数组且不为空')
	}
	if (!prtdate || prtdate.length == 0) {
		return res.status(400).send('批量导出周报的日期不能为空')
	}

	prtdate = moment(prtdate).format('YYYY-MM-DD');

	server.getPrtths(prtidList, prtdate, function(err, results) {
		if(handleError(err, res))
			return;
		
		// 遍历多个周报头表
		var map = {}
		var projectArr = [];
		projectArr.prtdate = prtdate;
		for(var i = 0; i < results.length; i++){
		    var prtth = results[i].recordset[0];

		    // 单个周报详细信息添加批量周报对象
		    var prtcontentList = results[++i].recordset;
		    var prt = new Object();
		    parsePrtcontentToPrt(prt, prtcontentList, true) 

		    if(map[prtth.PROJECTID] == undefined) {
		    	projectArr.push({
		    		projectid: prtth.PROJECTID,
		    		projectname: prtth.PROJECTNAME,
		    		projectmembers: [{
		    			operid: prtth.OPERID,
		    			nickname: prtth.NAMECN,
		    			prt: prt
		    		}]
	    		})

		    	map[prtth.PROJECTID] = projectArr.length - 1;
		    }else {
		    	projectArr[map[prtth.PROJECTID]].projectmembers.push({
	    			operid: prtth.OPERID,
	    			nickname: prtth.NAMECN,
	    			prt: prt
	    		})
		    }

		}  // prtth end for 

		var projects = {
			projectdate: prtdate,
			projectArr: projectArr
		}
		return res.json({
			retflag: true,
			retmsg: '获取成功',
			datalist: projects
		})
	});
})

router.post('/batchExportPrt', function(req, res) {
	if(!req.body) return res.status(400).send('请求参数错误');
	
	var prtidList = req.body.prtidList;
	var prtdate = req.body.prtdate;

	// 有效性验证
	if (!(prtidList instanceof Array) || prtidList.length == 0) {
		return res.status(400).send('周报id列表必须是数组且不为空')
	}
	if (!prtdate || prtdate.length == 0) {
		return res.status(400).send('批量导出周报的日期不能为空')
	}

	prtdate = moment(prtdate).format('YYYY-MM-DD');

	server.getPrtths(prtidList, prtdate, function(err, results) {
		if(handleError(err, res))
			return;
		
		// 遍历多个周报头表
		var map = {}
		var projectArr = [];
		projectArr.prtdate = prtdate;
		for(var i = 0; i < results.length; i++){
		    var prtth = results[i].recordset[0];

		    // 单个周报详细信息添加批量周报对象
		    var prtcontentList = results[++i].recordset;
		    var prt = new Object();
		    parsePrtcontentToPrt(prt, prtcontentList) 

		    if(map[prtth.PROJECTID] == undefined) {
		    	projectArr.push({
		    		projectid: prtth.PROJECTID,
		    		projectname: prtth.PROJECTNAME,
		    		projectmembers: [{
		    			operid: prtth.OPERID,
		    			nickname: prtth.NAMECN,
		    			prt: prt
		    		}]
	    		})

		    	map[prtth.PROJECTID] = projectArr.length - 1;
		    }else {
		    	projectArr[map[prtth.PROJECTID]].projectmembers.push({
	    			operid: prtth.OPERID,
	    			nickname: prtth.NAMECN,
	    			prt: prt
	    		})
		    }

		}  // prtth end for 

		var projects = {
			projectdate: prtdate,
			projectArr: projectArr
		}
		return res.json({
			retflag: true,
			retmsg: '获取成功',
			datalist: projects
		})
	});
})


// 单个周报头表解析到周报对象/对象
function parsePrtthToPrt(prt, prtth) {
	prt.prtdate = moment(prtth.RPTDATE).format('YYYY-MM-DD');
	prt.prtname= prtth.RPTNAME;
	prt.projectid= prtth.PROJECTID;
	prt.projectname= prtth.PROJECTNAME;
	prt.nickname= prtth.NAMECN;
}


// 单个周报事项解析到周报对象
function parsePrtcontentToPrt(prt, prtcontentList, descrToArr) {
	var map = {}
	var prtitArr = [];
	for(var i = 0; i < prtcontentList.length; i++){
	    var prtcontent = prtcontentList[i];
	    if(map[prtcontent.RPTITEMCODE[0]] == undefined){
	        prtitArr.push({
	        	rptitemcode: prtcontent.RPTITEMCODE[0],
	        	rptitemname: prtcontent.RPTITEMNAME,
	        	prtcontentList: [{
	        		prtcontentdescr: prtcontent.RPTCONTENTDESCR,
	        		prtcontentid: prtcontent.RPTCONTENTID
	        	}]
	        });
	        map[prtcontent.RPTITEMCODE[0]] = prtitArr.length - 1;
	    }else{
	    	prtitArr[map[prtcontent.RPTITEMCODE[0]]].prtcontentList.push({
	    		prtcontentdescr: prtcontent.RPTCONTENTDESCR,
	    		prtcontentid: prtcontent.RPTCONTENTID
	    	})
        }
	}

	prt.prtitArr = prtitArr;
}


function handleError(err, res) {
	if (err) {
		if(err.retmsg) {
		    res.json({
				retflag: false,
				retmsg: err.retmsg
			})
		}else {
			res.status(500).send(err);
		}

		return true;

	}else {
		return false
	}
}

module.exports = router;



 