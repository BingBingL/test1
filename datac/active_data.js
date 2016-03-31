/**
 * Created by Bingbing on 16/3/30.
 */


var url = 'mongodb://localhost:27017/datac';
var MongoClient = require('mongodb').MongoClient;


MongoClient.connect(url, function (err, db) {
    if (err) {
        console.log('db error!', err);
    }
    console.log('db connect!');

    var now = new Date();
    var dateStr = now.toLocaleDateString();
    console.log(dateStr);
    process.exit(0);
});

