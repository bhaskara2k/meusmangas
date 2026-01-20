// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBLMvSO-lBDJDPdiWBq1NX2NEnfdtJiDWM",
  authDomain: "meusmangas-42aaa.firebaseapp.com",
  projectId: "meusmangas-42aaa",
  storageBucket: "meusmangas-42aaa.firebasestorage.app",
  messagingSenderId: "302012028801",
  appId: "1:302012028801:web:897c9b26e71aa15d363a80"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
