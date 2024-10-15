import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { savedRecipes } from '../../data/savedRecipeData.js'



export default function SavedRecipesScreen({ navigation, route }) {
    const [recipes, setRecipes] = useState(savedRecipes); // Initial state from saved recipes

    useEffect(() => {
        if (route.params?.newRecipe) {
            setRecipes((prevRecipes) => [...prevRecipes, route.params.newRecipe]); // Add new recipe
        }
    }, [route.params?.newRecipe]);

    const handleRecipeSelect = (recipe) => {
        navigation.navigate('Calendar', { selectedRecipe: recipe });
    };

    const renderRecipeItem = ({ item }) => (
        <TouchableOpacity onPress={() => handleRecipeSelect(item)} style={styles.recipeItemContainer}>
            <Image source={{ uri: item.image }} style={styles.recipeImage} />
            <Text style={styles.recipeTitle}>{item.title}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Select a Saved Recipe</Text>
            <FlatList
                data={recipes}  // Updated to use the recipes state
                renderItem={renderRecipeItem}
                keyExtractor={item => item.id}
                numColumns={2}
                columnWrapperStyle={styles.row}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#fff' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    recipeItemContainer: {
        flex: 1,
        margin: 10,
        borderRadius: 10,
        overflow: 'hidden',
    },
    recipeImage: {
        width: '100%',
        height: 120,
        borderRadius: 10,
    },
    recipeTitle: {
        marginTop: 5,
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    row: {
        justifyContent: 'space-between',
    },
});