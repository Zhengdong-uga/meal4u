import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { doc, getDoc, updateDoc, getFirestore } from 'firebase/firestore';
import { auth } from '../../backend/src/firebase';
import RecipeCard from '../../components/RecipeCard';
import { COLORS } from '../../constants/theme';

import AsyncStorage from '@react-native-async-storage/async-storage';

export default function GeneratedRecipeScreen({ route, navigation }) {
  const { recipe, userIngredients = [] } = route.params;

  const handleDiscardRecipe = async () => {
    try {
      // Clear from local storage so it doesn't show in "Continue Cooking"
      await AsyncStorage.removeItem('last_generated_recipe');
      
      // Navigate back to the source screen or Home
      handleBackButton();
    } catch (e) {
      console.error("Error discarding recipe:", e);
    }
  };

  const saveRecipeToFirebase = async (recipe) => {
    const user = auth.currentUser;
    if (user) {
      const firestore = getFirestore();
      const userDocRef = doc(firestore, 'Users', user.uid);
      try {
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const recipeData = {
            name: recipe.name,
            time: recipe.time,
            difficulty: recipe.difficulty,
            ingredients: recipe.ingredients,
            instructions: recipe.instructions,
            description: recipe.description,
            nutrition: recipe.nutrition || {},
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

  const handleAddToPlan = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const firestore = getFirestore();
        const userDocRef = doc(firestore, 'Users', user.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          await updateDoc(userDocRef, {
            mealsImplemented: userDoc.data().mealsImplemented + 1,
          })
        } catch (error) {
          console.error('Error updating user meal count:', error);
        }
      };
    }
    catch (error) {
      console.error('Error updating user meal count:', error);
    }

    navigation.navigate('Calendar', { newRecipe: recipe });
  };

  const handleBackButton = () => {
    if (route.params?.fromScreen === 'SavedRecipes') {
      navigation.navigate('SavedRecipes');
    } else if (route.params?.fromScreen === 'Profile') {
      navigation.navigate('Profile');
    } else {
      navigation.navigate('Main', { screen: 'Meal Generating' });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <RecipeCard 
          recipe={recipe} 
          userIngredients={userIngredients}
          onSave={handleSaveRecipe}
          onAddToPlan={handleAddToPlan}
          onBack={handleBackButton}
          onDiscard={handleDiscardRecipe}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    paddingBottom: 20,
    paddingTop: 10,
  },
});
