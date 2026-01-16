import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    TextInput,
    StatusBar,
    ActivityIndicator,
    Alert,
    RefreshControl,
    Share
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import EmptyState from '../../components/EmptyState';
import SkeletonLoader from '../../components/SkeletonLoader';
import HapticsService from '../../utils/haptics';
import { useTheme } from '../../context/ThemeContext';
// Keep the import for fallback purposes
import { savedRecipes } from '../../data/savedRecipeData.js';
import { auth } from '../../backend/src/firebase';
import { doc, getDoc, updateDoc, getFirestore, collection, getDocs, addDoc, query, where } from 'firebase/firestore';

// RecipeCard Component (Keep this unchanged)
const RecipeCard = ({ recipe, onPress, isSelectionMode = false, onSelect = null, theme }) => {
  // Extract data from recipe
  const { 
    title, 
    name,
    time, 
    difficulty, 
    category 
  } = recipe;
  
  // Use title or name property based on which one exists
  const recipeName = title || name || 'Untitled Recipe';

  // Generate random pastel color based on recipe name
  const generatePastelColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Generate pastel colors
    const h = hash % 360;
    return `hsl(${h}, 70%, ${theme.mode === 'dark' ? '30%' : '90%'})`;
  };

  const backgroundColor = generatePastelColor(recipeName);
  
  // Determine which icon to use based on category or meal type
  const getCategoryIcon = () => {
    const cat = (category || '').toLowerCase();
    
    if (cat.includes('breakfast')) return 'partly-sunny-outline';
    if (cat.includes('lunch')) return 'pizza-outline';
    if (cat.includes('dinner')) return 'moon';
    if (cat.includes('dessert')) return 'ice-cream-outline';
    if (cat.includes('drink')) return 'cafe-outline';
    if (cat.includes('snack')) return 'nutrition-outline';
    
    // Default icon
    return 'nutrition-outline';
  };

  // Ensure category text doesn't exceed character limit
  const formatCategory = (cat) => {
    if (!cat) return '';
    return cat.length > 15 ? cat.substring(0, 12) + '...' : cat;
  };

  const styles = createCardStyles(theme);

  return (
    <TouchableOpacity 
      style={[styles.cardContainer, { borderLeftColor: backgroundColor }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor }]}>
        <Icon name={getCategoryIcon()} size={24} color={theme.primary} />
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={styles.cardTitle} numberOfLines={2}>{recipeName}</Text>
        
        <View style={styles.detailsContainer}>
          {time && (
            <View style={styles.detailItem}>
              <Icon name="time-outline" size={14} color={theme.textSecondary} />
              <Text style={styles.detailText}>{time}</Text>
            </View>
          )}
          
          {difficulty && (
            <View style={styles.detailItem}>
              <Icon name="bar-chart-outline" size={14} color={theme.textSecondary} />
              <Text style={styles.detailText}>{difficulty}</Text>
            </View>
          )}
          
          {category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{formatCategory(category)}</Text>
            </View>
          )}
        </View>
      </View>
      
      {isSelectionMode && (
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => onSelect && onSelect(recipe)}
        >
          <Text style={styles.selectButtonText}>Select</Text>
        </TouchableOpacity>
      )}
      
      <Icon name="chevron-forward-outline" size={20} color={theme.textSecondary} style={styles.arrowIcon} />
    </TouchableOpacity>
  );
};

