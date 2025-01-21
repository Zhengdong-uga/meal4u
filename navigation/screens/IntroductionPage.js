import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground } from 'react-native';

export default function IntroductionPage({ navigation, route }) {
    const { navigateToNext } = route.params || {};

    const handleNext = () => {
        navigation.navigate('IntroductionPage2'); // Navigate to the second intro page
    };

    return (
        <ImageBackground
            source={require('../../assets/intro.png')} // Replace with your actual image path
            style={styles.background}
        >
            <View style={styles.overlay}>
                <Text style={styles.title}>Welcome to Meal4U</Text>
                <Text style={styles.subtitle}>
                    Your journey to personalized and sustainable meal planning starts here.
                </Text>
                <TouchableOpacity style={styles.button} onPress={handleNext}>
                    <Text style={styles.buttonText}>Next</Text>
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
        position: 'absolute', // Makes the button positioned relative to its parent (overlay or background)
        bottom: 220, // Distance from the bottom
        right: 30, // Distance from the right
        backgroundColor: '#48755C',
        padding: 15,
        paddingHorizontal: 20,
        borderRadius: 20,
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
