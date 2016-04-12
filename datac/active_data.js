/**
 * Created by Bingbing on 16/3/30.
 */


var url = 'mongodb://localhost:27017/datac';
var MongoClient = require('mongodb').MongoClient;

var yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
runActiveDataForDate(yesterday);

function runActiveDataForDate(date) {

    console.log('start:', date);

    var startDate = new Date(date);
    var endDate = new Date(date);

    startDate.setHours(3, 0, 0, 0);

    endDate.setDate(endDate.getDate() + 1);
    endDate.setHours(3, 0, 0, 0);


    var dateStr = date.getFullYear() + '_' + (date.getMonth() + 1) + "_" + date.getDate();
    var lastDate = new Date(date);
    lastDate.setDate(date.getDate() - 1);
    var lastDateStr = lastDate.getFullYear() + '_' + (lastDate.getMonth() + 1) + '_' + lastDate.getDate();


    console.log('startDate', startDate);
    console.log('endDate', endDate);
    console.log('dateStr', dateStr);
    console.log('lastDateStr', lastDateStr);

    console.log('===========================================');

    var mongoDB;

    MongoClient.connect(url).then(function (db) {
        mongoDB = db;
        return db;
    }).then(function (db) {
        console.log('db connected');
        var cursor = db.collection('active').find({time: {$lt: endDate, $gt: startDate}})
            .project({_id: 0, public_id: 1, time: 1});

        var thisCollectionName = 'active_daily_' + dateStr + '_data';
        var thisCollection = db.collection(thisCollectionName);
        var bulk = thisCollection.initializeOrderedBulkOp();
        console.log('start today loop...');
        return new Promise(function (resolve, reject) {
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
        });
    }).then(function (bulk) {
        console.log('today loop over!\n\n');
        console.log('start execute bulk...');
        return bulk.execute();
    }).then(function (result) {
        console.log('today bulk execute over!',
            'insert:' + result.nUpserted +
            ', update:' + result.nModified +
            '\n\n');
        var lastCollectionName = 'active_daily_' + lastDateStr + '_data';
        var lastCollection = db.collection(lastCollectionName);
        var lastCursor = lastCollection.find();
        var lastBulk = thisCollection.initializeOrderedBulkOp();
        console.log('start yesterday loop...');
        return new Promise(function (resolve, reject) {
            lastCursor.forEach(function (doc) {
                lastBulk.find({_id: doc._id}).update({$set: {time: doc.time}});
            }, function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(lastBulk);
                }
            })
        });
    }).then(function (bulk) {
        console.log('yesterday loop over\n\n');
        console.log('start execute bulk...');
        return bulk.execute();
    }).then(function (result) {
        console.log('yesterday bulk execute over!',
            'update:' + result.nModified +
            '\n\n');
        mongoDB.close()
    }).catch(function (err) {
        console.log('err!:', err);
        mongoDB.close()
    });
}

