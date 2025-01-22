// // Import Firebase modules
// import { initializeApp } from 'firebase/app';
// import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// // Firebase configuration
// const firebaseConfig = {
//     // discord
//     apiKey: "AIzaSyA9BYzT4z6d97fEays0nAxT2emRTEhQvbE",
//     authDomain: "meal4u-bc86f.firebaseapp.com",
//     projectId: "meal4u-bc86f",
//     storageBucket: "meal4u-bc86f.firebasestorage.app",
//     messagingSenderId: "809015044004",
//     appId: "1:809015044004:web:78a52d030ee36f4026c331",
//     measurementId: "G-NJYPH5NDEC"
// };

// // Initialize Firebase App
// const app = initializeApp(firebaseConfig);

// // Initialize Firebase Auth with persistence
// const auth = initializeAuth(app, {
//     persistence: getReactNativePersistence(AsyncStorage),
// });

// export { auth, app };


// Import Firebase modules
import { initializeApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA9BYzT4z6d97fEays0nAxT2emRTEhQvbE",
    authDomain: "meal4u-bc86f.firebaseapp.com",
    projectId: "meal4u-bc86f",
    storageBucket: "meal4u-bc86f.appspot.app", // 修正了存储桶 URL 后缀
    messagingSenderId: "809015044004",
    appId: "1:809015044004:web:78a52d030ee36f4026c331",
    measurementId: "G-NJYPH5NDEC"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with React Native persistence
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage), // 设置持久化存储为 AsyncStorage
});

// Export Auth and App
export { auth, app };
