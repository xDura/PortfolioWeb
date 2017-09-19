//Lets require/import the HTTP module
var http = require('http');
var fs = require('fs');
var redis = require('redis');


const PORT=8081; 
var numReq = 0;

var statEventType = {
    death: 0 , 
    error: 1 , 
    leap: 2
};

//We need a function which handles requests and send response
function handleRequest(request, response){
	//request.method for get post etc
	numReq = numReq + 1;
	var body = '';

	request.on('data', function (data) {
        body += data;
        //avoid super large bodies
        if (body.length > 1e6)
            request.connection.destroy();
    });

    request.on('end', function () {
        console.log(body);

        try
        {
            var parsedBody = JSON.parse(body);
            console.log(JSON.stringify(parsedBody.eventData));
            resolveRequestEvent(parsedBody.eventType, parsedBody.eventData);
            response.end(request.url + ' data stored successfully');
        }
        catch(err)
        {
            console.log(err);
            response.end(request.url + ' request failed');
        }
    });
};

function resolveRequestEvent(eventCode, data){
    switch(eventCode){
        case statEventType.death:
            console.log("http stats event: death");
            storeDeath(data);
            break;
        case statEventType.error:
            console.log("http stats event: error");
            storeError(data);
            break;
        case statEventType.leap:
            console.log("http stats event: leap");
            storeLeap(data);
            break;
        default:
            console.log("http stats event: wrong id");
    }
};


//concrete event functions
function storeDeath(data)
{
    var redisClient = redis.createClient();
    redisClient.lpush(['deaths', JSON.stringify(data)], function(err, reply){
        console.log(err + reply);
    });
};

function storeError(data)
{

};

function storeLeap(data)
{

};

function storeRequestError(data)
{

};

//Create a server
var server = http.createServer(handleRequest);

//setup server
server.listen(PORT, function(){
    console.log(require('path').dirname(require.main.filename));
    console.log("Server listening on: http://localhost:%s", PORT);

    var redisClient = redis.createClient();
    redisClient.lrange("deaths", 0, -1, function(err, values) {
        console.log(values)
    });

});