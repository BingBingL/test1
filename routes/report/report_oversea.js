var express = require('express');
var config = require('./config_oversea.js');
var router = express.Router();
var globalConfig = require('../../config.js');

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
    if ('development' == globalConfig.env) {
        console.log(req.body);
    }
    next();
});



//handle public data
router.post('/save', function (req, res, next) {
    var publicData = req.body.public;

    if (!publicData || isEmpty(publicData)) {
        next({message: "null public data!", status: 401});
    } else {
        //FFA761C3-66E5-43E6-9B3F-F1B3069D764A146
        if (publicData.platform == 'iOS' && publicData.id.length > 36) {
            publicData.id = publicData.id.substr(0, 36);
        }

        mongoDB.collection('public_data').findOne({_id: publicData.id}, function (err, doc) {
            if (err) {
                console.log('public find error!', err);
            }

            var existData = doc;
            if (!existData || isEmpty(existData)) {

                publicData._id = publicData.id;
                publicData.time = req._startTime;
                publicData.first_time = req._startTime;

                mongoDB.collection('public_data').save(publicData, function (err, result) {
                    if (err) {
                        console.log('save error!', err);
                    }
                });
            } else {
                var updateDoc = {};

                if (publicData.user && publicData.user != existData.user) {
                    updateDoc.user = publicData.user;
                }

                if (publicData.client_version != existData.client_version) {
                    updateDoc.client_version = publicData.client_version;
                }

                if (!isEmpty(updateDoc)) {
                    updateDoc.time = req._startTime;
                    mongoDB.collection('public_data').updateOne({_id: publicData.id},
                        {$set: updateDoc},
                        function (err, result) {
                            if (err) {
                                console.log('update error!', err);
                            }
                        });
                } else {

                }
            }

            next();
        });
    }
});

//handle all_data
router.post('/save', function (req, res, next) {
    var type = req.body.type;
    var data = req.body.data;

    if (data == undefined || data == null || isEmpty(data)) {
        res.end();
    } else {
        data.time = req._startTime;
        var typedData = {
            type: type,
            data: data,
            public_id: req.body.public.id
        };
        mongoDB.collection('all_data').insertOne(typedData, function (err, result) {
            if (err) {
                console.log('save error!', err);
            }
        });
        next();
    }
});

//handle data
router.post('/save', function (req, res, next) {
    var type = req.body.type;
    var data = req.body.data;

    if (data == undefined || data == null || isEmpty(data)) {
        res.end();
    } else {
        data.public_id = req.body.public.id;
        mongoDB.collection(type).insertOne(data, function (err, result) {
            if (err) {
                console.log('save error!', err);
            }
        });
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
