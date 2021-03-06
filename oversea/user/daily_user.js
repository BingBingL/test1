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
        var sql = "SELECT ?? FROM user_info LEFT JOIN user ON user_info.id = user.id WHERE user_info.id IN (?)";
        var columns = ['user_info.id', 'user.phone_num', 'user_info.birthday', 'user_info.city', 'user_info.gender', 'user_info.nickname', 'user_info.identity', 'user_info.university', 'user_info.profession'];
        var values = [columns, ids];
        return new Promise(function (resolve, reject) {
            connection.query(sql, values, function (err, results) {
                if (err) {
                    reject(err);
                } else {
                    connection.end();
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
                var key;
                if (activeDate.getHours() < 3) {
                    key = activeDate.getFullYear() + '_' + (activeDate.getMonth() + 1) + '_' + (activeDate.getDate() - 1);
                } else {
                    key = activeDate.getFullYear() + '_' + (activeDate.getMonth() + 1) + '_' + (activeDate.getDate());
                }

                if (firstDate && dateStr == key && ((activeDate - firstDate) > (1000 * 60 * 60 * 24 * 7))) {
                    user.revive = 1;
                    user.from_time = firstDate;
                } else {
                    user.revive = 0;
                    user.from_time = activeDate;
                }
                user.birthday = toDateString(new Date(user.birthday));
                user.from_time = toDateString(new Date(user.from_time));
                return user;
            }))
        });
        return promises;
    }).then(function (promises) {
        return Promise.all(promises);
    }).then(function (users) {
        db.close();
        var stringify = require('csv-stringify');
        var columns = ['id', 'phone_num', 'birthday', 'city', 'gender', 'nickname', 'identity', 'university', 'profession', 'from_time', 'revive'];
        var option = {header: columns};
        stringify(users, option, function(err, output){
            if (err) {
                console.log('csv error:', err);
            }
            var fs= require('fs');
            var path = require('path');
            var filePath = path.join(__dirname, '../../public/datac/');
            filePath = path.join(filePath, dateStr + '.csv');
            console.log('file path:', filePath);
            fs.writeFile(filePath, output, function (err) {
               if (err) {
                   console.log('file write err:', err);
               }
            });
        });
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

function toDateString(date) {
    if (date) {
        if (date.getHours() < 3) {
            return date.getFullYear() + '_' + (date.getMonth() + 1) + '_' + (date.getDate() - 1);
        } else {
            return date.getFullYear() + '_' + (date.getMonth() + 1) + '_' + (date.getDate());
        }
    }
}