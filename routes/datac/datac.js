var express = require('express');
var config = require('./config.js');
var router = express.Router();

var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var mongoDB;

var url = 'mongodb://' + config.db_address + ":" + config.db_port + "/" + config.db_name;
MongoClient.connect(url, function (err, db) {
    if (err) {
        console.log('db error!', err);
    }
    console.log('db connect!');
    mongoDB = db;
});

router.use(function (req, res, next) {
    next();
});

//handle public data
router.post('/save', function (req, res, next) {
    var publicData = req.body.public;

    if (isEmpty(publicData) || publicData == null || publicData == undefined) {
        next({message: "null public data!", status: 401});
    } else {
        publicData._id = publicData.id;
        publicData.time = req._startTime;
        console.log('publicData', publicData);
        mongoDB.collection('public_data').save(publicData, function (err, result) {
            if (err) {
                console.log('save error!', err);
            }
        });
        next();
    }
});

//handle all_data
router.post('/save', function (req, res, next) {
    var type = req.body.type;
    var data = req.body.data;

    if (isEmpty(data) || data == null || data == undefined) {
        res.end();
    } else {
        data.time = req._startTime;
        var typedData = {
            type: type,
            data: data
        };
        console.log("typedData", typedData);
        mongoDB.collection('all_data').insertOne(typedData, function (err, result) {
            if (err) {
                console.log('save error!', err);
            }
        });
        next();
    }
});

//handle active_data
router.post('/save', function (req, res, next) {
    var type = req.body.type;
    var data = req.body.data;

    if (type == 'active') {
        if (isEmpty(data) || data == null || data == undefined) {
            res.end();
        } else {
            console.log("data", data);
            mongoDB.collection('active_data').insertOne(data, function (err, result) {
                if (err) {
                    console.log('save error!', err);
                }
            });
            next();
        }
    } else {
        next();
    }
});


//add more handlers here;



//unhandled data
router.post('/save', function (req, res, next) {
    res.end();
});




function isEmpty(obj) {
    for (var name
        in obj) {
        return false;
    }
    return true;
};


module.exports = router;
