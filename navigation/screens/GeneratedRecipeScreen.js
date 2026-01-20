import React, { useState, useMemo } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, Share, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { doc, getDoc, updateDoc, getFirestore } from 'firebase/firestore';
import { auth } from '../../backend/src/firebase';
import RecipeCard from '../../components/RecipeCard';
import { COLORS } from '../../constants/theme';
import HapticsService from '../../utils/haptics';
import { useTheme } from '../../context/ThemeContext';

import AsyncStorage from '@react-native-async-storage/async-storage';

export default function GeneratedRecipeScreen({ route, navigation }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { recipe, userIngredients = [] } = route.params;

  const handleDiscardRecipe = async () => {
    HapticsService.medium();
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
    HapticsService.success();
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
    HapticsService.success();
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

  const handleShareRecipe = async () => {
    HapticsService.light();
    try {
      const message = `Check out this recipe for ${recipe.name || recipe.title}!\n\nIngredients:\n${(recipe.ingredients || []).join('\n')}\n\nInstructions:\n${(recipe.instructions || []).join('\n')}`;
      
      const result = await Share.share({
        message,
        title: recipe.name || recipe.title,
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
        } else {
          // shared
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
      }
    } catch (error) {
      Alert.alert(error.message);
    }
  };

  const handleBackButton = () => {
    HapticsService.light();
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
          onShare={handleShareRecipe}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContainer: {
    paddingBottom: 100, // Add padding for floating tab bar
    paddingTop: 10,
  },
});
