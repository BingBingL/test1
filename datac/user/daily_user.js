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
    var map = {};
    new Promise(function (resolve, reject) {
        var promises = [];
        cursor.forEach(function (doc) {
            promises.push(publicCollection.findOne({_id: doc._id}, {fields: {user: 1}}).then(function (doc) {
                if (doc && doc.user) {
                    ids.push(doc.user);
                    map[doc.user] = doc._id;
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
        return new Promise(function (resolve, reject) {
            connection.query(sql, values, function (err, results) {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            })
        });
    }).then(function (results) {
        console.log('users:', results.length);
        var promises = [];
        results.forEach(function (user) {
            promises.push(collection.findOne({_id: map[user.id]}).then(function (doc) {
                var activeDate = new Date(doc.time);
                var firstDate = new Date(doc.first_time);
                if (activeDate && firstDate && ((activeDate - firstDate) > (1000 * 60 * 60 * 24 * 7))) {
                    user.from_time = doc.first_time;
                } else {
                    user.from_time = doc.time;
                }
                return user;
            }))
        })
        return promises;
    }).then(function (promises) {
        return Promise.all(promises);
    }).then(function (users) {
        console.log(users);
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