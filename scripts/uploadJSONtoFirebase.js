// JavaScript source code
const firebase = require("firebase");
// Required for side-effects
require("firebase/firestore");

// Initialize Cloud Firestore through Firebase
firebase.initializeApp({
    apiKey: "AIzaSyCjymcr-nHciYTjTdgRHRew7oQ6_-s6G7Y",
    authDomain: "bus-buddy-382e6.firebaseapp.com",
    projectId: "bus-buddy-382e6"
});

var db = firebase.firestore();

var stop_name_one_entry = [
    {
        "stop_name": "The HUB",
        "stop_id": 925,
        "stop_desc": "Eastbound Stadium RD @ Nearside Buckman DR",
        "route_id": [
            9,
            12,
            20,
            21,
            25,
            28,
            33,
            34,
            35,
            36,
            37,
            38,
            40,
            46,
            118,
            119,
            121,
            122,
            125,
            126,
            127,
            150
        ]
    }
]

stop_name_one_entry.forEach(function (obj) {
    db.collection("stop_name_one_entry").add({
        stop_name: obj.stop_name,
        stop_id: obj.stop_id,
        stop_desc: obj.stop_desc,
        route_id: obj.route_id,
    }).then(function (docRef) {
        console.log("Document written with ID: ", docRef.id);
    })
        .catch(function (error) {
            console.error("Error adding document: ", error);
        });
});