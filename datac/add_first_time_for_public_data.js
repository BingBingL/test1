var url = 'mongodb://localhost:27017/datac';
var MongoClient = require('mongodb').MongoClient;

MongoClient.connect(url).then(function (db) {
    var publicCollection = db.collection('public_data');
    var allDataCollection = db.collection('all_data');

    var cursor = publicCollection.find();

    var findCount = 0;
    var updateCount = 0;

    cursor.forEach(function (doc) {
        allDataCollection.findOne({'public_id': doc._id}, {sort: {'data.time': 1}}).then(function (doc) {
            var allDataDoc = doc;
            console.log('find:', findCount);
            findCount++;
            if (allDataDoc) {
                publicCollection.findOneAndUpdate({'_id': allDataDoc.public_id}, {'$set': {'first_time': allDataDoc.data.time}}, function (err, result) {
                    if (err) {
                        console.log('err:', err);
                    }
                    console.log('update', updateCount);
                    updateCount++;
                });
            }
        });
    }, function (err, result) {
        if (err) {
            console.log('err:', err);
        }
        console.log('all_result', result);
    })
});