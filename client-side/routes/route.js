var http = require('http');
var _ = require('underscore');
const async = require('async');
var querystring = require('querystring');
var sessionTable = require('../config/session');
var moment = require('moment');
var debug = require('debug')('dev:route');

var JSZip = require('jszip');
var Docxtemplater = require('docxtemplater');
var fs = require('fs');
var path = require('path');

const requset_param = {
	hostname: 'localhost',
	port: 8081,
};

module.exports = {
	registerRoutes: function(app) {
		app.use('/', this.checkLogin);
		app.get('/', this.index);
		app.get('/login', this.login);
		app.post('/login', this.ajaxLogin);
		app.get('/logout', this.logout);
		app.get('/newzb', this.newzb);
		app.get('/editzb/:id', this.editzb);
		app.get('/zbList', this.index);
		app.put('/nickname', this.nickname);
		app.get('/rptites', this.queryRptites);
		app.get('/projects', this.queryProjects);
		app.get('/prts', this.queryPrts);
		app.post('/prt', this.addPrt);
		app.post('/prtcontent', this.ajaxAddItem);
		app.put('/prtcontent/:id',this.ajaxChangeItem);
		app.delete('/prtcontent/:id', this.ajaxDeletePrtcontent);
		app.put('/prtcontentsDisplayOrder', this.ajaxUpdatePrtcontentsDisplayOrder);
		app.post('/prtdc',this.ajaxAddPrtdc);
		app.get('/prtdt/:id',this.getPrtdt);
		app.get('/prtdc/:id',this.getPrtdc);
		app.post('/batchExportPrtByPrtdate',this.batchExportPrtByPrtdate);
	},

	// 登录验证
	checkLogin: function(req, res, next) {
		if (sessionTable.getOperid(req.session))
			if (req.path == '/login')
				return res.redirect('/');
			else
				return next();

		if (req.path == '/login')
			return next();

		res.redirect('/login');

	},

	// 周报列表
	index: function(req, res, next) {
		var rolecode, role, operList;    // 用户角色

		async.series([
			// 查询用户角色
			async.apply(module.exports.queryRole, req, res),

			// 查询成员列表
			async.apply(module.exports.queryOpers, req, res),

			// 查询用户所属的项目列表
			async.apply(module.exports.queryProjects, req, res),

		], function(err, result) {
			if(err) {
				next(err, req, res);
			}

			var sendData = {}
			if(result[0] && result[0].statusCode == 200 && result[0].body.retflag) {
				sendData.rolecode = result[0].body.rolecode;
				sendData.role = result[0].body.role;
			}

			if(result[1] && result[1].statusCode == 200 && result[1].body.retflag) {
				if(sendData.rolecode) {
					sendData.operList = result[1].body.datalist;
				}else {
					sendData.operList = [];
				}
			}

			if(result[2] && result[2].statusCode == 200 && result[2].body.retflag) {
				sendData.projectList = result[2].body.datalist;
			}

			// 渲染页面
			return res.render('zbList', _.extend(sendData, {
				nickname: sessionTable.getNickname(req.session),
				title: '周报列表'
			}));

		});
	},

	login: function(req, res, next) {
		res.render('login', {
			title: '登录',
			username: req.signedCookies.username,
			pa: req.signedCookies.password
		});
	},

	ajaxLogin: function(req, res, next) {
		var username = req.body.username;
		var password = req.body.password;
		var keepPassword = req.body.keepPassword;
		var returnBean = {};

		// 有效性验证
		if (username == '') {
			returnBean.retflag = false;
			returnBean.retmsg = '用户名不能为空';
			return res.json(returnBean);
		}

		if (password == '') {
			returnBean.retflag = false;
			returnBean.retmsg = '密码不能为空';
			return res.json(returnBean);

		}

		var postData = {
			username: username,
			password: password
		};
		var param = {
			path: '/api/login',
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': Buffer.byteLength(querystring.stringify(postData))
			}
		};

		serverRequest(param, postData, function(err, serres) {
			if (err) return res.status(500).send('客户端请求错误');

			if (serres) {
				var statusCode = serres.statusCode;
				res.status(serres.statusCode);

				if(statusCode == 200) {
					var returnBean = serres.body;

					// 设置session
					sessionTable.setLogin(req.session, {
						OA_OPERID: username.toUpperCase()
					});

					// 设置cookie - 记住密码
					if (keepPassword == "true") {
						res.cookie('username', username, {
							path: '/login',
							secure: false,
							maxAge: 1000 * 60 * 60 * 24 * 15,
							signed: true
						});
						res.cookie('user', {
							username: 'lanlan',
							password: 'password'
						}, {
							path: '/login',
							secure: false,
							maxAge: 1000 * 60 * 60 * 24 * 15
						});
						res.cookie('password', password, {
							path: '/login',
							secure: false,
							maxAge: 1000 * 60 * 60 * 24 * 15,
							signed: true
						});
					} else {
						res.clearCookie('username', {
							path: '/login',
							secure: false,
							maxAge: 1000 * 60 * 60 * 24 * 15
						});
						res.clearCookie('pa', {
							path: '/login',
							secure: false,
							maxAge: 1000 * 60 * 60 * 24 * 15,
							signed: true
						});
					}

					// 把昵称存入session中
					if(returnBean.retflag) {
						sessionTable.setNickname(req.session, returnBean.nickname);
					}

					return res.json(returnBean);

				}else {
					return res.send(serres.body);
				}
			}
		});
	},

	logout: function(req, res, next) {
		sessionTable.setOperid(req.session, null);
		res.redirect('/login');
	},

	nickname: function(req, res, next) {
		var nickname = req.body.nickname;
		var operid = sessionTable.getOperid(req.session);

		// 有效性验证
		if (nickname == '') {
			returnBean.retflag = false;
			returnBean.retmsg = '昵称不能为空';
			return res.json(returnBean);
		}

		if (operid == '') {
			returnBean.retflag = false;
			returnBean.retmsg = '用户id不能为空';
			return res.json(returnBean);

		}

		var postData = {
			nickname: nickname,
			operid: operid
		};

		var param = {
			path: '/api/nickname',
			method: 'PUT',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': Buffer.byteLength(querystring.stringify(postData))
			}
		};

		serverRequest(param, postData, function(err, serres) {
			if (err) return res.status(500).send('客户端请求错误');

			if (serres) {
				var statusCode = serres.statusCode;
				res.status(serres.statusCode)
				if(statusCode == 200) {
					var returnBean = serres.body;

					// 把昵称存入session中
					if(returnBean.retflag) {
						sessionTable.setNickname(req.session, returnBean.nickname);
					}

					return res.json(returnBean);
				}else {
					return res.json(serres.body);
				}
			}
		});
	},

	newzb: function(req, res, next) {
		async.series([
		    // 查询模板
		    async.apply(module.exports.queryRptites, req, res),

		    // 查询项目
		    async.apply(module.exports.queryProjects, req, res)
		    
		], function(err, result) {
			if(err) {
				next(err, req, res)
			}

			var sendData = {}
			if(result[0] && result[0].statusCode == 200 && result[0].body.retflag) {
				sendData.rptites = result[0].body.datalist;
			}

			if(result[1] && result[1].statusCode == 200 && result[1].body.retflag) {
				sendData.projects = result[1].body.datalist;
			}

			if(result[2] && result[2].statusCode == 200 && result[2].body.retflag) {
				sendData.projectList = result[2].body.datalist;
			}

			// 渲染页面
			return res.render('newzb', _.extend(sendData, {
				nickname: sessionTable.getNickname(req.session)
			}));
		});
	},

	editzb: function(req, res, next) {
		
		async.series([
			// 查询模板
		    async.apply(module.exports.queryRptites, req, res),

		    // 查询项目
		    async.apply(module.exports.queryProjects, req, res),

		    // 查询个人编辑详情
		    async.apply(module.exports.getPrtdt, req, res)
		    
		], function(err, result) {
			if(err) {
				next(err, req, res)
			}

			var sendData = {};
			if(result[0] && result[0].statusCode == 200 && result[0].body.retflag) {
				sendData.rptites = result[0].body.datalist;
			}

			if(result[1] && result[1].statusCode == 200 && result[1].body.retflag) {
				sendData.projects = result[1].body.datalist;
			}

			if(result[2] && result[2].statusCode == 200 && result[2].body.retflag) {
				sendData.prt = result[2].body.datalist;
			}

			if(result[2] && result[2].statusCode == 200 && !result[2].body.retflag) {
				return next();
			}

			// 渲染页面
			return res.render('newzb', _.extend(sendData, {
				title: '编辑个人周报',
				prtid: req.params.id,
				nickname: sessionTable.getNickname(req.session)
			}));
		});
	},
	

	//查询周报需要填写的录入项
	queryRptites: function(req, res, next) {
		var param = {
			path: '/api/rptites',
			method: 'GET'
		};

		serverRequest(param, null, function(err, serres) {
			if(next) {
				return next(err, serres);
			}

			if (err) return res.status(500).send('客户端请求错误');

			if (serres) {
				var statusCode = serres.statusCode;
				res.status(serres.statusCode)
				if(statusCode == 200) {
					return res.json(JSON.parse(serres.body));
				}else {
					return res.json(serres.body);
				}
			}

		});
	},


	// 查询用户所属的项目
	queryProjects: function(req, res, next) {
		// 有效性验证
		var operid = sessionTable.getOperid(req.session);
		if (!operid || operid == '') {
			return res.status(400).send('用户id不能为空');
		}

		// 请求参数
		var param = {
			path: '/api/projects',
			method: 'GET',
			headers: {
				operid: operid
			}
		};

		// 发送请求
		serverRequest(param, null, function(err, serres) {
			if(next) {
				return next(err, serres);
			}

			if (err) return res.status(500).send('客户端请求错误');

			if (serres) {
				var statusCode = serres.statusCode;
				res.status(serres.statusCode);
				return res.json(erres.body);
			}

		});
	},

	// 单个用户判断成员角色
	queryRole: function(req, res, next) {
		// 有效性验证
		var operid = sessionTable.getOperid(req.session);
		if (!operid || operid == '') {
			return res.status(400).send('用户id不能为空');
		}

		// 请求参数
		var param = {
			path: '/api/role',
			method: 'GET',
			headers: {
				operid: operid
			}
		};

		// 发送请求
		serverRequest(param, null, function(err, serres) {
			if(next) {
				return next(err, serres);
			}

			if (err) return res.status(500).send('客户端请求错误');

			if (serres) {
				var statusCode = serres.statusCode;
				res.status(serres.statusCode)
				return res.json(serres.body);
			}

		});
	},

	// 获取成员列表
	queryOpers: function(req, res, next) {
		// 请求参数
		var param = {
			path: '/api/opers',
			method: 'GET'
		};

		// 发送请求
		serverRequest(param, null, function(err, serres) {
			if(next) {
				return next(err, serres);
			}

			if (err) return res.status(500).send('客户端请求错误');

			if (serres) {
				var statusCode = serres.statusCode;
				res.status(serres.statusCode)
				return res.json(serres.body);
			}

		});
	},

	//生成周报头表
	addPrt: function(req, res, next) {
		var returnBean = {};
		var prtdate = req.body.prtdate;
		var projectid = req.body.projectid;
		var operid = sessionTable.getOperid(req.session);

		// 有效性验证
		if (!prtdate || prtdate == '') {
			returnBean.retflag = false;
			returnBean.retmsg = '日期不能为空';
			return res.json(returnBean);
		}

		if (!operid || operid == '') {
			returnBean.retflag = false;
			returnBean.retmsg = '用户id不能为空';
			return res.json(returnBean);
		}

		if (!projectid || projectid == '') {
			returnBean.retflag = false;
			returnBean.retmsg = '项目id不能为空';
			return res.json(returnBean);
		}

		var postData = {
			prtdate: prtdate,
			projectid: projectid,
			operid: operid
		};
		var param = {
			path: '/api/prt',
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': Buffer.byteLength(querystring.stringify(postData))
			}
		};


		serverRequest(param, postData, function(err, serres) {

				if (err) return res.status(500).send('客户端请求错误');

				if (serres) {
					var statusCode = serres.statusCode;
					res.status(serres.statusCode)
					return res.json(serres.body);
				}
		});
	},

	//新增周报明细项
	ajaxAddItem: function(req, res, next) {
		var returnBean = {};
		var prtcontentdescr = req.body.prtcontentdescr;  
		var prtid = req.body.prtid;
		var prtitemcode = req.body.prtitemcode;
		var prtcontentorder = req.body.prtcontentorder;
		var operid = sessionTable.getOperid(req.session);
		// 有效性验证
		if (!prtcontentdescr || prtcontentdescr == '') {
			returnBean.retflag = false;
			returnBean.retmsg = '周报事项明细不能为空';
			return res.json(returnBean);
		}

		if (!prtid || prtid == '') {
			returnBean.retflag = false;
			returnBean.retmsg = '周报id不能为空';
			return res.json(returnBean);
		}

		if (!prtitemcode || prtitemcode == '') {
			returnBean.retflag = false;
			returnBean.retmsg = '周报事项代码不能为空';
			return res.json(returnBean);
		}

		if (!operid || operid == '') {
			returnBean.retflag = false;
			returnBean.retmsg = '用户id不能为空';
			return res.json(returnBean);
		}

		if (!prtcontentorder || prtcontentorder == '') {
			returnBean.retflag = false;
			returnBean.retmsg = '周报事项明细排序值不能为空';
			return res.json(returnBean);
		}

		var postData = {
			prtcontentdescr: prtcontentdescr,
			prtid: prtid,
			prtitemcode: prtitemcode,
			operid:operid,
			prtcontentorder:prtcontentorder
		};
		var param = {
			path: '/api/prtcontent',
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': Buffer.byteLength(querystring.stringify(postData))
			}
		};
		serverRequest(param, postData, function(err, serres) {
			if (err) return res.status(500).send('客户端请求错误');

			if (serres) {
				var statusCode = serres.statusCode;
				res.status(serres.statusCode)
				return res.json(serres.body);
			}
		});

	},

	//修改周报明细项
	ajaxChangeItem: function(req, res, next){
		var returnBean = {};
		var prtcontentid = req.params.id;
		var prtcontentdescr= req.body.prtcontentdescr;
		var operid = sessionTable.getOperid(req.session);
		var prtcontentorder = req.body.prtcontentorder;
		var prtid = req.body.prtid;   // 用于检查明细项是否重复
		var prtitemcode = req.body.prtitemcode;  // 用于检查明细项是否重复
		
		//有效性验证
		if (!prtcontentdescr || prtcontentdescr == '') {
			returnBean.retflag = false;
			returnBean.retmsg = '周报事项明细不能为空';
			return res.json(returnBean);
		}
		if (!operid || operid == '') {
			returnBean.retflag = false;
			returnBean.retmsg = '用户id不能为空';
			return res.json(returnBean);
		}
		if (!prtid || prtid == '') {
			returnBean.retflag = false;
			returnBean.retmsg = '周报id不能为空';
			return res.json(returnBean);
		}
		if (!prtitemcode || prtitemcode == '') {
			returnBean.retflag = false;
			returnBean.retmsg = '周报事项代码不能为空';
			return res.json(returnBean);
		}
		var postData = {
			prtcontentdescr: prtcontentdescr,
			operid:operid,
			prtcontentorder:prtcontentorder,
			prtid: prtid,
			prtitemcode: prtitemcode
		};

		var param = {
			path: '/api/prtcontent/' + prtcontentid,
			method:'PUT',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': Buffer.byteLength(querystring.stringify(postData))
			}
		};
		serverRequest(param, postData, function(err, serres) {
			if (err) return res.status(500).send('客户端请求错误');

			if (serres) {
				var statusCode = serres.statusCode;
				res.status(serres.statusCode)
				return res.json(serres.body);
			}
		});
	},

	// 删除周报明细项
	ajaxDeletePrtcontent: function(req, res, next){
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

		var postData = {
			prtcontentList: prtcontentList,
			prtid:prtid
		};
		
		var param = {
			path: '/api/prtcontent/' + prtcontentid,
			method:'DELETE',
			headers: {
				'Content-Type': 'application/json',
				'Content-Length': Buffer.byteLength(JSON.stringify(postData))
			},
			_json: true
		};

		serverRequest(param, postData, function(err, serres) {
			if (err) return res.status(500).send('客户端请求错误');

			if (serres) {
				var statusCode = serres.statusCode;
				res.status(serres.statusCode)
				return res.json(serres.body);
			}
		});
	},

	// 更新周报明细表中的显示排序
	ajaxUpdatePrtcontentsDisplayOrder: function(req, res, next) {
		var prtcontentList = req.body.prtcontentList;
		var prtid = req.body.prtid;

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

		var postData = {
			prtcontentList: prtcontentList,
			prtid:prtid
		};
		
		var param = {
			path: '/api/prtcontentsDisplayOrder',
			method:'PUT',
			headers: {
				'Content-Type': 'application/json',
				'Content-Length': Buffer.byteLength(JSON.stringify(postData))
			},
			_json: true
		};

		serverRequest(param, postData, function(err, serres) {
			if (err) return res.status(500).send('客户端请求错误');

			if (serres) {
				var statusCode = serres.statusCode;
				res.status(serres.statusCode)
				return res.json(serres.body);
			}
		});
	},

	//提交周报明细表
	ajaxAddPrtdc: function(req, res, next){
		var prtid = req.body.prtid;
		var operid = sessionTable.getOperid(req.session);
		if (!prtid || prtid == '') {
			return res.status(400).send('周报id不能为空')
		}

		if (!operid || operid == '') {
			return res.status(400).send('用户id不能为空')
		}

		var postData = {
			prtid: prtid,
			operid:operid
		};
		
		var param = {
			path: '/api/prtdc',
			method:'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': Buffer.byteLength(querystring.stringify(postData))
			}
		};

		serverRequest(param, postData, function(err, serres) {
			if (err) return res.status(500).send('客户端请求错误');

			if (serres) {
				var statusCode = serres.statusCode;
				res.status(serres.statusCode)
				return res.send(serres.body);
			}
		});
	},

	// 提取个人编辑周报明细表
	getPrtdt: function(req, res, next){
		var prtid = req.params.id;

		// 有效性验证
		if (!prtid || prtid == '') {
			res.status(400).send('周报id不能为空')
		} 
		
		var param = {
			path: '/api/prtdt/' + prtid,
			method:'GET'
		};

		serverRequest(param, null, function(err, serres) {
 			// 页面请求
			if(req.query.page) {              
				if(err) {
					return next(err, req, res)
				}

				var statusCode = serres.statusCode;
				if(statusCode == 200 && serres.body.retflag) {
					return res.render('preview', {
						prt: serres.body.datalist,
						title: '个人编辑周报明细'
					})

				}else {
					return res.render(serres.body, req, res);
				}
			}

			// 函数调用
			if(next) {
				return next(err, serres);
			}

			// ajax请求
			if (err) return res.status(500).send('客户端请求错误');

			if (serres) {
				var statusCode = serres.statusCode;
				res.status(serres.statusCode)
				return res.send(serres.body);
			}
		});
	},

	// 提取已提交周报明细表
	getPrtdc: function(req, res, next){
		var prtid = req.params.id;

		// 有效性验证
		if (!prtid || prtid == '') {
			res.status(400).send('周报id不能为空')
		} 
		
		var param = {
			path: '/api/prtdc/' + prtid,
			method:'GET'
		};

		serverRequest(param, null, function(err, serres) {
			// 页面请求
			if(req.query.page) {              
				if(err) {
					next(err, req, res)
				}

				var statusCode = serres.statusCode;
				if(statusCode == 200 && serres.body.retflag) {
					return res.render('preview', {
						prt: serres.body.datalist,
						title: '已提交周报明细'
					})

				}else {
					return res.render(serres.body, req, res);
				}
			}

			// 函数调用
			if(next) {
				return next(err, serres);
			}

			// ajax调用
			if (err) return res.status(500).send('客户端请求错误');
			if (serres) {
				var statusCode = serres.statusCode;
				res.status(serres.statusCode)
				return res.send(serres.body);
			}
		});
	},

	// 周报列表查询
	queryPrts: function(req, res, next) {
		var operid = sessionTable.getOperid(req.session);
		var memberid = req.query.memberid;      // 成员id
		var projectid = req.query.projectid;
		var prtdateBegin = req.query.prtdateBegin;
		var prtdateEnd = req.query.prtdateEnd;

		// 请求头
		var headers = {
			operid: operid
		};
		if(memberid && memberid.length) headers.memberid = memberid
		if(projectid) headers.projectid = projectid;
		if(prtdateBegin && prtdateBegin.length) {
			headers.prtdateBegin = moment(new Date(prtdateBegin)).format("YYYY-MM-DD");
		}
		if(prtdateEnd && prtdateEnd.length) {
			headers.prtdateEnd = moment(new Date(prtdateEnd)).format("YYYY-MM-DD");
		}
		
		var param = {
			path: '/api/prts',
			method:'GET',
			headers: headers
		};

		serverRequest(param, null, function(err, serres) {
			if (err) return res.status(500).send('客户端请求错误');

			if (serres) {
				var statusCode = serres.statusCode;
				res.status(serres.statusCode)
				return res.send(serres.body);
			}
		});
	},

	// 批量导出同一天的周报明细表
	batchExportPrtByPrtdate: function(req, res, next) {
		var prtidList = req.body.prtidList;
		var prtdate = req.body.prtdate;

		// 有效性验证
		if (!(prtidList instanceof Array) || prtidList.length == 0) {
			return res.status(400).send('周报列表必须是数组且不为空')
		}

		if (!prtdate || prtdate.length == 0) {
			return res.status(400).send('批量导出周报的日期不能为空')
		}

		var postData = {
			prtidList: prtidList,
			prtdate: prtdate
		};
		
		var param = {
			path: '/api/batchExportPrt',
			method:'POST',
			headers: {
				'Content-Type': 'application/json',
				'Content-Length': Buffer.byteLength(JSON.stringify(postData))
			},
			_json: true
		};

		serverRequest(param, postData, function(err, serres) {
			if (err) return res.status(500).send('客户端请求错误');

			res.status(serres.statusCode);
			if(serres.statusCode == 200 && serres.body.retflag) {
				var projects = serres.body.datalist;
				var filename = moment(projects.projectdate).format('YYYY年MM月DD日') + '项目小结';

				// 写入word文档
				writeToWord(projects, function(err, buf) {
					if(err) {
						if (err) return res.status(500).send(err);
					}

					// 文件名处理
					var userAgent = (req.headers['user-agent'] || '').toLowerCase();
					if (userAgent.indexOf('msie') >= 0 || userAgent.indexOf('chrome') >= 0) {
						contentDisposition = 'attachment; filename=' + encodeURIComponent(filename);
					} else if (userAgent.indexOf('firefox') >= 0) {
						contentDisposition = 'attachment; filename*="utf8\'\'' + encodeURIComponent(filename) + '"';
					} else {
						/* safari等其他非主流浏览器只能自求多福了 */
						contentDisposition = 'attachment; filename=' + new Buffer(filename).toString('binary');
					}
					
					res.writeHead (200, {
					    "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document;",
					    'Content-disposition': contentDisposition +'.docx',
				    });

					res.end(buf);
				});

			}else {
				res.send(serres.body);
			}
		});
	}
}

