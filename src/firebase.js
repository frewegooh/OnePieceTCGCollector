// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { setLogLevel } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyD6pCkoG3mxaYNn5JeFK5a_SX8Xtu7fGN8",
    authDomain: "card-tracker-c0d1f.firebaseapp.com",
    projectId: "card-tracker-c0d1f",
    storageBucket: "card-tracker-c0d1f.firebasestorage.app",
    messagingSenderId: "962993019749",
    appId: "1:962993019749:web:32687b02b04cdb7030df8c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const firestore = getFirestore(app);


setLogLevel('error');

export default app;
