var express = require('express');
var router = express.Router();


var mysql      = require('mysql');
var mysqlConnection = mysql.createConnection({
  host     : 'rdsiyrk8j9c8y1c9281b.mysql.rds.aliyuncs.com',
  user     : 'bingbing',
  password : 'bingbing2016',
  database : 'production'
});

/* GET home page. */
router.get('/', function(req, res, next) {

  connectMysql(mysqlConnection).then(function (connection) {
    var sql = "select `nickname`  , `user`.`phone_num` ,  `click_num` / `relation_num` as `beauty`, `topo_info`.`pic_path`   FROM `topo_info` LEFT JOIN `user` ON `topo_info`.`user_id` = `user`.`id` ORDER BY `beauty`  DESC ";
    return new Promise(function (resolve, reject) {
      connection.query(sql, function (err, results) {
        if (err) {
          reject(err);
        } else {
          connection.end();
          resolve(results);
        }
      })
    });
  }).then(function (result) {
    console.log(result);
    res.render('beauty', { title: "BingBing's WebSite" , data:result});
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
