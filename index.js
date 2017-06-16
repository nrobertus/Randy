var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('randy.db');

var express = require('express');
var restapi = express();

restapi.get('/heartbeat', function(req, res){
    db.get("SELECT * FROM heartbeat", function(err, row){
        res.json({ "count" : row.value });
    });
});

restapi.get('/rotations', function(req, res){
    db.get("SELECT * FROM rotations", function(err, row){
        res.json({ "count" : row.value });
    });
});


restapi.listen(80);
