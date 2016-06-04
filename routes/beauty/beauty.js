var express = require('express');
var router = express.Router();


var mysql = require('mysql');
var mysqlConnection = mysql.createConnection({
  host: 'rdsiyrk8j9c8y1c9281b.mysql.rds.aliyuncs.com',
  user: 'bingbing',
  password: 'bingbing2016',
  database: 'production'
});

var mysqlCon;

connectMysql(mysqlConnection).then(function (connection) {
  mysqlCon = connection;
});
/* GET home page. */
router.get('/', function (req, res, next) {
  var sql = "select `nickname`  , `user`.`phone_num` ,  `click_num` / `relation_num` as `beauty`, `topo_info`.`pic_path`   FROM `topo_info` LEFT JOIN `user` ON `topo_info`.`user_id` = `user`.`id` ORDER BY `beauty`  DESC LIMIT 200";
  return new Promise(function (resolve, reject) {
    mysqlCon.query(sql, function (err, results) {
      if (err) {
        reject(err);
      } else {
        connection.end();
        resolve(results);
      }
    })
  }).then(function (result) {
    res.render('beauty', {title: "BingBing's WebSite", data: result});
  }).catch(function (err) {
    console.log(err);
  });

});

function connectMysql(connection) {
  return new Promise(function (resolve, reject) {
    connection.connect(function (err) {
      if (err) {
        console.log('mysql connect error:', err);
        reject(err);
      } else {
        resolve(connection);
      }
    })
  });
}


module.exports = router;
