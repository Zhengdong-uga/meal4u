import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import dayjs from 'dayjs'; // 用于获取当前日期

import { ask_gemini } from '../../backend/api.js';

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
        // Find the start and end of the ingredients section
        const ingredientsStart = recipe.indexOf("**Ingredients:**");
        const stepsStart = recipe.indexOf("**Steps of Preparation:**");

        // Extract the ingredients list text
        const ingredientsText = recipe.slice(ingredientsStart + 15, stepsStart).trim();

        // Split the ingredients into individual lines and clean them
        const ingredients = ingredientsText
            .split("\n") // Split by new lines
            .map(line => line.trim()) // Remove extra spaces
            .filter(line => line.startsWith('*')) // Keep only lines that start with '*'
            .map(line => line.replace('*', '').trim()) // Remove the '*' and extra spaces again
            .filter(line => line.length > 0); // Remove any empty strings

        return ingredients;
    }

    // Function to parse the ingredients section
    function parseIngredients(recipe) {
        // Find the start and end of the ingredients section
        const ingredientsStart = recipe.indexOf("**Ingredients:**");
        let stepsStart = recipe.indexOf("**Steps of preparation:**");
        if (stepsStart === -1) {
            stepsStart = recipe.indexOf("**Steps of Preparation:**")
        };

        console.log(stepsStart);

        // Extract the ingredients list text
        const ingredientsText = recipe.slice(ingredientsStart + 15, stepsStart).trim();

        // Split the ingredients into individual lines and clean them
        const ingredients = ingredientsText
            .split("\n") // Split by new lines
            .map(line => line.trim()) // Remove extra spaces
            .filter(line => line.startsWith('*')) // Keep only lines that start with '*'
            .map(line => line.replace('*', '').trim()) // Remove the '*' and extra spaces again
            .filter(line => line.length > 0); // Remove any empty strings

        return ingredients;
    }


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
            console.log(result);
            const name = extractRecipeName(result);
            console.log(name);
            const generatedIngredients = parseIngredients(result);
            console.log(generatedIngredients);


            // ## Name: Keto Kung Pao Chicken Lettuce Wraps

            // This recipe provides a delicious and allergy-friendly keto lunch option packed with protein for muscle gain and adapted for your Chinese cuisine preference.

            // **Ingredients:**

            // * 1 tbsp avocado oil
            // * 1 lb boneless, skinless chicken breast, cut into 1-inch cubes
            // * 1/2 cup chopped onion
            // * 1 cup chopped celery 
            // * 1 cup chopped zucchini 
            // * 1/4 cup low-sodium soy sauce (or coconut aminos for soy-free)
            // * 2 tbsp rice vinegar (or apple cider vinegar)
            // * 1 tbsp toasted sesame oil
            // * 1/2 tsp ground ginger
            // * 1/4 tsp red pepper flakes (optional)
            // * 1/4 cup chopped cashews, toasted
            // * 6 large lettuce leaves (butter lettuce or romaine work well)
            // * 2 tbsp chopped green onions, for garnish

            // **Steps of preparation:**

            // 1. **Prep:** Chop the chicken, onion, celery, and zucchini. Whisk together the soy sauce, rice vinegar, sesame oil, ginger, and red pepper flakes in a small bowl.
            // 2. **Cook chicken:** Heat avocado oil in a large skillet or wok over medium-high heat. Add the chicken and cook until browned and cooked through, about 5-7 minutes. 
            // 3. **Sauté vegetables:** Add the onion, celery, and zucchini to the skillet and cook until softened, about 3-5 minutes.
            // 4. **Sauce:** Pour the sauce mixture into the skillet and bring to a simmer. Cook until the sauce thickens slightly, about 1-2 minutes.
            // 5. **Assemble:** Spoon the chicken and vegetable mixture into lettuce leaves. Top with cashews and green onions. 

            // **Nutritional information (approximate):**

            // * Calories: 550-600kcal
            // * Protein: 50-60g
            // * Carbs: 15-20g (Net Carbs: 10-15g)
            // * Fat: 35-40g

            // **Tips:**

            // * To toast cashews, spread them in a single layer on a baking sheet and bake in a preheated 350°F oven for 5-7 minutes, or until lightly golden brown.
            // * You can adjust the amount of red pepper flakes to your spice preference. 
            // * This recipe can be easily doubled or tripled to serve a crowd.

            // **Enjoy!**


            // Use the result from ask_gemini for the recipe data
            const generatedRecipe = {
                name: name,
                description: 'description', // Use the result from ask_gemini
                time: '30 mins',
                difficulty: 'Medium',
                ingredients: generatedIngredients,
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
