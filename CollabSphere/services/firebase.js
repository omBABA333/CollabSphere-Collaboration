// Import the functions you need from the SDKs you need
//core import 
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
//import { getAuth } from "firebase/auth";
import { initializeAuth, getReactNativePersistence, GithubAuthProvider } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

//services
//import { getAuth, GithubAuthProvider } from "firebase/auth";
//import { initializeAuth, getReactNativePersistence, GithubAuthProvider } from "firebase/auth";
//import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
//import AsyncStorage from "@react-native-async-storage/async-storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDsIBomTZTwqPkS4K6XO6pDG06qIyt3MkU",
  authDomain: "collabsphere-b7e3e.firebaseapp.com",
  projectId: "collabsphere-b7e3e",
  storageBucket: "collabsphere-b7e3e.firebasestorage.app",
  messagingSenderId: "194164839551",
  appId: "1:194164839551:web:b63c5ae406f4a4cdcf1b4a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//export const db = getFirestore(app);
export const db = getFirestore(app);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
//export services
//export const auth = getAuth(app);
export const githubProvider = new GithubAuthProvider(); // 🔹 GitHub login provider
//export const db = getFirestore(app);