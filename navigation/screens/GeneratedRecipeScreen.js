import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

export default function GeneratedRecipeScreen({ route, navigation }) {
    const { recipe } = route.params;  // receiving the generated recipe
    const [activeTab, setActiveTab] = useState('details');  // Track active tab ('details' or 'instructions')

    // Save Recipe functionality
    const handleSaveRecipe = () => {
        navigation.navigate('SavedRecipes', { newRecipe: recipe });
    };
    const handleAddToPlan = () => {
        navigation.navigate('Calendar', { newRecipe: recipe });
    };

    return (
        <View style={styles.container}>
            {/* Back Button */}
            <TouchableOpacity onPress={() => navigation.navigate('AI')} style={styles.backButton}>
                <Ionicons name="arrow-back-outline" size={24} color="black" />
            </TouchableOpacity>

            {/* Recipe Card */}
            <View style={styles.recipeCard}>
                <Text style={styles.recipeName}>{recipe.name || 'Generated Recipe'}</Text>
                <View style={styles.recipeInfo}>
                    <Text>{recipe.time || '30 mins'}</Text>
                    <Text>{recipe.difficulty || 'Medium'}</Text>
                </View>

                {/* Tab Switch */}
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

                {/* Content Switch based on active tab */}
                {activeTab === 'instructions' ? (
                    <ScrollView style={styles.detailsOrInstructions}>
                        <Text>Instructions:</Text>
                        {recipe.instructions && recipe.instructions.length > 0 ? (
                            recipe.instructions.map((instruction, index) => (
                                <View key={index} style={{ flexDirection: 'row', marginVertical: 5 }}>
                                    <Text style={{ fontWeight: 'bold' }}>{`Step ${index + 1}: `}</Text>
                                    <Text>{instruction}</Text>
                                </View>
                            ))
                        ) : (
                            <Text>{recipe.description}</Text>  
                        )}
                    </ScrollView>
                ) : (
                    <ScrollView style={styles.detailsOrInstructions}>
                        <Text>Ingredients:</Text>
                        {recipe.ingredients && recipe.ingredients.length > 0 ? (
                            recipe.ingredients.map((item, index) => (
                                <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text>{item.name}</Text>
                                    <Text>{item.amount}</Text>
                                </View>
                            ))
                        ) : (
                            <Text>{recipe.description}</Text>  
                        )}
                    </ScrollView>
                )}

                {/* Action Buttons */}
                <View style={styles.actions}>
                    {/* Save recipe button */}
                    <TouchableOpacity style={styles.saveButton} onPress={handleSaveRecipe}>
                        <Text style={{ color: 'white' }}>Save Recipe</Text>
                    </TouchableOpacity>

                    {/* Add to plan button */}
                    <TouchableOpacity style={styles.addToPlanButton} onPress={handleAddToPlan}>
                        <Text style={{ color: 'white' }}>Add to Plan</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    backButton: {
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 1,
    },
    recipeCard: { padding: 20, borderRadius: 10, backgroundColor: '#f0f0f0', marginTop: 60 },
    recipeName: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
    recipeInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        backgroundColor: '#e0e0e0',
        borderRadius: 10,
    },
    tabButton: {
        flex: 1,
        padding: 15,
        alignItems: 'center',
        borderRadius: 10,
    },
    activeTab: {
        backgroundColor: '#ccc',
    },
    tabText: {
        fontWeight: 'bold',
    },
    detailsOrInstructions: {
        marginBottom: 20,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    saveButton: {
        padding: 10,
        backgroundColor: 'black',
        borderRadius: 5,
    },
    addToPlanButton: {
        padding: 10,
        backgroundColor: 'green',
        borderRadius: 5,
    },
});
