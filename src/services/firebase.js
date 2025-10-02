import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, browserLocalPersistence } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAQ7G3DK2Zux4qvjAAbUwNt57i4YzoFXkM",
  authDomain: "student-network-system-c753e.firebaseapp.com",
  projectId: "student-network-system-c753e",
  storageBucket: "student-network-system-c753e.firebasestorage.app",
  messagingSenderId: "318688655484",
  appId: "1:318688655484:web:56e1ba34d3754d050c71f9",
  measurementId: "G-QSYCQV4LG8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Optional: Configure authentication persistence
auth.setPersistence(browserLocalPersistence);

// Optional: Enable offline persistence for Firestore
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.warn('The current browser does not support all features required for persistence.');
    }
  });

// Optional: Add error logging for initialization
console.log('Firebase initialized successfully');