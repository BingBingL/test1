var url = 'mongodb://localhost:27017/datac';
var MongoClient = require('mongodb').MongoClient;

MongoClient.connect(url).then(function (db) {
    var collection = db.collection('official_activity');
    var map = function () {
        var str = this.id + '_' + this.public_id;
        var result = {};
        result.count = 1;
        result[str] = true;
        emit(this.status, result);
    };

    var reduce = function (key, values) {
        var result = values[0];
        for (var i = 1; i < values.length; i++) {
            for (var str in values[i]) {
                if (values[i][str] && !result[str]) {
                    result[str] = true;
                    result.count++;
                }
            }
        }

        return result;
    };

    var option = {};
    option.out = {replace: 'tempCollection'};
    option.query = {event: 'activity_page'};
    collection.mapReduce(map, reduce, option, function (err, collection) {
        if (err) {
            console.log(err);
        }

        if (collection) {
            var cursor = collection.find();
            cursor.forEach(function (doc) {
                console.log(doc._id, doc.value.count);

            }, function (err) {
                if (err) {
                    console.log(err);
                }

                console.log('end!!');
                db.close();
            });
        } else {
            console.log('collection null!!');
            db.close()
        }

    })
});