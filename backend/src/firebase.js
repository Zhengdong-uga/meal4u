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

// Initialize Firebase App
// const app = initializeApp(firebaseConfig);

// // Initialize Firebase Auth with persistence
// const auth = initializeAuth(app, {
//     persistence: getReactNativePersistence(AsyncStorage),
// });

// export { auth, app };

import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    initializeAuth, 
    getReactNativePersistence,
    GoogleAuthProvider,
    OAuthProvider,
    signInWithCredential
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';

// Firebase 配置
const firebaseConfig = {
    apiKey: "AIzaSyA9BYzT4z6d97fEays0nAxT2emRTEhQvbE",
    authDomain: "meal4u-bc86f.firebaseapp.com",
    projectId: "meal4u-bc86f",
    storageBucket: "meal4u-bc86f.firebasestorage.app",
    messagingSenderId: "809015044004",
    appId: "1:809015044004:web:78a52d030ee36f4026c331",
    measurementId: "G-NJYPH5NDEC"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
});

// ✅ 使用 Expo `expo-auth-session` 进行 Google 登录
const signInWithGoogle = async () => {
    const [request, response, promptAsync] = Google.useAuthRequest({
        expoClientId: "809015044004-ahif2mhgnfp0lj59vh86io0rr2ap44ej.apps.googleusercontent.com", // Expo 客户端 ID
        iosClientId: "809015044004-qfbe8o9qeq6adbdldsd7j.apps.googleusercontent.com", // iOS 客户端 ID
        androidClientId: "809015044004-xxxxxxxxxxxxxxx.apps.googleusercontent.com", // Android 客户端 ID
        webClientId: "809015044004-ahif2mhgnfp0lj59vh86io0rr2ap44ej.apps.googleusercontent.com", // Web 客户端 ID
    });

    if (response?.type === "success") {
        const { id_token } = response.params;
        const googleCredential = GoogleAuthProvider.credential(id_token);
        const userCredential = await signInWithCredential(auth, googleCredential);
        console.log("Google 登录成功: ", userCredential.user);
    } else {
        console.log("Google 登录失败: ", response);
    }
};

// ✅ 使用 Expo `expo-apple-authentication` 进行 Apple 登录
const signInWithApple = async () => {
    try {
        const credential = await AppleAuthentication.signInAsync({
            requestedScopes: [
                AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                AppleAuthentication.AppleAuthenticationScope.EMAIL,
            ],
        });

        const appleProvider = new OAuthProvider("apple.com");
        const appleCredential = appleProvider.credential({
            idToken: credential.identityToken,
            rawNonce: credential.nonce,
        });

        const userCredential = await signInWithCredential(auth, appleCredential);
        console.log("Apple 登录成功: ", userCredential.user);
    } catch (error) {
        console.error("Apple 登录失败:", error);
    }
};

export { auth, signInWithGoogle, signInWithApple };
