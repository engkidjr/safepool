import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB0JlejsVnjjwgRqLiIO-j6UIsXVTmdbkA",
  authDomain: "safepool-8857f.firebaseapp.com",
  projectId: "safepool-8857f",
  storageBucket: "safepool-8857f.firebasestorage.app",
  messagingSenderId: "711967254844",
  appId: "1:711967254844:web:16b262f56896ba6497d639",
  measurementId: "G-8Y0EWHXE5W"
};

// Initialize Firebase (safely checking if it's already initialized)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);

// Analytics is only supported in browser environments
let analytics: Analytics | undefined;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

export { app, analytics, auth, db };
