#!/usr/bin/env node

// Libraries
const bodyParser = require('body-parser');
const spawn = require('child_process').spawn;
const exec = require('child_process').exec;
const express = require('express');
const fs = require("fs");
const http = require('http');
const https = require('https');
const mysql = require('mysql');
const shell = require('shelljs');
const util = require('util');

// Constants
const BASELINE_ROTATIONS = 20; // This is the minimum number to report a healthy status.
const HTTPS_PORT = 3001;
const HTTP_PORT = 3000;
const LOG_DIRECTORY = "/home/pi/logs/log.txt";

// Variables
var heartbeat_connections = [];
var rotations_connections = [];
var heartbeat_data = null;

////////////////////////////////
// Initial setup
///////////////////////////////

// Main application
const app = express();

// Database connection
var connection = mysql.createConnection({
  host: 'localhost',
  user: 'pi',
  password: 'randy4thewin',
  database: 'randy'
});


// HTTPS server
var secureServer = https.createServer({
    key: fs.readFileSync('/home/pi/keys/private.key'),
    cert: fs.readFileSync('/home/pi/keys/certificate.pem')
  }, app)
  .listen(HTTPS_PORT, function() {
    console.log('Secure Server listening on port ' + HTTPS_PORT);
  });

// HTTP server
var insecureServer = http.createServer(app).listen(HTTP_PORT, function() {
  console.log('Insecure Server listening on port ' + HTTP_PORT);
});


////////////////////////////
// Middleware
///////////////////////////

app.use(function(req, res, next) {
  res.sseSetup = function() {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    })
  }

  res.sseSend = function(data) {
    res.write("data: " + JSON.stringify(data) + "\n\n");
  }
  next()
});

// Content request headers middleware
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


// Body parser middleware
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({
  extended: true
})); // support encoded bodies



////////////////////////////
// Requests
///////////////////////////

// Heartbeat

app.get('/heartbeat/latest', function(req, res) {
  res.sseSetup();
  heartbeat_connections.push(res);
  connection.query('SELECT MAX(date) AS datetime FROM heartbeat GROUP BY id ORDER BY datetime DESC LIMIT 1', function(err, rows, fields) {
    res.sseSend(rows);
  });
});

app.get('/heartbeat/latest/static', function(req, res) {
  connection.query('SELECT MAX(date) AS datetime FROM heartbeat GROUP BY id ORDER BY datetime DESC LIMIT 1', function(err, rows, fields) {
    res.send(rows);
  });
});

app.post('/heartbeat', function(req, res) {
  var date = "NOW()";
  if (req.body.date) {
    date = "'" + req.body.date + "'";
  }
  res.send("posting heartbeat");
  connection.query("INSERT INTO heartbeat (date, status) values (" + date + ", 'healthy')", function(err, rows, fields) {
    if (!err) {
      connection.query('SELECT MAX(date) AS datetime FROM heartbeat GROUP BY id ORDER BY datetime DESC LIMIT 1', function(err, rows, fields) {
        for (var i = 0; i < heartbeat_connections.length; i++) {
          heartbeat_connections[i].sseSend(rows);
        }
      });
    } else {
      console.log("Failure to post heartbeat: " + date);
    }
  });

});

// Rotations

app.get('/rotations/weekday', function(req, res) {
  res.sseSetup();
  rotations_connections.push(res);
  connection.query('SELECT DAYOFWEEK(date) as weekday, COUNT(*) as count FROM rotations WHERE date BETWEEN date_sub(now(), INTERVAL 1 WEEK) AND now() GROUP BY weekday ORDER BY date ASC', function(err, rows, fields) {
    res.sseSend(rows);
  });
});

app.get('/rotations/weekday/static', function(req, res) {
  connection.query('SELECT DAYOFWEEK(date) as weekday, COUNT(*) as count FROM rotations WHERE date BETWEEN date_sub(now(),INTERVAL 1 WEEK) AND now() GROUP BY weekday ORDER BY date ASC', function(err, rows, fields) {
    res.send(rows);
  });
});

app.post('/rotations', function(req, res) {
  var date = "NOW()";
  if (req.body.date) {
    date = "'" + req.body.date + "'";
  }
  var values = "(" + date + ",0)";
  if (req.body.dates) {
    if (typeof req.body.dates === "string") {
      values = "('" + req.body.dates + "',0)";
    } else {
      var output = ""
      req.body.dates.forEach(function(date) {
        output += "('" + date + "',0),";
      })
      output = output.slice(0, -1);
      values = output;
    }
  }
  var sql = "INSERT INTO rotations (date, speed) values " + values;
  res.send(sql);
  connection.query(sql, function(err, rows, fields) {
    if (!err) {
      connection.query('SELECT DAYOFWEEK(date) as weekday, COUNT(*) as count FROM rotations WHERE date BETWEEN date_sub(now(),INTERVAL 1 WEEK) AND now() GROUP BY weekday ORDER BY date ASC', function(err, rows, fields) {
        for (var i = 0; i < rotations_connections.length; i++) {
          rotations_connections[i].sseSend(rows);
        }
      });
    } else {
      console.log("Failure to post rotations: " + sql);
    }
  });
});

// Unusual requests
app.get('/uptime', function(req, res) {
  executeCommand('uptime', function(data) {
    res.send(data);
  });
});

app.post('/command', function(req, res) {
  executeCommand(req.body.command, function(data) {
    res.send(JSON.stringify({
      'res': data
    }));
  })
});

app.get("/logs", function(req, res) {
  fs.readFile(LOG_DIRECTORY, function read(err, data) {
    if (err) {
      res.send("Cannot read file");
    } else {
      res.send(data)
    }
  });
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
// Helper functions
///////////////////////////

function executeCommand(input, callback) {
  var proc = exec(input, function(error, stdout, stderr) {
    callback(stdout.toString() + "\n" + stderr.toString());
  });
}
