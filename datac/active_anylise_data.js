/**
 * Created by Bingbing on 16/4/5.
 */

var url = 'mongodb://localhost:27017/datac';
var MongoClient = require('mongodb').MongoClient;


var date = process.argv.splice(2);

if (isEmpty(date) || !date) {
    console.log('arg error!');
    return
}


MongoClient.connect(url).then(findData);

function findData(db) {
    console.log('db connected!');

    var collectionName = 'active_daily_' + date + '_data';
    console.log('collectionName:' + collectionName);
    var collection = db.collection(collectionName);

    function map(){
        var key = this.time.getFullYear() + '_' + (this.time.getMonth() + 1) + '_' + (this.time.getDate());
        // console.log('map key:' + key);
        emit(key, 1);
    }

    function reduce(key, values) {
        // console.log('reduce:' + key + ', ' + values.length);
        return values.length;
    }

    console.log('db map reduce!');

    collection.mapReduce(map, reduce, {out: {replace : 'tempCollection'}}, function (err, collection) {
        if (err) {
            console.log(err);
        }

        if (collection) {
            var cursor = collection.find();
            cursor.forEach(function (doc) {
                console.log(doc);

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

    });

}


function isEmpty(obj) {
    for (var name
        in obj) {
        return false;
    }
    return true;
};

