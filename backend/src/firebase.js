import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import Constants from 'expo-constants';

// Firebase config
const firebaseConfig = Constants.expoConfig.extra.firebaseApi;

// Initialize Firebase app (avoid re-initializing during fast refresh)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence (per Expo SDK 54 docs)
// Use try-catch to handle case where auth is already initialized
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error) {
  // If auth is already initialized, get the existing instance
  auth = getAuth(app);
}

// ✅ Google Sign-In
const signInWithGoogle = async () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: "809015044004-ahif2mhgnfp0lj59vh86io0rr2ap44ej.apps.googleusercontent.com",
    iosClientId: "809015044004-qfbe8o9qeq6adbdldsd7j.apps.googleusercontent.com",
    androidClientId: "809015044004-xxxxxxxxxxxxxxx.apps.googleusercontent.com",
    webClientId: "809015044004-ahif2mhgnfp0lj59vh86io0rr2ap44ej.apps.googleusercontent.com",
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

// ✅ Apple Sign-In
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

const firebaseApp = app;

export { auth, signInWithGoogle, signInWithApple, firebaseApp };
