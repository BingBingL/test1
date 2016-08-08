/**
 * Created by Bingbing on 16/8/8.
 */

var express = require('express');
var globalConfig = require('../config.js');

var router = express.Router();

router.use(function (req, res, next) {
  var url = req.headers.host;

  if ('development' == globalConfig.env) {
    console.log('filter receive:' + url);
    next();
  } else {
    if (globalConfig.urls.indexOf(url) >= 0) {
      next();
    } else {
      var err = new Error('forbidden host');
      err.status = 403;
      next(err);
    }
  }

});

module.exports = router;