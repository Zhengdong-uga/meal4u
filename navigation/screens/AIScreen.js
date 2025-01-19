import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import dayjs from 'dayjs';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../backend/src/firebase';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { ask_gemini } from '../../backend/api.js';

export default function AIScreen({ navigation }) {
    const [ingredientInput, setIngredientInput] = useState(''); // ?
    const [loading, setLoading] = useState(false); // ?
    const [preferencesModalVisible, setPreferencesModalVisible] = useState(false); // ?

    // Obtained from database
    const [userGoal, setUserGoal] = useState(''); // User's goals (lose weight, gain muscle, etc.)
    const [userDiet, setUserDiet] = useState(''); // User's diet (keto, vegan, etc.)
    const [userRestrictions, setUserRestrictions] = useState([]); // What the user cannot eat (allergies, etc.)
    const [userDislikes, setUserDislikes] = useState([]); // What the user dislikes
    const [userLikes, setUserLikes] = useState([]); // What the user likes

    // Obtained from AI page
    const [ingredients, setIngredients] = useState([]); // What the user has right now
    const [suggestionsNeeded, setSuggestionsNeeded] = useState(null); // Should LLM consider other ingredients?
    const [specialRequest, setSpecialRequest] = useState(''); // What special requests does the user need?
    const [mealType, setMealType] = useState(''); // Time of the meal - breakfast, lunch, dinner

    // Obtained from the popup on the AI page
    const [preferences, setPreferences] = useState({
        prepareTime: '',
        dishType: '',
    });

    const options = {
        prepareTime: ['Under 15 mins', 'Under 30 mins', '1 hour'],
        dishType: ['Asian', 'American', 'Mediterranean', 'Indian'],
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const firestore = getFirestore();
                const userDocRef = doc(firestore, 'Users', user.uid);
                try {
                    const userDoc = await getDoc(userDocRef);
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        setUserGoal(data.goal || '');
                        setUserDiet(data.diet || '');
                        setUserRestrictions(data.restrictions || []);
                        setUserDislikes(data.dislikes || []);
                        setUserLikes(data.likes || []);
                    }
                } catch (error) {
                    console.error('Error fetching user info:', error);
                }
            } else {
                // Reset user data if logged out
                setUserGoal('');
                setUserDiet('');
                setUserRestrictions([]);
                setUserDislikes([]);
                setUserLikes([]);
            }
        });

        return () => unsubscribe();
    }, []);

    const handleAddIngredient = () => {
        if (ingredientInput.trim()) {
            setIngredients([...ingredients, ingredientInput.trim()]);
            setIngredientInput('');
        }
    };

    const handleRemoveIngredient = (ingredient) => {
        setIngredients(ingredients.filter(item => item !== ingredient));
    };

    const handlePreferenceSelect = (key, value) => {
        setPreferences((prev) => ({ ...prev, [key]: value }));
    };

    const savePreferences = () => {
        setPreferencesModalVisible(false);
        alert('Preferences applied!');
    };

    const clearPreferences = () => {
        setPreferences({
            prepareTime: '',
            dishType: '',
        });
    };

    const handleGenerateRecipe = async () => {
        setLoading(true);
        const { prepareTime, dishType } = preferences;

        try {

            const result = JSON.parse(await ask_gemini(
                userGoal, userDiet, userRestrictions, userDislikes, userLikes, ingredients, suggestionsNeeded, specialRequest, mealType, prepareTime, dishType)
            );


            const generatedRecipe = {
                name: result.name,
                description: result.description,
                time: result.time,
                difficulty: result.difficulty,
                ingredients: result.ingredients,
                instructions: result.stepsOfPreparation,
                notes: ['Generated with AI based on your preferences.'], // should I replace this with nutritional information?
            };

            navigation.navigate('GeneratedRecipe', { recipe: generatedRecipe });
        } catch (error) {
            console.error('Error generating recipe:', error);
            alert('Failed to generate recipe. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const dayOfWeek = dayjs().format('dddd');
    const date = dayjs().format('MMMM D');

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.dateContainer}>
                    <Text style={styles.dayText}>{dayOfWeek}</Text>
                    <Text style={styles.dateText}>{date}</Text>
                </View>
                <TouchableOpacity
                    style={styles.preferenceButton}
                    onPress={() => setPreferencesModalVisible(true)}
                >
                    <Ionicons name="options-outline" size={30} color="black" />
                </TouchableOpacity>
            </View>

            <View style={styles.inputSection}>
                <Text style={styles.question}>Which ingredients do you currently have?</Text>
                <View style={styles.ingredientInputContainer}>
                    <TextInput
                        style={styles.ingredientInput}
                        placeholder="Add Ingredients"
                        value={ingredientInput}
                        onChangeText={setIngredientInput}
                        onSubmitEditing={handleAddIngredient}
                    />
                    <FlatList
                        data={ingredients}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.ingredient} onPress={() => handleRemoveIngredient(item)}>
                                <Text>{item} ×</Text>
                            </TouchableOpacity>
                        )}
                        keyExtractor={(item, index) => index.toString()}
                        horizontal
                    />
                </View>
            </View>

            <View style={styles.inputSection}>
                <Text style={styles.question}>Would you like some suggestions for other ingredients to consider?</Text>
                <View style={styles.optionContainer}>
                    <TouchableOpacity
                        style={[styles.optionButton, suggestionsNeeded === true ? styles.selectedOption : null]}
                        onPress={() => setSuggestionsNeeded(true)}
                    >
                        <Text
                            style={[
                                styles.optionText,
                                suggestionsNeeded === true && styles.selectedOptionText,
                            ]}
                        >
                            Yes
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.optionButton, suggestionsNeeded === false ? styles.selectedOption : null]}
                        onPress={() => setSuggestionsNeeded(false)}
                    >
                        <Text
                            style={[
                                styles.optionText,
                                suggestionsNeeded === false && styles.selectedOptionText,
                            ]}
                        >
                            No
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>


            <View style={styles.inputSection}>
                <Text style={styles.question}>Special Request?</Text>
                <TextInput
                    style={styles.specialRequestInput}
                    placeholder="e.g type what kind of food you like such as Chinese food, seafood, etc."
                    value={specialRequest}
                    onChangeText={setSpecialRequest}
                />
            </View>

            <View style={styles.inputSection}>
                <Text style={styles.question}>Which meal is this for?</Text>
                <View style={styles.optionContainer}>
                    {['Breakfast', 'Lunch', 'Dinner'].map((type) => (
                        <TouchableOpacity
                            key={type}
                            style={[styles.optionButton, mealType === type ? styles.selectedOption : null]}
                            onPress={() => setMealType(type)}
                        >
                            <Text
                                style={[
                                    styles.optionText,
                                    mealType === type && styles.selectedOptionText,
                                ]}
                            >
                                {type}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>


            <TouchableOpacity
                style={styles.generateButton}
                onPress={handleGenerateRecipe}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator size="small" color="white" />
                ) : (
                    <Text style={styles.generateButtonText}>Generate Recipe</Text>
                )}
            </TouchableOpacity>

            <Modal
                visible={preferencesModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setPreferencesModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Recipe Preference</Text>

                        {Object.entries(options).map(([key, values]) => (
                            <View key={key}>
                                <Text style={styles.sectionTitle}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                                <View style={styles.optionsContainer}>
                                    {values.map((option) => (
                                        <TouchableOpacity
                                            key={option}
                                            style={[
                                                styles.option,
                                                preferences[key] === option && styles.selectedOption,
                                            ]}
                                            onPress={() => handlePreferenceSelect(key, option)}
                                        >
                                            <Text
                                                style={[
                                                    styles.optionText,
                                                    preferences[key] === option && styles.selectedOptionText,
                                                ]}
                                            >
                                                {option}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        ))}

                        <View style={styles.buttonsContainer}>
                            <TouchableOpacity style={styles.clearButton} onPress={clearPreferences}>
                                <Text style={styles.clearButtonText}>Clear All</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.applyButton} onPress={savePreferences}>
                                <Text style={styles.applyButtonText}>Apply</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    dateContainer: {
        justifyContent: 'center',
    },
    dayText: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    dateText: {
        fontSize: 18,
        color: '#888',
        marginTop: 5,
    },
    preferenceButton: {
        padding: 10,
    },
    inputSection: {
        marginBottom: 20,
    },
    question: {
        fontSize: 16,
        marginBottom: 10,
    },
    ingredientInputContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 10,
        padding: 10,
        backgroundColor: '#f0f0f0',
    },
    ingredient: {
        padding: 5,
        backgroundColor: '#ddd',
        borderRadius: 15,
        marginRight: 10,
        marginBottom: 10,
    },
    ingredientInput: {
        width: '100%',
        padding: 10,
        marginBottom: 10,
    },
    optionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    optionButton: {
        flex: 1,
        padding: 15,
        backgroundColor: '#f0f0f0',
        marginHorizontal: 5,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectedOption: {
        backgroundColor: 'black',
    },
    optionText: {
        color: 'black',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    selectedOptionText: {
        color: 'white',
    },
    specialRequestInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 10,
        padding: 10,
        backgroundColor: '#f0f0f0',
        height: 50,
        fontSize: 16,
    },
    generateButton: {
        backgroundColor: 'black',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        height: 50, // Fixed height to prevent button size change
    },
    generateButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginVertical: 10,
    },
    optionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
    },
    option: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 20,
        padding: 10,
        margin: 5,
    },
    selectedOption: {
        backgroundColor: 'black',
        borderColor: 'black',
    },
    optionText: {
        color: 'black',
    },
    selectedOptionText: {
        color: 'white',
    },
    buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    clearButton: {
        backgroundColor: '#ddd',
        padding: 10,
        borderRadius: 10,
    },
    clearButtonText: {
        color: '#000',
        fontWeight: 'bold',
    },
    applyButton: {
        backgroundColor: 'black',
        padding: 10,
        borderRadius: 10,
    },
    applyButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});