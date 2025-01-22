import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import { getAuth, GoogleAuthProvider, signInWithCredential, createUserWithEmailAndPassword, signInWithEmailAndPassword, OAuthProvider } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { firebaseApp } from '../../backend/src/firebase';

const auth = getAuth(firebaseApp);
const firestore = getFirestore(firebaseApp);

export const handleEmailLogin = async (email, password, setLoading, Alert) => {
    if (!email || !password) {
        Alert.alert('Missing Fields', 'Please fill in both fields.');
        return;
    }

    setLoading(true);
    try {
        await signInWithEmailAndPassword(auth, email, password);
        Alert.alert('Login Successful', 'You are now logged in!');
    } catch (error) {
        Alert.alert('Login Failed', error.message);
    } finally {
        setLoading(false);
    }
};

export const handleEmailSignUp = async (email, password, name, setLoading, Alert) => {
    if (!email || !password || !name) {
        Alert.alert('Missing Fields', 'Please fill in all fields.');
        return;
    }

    setLoading(true);
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Save user info to Firestore
        const userDocRef = doc(firestore, 'Users', user.uid);
        await setDoc(userDocRef, {
            name,
            email,
            createdAt: new Date().toISOString(),
        });

        Alert.alert('Sign Up Successful', 'Your account has been created!');
    } catch (error) {
        Alert.alert('Sign Up Failed', error.message);
    } finally {
        setLoading(false);
    }
};

export const handleGoogleLogin = async (setLoading, Alert) => {
    const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
        clientId: '<YOUR_GOOGLE_CLIENT_ID>', // 替换为你的 Google OAuth 客户端 ID
    });

    setLoading(true);
    try {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            const credential = GoogleAuthProvider.credential(id_token);
            const result = await signInWithCredential(auth, credential);
            const user = result.user;

            // Save user info to Firestore
            const userDocRef = doc(firestore, 'Users', user.uid);
            await setDoc(userDocRef, {
                name: user.displayName || '',
                email: user.email,
                createdAt: new Date().toISOString(),
            }, { merge: true });

            Alert.alert('Login Successful', 'You are now logged in with Google!');
        } else {
            promptAsync();
        }
    } catch (error) {
        Alert.alert('Login Failed', error.message);
    } finally {
        setLoading(false);
    }
};

export const handleAppleLogin = async (setLoading, Alert) => {
    setLoading(true);
    try {
        const appleCredential = await AppleAuthentication.signInAsync({
            requestedScopes: [
                AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                AppleAuthentication.AppleAuthenticationScope.EMAIL,
            ],
        });

        const provider = new OAuthProvider('apple.com');
        const credential = provider.credential({
            idToken: appleCredential.identityToken,
        });

        await signInWithCredential(auth, credential);
        Alert.alert('Login Successful', 'You are now logged in with Apple!');
    } catch (error) {
        Alert.alert('Login Failed', error.message);
    } finally {
        setLoading(false);
    }
};
