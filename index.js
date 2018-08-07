/*
Created by Jake Nelson
*/

var express = require("express");
var request = require("request");
var jsonfile = require("jsonfile");
var bodyParser = require("body-parser");
var parse = require("csv-parse/lib/sync");
var fs = require("fs");

var app = express();
app.use(bodyParser());

//webhook for Slack
var webhook = "https://hooks.slack.com/services/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";
//Regular expressions used to find points in messages
var pointUser = /(<@)\S+(>)/;
var userPlusPlus =  /(<@)\S+(>)\s(\+\+)/;
var userMinusMinus = /(<@)\S+(>)\s(\-\-)/;
var thingPlusPlus =  /(@)\S+\s(\+\+)/;
var thingMinusMinus = /(@)\S+\s(\-\-)/;
var plusbot = "UC2CYDAE8";
var leaderboard = /<@UC2CYDAE8>\sleaderboard/;
var leaderboardthing = /<@UC2CYDAE8>\sleaderboard\sthings/;
var loserboard = /<@UC2CYDAE8>\sloserboard/;
var loserboardthing = /<@UC2CYDAE8>\sloserboard\sthings/;
var reset = /(<@UC2CYDAE8>)\s(reset leaderboard)/;
var userScore = /(<@UC2CYDAE8>)\s(<)\S+(>)/;
var userTag = /<@\S+>/g;

var points = {};
var filename = "data.json";

let good = [];
let bad = [];


function getMessages(){

    fs.readFile("good.csv","utf8",function(err,data){
        if (err) throw err;
        good = parse(data);
        //console.log(good[0]);

    })

    fs.readFile("bad.csv","utf8",function(err,data){
        if (err) throw err;
        bad = parse(data);
        //console.log(bad[0]);

    })
}

getMessages();

function getPoints(){
    points = jsonfile.readFileSync(filename);
}

function savePoints(){
    jsonfile.writeFileSync(filename,points);
}

function checkPoints(user){
    if (points.hasOwnProperty(user)){
        return points[user].score;
    }
    else {
        //points[user] = {"score":0,"type":"U"};
        return 0;
    }
}

function addRecord(user,type="U"){
    if (points.hasOwnProperty(user)){
        return false;
    }
    else {
        points[user] = {"score": 0, "type": type};
        return true;
    }
}

function addPoint(user){
    points[user].score = checkPoints(user) + 1;
}

function removePoint(user){
    points[user].score = checkPoints(user) - 1;
}

function sendMessage( karma , user ){
    if (karma === "good") {
        var msg = good[Math.floor(Math.random()*good.length)][0];
        colour = "#62cc1c";
    }
    else if (karma === "bad") {
        var msg = bad[Math.floor(Math.random()*bad.length)][0];
        colour = "#ff2300";
    }
    else if (karma === "score") {
        var msg = "User score:";
        colour = "#f59800";
    }
    else if (karma === "leader") {
        var msg = getLeaderboard().toString();
        colour = "#0183f7";
    }

    var options = {
        url: webhook,
        method: "POST",
        json: true,
        body: {
            text: msg,
            link_names: 0,
            attachments: [{
                text: "<@" + user + "> now at " + checkPoints(user) + " points.",
                color: colour
            }]
        }
    };
    request(options,function(error, response, body) {
        if (!error && response.statusCode == 200) {
            //console.log(" - Sent notification to Slack: " + message);
        }
        else console.log(" - Error communicating with Slack API");
    });
}

function sendLeaderboard( list, type="U" ){
    let msg = "";
    if (type === "U") {
        msg += "Current leaderboard:\n ";
        let index = 0;
        list.forEach(function(user){
            index ++;
            msg += index + ". <@" + user[0] + "> at " + checkPoints(user[0]) + " points.\n"
        })
    }
    else if (type ==="T"){
        msg += "Current leaderboard:\n ";
        let index = 0;
        list.forEach(function(user){
            index ++;
            msg += index + ". @" + user[0] + " at " + checkPoints(user[0]) + " points.\n"
        })
    }

    var options = {
        url: webhook,
        method: "POST",
        json: true,
        body: {
            text: msg,
            link_names: 0
        }
    };
    request(options,function(error, response, body) {
        if (!error && response.statusCode == 200) {
            //console.log(" - Sent notification to Slack: " + message);
        }
        else console.log(" - Error communicating with Slack API");
    });
}



