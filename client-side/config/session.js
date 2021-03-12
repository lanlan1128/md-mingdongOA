var OA_ORGIDS021 = 'MINGDONG';

/* 设置登录session */
exports.setLogin=function(session, value){
    session.OA_ORGIDS021 = OA_ORGIDS021;    // 机构id
    session.OA_OPERID = value.OA_OPERID;		// 用户id
    // session.save();
};

/* 设置operid */
exports.setOperid =function(session, value){
	session.OA_OPERID = value;
};

/* 获取用户id */
exports.getOperid =function(session){
	return session.OA_OPERID;
};


/* 设置用户昵称 */
exports.setNickname =function(session, value){
	session.NAMECN = value;
};

/* 获取用户昵称 */
exports.getNickname =function(session){
	return session.NAMECN;
};

