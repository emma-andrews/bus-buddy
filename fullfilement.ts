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
            // return Promise.resolve('Read complete');
        }).catch(() => {
            agent.add('Error reading entry from the Firestore database.');
            agent.add('Please add a entry to the database first by saying, "Write <your phrase> to the database"');
        });
    }

    function getEstimatedETA_context_noRoute(agent) {
        var contexts = agent.getContexts('closeststopname');
        var soonestBusRouteID;
        var timePeriod;

        agent.add('The next ' + soonestBusRouteID + ' arrives at ' + contexts.parameter.ClosestStop + ' in about ' + timePeriod + ' minutes.');

    }

    function getEstimatedETA_context_route(agent) {
        var contexts = agent.getContexts('closeststopname');
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
        var contexts = agent.getContexts('closeststopname');
        var closest = contexts.parameters.ClosestStop;
        var doc = db.collection('stop_name').doc(closest);

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
        //var doc = db.collection('data_distinct').doc('0');
        var targetStop = agent.parameters.StopName;
        var doc = db.collection('stop_name').doc(targetStop);
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

                // var toReturn = "The following routes go to ";
                // for(var i = 0; i < list.count(); i++)
                // {
                //     toReturn = toReturn + " " + list[i].route_id;
                // }
                // agent.add(toReturn);
                agent.add("The following routes go to " + targetStop + " " + doc.data().route_id.join(", "));
                
                // create a list of documents that match the specific bus stop name
                //var list = [];
                // iterate through the documents
                //console.log("created a list");
                // console.log("there are " + db.collection('data_distinct').count() + " items in data_distinct");
                // for(var i = 0; i < db.collection('data_distinct').count(); i++)
                // {
                //   console.log("entered the for loop");
                //     doc = db.collection('data_distinct').doc(i);
                //     if(doc.exists)  // if the document exists
                //     {
                //         if(agent.parameters.StopName == doc.data().stop_name)   // if the document there has the correct information
                //         {
                //             console.log("found one in document number " + i);
                //             list.push(db.collection('data_distinct').doc(i));
                //         }
                            
                //     }
                    
                    
                // }

                // db.collection("data_distinct").where("stop_name", "==", targetStop).get().then(function(querySnapshot) {
                //     querySnapshot.forEach(function(doc) {
                //         // doc.data() is never undefined for query doc snapshots
                //         console.log(doc.id, " => ", doc.data());
                //         console.log("the doc.id is " + doc.id + " and the route is " + doc.data().route_id);
                //         // list.push(doc.id);
                //         list.push(doc.data().route_id);
                //     });
                // })
                // .catch(function(error) {
                //     console.log("Error getting documents: ", error);
                // });
                
                //var toReturn = "The following routes go to ";
                // for(var i = 0; i < list.count(); i++)
                // {
                //     toReturn = toReturn + " " + list[i].route_id;
                // }
                //agent.add(toReturn);
                
              	//agent.add(toReturn);
                //var stop = doc.data().stop_name;
                //console.log('Most recent doc', stop, agent);
                //agent.add("Most recent stop: " + stop);
            }
            // return Promise.resolve('Read complete');
        }).catch(() => {
            agent.add('Error reading entry from the Firestore database.');
            agent.add('Please add an entry to the database first by saying, "Write <your phrase> to the database"');
        });
    }

    // returns the route IDs when someone says a specific bus stop name like "Which bus routes go to the Hub?"
    function getSomewhere(agent) {
        console.log(request.body.queryResult.fulfillmentText);
        console.log("-------------------------");
        console.log(request.body.queryResult.outputContexts);
        console.log("++++++++++++++++++++++++");
        agent.add('1111');

        // var contexts = request.body.queryResult.outputContexts;
        // var closest;
        // var routes = [];
        // var doc = db.collection('data_distinct').doc('0');
        // console.log("ctx: " + contexts[0].name);
        // var ctx = agent.contexts;
        // console.log("ctx2: " + ctx);
        // console.log("1. " + ctx['closeststopname'].parameters);
        // for (var j = 0; j < contexts.count(); j++) {
        //     if (contexts[j].includes("closeststopname")) {
        //         closest = contexts[j];
        //         console.log("closest: " + closest);
        //     }
        // }

        // for (var i = 0; i < db.collection('data_distinct').count(); i++) {
        //     doc = db.collection('data_distinct').doc(i);
        //     if (doc.exists) {
        //         if (closest === doc.data().stop_name) {
        //             routes.push(doc.data().route_id);
        //             console.log("route: " + doc.data().route_id);
        //         }
        //     }
        // }
        // return doc.get().then(doc => {
        //     if (!doc.exists) {
        //         console.log('getRouteID_context ' + agent);
        //         agent.add('No data found in the database!');
        //     } else {
        //         var stop = doc.data().stop_name;
        //         console.log('Most recent doc', stop, agent);
        //         agent.add("Most recent stop: " + stop);
        //     }
        //     // return Promise.resolve('Read complete');
        // }).catch(() => {
        //     agent.add('Error reading entry from the Firestore database.');
        //     agent.add('Please add an entry to the database first by saying, "Write <your phrase> to the database"');
        // });
    }
    // // Uncomment and edit to make your own intent handler
    // // uncomment `intentMap.set('your intent name here', yourFunctionHandler);`
    // // below to get this function to be run when a Dialogflow intent is matched
    // function yourFunctionHandler(agent) {
    //   agent.add(`This message is from Dialogflow's Cloud Functions for Firebase editor!`);
    //   agent.add(new Card({
    //       title: `Title: this is a card title`,
    //       imageUrl: 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png',
    //       text: `This is the body text of a card.  You can even use line\n  breaks and emoji! 💁`,
    //       buttonText: 'This is a button',
    //       buttonUrl: 'https://assistant.google.com/'
    //     })
    //   );
    //   agent.add(new Suggestion(`Quick Reply`));
    //   agent.add(new Suggestion(`Suggestion`));
    //   agent.setContext({ name: 'weather', lifespan: 2, parameters: { city: 'Rome' }});
    // }

    // // Uncomment and edit to make your own Google Assistant intent handler
    // // uncomment `intentMap.set('your intent name here', googleAssistantHandler);`
    // // below to get this function to be run when a Dialogflow intent is matched
    // function googleAssistantHandler(agent) {
    //   let conv = agent.conv(); // Get Actions on Google library conv instance
    //   conv.ask('Hello from the Actions on Google client library!') // Use Actions on Google library
    //   agent.add(conv); // Add Actions on Google library responses to your agent's response
    // }
    // // See https://github.com/dialogflow/fulfillment-actions-library-nodejs
    // // for a complete Dialogflow fulfillment library Actions on Google client library v2 integration sample

    // Run the proper function handler based on the matched Dialogflow intent name
    let intentMap = new Map();
    intentMap.set('Default Welcome Intent', welcome);
    intentMap.set('Default Fallback Intent', fallback);
    intentMap.set('getClosestStopName', nameClosestStop);
    intentMap.set('getRouteID-context', getRouteID_context);
    intentMap.set('getRouteID-noContext', getRouteID_noContext);
    intentMap.set('getSomewhere', getSomewhere);
    // intentMap.set('your intent name here', googleAssistantHandler);
    agent.handleRequest(intentMap);
});
