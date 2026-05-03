import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDOHckc1SipbBai-cCR4tVOnvX2h7pdZ-U",
  authDomain: "shiftmanager-44b8e.firebaseapp.com",
  projectId: "shiftmanager-44b8e",
  storageBucket: "shiftmanager-44b8e.firebasestorage.app",
  messagingSenderId: "983198355041",
  appId: "1:983198355041:web:03e9f9f3c830cd8fb8e420",
  measurementId: "G-LJZ4T5GZDK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;