var mysql = require('mysql');
var connection = mysql.createConnection({
  host: 'localhost',
  user: 'pi',
  password: 'randy4thewin',
  database: 'randy'
});

const express = require('express');
const app = express();

////////////////////////////
// Heartbeat requests
///////////////////////////

app.get('/heartbeat', function(req, res) {
  connection.query('SELECT * FROM heartbeat', function(err, rows, fields) {
    res.send(rows);
  });
});

app.get('/heartbeat/today', function(req, res) {
  connection.query('SELECT * FROM heartbeat WHERE date >= now() - INTERVAL 1 DAY', function(err, rows, fields) {
    res.send(rows);
  })
});

////////////////////////////
// Rotation requests
///////////////////////////

app.get('/rotations', function(req, res) {
  connection.query('SELECT * FROM rotations', function(err, rows, fields) {
    res.send(rows);
  });
});

app.get('/rotations/today', function(req, res) {
  connection.query('SELECT * FROM rotations WHERE date >= now() - INTERVAL 1 DAY', function(err, rows, fields) {
    res.send(rows);
  });
});

app.listen(3000, function() {
  console.log('Example app listening on port 3000!');
})
