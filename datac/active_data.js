/**
 * Created by Bingbing on 16/3/30.
 */


var url = 'mongodb://localhost:27017/datac';
var MongoClient = require('mongodb').MongoClient;

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

runActiveDataForDate(yesterday);

function runActiveDataForDate(date) {

    console.log('start:', date);

    var startDate = new Date(date);
    var endDate = new Date(date);

    startDate.setHours(3, 0, 0, 0);

    endDate.setDate(endDate.getDate() + 1);
    endDate.setHours(3, 0, 0, 0);


    var dateStr = date.getFullYear() + '_' + (date.getMonth() + 1) + "_" + date.getDate();


    console.log('startDate', startDate);
    console.log('endDate', endDate);
    console.log('dateStr', dateStr);

    console.log('===========================================');

    MongoClient.connect(url).then(function (db) {
        console.log('db connected');
        var thisCollection;

        var cursor = db.collection('active').find({time: {$lt: endDate, $gt: startDate}, public_id:{$regex:'.{1,40}'}})
            .project({_id: 0, public_id: 1, time: 1});

        var thisCollectionName = 'active_daily_' + dateStr + '_data';
        thisCollection = db.collection(thisCollectionName);
        var bulk = thisCollection.initializeOrderedBulkOp();
        console.log('start today loop...');
        new Promise(function (resolve, reject) {
            cursor.forEach(function (doc) {
                bulk.find({_id: doc.public_id}).upsert().update({$set: {_id: doc.public_id, time: doc.time}});
            }, function (err) {
                if (err) {
                    console.log('forEach error', err);
                    reject(err);
                } else {
                    resolve(bulk);
                }

            });
        }).then(function (bulk) {
            console.log('today loop over!\n\n');
            console.log('start execute today bulk...');
            return bulk.execute();
        }).then(function (result) {
            console.log('today bulk execute over!',
                'insert:' + result.nUpserted +
                ', update:' + result.nModified +
                '\n\n');

            var promiseQue = Promise.resolve();
            for (var i = 1; i < 8; i++) {
                (function (i) {
                    promiseQue = promiseQue.then(function () {
                        var tempDate = new Date(date);
                        tempDate.setDate(date.getDate() - i);
                        return updateForDate(db, tempDate, thisCollection);
                    })
                })(i);
            }
            return promiseQue;

        }).catch(function (err) {
            console.log('last days err!:', err);
        }).then(function (result) {
            console.log('last days over!\n\n');
            console.log('start add first time!');
            var publicCollectionName = 'public_data';
            var publicCollection = db.collection(publicCollectionName);
            var thisCursor = thisCollection.find();
            var firstTimeBulk = thisCollection.initializeUnorderedBulkOp();
            var promises = [];
            var i = 0;
            return new Promise(function (resolve, reject) {
                thisCursor.forEach(function (doc) {
                    promises[i] = publicCollection.findOne({_id: doc._id}, {fields: {first_time: 1}})
                        .then(function (doc) {
                            if (doc) {
                                firstTimeBulk.find({_id: doc._id}).update({$set: {first_time: doc.first_time}});
                            }
                            return firstTimeBulk;
                        });
                    i++;
                }, function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        console.log('i', i);
                        resolve(promises);
                    }
                });
            });
        }).then(function (promises) {
            console.log('add first time loop over!');
            return Promise.all(promises);
        }).then(function (bulks) {
            console.log('add first time find over!');
            var bulk = bulks[0];
            return bulk.execute();
        }).then(function (result) {
            console.log('add first time bulk over!\n\n');
            console.log('all over!!!\n\n');
            db.close();
        }).catch(function (err) {
            console.log('err!:', err);
            db.close()
        });
    });

    function updateForDate(db, date, targetCollection) {
        var dateString = date.getFullYear() + '_' + (date.getMonth() + 1) + '_' + date.getDate();
        var collectionName = 'active_daily_' + dateString + '_data';
        var collection = db.collection(collectionName);
        var bulk = targetCollection.initializeUnorderedBulkOp();
        var cursor = collection.find();
        console.log('start loop for date:', dateString);
        return new Promise(function (resolve, reject) {
            cursor.forEach(function (doc) {
                bulk.find({_id: doc._id}).update({$set: {time: doc.time}});
            }, function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(bulk);
                }
            })
        }).then(function (bulk) {
            console.log('start execute bulk for date:', dateString);
            return bulk.execute()
        }).then(function (result) {
            console.log(dateString + ' bulk execute over!',
                'insert:' + result.nUpserted +
                ', update:' + result.nModified +
                '\n\n');
            return Promise.resolve();
        }).catch(function (err) {
            return Promise.reject(err);
        });

    }
}

function isEmpty(obj) {
    for (var name
        in obj) {
        return false;
    }
    return true;
};

