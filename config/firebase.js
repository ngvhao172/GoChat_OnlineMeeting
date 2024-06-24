// Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
const { initializeApp } = require("firebase/app");
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
// import { getFirestore } from "firebase/firestore";
const { getFirestore } = require("firebase/firestore");
// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC1dbJGTMGXxwhQxJwovbl6sR1eXSUNc60",
    authDomain: "duancntt-webrtc-online-meeting.firebaseapp.com",
    projectId: "duancntt-webrtc-online-meeting",
    storageBucket: "duancntt-webrtc-online-meeting.appspot.com",
    messagingSenderId: "205053805041",
    appId: "1:205053805041:web:82a0979499ee401f100450"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const db = getFirestore(app);

module.exports = { app };



