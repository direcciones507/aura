import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAnrizkZp2rGhpYYyek3v49Q6Qs_ylEvbw",
  authDomain: "aura-84d51.firebaseapp.com",
  projectId: "aura-84d51",
  storageBucket: "aura-84d51.firebasestorage.app",
  messagingSenderId: "1047069147914",
  appId: "1:1047069147914:web:5f5c7fcf7a7f577ff2f0f3",
  measurementId: "G-89L47E388H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export {
  db,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy
};
