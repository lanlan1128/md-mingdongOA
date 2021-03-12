const mssql = require('mssql');
const config = {
    user: 'MINGDONGOA',
    password: 'ADMIN@1511',
    server: '10.1.1.12',
    database: 'MINGDONG_OA',

    // options: {
    //     encrypt: true // Use this if you're on Windows Azure 
    // }
}

var sql = {};

sql.connect = function(func) {
	pool = new mssql.ConnectionPool(config, err => {
		if(err) {
			console.error(err)
			return func(err);
		}

		func(null, pool);

	})

	pool.on('error', err => {
	    console.error(err)
	    func(err)
	})
}


module.exports = sql;