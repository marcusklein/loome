var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('#/404', function(req, res, next) {
  res.sendfile('404.html');
});

router.get('/', function(req, res, next) {
  res.sendfile('index.html');
});

router.get('*', function(req, res, next) {
  res.sendfile('public/404.html');
});

module.exports = router;
