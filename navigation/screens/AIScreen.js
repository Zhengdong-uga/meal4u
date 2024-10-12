import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import dayjs from 'dayjs'; // 用于获取当前日期

import { ask_gemini } from '/Users/zhengdongpeng/mealingful/demo1/backend/api.js';

export default function AIScreen({ navigation }) {
    const [ingredients, setIngredients] = useState([]);
    const [ingredientInput, setIngredientInput] = useState('');
    const [specialRequest, setSpecialRequest] = useState('');
    const [mealType, setMealType] = useState('');
    const [suggestionsNeeded, setSuggestionsNeeded] = useState(null);

    // 添加食材
    const handleAddIngredient = () => {
        if (ingredientInput.trim() !== '') {
            setIngredients([...ingredients, ingredientInput.trim()]);
            setIngredientInput('');
        }
    };

    // 删除食材
    const handleRemoveIngredient = (ingredient) => {
        setIngredients(ingredients.filter(item => item !== ingredient));
    };

 // 生成菜谱并导航到生成页面 (fetch recipe from backend)
 const handleGenerateRecipe = async () => {
    let allergies = { 'peanut': 0, 'shellfish': 1, 'strawberries': 1, 'tomatoes': 1, 'chocolate': 0 };
    let diet = 'keto';
    let calorieRestriction = 1700;
    let specialRequests = specialRequest;
    let time = '30 minutes';
    let goal = 'gain muscle';
    let dishType = mealType || 'Indian';
    let dislikes = [];

    try {
        // Call the backend function to get a generated recipe
        const result = await ask_gemini(allergies, diet, calorieRestriction, ingredients, specialRequests, time, goal, dishType, dislikes);
        
        // Use the result from ask_gemini for the recipe data
        const generatedRecipe = {
            name: 'Generated Recipe',
            description: result, // Use the result from ask_gemini
            time: '30 mins',
            difficulty: 'Medium',
            ingredients: [
                { name: 'Onion', amount: '1 piece' },
                { name: 'Beef', amount: '200g' },
            ],
            instructions: [
                'Step 1: Prepare the ingredients as described in the result.',
                'Step 2: Follow the steps provided in the result.'
            ],
            notes: [
                'The recipe was generated based on your input.'
            ]
        };

        // Navigate to GeneratedRecipe screen with the recipe data
        navigation.navigate('GeneratedRecipe', { recipe: generatedRecipe });

    } catch (error) {
        console.error("Error generating recipe:", error);
    }
};


    // 获取今天的日期和周几
    const dayOfWeek = dayjs().format('dddd'); // 星期几
    const date = dayjs().format('MMMM D'); // 月份和日期

    return (
        <View style={styles.container}>
            {/* 日期和调整按钮 */}
            <View style={styles.header}>
                <View style={styles.dateContainer}>
                    <Text style={styles.dayText}>{dayOfWeek}</Text>
                    <Text style={styles.dateText}>{date}</Text>
                </View>
                <TouchableOpacity style={styles.preferenceButton}>
                    <Ionicons name="options-outline" size={30} color="black" />
                </TouchableOpacity>
            </View>

            {/* 食材输入区域 */}
            <View style={styles.inputSection}>
                <Text style={styles.question}>Which ingredients do you currently have?</Text>
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

            {/* 其他问题 - 提供其他食材建议 */}
            <View style={styles.inputSection}>
                <Text style={styles.question}>Would you like some suggestions for other ingredients to consider?</Text>
                <View style={styles.optionContainer}>
                    <TouchableOpacity
                        style={[styles.optionButton, suggestionsNeeded === true ? styles.selectedOption : null]}
                        onPress={() => setSuggestionsNeeded(true)}
                    >
                        <Text style={styles.optionText}>Yes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.optionButton, suggestionsNeeded === false ? styles.selectedOption : null]}
                        onPress={() => setSuggestionsNeeded(false)}
                    >
                        <Text style={styles.optionText}>No</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* 特殊请求 */}
            <View style={styles.inputSection}>
                <Text style={styles.question}>Special Request?</Text>
                <TextInput
                    style={styles.specialRequestInput}
                    placeholder="e.g type what kind of food do you like such as Chinese food, seafood, etc."
                    value={specialRequest}
                    onChangeText={setSpecialRequest}
                />
            </View>

            {/* 早餐/午餐/晚餐 */}
            <View style={styles.inputSection}>
                <Text style={styles.question}>Which meal is this for?</Text>
                <View style={styles.optionContainer}>
                    {['Breakfast', 'Lunch', 'Dinner'].map((type) => (
                        <TouchableOpacity
                            key={type}
                            style={[styles.optionButton, mealType === type ? styles.selectedOption : null]}
                            onPress={() => setMealType(type)}
                        >
                            <Text style={styles.optionText} numberOfLines={1}>{type}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* 生成食谱按钮 */}
            <TouchableOpacity style={styles.generateButton} onPress={handleGenerateRecipe}>
                <Text style={styles.generateButtonText}>Generate Recipe</Text>
            </TouchableOpacity>
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
        justifyContent: 'center',  // 垂直居中
    },
    selectedOption: {
        backgroundColor: 'black',
    },
    optionText: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        flexWrap: 'nowrap',  // 禁止换行
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
        marginTop: 20,
    },
    generateButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
