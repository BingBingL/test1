var url = 'mongodb://localhost:27017/datac';
var MongoClient = require('mongodb').MongoClient;

var mysql      = require('mysql');
var mysqlConnection = mysql.createConnection({
    host     : 'rdsiyrk8j9c8y1c9281b.mysql.rds.aliyuncs.com',
    user     : 'bingbing',
    password : 'bingbing2016',
    database : 'production'
});

var dateArg = process.argv.splice(2);
var yesterday;

if (isEmpty(dateArg) || !dateArg) {
    console.log('arg error!, use yesterday as default');
    yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
} else {
    console.log('arg:', dateArg);
    yesterday = new Date(dateArg);
}

MongoClient.connect(url).then(function (db) {
    var dateStr = yesterday.getFullYear() + '_' + (yesterday.getMonth() + 1) + "_" + yesterday.getDate();
    var collectionName = 'active_daily_' + dateStr + '_data';
    console.log('collectionName:' + collectionName);
    var collection = db.collection(collectionName);

    var publicCollection = db.collection('public_data');

    var cursor = collection.find();
    var ids = [];
    var promises = [];
    new Promise(function (resolve, reject) {
        cursor.forEach(function (doc) {
            promises.push(publicCollection.findOne({_id: doc._id}, {fields: {user: 1}}).then(function (doc) {
                if (doc && doc.user) {
                    ids.push(doc.user);
                }
            }));
        }, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve(promises);
            }
        })
    }).then(function (promises) {
        return Promise.all(promises);
    }).then(function () {
        console.log('ids:', ids.length);
        return connectMysql(mysqlConnection);
    }).then(function (connection) {
        var sql = "SELECT ?? FROM user_info WHERE id IN (?)";
        var columns = ['id', 'birthday', 'city', 'gender', 'nickname', 'identity', 'university', 'profession'];
        var values = [columns, ids];
        connection.query(sql, values, function (err, results) {
            if (err) {
                console.log('mysql query error:', err);
            } else {
                console.log('result', results);
            }
        })
    }).catch(function (err) {
        console.log('err:', err);
        db.close();
    });

});


function connectMysql(connection) {
    return new Promise(function (resolve, reject) {
        connection.connect(function (err) {
            if (err) {
                console.log('mysql connect error:', err);
                reject(err);
            } else {
                resolve(connection);
            }
        })
    });
}

function isEmpty(obj) {
    for (var name
        in obj) {
        return false;
    }
    return true;
};