/**
 * Created by Bingbing on 16/3/30.
 */
var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    res.end();
});

module.exports = router;