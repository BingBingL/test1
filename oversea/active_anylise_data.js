/**
 * Created by Bingbing on 16/4/5.
 */

var url = 'mongodb://localhost:27017/oversea';
var MongoClient = require('mongodb').MongoClient;


var dateArg = process.argv.splice(2);

if (isEmpty(dateArg) || !dateArg) {
    console.log('arg error!, use yesterday as default');
    yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
} else {
    console.log('arg:', dateArg);
    yesterday = new Date(dateArg);
}

var date = yesterday.getFullYear() + '_' + (yesterday.getMonth() + 1) + "_" + yesterday.getDate();


MongoClient.connect(url).then(findData);

function findData(db) {
    console.log('db connected!');

    var collectionName = 'active_daily_' + date + '_data';
    console.log('collectionName:' + collectionName);
    var collection = db.collection(collectionName);

    function map() {
        var key;
        var date = new Date(this.time);
        var firstDate = new Date(this.first_time);
        // if (date.getHours() < 3) {
        //     key = date.getFullYear() + '_' + (date.getMonth() + 1) + '_' + (date.getDate() - 1);
        // } else {
            key = date.getFullYear() + '_' + (date.getMonth() + 1) + '_' + (date.getDate());
        // }

        if (firstDate && thisDate == key && ((date - firstDate) > (1000 * 60 * 60 * 24 * 7))) {
            key = 'revive';
        }
        console.log('timezone' + date.getTimezoneOffset());
        emit(key, 1);
    }

    function reduce(key, values) {
        // console.log('reduce:' + key + ', ' + values.length);
        return Array.sum(values);
    }


    var option = {};
    option.out = {replace: 'tempCollection'};
    option.scope = {thisDate: date};

    console.log('db map reduce!', option.scope);

    collection.mapReduce(map, reduce, option, function (err, collection) {
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

