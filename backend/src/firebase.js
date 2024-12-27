import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBU8SGriCsZbFSY7teG9SakSR1PKNUuyKc",
    authDomain: "meal4u-632e5.firebaseapp.com",
    projectId: "meal4u-632e5",
    storageBucket: "meal4u-632e5.firebasestorage.app",
    messagingSenderId: "867730336923",
    appId: "1:867730336923:web:cbb16bbc7c9be50f6b2a3e",
    measurementId: "G-PLP9M33B2V"
};

// Initialize Firebase App (check if already initialized)
let firebaseApp;
if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig);
} else {
    firebaseApp = getApps()[0];
}

// Initialize Firebase Auth with React Native persistence
const auth = initializeAuth(firebaseApp, {
    persistence: getReactNativePersistence(AsyncStorage),
});

// Initialize Firestore
const firestore = getFirestore(firebaseApp);

export { auth, firestore, firebaseApp };
