import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore/lite";

const firebaseConfig = {
    apiKey: "AIzaSyCGkyolRmjQwamqZI58yWe0Eu2N3h72gkc",
    authDomain: "filevora.firebaseapp.com",
    projectId: "filevora",
    storageBucket: "filevora.firebasestorage.app",
    messagingSenderId: "877315241969",
    appId: "1:877315241969:web:6f0b67e9ff5807fd737650",
    measurementId: "G-XP1S81KBQ8"
};

// Initialize Firebase
// Check if apps are already initialized to avoid "Firebase App named '[DEFAULT]' already exists" error
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore
const db = getFirestore(app);

// Initialize Analytics (Client-side only)
let analytics = null;
if (typeof window !== "undefined") {
    isSupported().then((supported) => {
        if (supported) {
            analytics = getAnalytics(app);
        }
    });
}

export { app, db, analytics };
