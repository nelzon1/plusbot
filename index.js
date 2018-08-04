/*
Created by Jake Nelson
*/

var express = require("express");
var request = require("request");
var jsonfile = require("jsonfile");
var bodyParser = require("body-parser");

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
var leaderboard = /(@UC2CYDAE8)\s(leaderboard)/;
var reset = /(@UC2CYDAE8)\s(reset leaderboard)/;
var userScore = /(@UC2CYDAE8)\s(<)\S+(>)/;

var points = {};
var filename = "data.json";

function getPoints(){
    points = jsonfile.readFileSync(filename);
}

function savePoints(){
    jsonfile.writeFileSync(filename,points);
}

function checkPoints(user){
    if (points.hasOwnProperty(user)){
        return points[user];
    }
    else {
        return 0;
    }
}

function addPoint(user){
    points[user] = checkPoints(user) + 1;
}

function removePoint(user){
    points[user] = checkPoints(user) - 1;
}

function sendMessage( message , user ){
    var options = {
        url: webhook,
        method: "POST",
        json: true,
        body: {
            text: "Message recieved",
            link_names: 0,
            attachments: [{
                text: message + " <@" + user + "> now at " + checkPoints(user) + " points",
            }]
        }
    };
    request(options,function(error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(" - Sent notification to Slack: " + message);
        }
        else console.log(" - Error communicating with Slack API");
    });
}



/*
console.log(userPlusPlus.exec("Hi <@UJSJFD34> ++ You are awesome!")[0]);
getPoints();
console.log(points);
console.log(checkPoints("Bob"));
*/


app.post("/plusbot", function(req,res){

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

    if (payload.type==="event_callback"){

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

            //leaderboard
            if ( leaderboard.test(payload.event.text) ){

            }

            //user score
            else if ( userScore.test(payload.event.text) ){

            }


            //user plus plus
            else if ( userPlusPlus.test(payload.event.text) ){
                addPoint(ptUser);
                sendMessage("userPlusPlus",ptUser);
            }


            //user minus minus
            else if (userMinusMinus.test(payload.event.text) ){
                removePoint(ptUser);
                sendMessage("userMinusMinus",ptUser);
            }

            //thing plus plus
            else if (thingPlusPlus.test(payload.event.text) ){
                let thing = thingPlusPlus.exec(payload.event.text)[0].slice(1,-3);
                addPoint(thing);
                console.log(thing);
                sendMessage("thingPlusPlus",thing);
            }

            //thing minus minus
            else if (thingMinusMinus.test(payload.event.text) ){
                let thing = thingMinusMinus.exec(payload.event.text)[0].slice(1,-3);
                removePoint(thing);
                sendMessage("thingMinusMinus",thing);
            }
        }
        
        
    }

    res.sendStatus(200);
});


var server = app.listen(10001, function () {

    var host = server.address().address
    var port = server.address().port
 
    console.log("Example app listening at http://%s:%s", host, port)
 })