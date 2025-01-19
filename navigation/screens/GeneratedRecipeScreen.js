import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';



export default function GeneratedRecipeScreen({ route, navigation }) {
    const { recipe } = route.params;
    const [activeTab, setActiveTab] = useState('details');

    const handleSaveRecipe = async () => {
        console.log("Saving recipe:", recipe); // Check the recipe data
        try {
            await saveRecipeToFirebase(recipe);
            console.log("Recipe saved successfully!");
            navigation.navigate('SavedRecipes', { newRecipe: recipe });
        } catch (error) {
            console.error("Failed to save the recipe: ", error);
            alert("An error occurred while saving the recipe. Please try again.");
        }
    };


    const handleAddToPlan = () => {
        navigation.navigate('Calendar', { newRecipe: recipe });
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={() => navigation.navigate('AI')} style={styles.backButton}>
                <Ionicons name="arrow-back-outline" size={24} color="black" />
            </TouchableOpacity>

            <View style={styles.recipeCard}>
                <Text style={styles.recipeName}>
                    {recipe.name ? recipe.name : 'Generated Recipe'}
                </Text>
                <View style={styles.recipeInfo}>
                    <Text>{recipe.time || '30 mins'}</Text>
                    <Text>{recipe.difficulty || 'Medium'}</Text>
                </View>

                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'details' ? styles.activeTab : null]}
                        onPress={() => setActiveTab('details')}
                    >
                        <Text style={styles.tabText}>Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'instructions' ? styles.activeTab : null]}
                        onPress={() => setActiveTab('instructions')}
                    >
                        <Text style={styles.tabText}>Instructions</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.detailsOrInstructions}>
                    {activeTab === 'details' ? (
                        <>
                            <Text style={styles.sectionTitle}>Ingredients:</Text>
                            {recipe.ingredients && recipe.ingredients.map((ingredient, index) => (
                                <Text key={index} style={styles.ingredientItem}>• {ingredient}</Text>
                            ))}
                        </>
                    ) : (
                        <>
                            <Text style={styles.sectionTitle}>Instructions:</Text>
                            {recipe.instructions && recipe.instructions.map((instruction, index) => (
                                <Text key={index} style={styles.instructionItem}>{index + 1}. {instruction}</Text>
                            ))}
                        </>
                    )}
                </ScrollView>

                <View style={styles.actions}>
                    <TouchableOpacity style={styles.saveButton} onPress={handleSaveRecipe}>
                        <Text style={styles.buttonText}>Save Recipe</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.addToPlanButton} onPress={handleAddToPlan}>
                        <Text style={styles.buttonText}>Add to Plan</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#fff' },
    backButton: { position: 'absolute', top: 20, left: 20, zIndex: 1 },
    recipeCard: { padding: 20, borderRadius: 10, backgroundColor: '#f0f0f0', marginTop: 60 },
    recipeName: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
    recipeInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    tabContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, backgroundColor: '#e0e0e0', borderRadius: 10 },
    tabButton: { flex: 1, padding: 15, alignItems: 'center', borderRadius: 10 },
    activeTab: { backgroundColor: '#ccc' },
    tabText: { fontWeight: 'bold' },
    detailsOrInstructions: { maxHeight: 300, marginBottom: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    ingredientItem: { fontSize: 16, marginBottom: 5 },
    instructionItem: { fontSize: 16, marginBottom: 10 },
    actions: { flexDirection: 'row', justifyContent: 'space-between' },
    saveButton: { padding: 10, backgroundColor: 'black', borderRadius: 5 },
    addToPlanButton: { padding: 10, backgroundColor: 'green', borderRadius: 5 },
    buttonText: { color: 'white', fontWeight: 'bold' },
});