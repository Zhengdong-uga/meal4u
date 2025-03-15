import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Image,
    SafeAreaView,
    TextInput,
    StatusBar,
    ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { savedRecipes } from '../../data/savedRecipeData.js';
import { auth } from '../../backend/src/firebase';
import { doc, getDoc, updateDoc, getFirestore } from 'firebase/firestore';

export default function SavedRecipesScreen({ navigation, route }) {
    const [recipes, setRecipes] = useState(savedRecipes);
    const [filteredRecipes, setFilteredRecipes] = useState(savedRecipes);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('All');

    // Categories for filtering
    const categories = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snacks'];

    // Check if we're coming from Calendar screen for selection mode
    const isSelectionMode = route.params?.returnScreen === 'Calendar';
    const mealType = route.params?.mealType;

    useEffect(() => {
        // Set navigation title based on mode
        navigation.setOptions({
            headerTitle: isSelectionMode
                ? `Select a ${mealType || 'meal'}`
                : 'Saved Recipes',
            headerLeft: () => (
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.headerButton}
                >
                    <Icon name="arrow-back" size={24} color="#48755C" />
                </TouchableOpacity>
            ),
            headerRight: () => (
                <TouchableOpacity
                    onPress={() => navigation.navigate('AI')}
                    style={styles.headerButton}
                >
                    <Icon name="add-circle-outline" size={24} color="#48755C" />
                </TouchableOpacity>
            ),
        });
    }, [navigation, isSelectionMode, mealType]);

    useEffect(() => {
        if (route.params?.newRecipe) {
            setLoading(true);

            // Add new recipe with a delay to show loading indicator
            setTimeout(() => {
                setRecipes(prevRecipes => [...prevRecipes, route.params.newRecipe]);
                setFilteredRecipes(prevRecipes => [...prevRecipes, route.params.newRecipe]);
                setLoading(false);
            }, 300);

            // Clear the params
            navigation.setParams({ newRecipe: null });
        }
    }, [route.params?.newRecipe]);

    useEffect(() => {
        // Filter recipes based on search query and category
        let results = recipes;

        if (searchQuery) {
            results = results.filter(recipe =>
                recipe.title.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (selectedCategory !== 'All') {
            results = results.filter(recipe =>
                recipe.category === selectedCategory
            );
        }

        setFilteredRecipes(results);
    }, [searchQuery, selectedCategory, recipes]);

    const handleRecipeSelect = async (recipe) => {
        if (isSelectionMode) {
            // Return selected recipe to Calendar
            navigation.navigate('Calendar', { selectedRecipe: recipe });
        } else {
            // View recipe details
            navigation.navigate('GeneratedRecipe', { recipe });
        }
    };

    const renderRecipeItem = ({ item }) => (
        <TouchableOpacity
            onPress={() => handleRecipeSelect(item)}
            style={styles.recipeItemContainer}
            activeOpacity={0.7}
        >
            <Image source={{ uri: item.image }} style={styles.recipeImage} />

            {/* Meal type indicator */}
            <View style={styles.categoryTag}>
                <Text style={styles.categoryText}>{item.category || 'Recipe'}</Text>
            </View>

            <View style={styles.recipeDetails}>
                <Text style={styles.recipeTitle} numberOfLines={2}>{item.title}</Text>
                {item.time && (
                    <View style={styles.timeContainer}>
                        <Icon name="time-outline" size={14} color="#666" />
                        <Text style={styles.timeText}>{item.time}</Text>
                    </View>
                )}
            </View>

            {isSelectionMode && (
                <TouchableOpacity
                    style={styles.selectButton}
                    onPress={() => handleRecipeSelect(item)}
                >
                    <Text style={styles.selectButtonText}>Select</Text>
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );

    const renderCategoryItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.categoryButton,
                selectedCategory === item && styles.categoryButtonActive
            ]}
            onPress={() => setSelectedCategory(item)}
        >
            <Text
                style={[
                    styles.categoryButtonText,
                    selectedCategory === item && styles.categoryButtonTextActive
                ]}
            >
                {item}
            </Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.container}>
                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search your recipes..."
                        placeholderTextColor="#999"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        returnKeyType="search"
                        clearButtonMode="while-editing"
                    />
                    {searchQuery !== '' && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Icon name="close-circle" size={20} color="#999" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Category Filter */}
                <FlatList
                    horizontal
                    data={categories}
                    renderItem={renderCategoryItem}
                    keyExtractor={item => item}
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoryList}
                    contentContainerStyle={styles.categoryListContent}
                />

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#48755C" />
                        <Text style={styles.loadingText}>Loading recipes...</Text>
                    </View>
                ) : filteredRecipes.length > 0 ? (
                    <FlatList
                        data={filteredRecipes}
                        renderItem={renderRecipeItem}
                        keyExtractor={item => item.id}
                        numColumns={2}
                        columnWrapperStyle={styles.row}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.recipeListContent}
                    />
                ) : (
                    <View style={styles.emptyContainer}>
                        <Icon name="search-outline" size={60} color="#CCC" />
                        <Text style={styles.emptyTitle}>No recipes found</Text>
                        <Text style={styles.emptyText}>
                            {searchQuery ?
                                "Try a different search term or category" :
                                "Save some recipes to see them here"}
                        </Text>
                        <TouchableOpacity
                            style={styles.createButton}
                            onPress={() => navigation.navigate('AI')}
                        >
                            <Text style={styles.createButtonText}>Create New Recipe</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    headerButton: {
        padding: 8,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        margin: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        height: 40,
        fontSize: 16,
        color: '#000000',
    },
    categoryList: {
        maxHeight: 50,
        marginBottom: 8,
    },
    categoryListContent: {
        paddingHorizontal: 16,
    },
    categoryButton: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderRadius: 10,
        marginRight: 8,
        backgroundColor: '#F0F0F0',
    },
    categoryButtonActive: {
        backgroundColor: '#48755C',
    },
    categoryButtonText: {
        color: '#666666',
        fontWeight: '500',
    },
    categoryButtonTextActive: {
        color: '#FFFFFF',
    },
    recipeListContent: {
        padding: 8,
        paddingBottom: 24,
    },
    row: {
        justifyContent: 'space-between',
    },
    recipeItemContainer: {
        flex: 1,
        margin: 8,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        position: 'relative',
    },
    recipeImage: {
        width: '100%',
        height: 140,
        backgroundColor: '#E0E0E0',
    },
    categoryTag: {
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    categoryText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '500',
    },
    recipeDetails: {
        padding: 12,
    },
    recipeTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 4,
        color: '#333333',
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeText: {
        fontSize: 12,
        color: '#666666',
        marginLeft: 4,
    },
    selectButton: {
        backgroundColor: '#48755C',
        paddingVertical: 8,
        alignItems: 'center',
    },
    selectButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: '#666666',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 16,
        color: '#333333',
    },
    emptyText: {
        fontSize: 16,
        color: '#666666',
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 24,
    },
    createButton: {
        backgroundColor: '#48755C',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
    },
    createButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
});