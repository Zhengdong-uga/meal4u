import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    SafeAreaView,
    Dimensions,
    StatusBar
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
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function LoginPage() {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [appleAvailable, setAppleAvailable] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const auth = getAuth(firebaseApp);
    const firestore = getFirestore(firebaseApp);

    useEffect(() => {
        async function checkAppleAvailability() {
            setAppleAvailable(await AppleAuthentication.isAvailableAsync());
        }
        checkAppleAvailability();
    }, []);

    const [request, response, promptAsync] = Google.useAuthRequest({
        iosClientId: "809015044004-2qe0fbe9r14iebp0u2basjsgs5t9vcur.apps.googleusercontent.com",
        webClientId: "809015044004-dsfp0lf7r2knti04sjaqg372ebaej6nc.apps.googleusercontent.com",
        redirectUri: "https://meal4u-bc86f.firebaseapp.com/__/auth/handler",
        useProxy: false,
    });

    useEffect(() => {
        async function handleGoogleResponse() {
            if (response?.type === "success") {
                setLoading(true);
                try {
                    const { id_token } = response.params;
                    const googleCredential = GoogleAuthProvider.credential(id_token);
                    const userCredential = await signInWithCredential(auth, googleCredential);

                    // Create a basic user document - preferences will be set in onboarding
                    await setDoc(doc(firestore, 'Users', userCredential.user.uid), {
                        name: userCredential.user.displayName || '',
                        email: userCredential.user.email,
                        createdAt: new Date().toISOString(),
                        // Empty preferences to indicate this is a new user
                        goal: [],
                        diet: [],
                        restrictions: [],
                        dislikes: [],
                        likes: [],
                        savedRecipes: [],
                        mealsGenerated: 0,
                        mealsImplemented: 0,
                    }, { merge: true });

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
            // No need to do anything else here - MainContainer will handle the flow
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

            // Create a basic user document - preferences will be set in onboarding
            await setDoc(doc(firestore, 'Users', userCredential.user.uid), {
                name,
                email,
                createdAt: new Date().toISOString(),
                // Empty preferences to indicate this is a new user who needs onboarding
                goal: [],
                diet: [],
                restrictions: [],
                dislikes: [],
                likes: [],
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

            // Create a basic user document - preferences will be set in onboarding
            await setDoc(doc(firestore, 'Users', userCredential.user.uid), {
                name: userCredential.user.displayName || '',
                email: userCredential.user.email,
                createdAt: new Date().toISOString(),
                // Empty preferences to indicate this is a new user
                goal: [],
                diet: [],
                restrictions: [],
                dislikes: [],
                likes: [],
                savedRecipes: [],
            }, { merge: true });

        } catch (error) {
            Alert.alert('Login Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoidingView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.headerContainer}>
                        {/* Replace with your actual logo */}
                        <View style={styles.logoContainer}>
                            <Ionicons name="restaurant" size={50} color={theme.primary} />
                        </View>
                        <Text style={styles.appName}>Meal4U</Text>
                        <Text style={styles.tagline}>Your personalized meal planning companion</Text>
                    </View>

                    <View style={styles.formContainer}>
                        <Text style={styles.formTitle}>{isSignUp ? 'Create Account' : 'Welcome Back'}</Text>

                        {isSignUp && (
                            <View style={styles.inputContainer}>
                                <Ionicons name="person-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Full Name"
                                    value={name}
                                    onChangeText={setName}
                                    placeholderTextColor={theme.textSecondary}
                                />
                            </View>
                        )}

                        <View style={styles.inputContainer}>
                            <Ionicons name="mail-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Email Address"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                placeholderTextColor={theme.textSecondary}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Password"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                placeholderTextColor={theme.textSecondary}
                            />
                            <TouchableOpacity
                                style={styles.passwordVisibilityButton}
                                onPress={() => setShowPassword(!showPassword)}
                            >
                                <Ionicons
                                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                                    size={20}
                                    color={theme.textSecondary}
                                />
                            </TouchableOpacity>
                        </View>

                        {!isSignUp && (
                            <TouchableOpacity style={styles.forgotPasswordButton}>
                                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[styles.mainButton, loading && styles.disabledButton]}
                            onPress={isSignUp ? handleSignUp : handleLogin}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.mainButtonText}>
                                    {isSignUp ? 'Sign Up' : 'Login'}
                                </Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.dividerContainer}>
                            <View style={styles.divider} />
                            <Text style={styles.dividerText}>OR</Text>
                            <View style={styles.divider} />
                        </View>

                        <View style={styles.socialButtonsContainer}>
                            <TouchableOpacity
                                style={[styles.socialButton, styles.googleButton, loading && styles.disabledButton]}
                                onPress={handleGoogleLogin}
                                disabled={loading}
                            >
                                <Ionicons name="logo-google" size={20} color="#FFFFFF" />
                                <Text style={styles.socialButtonText}>Google</Text>
                            </TouchableOpacity>

                            {appleAvailable && (
                                <TouchableOpacity
                                    style={[styles.socialButton, styles.appleButton, loading && styles.disabledButton]}
                                    onPress={handleAppleLogin}
                                    disabled={loading}
                                >
                                    <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
                                    <Text style={styles.socialButtonText}>Apple</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.toggleContainer}
                        onPress={() => setIsSignUp(!isSignUp)}
                    >
                        <Text style={styles.toggleText}>
                            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                            <Text style={styles.toggleTextHighlight}>
                                {isSignUp ? 'Login' : 'Sign Up'}
                            </Text>
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const createStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: theme.mode === 'dark' ? '#2C3E33' : '#F0F8F0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    appName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.primary,
        marginBottom: 8,
    },
    tagline: {
        fontSize: 14,
        color: theme.textSecondary,
        textAlign: 'center',
    },
    formContainer: {
        width: '100%',
    },
    formTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 24,
        textAlign: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        marginBottom: 16,
        height: 56,
        backgroundColor: theme.mode === 'dark' ? '#333' : '#F9F9F9',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: theme.text,
    },
    passwordVisibilityButton: {
        padding: 8,
    },
    forgotPasswordButton: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    forgotPasswordText: {
        color: theme.primary,
        fontSize: 14,
        fontWeight: '500',
    },
    mainButton: {
        backgroundColor: theme.primary,
        borderRadius: 12,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    mainButtonText: {
        color: theme.onPrimary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    disabledButton: {
        opacity: 0.7,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: theme.border,
    },
    dividerText: {
        paddingHorizontal: 16,
        color: theme.textSecondary,
        fontSize: 14,
        fontWeight: '500',
    },
    socialButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    socialButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        height: 56,
        borderRadius: 12,
        flex: 0.48,
    },
    googleButton: {
        backgroundColor: '#4285F4',
    },
    appleButton: {
        backgroundColor: '#000',
    },
    socialButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    toggleContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
    toggleText: {
        fontSize: 14,
        color: theme.textSecondary,
    },
    toggleTextHighlight: {
        color: theme.primary,
        fontWeight: 'bold',
    },
});