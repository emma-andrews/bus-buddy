// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';

const functions = require('firebase-functions');
const { WebhookClient } = require('dialogflow-fulfillment');
const { Card, Suggestion } = require('dialogflow-fulfillment');
const admin = require("firebase-admin");

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements


const firebaseConfig = {
    type: "service_account",
    project_id: "busbuddy-3e804",
    private_key_id: "179675ce3b6354f727775184caa1077b0bbe6e3b",
    client_email: "firebase-adminsdk-w19fw@busbuddy-3e804.iam.gserviceaccount.com",
    client_id: "100270686659460242648",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-w19fw%40busbuddy-3e804.iam.gserviceaccount.com"
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

    function nameClosestStop(agent) {
        // agent.add(`!!!!!!!`);
        const doc = db.collection('data_distinct').doc('0');
        return doc.get().then(doc => {
            if (!doc.exists) {
                console.log('11111111111');
                agent.add('No data found in the database!');
            } else {
                var s = doc.data().stop_name;
                console.log('2222222222222', s);
                agent.add("Stop: " + s);
            }
            // return Promise.resolve('Read complete');
        }).catch(() => {
            agent.add('Error reading entry from the Firestore database.');
            agent.add('Please add a entry to the database first by saying, "Write <your phrase> to the database"');
        });
    }

    // returns the route IDs when someone says a specific bus stop name like "Which bus routes go to the Hub?"
    function getRouteID_noContext(agent) {
        const doc = db.collection('data_distinct').doc('0');
        return doc.get().then(doc => {
            if (!doc.exists) {
                console.log('getRouteID_noContext ' + agent);
                agent.add('No data found in the database!');
            } else {
                var stop = doc.data().stop_name;
                console.log('Found a doc', stop, agent);
                agent.add("Stop: " + stop);
            }
            // return Promise.resolve('Read complete');
        }).catch(() => {
            agent.add('Error reading entry from the Firestore database.');
            agent.add('Please add an entry to the database first by saying, "Write <your phrase> to the database"');
        });
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
    intentMap.set('getRouteID-noContext', getRouteID_noContext);
    // intentMap.set('your intent name here', googleAssistantHandler);
    agent.handleRequest(intentMap);
});
