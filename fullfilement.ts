// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';

const functions = require('firebase-functions');
const { WebhookClient } = require('dialogflow-fulfillment');
const { Card, Suggestion } = require('dialogflow-fulfillment');
const admin = require("firebase-admin");

const PLACEHOLDER = "[TODO IN FULFILLMENT]";

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

const firebaseConfig = {
    apiKey: "AIzaSyCjymcr-nHciYTjTdgRHRew7oQ6_-s6G7Y",
    authDomain: "bus-buddy-382e6.firebaseapp.com",
    projectId: "bus-buddy-382e6",
    storageBucket: "bus-buddy-382e6.appspot.com",
    messagingSenderId: "238577298800",
    appId: "1:238577298800:web:fb63e530ad39440a89b3b5"
};
admin.initializeApp(firebaseConfig);
const db = admin.firestore();

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
    const agent = new WebhookClient({ request, response });
    console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
    console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

    // variable slots
    let lastDepartureName = "";  // "last" is used instead of "most recent" because it's shorter
    let lastDestinationName = "";
    let lastDepartureNumber = "";
    let lastDestinationNumber = "";
    let lastRoute = "";

    function welcome(agent) {
        agent.add(`Welcome to BusBuddy!`);
    }

    function fallback(agent) {
        agent.add(`I didn't understand`);
        agent.add(`I'm sorry, can you try again?`);
    }

    // function that will fill the slots about getting somewhere
    function fillSlots(input) {
        // in order to make decisions about a route, we need to know from destination, departure, and route
        const departureName = input.parameters.DepartureStopName;
        const destinationName = input.parameters.DestinationStopName;
        const departureNumber = input.parameters.DepartureStopNumber;
        const destinationNumber = input.parameters.DestinationStopNumber;
        const route = input.parameters.Route;

        const departureNameGiven = departureName.length > 0;  // if there is a name, this returns true
        const destinationNameGiven = destinationName.length > 0;  // if there is a name, this returns true
        const departureNumberGiven = departureNumber.length > 0;  // if there is a number, this returns true
        const destinationNumberGiven = destinationNumber.length > 0;  // if there is a number, this returns true
        const routeGiven = route.length > 0;

        if (departureNameGiven)  // if a new departure name was given, replace the old one
        {
            lastDepartureName = departureName;
        }
        if (destinationNameGiven) {
            lastDestinationName = destinationName;
        }
        if (departureNumberGiven) {
            lastDepartureNumber = departureName;
        }
        if (destinationNumberGiven) {
            lastDestinationNumber = destinationNumber;
        }
        if (routeGiven) {
            lastRoute = route;
        }
    }	// end of fillSlots function

    //should be good for first RR
    function nameClosestStop(agent) {
        //db.collection('stops').doc('392') is location of The Hub data
        const doc = db.collection('stops').doc('392');

        return doc.get().then(doc => {
            if (!doc.exists) {
                agent.add('No data found in the database!');
            } else {
                var textresponse = request.body.queryResult.fulfillmentText + " ";
                var s = doc.data().stop_name;
                textresponse = textresponse.replace(PLACEHOLDER, s);
                console.log('Manually setting The HUB as closest stop', s, PLACEHOLDER, textresponse);
                agent.add(textresponse);
            }
        }).catch(() => {
            agent.add('Error reading entry from the Firestore database.');
            agent.add('Please add a entry to the database first by saying, "Write <your phrase> to the database"');
        });
    }

    function getEstimatedETA_context_noRoute(agent) {
        var contexts = agent.getContext('closeststopname');
        var soonestBusRouteID;
        var timePeriod;

        agent.add('The next ' + soonestBusRouteID + ' arrives at ' + contexts.parameter.ClosestStop + ' in about ' + timePeriod + ' minutes.');

    }

    function getEstimatedETA_context_route(agent) {
        var contexts = agent.getContext('closeststopname');
        var timePeriod;

        agent.add('The next ' + agent.parameters.busrouteid + ' arrives at ' + contexts.parameter.ClosestStop + ' in about ' + timePeriod + ' minutes.');

    }

    function getEstimatedETA_noContext_noRoute(agent) {
        var soonestBusRouteID;
        var timePeriod;

        agent.add('The next ' + soonestBusRouteID + ' arrives at ' + agent.parameter.stopname + ' in about ' + timePeriod + ' minutes.');


    }

    function getEstimatedETA_noContext_route(agent) {
        var timePeriod;

        agent.add('The next ' + agent.parameters.busrouteid + ' arrives at ' + agent.parameter.stopname + ' in about ' + timePeriod + ' minutes.');


    }

    function getRouteID_context(agent) {
        var contexts = agent.getContext('closeststopname');
        var closest = contexts.parameters.ClosestStop;
        var doc = db.collection('test_stop_names').doc(closest);

        return doc.get().then(doc => {
            if (!doc.exists) {
                console.log('getRouteID_context ' + agent);
                agent.add('No data found in the database!');
            } else {
                var routes = doc.data().route_id;

                agent.setContext({
                    name: 'busrouteidlist',
                    lifespan: 1,
                    parameters: {
                        routes: routes
                    }
                });
        
                agent.add("The stop at " + closest + " is served by routes " + routes.join(", "));
            }
        }).catch(() => {
            agent.add('Error reading entry from the Firestore database.');
            agent.add('Please add an entry to the database first by saying, "Write <your phrase> to the database"');
        });
    }

    // returns the route IDs when someone says a specific bus stop name like "Which bus routes go to the Hub?"
    function getRouteID_noContext(agent) {
        console.log("you've entered the getRouteID_noContext");
        var targetStop = agent.parameters.StopName;
        var doc = db.collection('test_stop_names').doc(targetStop);
        console.log("target stop is " + targetStop);
        return doc.get().then(doc => {
            if (!doc.exists) {
                console.log('getRouteID_noContext ' + agent);
                agent.add('No data found in the database!');
            } else {
                // attempt to see if it works
                console.log("successfully set doc. Route IDs are ");
                console.log(doc.data().route_id);
                console.log("I just logged the route ID list");

                agent.add("The following routes go to " + targetStop + " " + doc.data().route_id.join(", "));
            }
        }).catch(() => {
            agent.add('Error reading entry from the Firestore database.');
            agent.add('Please add an entry to the database first by saying, "Write <your phrase> to the database"');
        });
    }

    function getArraysIntersection(a1, a2) {
        return a1.filter(function (n) { return a2.indexOf(n) !== -1; });
    }

    // returns the route IDs when someone says a specific bus stop name like "Which bus routes go to the Hub?"
    function getSomewhere(agent) {
        var destinationStop = agent.parameters.DestinationStopName;
        console.log("got here 0");
        var departureStop = agent.parameters.DepartureStopName;
        console.log("got here 1");
        var docDest = db.collection('test_stop_names').doc(destinationStop);
        console.log("got here 2");
        var docDep = db.collection('test_stop_names').doc(departureStop);
        console.log("got here 3");

        return db.getAll(docDest, docDep).then(docs => {
            if (!(docs[0].exists && docs[1].exists)) {
                console.log('getSomewhere' + agent);
                agent.add('No data found in the database!');
            } else {   
                console.log("got here 5");
                var rDep = docs[1].data().route_id;
                var rDest = docs[0].data().route_id;

                console.log("rDep: " + rDep.join(", "));
                console.log("rDest: " + rDest.join(", "));

                var routesInCommon = getArraysIntersection(rDest, rDep);
                console.log("common: " + routesInCommon.join(", "));

                agent.add("I hear you want to get to " + agent.parameters.DestinationStopName + " from " + 
                    agent.parameters.DepartureStopName + ". You can get there by taking routes " + routesInCommon.join(", "));
            }
        }).catch(() => {
            agent.add('Error reading entry from the Firestore database.');
            agent.add('Please add an entry to the database first by saying, "Write <your phrase> to the database"');
        });
    }

    // Run the proper function handler based on the matched Dialogflow intent name
    let intentMap = new Map();
    intentMap.set('Default Welcome Intent', welcome);
    intentMap.set('Default Fallback Intent', fallback);
    intentMap.set('getClosestStopName', nameClosestStop);
    intentMap.set('getRouteID-context', getRouteID_context);
    intentMap.set('getRouteID-noContext', getRouteID_noContext);
    intentMap.set('getSomewhere', getSomewhere);
    agent.handleRequest(intentMap);
});
