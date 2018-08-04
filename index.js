/*
Created by Jake Nelson
*/

var express = require("express");
var request = require("request");
var jsonfile = require("jsonfile");
var bodyParser = require("body-parser");

var app = express();
app.use(bodyParser());

app.post("/plusbot", function(req,res){

    let payload = req.body;
    //console.log(req);
    let challenge = payload.challenge;

    console.log("Responding to challenge");
    res.set("application/json").send({body: {"challenge": challenge} });


});


var server = app.listen(10001, function () {

    var host = server.address().address
    var port = server.address().port
 
    console.log("Example app listening at http://%s:%s", host, port)
 })