// 把周报小节写到word中
function writeToWord(projects, callback) {
	//Load the docx file as a binary
	var content = fs
	    .readFileSync(path.resolve(__dirname, 'prtTemplate.docx'), 'binary');

	var zip = new JSZip(content);
	var doc = new Docxtemplater();
	doc.loadZip(zip);

	//set the templateVariables
	// 标题
	projects.projectdate = moment(projects.projectdate).format('YYYY年MM月DD日') + '项目小结';
	pre = '<w:p><w:r><w:t>';
	post = '</w:t></w:r></w:p>';
	lineBreak = '<w:br/>●';
	projects.projectArr.forEach(function(project) {
		project.projectmembers.forEach(function(member) {
			member.prt.prtitArr.forEach(function(prtit) {
				prtit.prtcontentList.forEach(function(prtcontent, i) {
					// 特殊字符处理
					var prtcontentdescr = prtcontent.prtcontentdescr.replace(/<([^"]*)>/g, "&lt;$1&gt;");  // 处理<>字符

					// 换行处理
					prtcontentdescr = prtcontentdescr.replace(/\n/g, lineBreak);

					prtcontent.prtcontentdescr = pre + '（' + (i+1) + '）' + prtcontentdescr + post;
				})
			})
		})
	})

	doc.setData(projects);

	try {
		// render the document (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
		doc.render()
	} catch (error) {
		var e = {
			message: error.message,
			name: error.name,
			stack: error.stack,
			properties: error.properties,
		}
		console.error(JSON.stringify({
			error: e
		}));
		// The error thrown here contains additional information when logged with JSON.stringify (it contains a property object).
		throw error;
	}

	buf = doc.getZip().generate({type: 'nodebuffer'});

	callback(e, buf);	
}

var serverRequest = function(param, postData, func) { // 向服务端发送请求
	_.extend(param, requset_param);

	var request = http.request(param, (res) => {
		debug(`STATUS: ${res.statusCode}`);
		debug(`HEADERS: ${JSON.stringify(res.headers)}`);

		if(!res.headers['transfer-encoding'] == 'chunked')
			res.setEncoding('utf8');
		
		let rawData = '';
		res.on('data', (chunk) => {
			rawData += chunk;
		});
		res.on('end', () => {
			try {
				debug(`BODY: ${rawData}`);
		        res.body = JSON.parse(rawData);
		        func(null, res);

		    } catch (e) {
		        console.error(e.message);
		    	res.body = rawData;
		        func(null, res);
		    }
		});
	});

	request.on('error', (err) => {
		console.error(`problem with request: ${err.message}`);
		func(err, null);
	});

	// write data to request body
	if(param._json) {
		var postData = JSON.stringify(postData);
	}else {
		var postData = querystring.stringify(postData);
	}
	
	request.write(postData);
	request.end();
}