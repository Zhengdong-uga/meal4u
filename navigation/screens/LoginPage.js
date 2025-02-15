import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from 'react-native';
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    OAuthProvider,
    signInWithCredential
} from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import { firebaseApp } from '../../backend/src/firebase';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [appleAvailable, setAppleAvailable] = useState(false);

    const auth = getAuth(firebaseApp);
    const firestore = getFirestore(firebaseApp);

    useEffect(() => {
        async function checkAppleAvailability() {
            setAppleAvailable(await AppleAuthentication.isAvailableAsync());
        }
        checkAppleAvailability();
    }, []);

    const [request, response, promptAsync] = Google.useAuthRequest({ // discord
    });

    useEffect(() => {
        async function handleGoogleResponse() {
            if (response?.type === "success") {
                setLoading(true);
                try {
                    const { id_token } = response.params;
                    const googleCredential = GoogleAuthProvider.credential(id_token);
                    const userCredential = await signInWithCredential(auth, googleCredential);

                    // 保存用户数据
                    await setDoc(doc(firestore, 'Users', userCredential.user.uid), {
                        name: userCredential.user.displayName || '',
                        email: userCredential.user.email,
                        createdAt: new Date().toISOString(),
                    }, { merge: true });

                    Alert.alert('Login Successful', 'You are now logged in with Google!');
                } catch (error) {
                    Alert.alert('Login Failed', error.message);
                } finally {
                    setLoading(false);
                }
            }
        }
        handleGoogleResponse();
    }, [response]);

    const handleLogin = async () => {
        if (!email || !password) {
            return Alert.alert('Missing Fields', 'Please fill in both fields.');
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

    const handleSignUp = async () => {
        if (!email || !password || !name) {
            return Alert.alert('Missing Fields', 'Please fill in all fields.');
        }

        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await setDoc(doc(firestore, 'Users', userCredential.user.uid), {
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

    const handleGoogleLogin = async () => {
        setLoading(true);
        await promptAsync();
        setLoading(false);
    };

    const handleAppleLogin = async () => {
        setLoading(true);
        try {
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });

            if (!credential.identityToken) {
                throw new Error("Apple Sign-In failed - no identity token returned");
            }

            const appleProvider = new OAuthProvider("apple.com");
            const appleCredential = appleProvider.credential({
                idToken: credential.identityToken,
                rawNonce: credential.nonce,
            });

            const userCredential = await signInWithCredential(auth, appleCredential);

            await setDoc(doc(firestore, 'Users', userCredential.user.uid), {
                name: userCredential.user.displayName || '',
                email: userCredential.user.email,
                createdAt: new Date().toISOString(),
            }, { merge: true });

            Alert.alert('Login Successful', 'You are now logged in with Apple!');
        } catch (error) {
            Alert.alert('Login Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{isSignUp ? 'Meal4U' : 'Meal4U'}</Text>

            {isSignUp && (
                <TextInput
                    style={styles.input}
                    placeholder="Name"
                    value={name}
                    onChangeText={setName}
                />
            )}

            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />

            <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <TouchableOpacity
                style={[styles.loginButton, loading && styles.disabledButton]}
                onPress={isSignUp ? handleSignUp : handleLogin}
                disabled={loading}
            >
                {loading ? <ActivityIndicator size="small" color="#fff" /> : (
                    <Text style={styles.loginButtonText}>
                        {isSignUp ? 'Sign Up' : 'Login'}
                    </Text>
                )}
            </TouchableOpacity>

            {!isSignUp && (
                <>
                    <TouchableOpacity
                        style={[styles.googleButton, loading && styles.disabledButton]}
                        onPress={handleGoogleLogin}
                        disabled={loading}
                    >
                        <Text style={styles.loginButtonText}>Login with Google</Text>
                    </TouchableOpacity>

                    {appleAvailable && (
                        <TouchableOpacity
                            style={[styles.appleButton, loading && styles.disabledButton]}
                            onPress={handleAppleLogin}
                            disabled={loading}
                        >
                            <Text style={styles.loginButtonText}>Login with Apple</Text>
                        </TouchableOpacity>
                    )}
                </>
            )}

            <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
                <Text style={styles.toggleText}>
                    {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    input: { height: 50, borderColor: '#ccc', borderWidth: 1, marginBottom: 15, paddingHorizontal: 10, borderRadius: 8, fontSize: 16 },
    loginButton: { backgroundColor: 'black', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    googleButton: { backgroundColor: '#4285F4', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    appleButton: { backgroundColor: '#000', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    loginButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    disabledButton: { opacity: 0.6 },
    toggleText: { marginTop: 20, textAlign: 'center', color: 'grey' },
});
