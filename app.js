var mysql = require('mysql');
var connection = mysql.createConnection({
  host: 'localhost',
  user: 'pi',
  password: 'randy4thewin',
  database: 'randy'
});

const express = require('express');
const app = express();

app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://69.145.60.173');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

////////////////////////////
// Heartbeat requests
///////////////////////////

app.get('/heartbeat', function(req, res) {
  connection.query('SELECT *, DAYOFWEEK(date) as weekday FROM heartbeat', function(err, rows, fields) {
    res.send(rows);
  });
});

app.get('/heartbeat/today', function(req, res) {
  connection.query('SELECT * FROM heartbeat WHERE date >= now() - INTERVAL 1 DAY', function(err, rows, fields) {
    res.send(rows);
  })
});

app.get('/heartbeat/today/count', function(req, res) {
  connection.query('SELECT COUNT(*) as count FROM heartbeat WHERE date >= now() - INTERVAL 1 DAY', function(err, rows, fields) {
    res.send(rows);
  })
});

////////////////////////////
// Rotation requests
///////////////////////////

app.get('/rotations', function(req, res) {
  connection.query('SELECT *, DAYOFWEEK(date) as weekda FROM rotations', function(err, rows, fields) {
    res.send(rows);
  });
});

app.get('/rotations/today', function(req, res) {
  connection.query('SELECT * FROM rotations WHERE date >= now() - INTERVAL 1 DAY', function(err, rows, fields) {
    res.send(rows);
  });
});

app.get('/rotations/today/count', function(req, res) {
  connection.query('SELECT COUNT(*) as count FROM rotations WHERE date >= now() - INTERVAL 1 DAY', function(err, rows, fields) {
    res.send(rows);
  });
});

app.listen(3000, function() {
  console.log('Example app listening on port 3000!');
})
