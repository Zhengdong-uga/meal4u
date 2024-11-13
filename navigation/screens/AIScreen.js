import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import dayjs from 'dayjs';

import { ask_gemini } from '../../backend/api.js';

export default function AIScreen({ navigation }) {
    const [ingredients, setIngredients] = useState([]);
    const [ingredientInput, setIngredientInput] = useState('');
    const [specialRequest, setSpecialRequest] = useState('');
    const [mealType, setMealType] = useState('');
    const [suggestionsNeeded, setSuggestionsNeeded] = useState(null);
    const [preferencesModalVisible, setPreferencesModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [preferences, setPreferences] = useState({
        prepareTime: 'Under 30 mins',
        eatingGoal: 'Maintain',
        dietType: '',
        foodRestrictions: '',
        dishType: '',
        dislikedFoods: '',
    });

    const options = {
        prepareTime: ['Under 15 mins', 'Under 30 mins', '1 hour'],
        eatingGoal: ['Lose fat', 'Gain weight', 'Maintain'],
        dietType: ['Vegetarian', 'Vegan', 'Keto', 'Paleo'],
        foodRestrictions: ['Gluten-Free', 'Dairy-Free', 'Nut-Free'],
        dishType: ['Asian', 'American', 'Mediterranean', 'Indian'],
        dislikedFoods: ['Onion', 'Garlic', 'Peanuts', 'Shellfish'],
    };

    const handleAddIngredient = () => {
        if (ingredientInput.trim() !== '') {
            const updatedIngredients = [...ingredients, ingredientInput.trim()];
            setIngredients(updatedIngredients);
            console.log("Updated ingredients:", updatedIngredients);
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
            eatingGoal: '',
            dietType: '',
            foodRestrictions: '',
            dishType: '',
            dislikedFoods: '',
        });
    };

    function extractRecipeName(recipe) {
        // Find the position of the name marker "## Name:" and slice the string after it
        const nameStart = recipe.indexOf("## Name:");
        if (nameStart === -1) return null; // Return null if not found

        // Slice from the start of the name until the next line break
        const nameEnd = recipe.indexOf("\n", nameStart);
        const recipeName = recipe.slice(nameStart + 8, nameEnd).trim(); // "+8" to skip "## Name: "

        return recipeName;
    }
    

    function parseIngredients(recipe) {
        const ingredientsStart = recipe.indexOf("**Ingredients:**");
        const stepsStart = recipe.indexOf("**Steps of Preparation:**");
        const ingredientsText = recipe.slice(ingredientsStart + 15, stepsStart).trim();
        return ingredientsText
            .split("\n")
            .map(line => line.trim())
            .filter(line => line.startsWith('*'))
            .map(line => line.replace('*', '').trim())
            .filter(line => line.length > 0);
    }

    const handleGenerateRecipe = async () => {
        let allergies = { peanut: 0, shellfish: 1, strawberries: 1, tomatoes: 1, chocolate: 0 };
        let diet = preferences.dietType;
        let calorieRestriction = 1700;
        let time = preferences.prepareTime;
        let goal = preferences.eatingGoal;
        let dishType = mealType || preferences.dishType;
        let dislikes = preferences.dislikedFoods.split(',');

        setLoading(true);

        try {
            const result = await ask_gemini(allergies, diet, calorieRestriction, ingredients, specialRequest, time, goal, dishType, dislikes);
            const name = extractRecipeName(result);
            const generatedIngredients = parseIngredients(result);

            const generatedRecipe = {
                name: name,
                description: 'description',
                time: time,
                difficulty: 'Medium',
                ingredients: generatedIngredients,
                instructions: ['Step 1: Prepare the ingredients.', 'Step 2: Follow the steps provided.'],
                notes: ['The recipe was generated based on your input.'],
            };

            navigation.navigate('GeneratedRecipe', { recipe: generatedRecipe });
        } catch (error) {
            console.error("Error generating recipe:", error);
            alert("Failed to generate recipe. Please try again.");
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
                <Text style={styles.question}>

                </Text>
                <View style={styles.ingredientInputContainer}>
                    <TextInput
                        style={styles.ingredientInput}
                        placeholder="Add Ingredients"
                        placeholderTextColor="#999"
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
                        <Text style={[styles.optionText, suggestionsNeeded === true && styles.selectedOptionText]}>Yes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.optionButton, suggestionsNeeded === false ? styles.selectedOption : null]}
                        onPress={() => setSuggestionsNeeded(false)}
                    >
                        <Text style={[styles.optionText, suggestionsNeeded === false && styles.selectedOptionText]}>No</Text>
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
                            <Text style={[styles.optionText, mealType === type && styles.selectedOptionText]}>{type}</Text>
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