getPoints();
setInterval(savePoints,30 * 1000);

function getLeaderboard(type="U", karma="good"){
    var userlist = [];
    var thinglist = [];
    Object.keys(points).forEach(function(element,key){
        if (points[element].type === "U"){
            userlist.push([element,points[element].score]);
        }
        else if (points[element].type === "T"){
            thinglist.push([element,points[element].score]);
        }
    })


    userlist.sort(sortLeaders);
    thinglist.sort(sortLeaders);

    if (karma === "bad"){
        userlist.reverse();
        thinglist.reverse();
    }

    if (type === "U")   return userlist.slice(0,10);
    else if (type === "T")  return thinglist.slice(0,10);
    
}

function sortLeaders(a,b){
    if (a[1] === b[1]) {
        return 0;
    }
    else {
        return (a[1] > b[1]) ? -1: 1;
    }
}
function test(){

    console.log(good[Math.floor(Math.random()*good.length)]);
}

setTimeout(test,2000);

/*

console.log(userPlusPlus.exec("Hi <@UJSJFD34> ++ You are awesome!")[0]);
getPoints();
console.log(points);
console.log(checkPoints("Bob"));
*/


app.post("/plusbot", function(req,res){
    res.sendStatus(200);
    let payload = req.body;
    //console.log(req);
    console.log(payload.event);
    if (payload.type==="url_verification")
    {
        let challenge = payload.challenge;
        console.log("Responding to challenge");
        console.log(payload);
        res.set("application/json").send({body: {"challenge": challenge} });
    }

    else if (payload.type==="event_callback"){

        if (payload.event.type === "message" && payload.event.subtype !== "bot_message")
        {
            //get user from message
            msgUser = payload.event.user;
            //get point user from message
            try {
                ptUser = pointUser.exec(payload.event.text)[0].slice(2,-1);
                console.log(ptUser);
            }
            catch(err){
                console.log("no user mention");
            }

             //leaderboard things
             if ( leaderboardthing.test(payload.event.text) ){
                //console.log(payload.event.text);
                sendLeaderboard(getLeaderboard("T"),"T");
                //sendMessage("leader",ptUser);
            }


            //leaderboard
            else if ( leaderboard.test(payload.event.text) ){
                //console.log(payload.event.text);
                sendLeaderboard(getLeaderboard(),"U");
                //sendMessage("leader",ptUser);
            }

            //loserboard things
            else if ( loserboardthing.test(payload.event.text) ){
                //console.log(payload.event.text);
                sendLeaderboard(getLeaderboard("T","bad"),"T");
                //sendMessage("leader",ptUser);
            }

            //loserboard
            else if ( loserboard.test(payload.event.text) ){
                //console.log(payload.event.text);
                sendLeaderboard(getLeaderboard("U","bad"),"U");
                //sendMessage("leader",ptUser);
            }



            //user score
            else if ( userScore.test(payload.event.text) ){
                userTag.exec(payload.event.text);
                ptUser = userTag.exec(payload.event.text)[0].slice(2,-1);
                sendMessage("score",ptUser);
            }


            //user plus plus
            else if ( userPlusPlus.test(payload.event.text) ){
                addRecord(ptUser,"U");
                addPoint(ptUser);
                sendMessage("good",ptUser);
            }


            //user minus minus
            else if (userMinusMinus.test(payload.event.text) ){
                addRecord(ptUser,"U");
                removePoint(ptUser);
                sendMessage("bad",ptUser);
            }

            //thing plus plus
            else if (thingPlusPlus.test(payload.event.text) ){
                let thing = thingPlusPlus.exec(payload.event.text)[0].slice(1,-3);
                addRecord(thing,"T");
                addPoint(thing);
                console.log(thing);
                sendMessage("good",thing);
            }

            //thing minus minus
            else if (thingMinusMinus.test(payload.event.text) ){
                let thing = thingMinusMinus.exec(payload.event.text)[0].slice(1,-3);
                addRecord(thing,"T");
                removePoint(thing);
                sendMessage("bad",thing);
            }
        }
        
        
    }


});


var server = app.listen(10001, function () {

    var host = server.address().address
    var port = server.address().port
 
    console.log("Example app listening at http://%s:%s", host, port)
 })