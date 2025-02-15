// // Firebase configuration
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

// Firebase 
const firebaseConfig = {
    // discord,
};

//  Firebase
const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
});

// ✅ use Expo `expo-auth-session`for google
const signInWithGoogle = async () => {
    const [request, response, promptAsync] = Google.useAuthRequest({
// discord 
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

// ✅ use Expo `expo-apple-authentication` for apple
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