export default function SavedRecipesScreen({ navigation, route }) {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    // Initialize Firestore
    const db = getFirestore();
    
    const [recipes, setRecipes] = useState([]);
    const [filteredRecipes, setFilteredRecipes] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true); // Start with loading true
    const [refreshing, setRefreshing] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('All');

    // Categories for filtering
    const categories = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snacks'];

    // Check if we're coming from Calendar screen for selection mode
    const isSelectionMode = route.params?.returnScreen === 'Calendar';
    const mealType = route.params?.mealType;
    
    // Check if we came from Profile screen
    const fromProfileScreen = route.params?.fromScreen === 'Profile';

    // Function to fetch user's saved recipes from Firestore
    const fetchSavedRecipes = async (isRefreshing = false) => {
        if (!isRefreshing) setLoading(true);
        try {
            // Get current user
            const currentUser = auth.currentUser;
            
            if (!currentUser) {
                console.log('No user logged in');
                // Use local data as fallback if no user is logged in
                setRecipes(savedRecipes.slice(4));
                setFilteredRecipes(savedRecipes.slice(4));
                setLoading(false);
                return;
            }
            
            // Query recipes collection for documents owned by the current user
            const recipesRef = collection(db, 'recipes');
            const q = query(recipesRef, where('userId', '==', currentUser.uid));
            const querySnapshot = await getDocs(q);
            
            // Process the results
            const userRecipes = [];
            querySnapshot.forEach((doc) => {
                // Add each recipe with its Firestore ID
                userRecipes.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            // Update state with recipes from Firebase
            setRecipes(userRecipes);
            setFilteredRecipes(userRecipes);
        } catch (error) {
            console.error('Error fetching saved recipes:', error);
            
            // Check if it's a permissions error
            if (error.message && error.message.includes('permissions')) {
                console.log('Permissions error detected, using local data as fallback');
                // Silently fallback to local data without alarming the user
                setRecipes(savedRecipes.slice(4));
                setFilteredRecipes(savedRecipes.slice(4));
            } else {
                // For other errors, show an alert
                Alert.alert('Error', 'Failed to load your recipes. Please try again.');
                // Use local data as fallback on error
                setRecipes(savedRecipes.slice(4));
                setFilteredRecipes(savedRecipes.slice(4));
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Function to save new recipe to Firestore
    const saveRecipeToFirestore = async (recipe) => {
        try {
            const currentUser = auth.currentUser;
            
            if (!currentUser) {
                console.log('No user logged in, cannot save recipe');
                return null;
            }
            
            // Ensure recipe has userId
            const recipeWithUser = {
                ...recipe,
                userId: currentUser.uid,
                createdAt: new Date()
            };
            
            // Add to Firestore
            const recipeRef = await addDoc(collection(db, 'recipes'), recipeWithUser);
            
            // Return recipe with Firestore ID
            return {
                id: recipeRef.id,
                ...recipeWithUser
            };
        } catch (error) {
            console.error('Error saving recipe:', error);
            Alert.alert('Error', 'Failed to save your recipe. Please try again.');
            return null;
        }
    };

    useEffect(() => {
        // Set navigation title based on mode
        navigation.setOptions({
            headerTitle: isSelectionMode
                ? `Select a ${mealType || 'meal'}`
                : 'Saved Recipes',
            headerLeft: () => (
                <TouchableOpacity
                    onPress={() => {
                        // If we came from Profile, navigate back to Profile
                        if (fromProfileScreen) {
                            navigation.navigate('Profile');
                        } else {
                            navigation.goBack();
                        }
                    }}
                    style={styles.headerButton}
                >
                    <Icon name="chevron-back-outline" size={24} color="#48755C" />
                </TouchableOpacity>
            ),
            // Removed the headerRight (plus button) as requested
        });
    }, [navigation, isSelectionMode, mealType, fromProfileScreen]);

    // Fetch recipes when component mounts
    useEffect(() => {
        fetchSavedRecipes();
    }, []);

    useEffect(() => {
        if (route.params?.newRecipe) {
            setLoading(true);

            // Try to save to Firestore, but handle permissions errors gracefully
            saveRecipeToFirestore(route.params.newRecipe)
                .then(savedRecipe => {
                    if (savedRecipe) {
                        setRecipes(prevRecipes => [...prevRecipes, savedRecipe]);
                        setFilteredRecipes(prevRecipes => [...prevRecipes, savedRecipe]);
                    } else {
                        // If Firestore save failed, still update local state
                        const localRecipe = {
                            ...route.params.newRecipe,
                            id: `local-${Date.now()}`  // Generate a local ID
                        };
                        setRecipes(prevRecipes => [...prevRecipes, localRecipe]);
                        setFilteredRecipes(prevRecipes => [...prevRecipes, localRecipe]);
                    }
                })
                .catch(error => {
                    console.error('Error saving new recipe:', error);
                    // Even if Firestore save fails, still update local state
                    const localRecipe = {
                        ...route.params.newRecipe,
                        id: `local-${Date.now()}`  // Generate a local ID
                    };
                    setRecipes(prevRecipes => [...prevRecipes, localRecipe]);
                    setFilteredRecipes(prevRecipes => [...prevRecipes, localRecipe]);
                })
                .finally(() => {
                    setLoading(false);
                    // Clear the params
                    navigation.setParams({ newRecipe: null });
                });
        }
    }, [route.params?.newRecipe]);

    useEffect(() => {
        // Filter recipes based on search query and category
        let results = recipes;

        if (searchQuery) {
            results = results.filter(recipe => {
                const searchableTitle = (recipe.title || recipe.name || '').toLowerCase();
                return searchableTitle.includes(searchQuery.toLowerCase());
            });
        }

        if (selectedCategory !== 'All') {
            results = results.filter(recipe => {
                // Safely handle missing category property
                const recipeCategory = (recipe.category || '').toLowerCase();
                return recipeCategory.includes(selectedCategory.toLowerCase());
            });
        }

        setFilteredRecipes(results);
    }, [searchQuery, selectedCategory, recipes]);

    const handleRecipeSelect = async (recipe) => {
        await HapticsService.light();
        if (isSelectionMode) {
            // Return selected recipe to Calendar
            navigation.navigate('Calendar', { selectedRecipe: recipe });
        } else {
            // View recipe details - pass the fromScreen parameter to track navigation source
            navigation.navigate('GeneratedRecipe', { 
                recipe, 
                fromScreen: 'SavedRecipes' 
            });
        }
    };

    const handleShareRecipe = async (recipe) => {
        HapticsService.light();
        try {
            const message = `Check out this recipe for ${recipe.name || recipe.title}!\n\nIngredients:\n${(recipe.ingredients || []).join('\n')}\n\nInstructions:\n${(recipe.instructions || []).join('\n')}`;
            
            const result = await Share.share({
                message,
                title: recipe.name || recipe.title,
            });
        } catch (error) {
            Alert.alert(error.message);
        }
    };

    // Navigate to the Meal Generating screen instead of AI
    const goToMealGenerating = () => {
        HapticsService.light();
        navigation.navigate('Meal Generating');
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        HapticsService.light();
        fetchSavedRecipes(true);
    }, []);

    const renderRecipeItem = ({ item }) => (
        <RecipeCard
            recipe={item}
            onPress={() => handleRecipeSelect(item)}
            isSelectionMode={isSelectionMode}
            onSelect={() => handleRecipeSelect(item)}
            onShare={() => handleShareRecipe(item)}
            theme={theme}
        />
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
                    <Icon name="search-outline" size={20} color="#999" style={styles.searchIcon} />
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
                            <Icon name="close-circle-outline" size={20} color="#999" />
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

                {loading && !refreshing ? (
                    <View style={styles.loadingContainer}>
                        <SkeletonLoader type="list" />
                    </View>
                ) : filteredRecipes.length > 0 ? (
                    <FlatList
                        data={filteredRecipes}
                        renderItem={renderRecipeItem}
                        keyExtractor={(item, index) => `${item.id || item.name || 'recipe'}-${index}`}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.recipeListContent}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                            />
                        }
                    />
                ) : (
                    <EmptyState
                        icon="book-outline"
                        title="No recipes found"
                        message={searchQuery ? 
                            "Try a different search term or category" : 
                            "Save some recipes to see them here"
                        }
                        actionLabel="Create New Recipe"
                        onAction={goToMealGenerating}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const createStyles = (theme) => StyleSheet.create({
    // Original SavedRecipesScreen styles
    safeArea: {
        flex: 1,
        backgroundColor: theme.background,
    },
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    headerButton: {
        padding: 8,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.surface,
        borderRadius: 10,
        margin: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: theme.border,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        height: 40,
        fontSize: 16,
        color: theme.text,
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
        backgroundColor: theme.mode === 'dark' ? '#333' : '#F0F0F0',
    },
    categoryButtonActive: {
        backgroundColor: theme.primary,
    },
    categoryButtonText: {
        color: theme.textSecondary,
        fontWeight: '500',
    },
    categoryButtonTextActive: {
        color: theme.onPrimary,
    },
    recipeListContent: {
        padding: 16,
        paddingBottom: 24,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: theme.textSecondary,
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
        color: theme.text,
    },
    emptyText: {
        fontSize: 16,
        color: theme.textSecondary,
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 24,
    },
    createButton: {
        backgroundColor: theme.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
    },
    createButtonText: {
        color: theme.onPrimary,
        fontWeight: 'bold',
        fontSize: 16,
    },
    
    // RecipeCard component styles
    cardContainer: {
        flexDirection: 'row',
        backgroundColor: theme.surface,
        borderRadius: 12,
        marginVertical: 8,
        marginHorizontal: 4,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
        borderLeftWidth: 6,
        borderLeftColor: theme.primary,
        alignItems: 'center',
    },
    iconContainer: {
        width: 46,
        height: 46,
        borderRadius: 23,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 6,
    },
    detailsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
    },
    detailText: {
        fontSize: 12,
        color: theme.textSecondary,
        marginLeft: 4,
    },
    categoryBadge: {
        backgroundColor: theme.mode === 'dark' ? '#1E3326' : '#F0DED0',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        marginTop: 4,
    },
    categoryBadgeText: {
        fontSize: 10,
        color: theme.primary,
        fontWeight: '500',
        maxWidth: 120,
    },
    arrowIcon: {
        marginLeft: 8,
    },
    selectButton: {
        backgroundColor: theme.primary,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        marginLeft: 8,
    },
    selectButtonText: {
        color: theme.onPrimary,
        fontWeight: 'bold',
        fontSize: 12,
    },
});

const createCardStyles = (theme) => StyleSheet.create({
    cardContainer: {
        flexDirection: 'row',
        backgroundColor: theme.surface,
        borderRadius: 12,
        marginVertical: 8,
        marginHorizontal: 4,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
        borderLeftWidth: 6,
        borderLeftColor: theme.primary,
        alignItems: 'center',
    },
    iconContainer: {
        width: 46,
        height: 46,
        borderRadius: 23,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 6,
    },
    detailsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
    },
    detailText: {
        fontSize: 12,
        color: theme.textSecondary,
        marginLeft: 4,
    },
    categoryBadge: {
        backgroundColor: theme.mode === 'dark' ? '#1E3326' : '#F0DED0',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        marginTop: 4,
    },
    categoryBadgeText: {
        fontSize: 10,
        color: theme.primary,
        fontWeight: '500',
        maxWidth: 120,
    },
    arrowIcon: {
        marginLeft: 8,
    },
    selectButton: {
        backgroundColor: theme.primary,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        marginLeft: 8,
    },
    selectButtonText: {
        color: theme.onPrimary,
        fontWeight: 'bold',
        fontSize: 12,
    },
});