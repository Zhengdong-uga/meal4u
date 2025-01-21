import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground } from 'react-native';

export default function IntroductionPage2({ navigation, route }) {
    const { onIntroComplete } = route.params || {};

    const handleGetStarted = () => {
        if (onIntroComplete) {
            onIntroComplete(); // Marks the introduction as complete
        } else {
            navigation.replace('Login'); // Navigate to Login
        }
    };

    return (
        <ImageBackground
            source={require('../../assets/Intro1.png')} // Replace with your actual image path
            style={styles.background}
        >
            <View style={styles.overlay}>
                <Text style={styles.title}>Meal4U Features</Text>
                <Text style={styles.subtitle}>
                    Go to your profile and edit your eating preferences and goals!
                </Text>
                <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
                    <Text style={styles.buttonText}>Get Started</Text>
                </TouchableOpacity>
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        resizeMode: 'cover',
    },
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        width: '100%',
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#FFFFFF',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 30,
        color: '#FFFFFF',
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#48755C',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
