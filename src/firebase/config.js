/**
 * Firebase configuration for WICS Point Tracker.
 * Replace the placeholder values below with your actual Firebase project credentials.
 * Get these from: Firebase Console → Project Settings → Your apps → Add app (Web).
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration object (from Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyBTtC9I6GvAE5OScmyEQhLzXl4Xu7PaoJ0",
  authDomain: "wics-points-tracker.firebaseapp.com",
  projectId: "wics-points-tracker",
  storageBucket: "wics-points-tracker.firebasestorage.app",
  messagingSenderId: "809830558496",
  appId: "1:809830558496:web:7615c256d56c7d002a4545"
};

// Initialize Firebase (only once for the whole app)
const app = initializeApp(firebaseConfig);

// Export Auth, Firestore, and Storage so other files can use them
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
