import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { savedRecipes } from '/Users/zhengdongpeng/mealingful/demo1/data/savedRecipeData.js'

export default function ProfileScreen({ navigation }) {
    const [showAll, setShowAll] = useState(false);

    const handleRecipePress = (recipe) => {
        alert(`Selected Recipe: ${recipe.title}`);  // You can replace this with navigation to a details page
    };

    const renderRecipeItem = ({ item }) => (
        <TouchableOpacity onPress={() => handleRecipePress(item)} style={styles.recipeItemContainer}>
            <Image source={{ uri: item.image }} style={styles.recipeImage} />
            <Text style={styles.recipeTitle}>{item.title}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Profile Information */}
            <View style={styles.profileSection}>
                {/* Avatar */}
                <View style={styles.avatar}></View>
                <Text style={styles.name}>Zhengdong Peng</Text>
                <Text style={styles.email}>Asihfiix@gmail.com</Text>
                <TouchableOpacity style={styles.editButton} onPress={() => alert('Edit Profile')}>
                    <Text style={styles.editButtonText}>Edit Profile</Text>
                </TouchableOpacity>
            </View>

            {/* Saved Recipes Section */}
            <View style={styles.recipeSection}>
                <Text style={styles.sectionTitle}>Recent Recipes</Text>
                <FlatList
                    data={showAll ? savedRecipes : savedRecipes.slice(0, 2)}
                    renderItem={renderRecipeItem}
                    keyExtractor={item => item.id}
                    numColumns={2}  
                    columnWrapperStyle={styles.row}
                />
                <TouchableOpacity onPress={() => setShowAll(!showAll)}>
                    <Text style={styles.seeAllText}>{showAll ? 'See Less' : 'See All'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    profileSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'green',
        marginBottom: 10,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    email: {
        fontSize: 16,
        color: '#888',
    },
    editButton: {
        marginTop: 10,
        padding: 10,
        backgroundColor: 'black',
        borderRadius: 5,
    },
    editButtonText: {
        color: 'white',
        fontSize: 16,
    },
    recipeSection: {
        marginTop: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
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
    seeAllText: {
        color: 'grey',
        textAlign: 'right',
        margin: 16,
    },
    row: {
        justifyContent: 'space-between',
    },
});
