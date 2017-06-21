#!/usr/bin/env node

var mysql = require('mysql');
var connection = mysql.createConnection({
  host: 'localhost',
  user: 'pi',
  password: 'randy4thewin',
  database: 'randy'
});


const BASELINE_ROTATIONS = 20; // This is the minimum number to report a healthy status.

const HTTPS_PORT = 3001;
const HTTP_PORT = 3000;

const express = require('express');
const shell = require('shelljs');
const fs = require("fs");
const https = require('https');
const http = require('http');

const app = express();


////////////////////////////////
// Setup servers

// HTTPS
var secureServer = https.createServer({
    key: fs.readFileSync('keys/private.key'),
    cert: fs.readFileSync('keys/certificate.pem')
  }, app)
  .listen(HTTPS_PORT, function() {
    console.log('Secure Server listening on port ' + HTTPS_PORT);
  });

// HTTP
var insecureServer = http.createServer(app).listen(HTTP_PORT, function() {
  console.log('Insecure Server listening on port ' + HTTP_PORT);
});


////////////////////////////
// Content request headers middleware
///////////////////////////
app.use(function(req, res, next) {

  var allowedOrigins = ['http://randythehamster.com', 'http://www.randythehamster.com', 'https://www.randythehamster.com', 'https://randythehamster.com'];
  var origin = req.headers.origin;
  if (allowedOrigins.indexOf(origin) > -1) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Content-Type', 'application/json');
  // Pass to next layer of middleware
  next();
});


////////////////////////////
// Unusual Requests
///////////////////////////

app.get('/test', function(req, res) {
  res.send("TEST!");
});

app.post('/pull', function(req, res) {
  res.send('Pulling repo and restarting server');
  shell.cd('/home/pi/randy');
  shell.exec('git pull origin master');
});

app.post('/reboot', function(req, res) {
  res.send('Rebooting Pi');
  shell.exec('sudo reboot');
});

app.post('/google', function(req, res) {
  var output = {
    speech: "",
    displayText: "",
    source: "www.randythehamster.com"
  }
  connection.query('SELECT COUNT(*) AS count FROM rotations WHERE date >= now() - INTERVAL 1 DAY', function(err, rows, fields) {
    var rotations = rows[0].count;
    output.speech += "Today, Randy has run " + rotations + " rotations. ";
    if (rotations < BASELINE_ROTATIONS) {
      output.speech += "You should probably check on him."
    } else {
      output.speech += "He seems happy and healthy."
    }
    output.displayText = output.speech;

    return res.json(output);
  });
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

app.get('/heartbeat/weekday', function(req, res) { // This only returns results for the last week.
  connection.query('SELECT DAYOFWEEK(date) as weekday, COUNT(*) as count FROM heartbeat WHERE date BETWEEN date_sub(now(),INTERVAL 1 WEEK) AND now() GROUP BY weekday ORDER BY weekday ASC', function(err, rows, fields) {
    res.send(rows);
  });
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

app.get('/rotations/weekday', function(req, res) {
  connection.query('SELECT DAYOFWEEK(date) as weekday, COUNT(*) as count FROM rotations WHERE date BETWEEN date_sub(now(),INTERVAL 1 WEEK) AND now() GROUP BY weekday ORDER BY weekday ASC', function(err, rows, fields) {
    res.send(rows);
  });
});

app.get('/rotations/today/count', function(req, res) {
  connection.query('SELECT COUNT(*) as count FROM rotations WHERE date >= now() - INTERVAL 1 DAY', function(err, rows, fields) {
    res.send(rows);
  });
});
