import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { doc, getDoc, updateDoc, getFirestore } from 'firebase/firestore';
import { auth } from '../../backend/src/firebase';

export default function GeneratedRecipeScreen({ route, navigation }) {
  const { recipe } = route.params;
  const [activeTab, setActiveTab] = useState('details');

  const saveRecipeToFirebase = async (recipe) => {
    const user = auth.currentUser;
    console.log(user)
    console.log(recipe)
    if (user) {
        const firestore = getFirestore();
        const userDocRef = doc(firestore, 'Users', user.uid);
        try {
            const userDoc = await getDoc(userDocRef);
            console.log(userDoc.savedRecipes)
            if (userDoc.exists()) {
                const recipeData = {
                    name: recipe.name,
                    time: recipe.time,
                    difficulty: recipe.difficulty,
                    ingredients: recipe.ingredients,
                    instructions: recipe.instructions,
                    description: recipe.description,
                    nutrition: recipe.nutrition || {}, // Add nutrition to be saved
                };
                await updateDoc(userDocRef, {
                    savedRecipes: [...userDoc.data().savedRecipes, recipeData],
                });
            }
        } catch (error) {
            console.error('Error saving recipe:', error);
        }
    }
};

  const handleSaveRecipe = async () => {
    console.log("Saving recipe:", recipe);
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

  const handleBackButton = () => {
    // Navigate back to the main tabs and then to the AI tab
    navigation.navigate('Main', { screen: 'Meal Generating' });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handleBackButton}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back-outline" size={30} color="black" />
      </TouchableOpacity>

      <View style={styles.recipeCard}>
        <Text style={styles.recipeName}>
          {recipe.name || 'Generated Recipe'}
        </Text>
        <View style={styles.recipeInfo}>
          <Text>{recipe.time || '30 mins'}</Text>
          <Text>{recipe.difficulty || 'Medium'}</Text>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'details' && styles.activeTab]}
            onPress={() => setActiveTab('details')}
          >
            <Text style={styles.tabText}>Ingredients</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'instructions' && styles.activeTab]}
            onPress={() => setActiveTab('instructions')}
          >
            <Text style={styles.tabText}>Instructions</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'nutrition' && styles.activeTab]}
            onPress={() => setActiveTab('nutrition')}
          >
            <Text style={styles.tabText}>Nutrition</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.detailsOrInstructions}>
          {activeTab === 'details' ? (
            <>
              <Text style={styles.sectionTitle}>Ingredients:</Text>
              {recipe.ingredients &&
                recipe.ingredients.map((ingredient, index) => (
                  <Text key={index} style={styles.ingredientItem}>
                    • {ingredient}
                  </Text>
                ))}
            </>
          ) : activeTab === 'instructions' ? (
            <>
              <Text style={styles.sectionTitle}>Instructions:</Text>
              {recipe.instructions &&
                recipe.instructions.map((instruction, index) => (
                  <Text key={index} style={styles.instructionItem}>
                    {index + 1}. {instruction}
                  </Text>
                ))}
            </>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Nutrition:</Text>
              {recipe.nutrition ? (
                <View style={styles.nutritionContainer}>
                  {Object.entries(recipe.nutrition).map(([key, value], index) => (
                    <View key={index} style={styles.nutritionRow}>
                      <Text style={styles.nutritionLabel}>{key}</Text>
                      <Text style={styles.nutritionValue}>{value}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.noNutritionText}>Nutrition information not available</Text>
              )}
            </>
          )}
        </ScrollView>

        <View style={styles.actions}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveRecipe}>
                <Text style={[styles.buttonText, styles.saveButtonText]}>Save Recipe</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addToPlanButton} onPress={handleAddToPlan}>
                <Text style={[styles.buttonText, styles.addToPlanButtonText]}>Add to Plan</Text>
            </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#FBF0E9' },
  backButton: { position: 'absolute', top: 30, left: 20, zIndex: 1 },
  recipeCard: {
    padding: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    marginTop: 60,
    borderWidth: 1,
    borderColor: '#664E2D',
  },
  recipeName: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'left', color: '#664E2D' },
  recipeInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: '#F4F4F4',
    borderRadius: 10,
  },
  tabButton: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 12 },
  activeTab: { backgroundColor: '#E4E4E4' },
  tabText: { fontWeight: 'bold', color: '#664E2D' },
  detailsOrInstructions: { maxHeight: 300, marginBottom: 20 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, color: '#231F20' },
  ingredientItem: { fontSize: 18, marginBottom: 5 },
  instructionItem: { fontSize: 18, marginBottom: 10 },
  actions: { flexDirection: 'row', justifyContent: 'space-between' },
  saveButton: { padding: 20, backgroundColor: '#F0DED0', borderRadius: 8, flex: 1, marginRight: 20 },
  addToPlanButton: { padding: 20, backgroundColor: '#48755C', borderRadius: 8, flex: 1 },
  buttonText: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  addToPlanButtonText: {
    color: '#FFFFFF', // White text for "Add to Plan"
  },
  saveButtonText: {
    color: '#664E2D', // Original brown text for "Save Recipe"
  },
  // New styles for nutrition tab
  nutritionContainer: {
    marginTop: 5,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  nutritionLabel: {
    fontSize: 16,
    color: '#664E2D',
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#48755C',
  },
  noNutritionText: {
    fontSize: 16,
    color: '#999999',
    textAlign: 'center',
    padding: 20,
  },
});