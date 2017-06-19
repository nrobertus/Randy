var mysql = require('mysql')
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'pi',
  password : 'randy4thewin',
  database : 'randy'
});

connection.connect()

const express = require('express')
const app = express()

app.get('/', function (req, res) {
  res.send('Hello World!')
  connection.query('SELECT * FROM heartbeat', function (err, rows, fields) {
  if (err) throw err

  res.send('The solution is: ', rows[0].solution)
  })
})

app.listen(80, function () {
  console.log('Example app listening on port 80!')
})



//connection.end()