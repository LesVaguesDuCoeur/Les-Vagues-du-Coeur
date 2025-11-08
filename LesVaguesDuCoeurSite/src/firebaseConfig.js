import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Configuration Firebase - À remplacer avec vos propres identifiants
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyB5example",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "example.firebaseapp.com",
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL || "https://example.firebasedatabase.app",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "example-project",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "example.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:123456789:web:example"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Obtenir une référence à la base de données
export const database = getDatabase(app);
export default app;
