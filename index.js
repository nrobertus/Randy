var mysql = require('mysql')
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'pi',
  password : 'randy4thewin',
  database : 'randy'
});

const express = require('express')
const app = express()

app.get('/heartbeat', function (req, res) {
  connection.query('SELECT * FROM heartbeat', function (err, rows, fields) {
    res.send(rows);
  });
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})
