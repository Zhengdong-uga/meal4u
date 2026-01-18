import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    Modal,
    ActivityIndicator,
    TouchableWithoutFeedback,
    Keyboard,
    Animated,
    SafeAreaView,
    StatusBar,
    ScrollView,
    LayoutAnimation,
    Platform,
    UIManager
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import dayjs from 'dayjs';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../backend/src/firebase';
import { doc, getDoc, updateDoc, getFirestore } from 'firebase/firestore';
import { ask_gemini } from '../../backend/api.js';
import LottieView from 'lottie-react-native';
import HapticsService from '../../utils/haptics';
import { fetchRecipeImage } from '../../utils/imageService';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

// Loading Animation Modal Component
const LoadingModal = ({ visible, mealType }) => {
    const { theme } = useTheme();
    const styles = React.useMemo(() => createStyles(theme), [theme]);

    if (!visible) return null;

    // Determine animation source and loading text based on meal type
    let animationSource = '';
    let loadingText = '';

    switch (mealType) {
        case 'Meals':
            animationSource = 'https://lottie.host/67a0627c-7316-4f3d-ad13-71e862baae13/ZtTgSnBRX4.lottie';
            loadingText = 'Preparing your meal...';
            break;
        case 'Drinks':
            animationSource = 'https://lottie.host/9cda8973-9bb4-40ae-ac35-cbe675f9f932/3lBZEOeQDO.lottie';
            loadingText = 'Shaking your drinks...';
            break;
        case 'Dessert':
            animationSource = 'https://lottie.host/2f7cdf3a-6114-40be-bb2e-0eaae2dbbca9/AnrUhO5BEV.lottie';
            loadingText = 'Crafting your dessert...';
            break;
        default:
            // Default animation if no meal type is selected
            animationSource = 'https://lottie.host/9cda8973-9bb4-40ae-ac35-cbe675f9f932/3lBZEOeQDO.lottie';
            loadingText = 'Cooking up your recipe...';
    }

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
        >
            <View style={styles.loadingModalOverlay}>
                <View style={styles.loadingModalContent}>
                    <LottieView
                        source={{ uri: animationSource }}
                        autoPlay
                        loop
                        style={styles.lottieAnimation}
                    />
                    <Text style={styles.loadingText}>{loadingText}</Text>
                </View>
            </View>
        </Modal>
    );
};

// Custom Toast Component
const Toast = ({ visible, message, type }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(-20)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                })
            ]).start();

            setTimeout(() => {
                Animated.parallel([
                    Animated.timing(fadeAnim, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(translateY, {
                        toValue: -20,
                        duration: 300,
                        useNativeDriver: true,
                    })
                ]).start();
            }, 2000);
        }
    }, [visible, fadeAnim, translateY]);

    if (!visible) return null;

    const backgroundColor = type === 'success' ? '#48755C' : '#E74C3C';

    return (
        <Animated.View
            style={[
                styles.toast,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY }],
                    backgroundColor
                }
            ]}
        >
            <Ionicons
                name={type === 'success' ? 'checkmark-circle' : 'alert-circle'}
                size={22}
                color="white"
            />
            <Text style={styles.toastText}>{message}</Text>
        </Animated.View>
    );
};

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';

import { useTheme } from '../../context/ThemeContext';

export default function AIScreen({ navigation }) {
    const { theme } = useTheme();
    const styles = React.useMemo(() => createStyles(theme), [theme]);
    const isFocused = useIsFocused();
    const [ingredientInput, setIngredientInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [preferencesModalVisible, setPreferencesModalVisible] = useState(false);
    const [lastRecipe, setLastRecipe] = useState(null);

    // Toast state
    const [toast, setToast] = useState({
        visible: false,
        message: '',
        type: 'success'
    });

    // Show toast function
    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
        // Auto hide after 2.5 seconds
        setTimeout(() => {
            setToast(prev => ({ ...prev, visible: false }));
        }, 2600);
    };

    // Obtained from database
    const [userGoal, setUserGoal] = useState('');
    const [userDiet, setUserDiet] = useState('');
    const [userRestrictions, setUserRestrictions] = useState([]);
    const [userDislikes, setUserDislikes] = useState([]);
    const [userLikes, setUserLikes] = useState([]);

    // Obtained from AI page
    const [ingredients, setIngredients] = useState([]);
    const [suggestionsNeeded, setSuggestionsNeeded] = useState(null);
    const [specialRequest, setSpecialRequest] = useState('');
    const [mealType, setMealType] = useState('');

    // Obtained from the popup on the AI page
    const [preferences, setPreferences] = useState({
        prepareTime: '',
        dishType: '',
    });

    const options = {
        prepareTime: ['Under 15 mins', 'Under 30 mins', '1 hour'],
        dishType: ['Asian', 'American', 'Mediterranean', 'Indian'],
    };

    useEffect(() => {
        const loadLastRecipe = async () => {
            try {
                const stored = await AsyncStorage.getItem('last_generated_recipe');
                if (stored) {
                    setLastRecipe(JSON.parse(stored));
                }
            } catch (e) {
                console.error("Failed to load last recipe", e);
            }
        };
        
        if (isFocused) {
            loadLastRecipe();
        }
    }, [isFocused]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const firestore = getFirestore();
                const userDocRef = doc(firestore, 'Users', user.uid);
                try {
                    const userDoc = await getDoc(userDocRef);
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        setUserGoal(data.goal || '');
                        setUserDiet(data.diet || '');
                        setUserRestrictions(data.restrictions || []);
                        setUserDislikes(data.dislikes || []);
                        setUserLikes(data.likes || []);
                    }
                } catch (error) {
                    console.error('Error fetching user info:', error);
                }
            } else {
                // Reset user data if logged out
                setUserGoal('');
                setUserDiet('');
                setUserRestrictions([]);
                setUserDislikes([]);
                setUserLikes([]);
            }
        });

        return () => unsubscribe();
    }, []);

    const handleAddIngredient = () => {
        if (ingredientInput.trim()) {
            HapticsService.light();
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setIngredients([...ingredients, ingredientInput.trim()]);
            setIngredientInput('');
        }
    };

    const handleRemoveIngredient = (ingredient) => {
        HapticsService.medium();
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIngredients(ingredients.filter(item => item !== ingredient));
    };

    const handlePreferenceSelect = (key, value) => {
        HapticsService.selection();
        setPreferences((prev) => ({ ...prev, [key]: value }));
    };

    const savePreferences = () => {
        HapticsService.success();
        setPreferencesModalVisible(false);
        // Show the custom toast instead of alert
        showToast('Preferences applied!', 'success');
    };

    const clearPreferences = () => {
        HapticsService.medium();
        setPreferences({
            prepareTime: '',
            dishType: '',
        });
        showToast('Preferences cleared', 'success');
    };

    const handleGenerateRecipe = async () => {
        // Check if meal type is selected
        if (!mealType) {
            HapticsService.error();
            showToast('Please select a meal type', 'error');
            return;
        }

        HapticsService.heavy();
        setLoading(true);
        
        // Clear last recipe to prevent showing old image
        setLastRecipe(null);
        
        const { prepareTime, dishType } = preferences;

        try {
            // Set minimum delay for animation display
            const minDelay = new Promise(resolve => setTimeout(resolve, 2000));

            const apiPromise = ask_gemini(
                userGoal, userDiet, userRestrictions, userDislikes, userLikes,
                ingredients, suggestionsNeeded, specialRequest, mealType,
                prepareTime, dishType
            );

            // Wait for both the API call and minimum delay
            const [apiResult] = await Promise.all([apiPromise, minDelay]);

            const result = JSON.parse(apiResult);

            // Create recipe without image first
            const generatedRecipe = {
                name: result.name,
                description: result.description,
                time: result.time,
                difficulty: result.difficulty,
                ingredients: result.ingredients,
                instructions: result.stepsOfPreparation,
                nutrition: result.nutrition,
                notes: ['Generated with AI based on your preferences.'],
                category: mealType,
                image: null, // Start with null, will be loaded in the recipe screen
                imageLoading: true, // Flag to show loading state
            };

            // Fetch recipe image in the background
            fetchRecipeImage(result.name, mealType).then(recipeImage => {
                // Update the recipe with the fetched image
                generatedRecipe.image = recipeImage;
                generatedRecipe.imageLoading = false;
                
                // Save to local storage with image
                try {
                    const storageData = {
                        recipe: generatedRecipe,
                        userIngredients: ingredients
                    };
                    AsyncStorage.setItem('last_generated_recipe', JSON.stringify(storageData));
                    setLastRecipe(storageData);
                } catch (e) {
                    console.error("Failed to save recipe locally", e);
                }
            }).catch(err => {
                console.error("Failed to fetch recipe image", err);
                generatedRecipe.imageLoading = false;
            });

            const user = auth.currentUser;
            if (user) {
                const firestore = getFirestore();
                const userDocRef = doc(firestore, 'Users', user.uid);
                try {
                    const userDoc = await getDoc(userDocRef);
                    await updateDoc(userDocRef, {
                        mealsGenerated: userDoc.data().mealsGenerated + 1,
                    })
                } catch (error) {
                    console.error('Error updating user meal count:', error);
                }
            };

            navigation.navigate('GeneratedRecipe', { 
                recipe: generatedRecipe,
                userIngredients: ingredients 
            });
        } catch (error) {
            console.error('Error generating recipe:', error);
            showToast('Failed to generate recipe. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const dayOfWeek = dayjs().format('dddd');
    const date = dayjs().format('MMMM D');

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" />
            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
            />

            <View style={styles.header}>
                <View style={styles.dateContainer}>
                    <Text style={styles.dayText}>{dayOfWeek}</Text>
                    <Text style={styles.dateText}>{date}</Text>
                </View>
                <TouchableOpacity
                    style={styles.preferenceButton}
                    onPress={() => {
                        HapticsService.light();
                        setPreferencesModalVisible(true);
                    }}
                    activeOpacity={0.7}
                >
                    <View style={styles.iconContainer}>
                        <Ionicons name="options" size={20} color="#48755C" />
                    </View>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.contentContainer}>
                        
                        {/* Resume Last Recipe Card */}
                        {lastRecipe && lastRecipe.recipe && (
                            <TouchableOpacity
                                style={styles.resumeCard}
                                onPress={() => {
                                    HapticsService.light();
                                    navigation.navigate('GeneratedRecipe', { 
                                    recipe: lastRecipe.recipe,
                                    userIngredients: lastRecipe.userIngredients || [] 
                                })}}
                                activeOpacity={0.8}
                            >
                                <View style={styles.resumeContent}>
                                    <View style={styles.resumeIconContainer}>
                                        <Ionicons name="receipt-outline" size={20} color="#FFFFFF" />
                                    </View>
                                    <View style={styles.resumeTextContainer}>
                                        <Text style={styles.resumeLabel}>Continue Cooking</Text>
                                        <Text style={styles.resumeRecipeName} numberOfLines={1}>
                                            {lastRecipe.recipe.name}
                                        </Text>
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={24} color="#48755C" />
                            </TouchableOpacity>
                        )}

                        <View style={styles.card}>
                            <Text style={styles.question}>What ingredients do you have?</Text>
                            
                            <View style={styles.searchBarContainer}>
                                <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Add ingredients (e.g., Avocado)..."
                                    placeholderTextColor="#999"
                                    value={ingredientInput}
                                    onChangeText={setIngredientInput}
                                    onSubmitEditing={handleAddIngredient}
                                    returnKeyType="done"
                                />
                                <TouchableOpacity onPress={handleAddIngredient} style={styles.addIconBtn}>
                                   <Ionicons name="add-circle-outline" size={32} color="#48755C" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.ingredientInputContainer}>
                                <View style={styles.quickSuggestionsContainer}>
                                    <Text style={styles.suggestionsLabel}>Quick add:</Text>
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        style={styles.suggestionsScroll}
                                    >
                                        {['Chicken', 'Rice', 'Onion', 'Garlic', 'Tomato', 'Pasta', 'Potato', 'Beef'].map((item) => (
                                            <TouchableOpacity
                                                key={item}
                                                style={styles.suggestionPill}
                                                onPress={() => {
                                                    HapticsService.light();
                                                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                                    setIngredients([...ingredients, item]);
                                                }}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={styles.suggestionText}>{item}</Text>
                                                <Ionicons name="add-outline" size={14} color="#664E2D" style={{marginLeft: 4}} />
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>

                                {ingredients.length > 0 && (
                                    <View style={styles.ingredientsContainer}>
                                        <Text style={styles.sectionLabel}>Your Basket:</Text>
                                        <View style={styles.ingredientsGrid}>
                                            {ingredients.map((item, index) => {
                                                // Generate a deterministic pastel color index based on item length
                                                const colorIndex = item.length % 4;
                                                const bgColors = ['#E8F5E9', '#E3F2FD', '#FFF3E0', '#F3E5F5'];
                                                const borderColors = ['#C8E6C9', '#BBDEFB', '#FFE0B2', '#E1BEE7'];
                                                const textColors = ['#2E7D32', '#1565C0', '#EF6C00', '#7B1FA2'];
                                                
                                                return (
                                                <TouchableOpacity
                                                    key={`${item}-${index}`}
                                                    style={[styles.ingredientChip, { backgroundColor: bgColors[colorIndex], borderColor: borderColors[colorIndex] }]}
                                                    onPress={() => handleRemoveIngredient(item)}
                                                    activeOpacity={0.7}
                                                >
                                                    <Text style={[styles.ingredientText, { color: textColors[colorIndex] }]}>{item}</Text>
                                                    <View style={[styles.removeIconContainer, { backgroundColor: textColors[colorIndex] }]}>
                                                      <Ionicons name="close-outline" size={10} color="#FFFFFF" />
                                                    </View>
                                                </TouchableOpacity>
                                            )})}
                                        </View>
                                    </View>
                                )}
                            </View>
                        </View>

                        <View style={styles.card}>
                            <Text style={styles.question}>Should we add extra ingredients?</Text>
                            <View style={styles.toggleContainer}>
                                <TouchableOpacity
                                    style={[
                                        styles.toggleButton,
                                        suggestionsNeeded === false && styles.activeToggle
                                    ]}
                                    onPress={() => {
                                        HapticsService.light();
                                        setSuggestionsNeeded(false);
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <Text
                                        style={[
                                            styles.toggleText,
                                            suggestionsNeeded === false && styles.activeToggleText
                                        ]}
                                    >
                                        Strictly My Fridge
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.toggleButton,
                                        suggestionsNeeded === true && styles.activeToggle
                                    ]}
                                    onPress={() => {
                                        HapticsService.light();
                                        setSuggestionsNeeded(true);
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <Text
                                        style={[
                                            styles.toggleText,
                                            suggestionsNeeded === true && styles.activeToggleText
                                        ]}
                                    >
                                        Shop for More
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.card}>
                            <Text style={styles.question}>Special Request?</Text>
                            <TextInput
                                style={styles.specialRequestInput}
                                placeholder="E.g., Chinese food, seafood, vegetarian pasta..."
                                placeholderTextColor="#999"
                                value={specialRequest}
                                onChangeText={setSpecialRequest}
                                multiline={true}
                                numberOfLines={2}
                            />
                        </View>

                        <View style={styles.card}>
                            <Text style={styles.question}>What are you craving?</Text>
                            <View style={styles.mealTypeContainer}>
                                {[
                                { type: 'Meals', icon: 'restaurant-outline' },
                                { type: 'Drinks', icon: 'cafe-outline' },
                                { type: 'Dessert', icon: 'ice-cream-outline' }
                                ].map((item) => (
                                    <TouchableOpacity
                                        key={item.type}
                                        style={[
                                            styles.mealTypeCard,
                                            mealType === item.type && styles.selectedMealTypeCard
                                        ]}
                                        onPress={() => {
                                            HapticsService.selection();
                                            setMealType(item.type);
                                        }}
                                        activeOpacity={0.8}
                                    >
                                        <View style={[
                                            styles.mealTypeIconContainer,
                                            mealType === item.type && styles.selectedMealTypeIconContainer
                                        ]}>
                                            <Ionicons 
                                                name={item.icon} 
                                                size={28} 
                                                color={mealType === item.type ? '#FFFFFF' : '#664E2D'} 
                                            />
                                        </View>
                                        <Text
                                            style={[
                                                styles.mealTypeText,
                                                mealType === item.type && styles.selectedMealTypeText,
                                            ]}
                                        >
                                            {item.type}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.preferencesSummary}>
                            {preferences.prepareTime && (
                                <View style={styles.preferenceBadge}>
                                    <Ionicons name="time-outline" size={14} color="#48755C" />
                                    <Text style={styles.preferenceBadgeText}>{preferences.prepareTime}</Text>
                                </View>
                            )}
                            {preferences.dishType && (
                                <View style={styles.preferenceBadge}>
                                    <Ionicons name="restaurant-outline" size={14} color="#48755C" />
                                    <Text style={styles.preferenceBadgeText}>{preferences.dishType}</Text>
                                </View>
                            )}
                        </View>

                        <TouchableOpacity
                            style={styles.generateButton}
                            onPress={handleGenerateRecipe}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <>
                                    <Ionicons name="color-wand-outline" size={20} color="white" style={styles.buttonIcon} />
                                    <Text style={styles.generateButtonText}>Generate Recipe</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </TouchableWithoutFeedback>
            </ScrollView>

            {/* Loading Modal with Dynamic Lottie Animation based on meal type */}
            <LoadingModal visible={loading} mealType={mealType} />

            <Modal
                visible={preferencesModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setPreferencesModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setPreferencesModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                            <View style={styles.modalContent}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Recipe Preference</Text>
                                    <TouchableOpacity
                                        onPress={() => setPreferencesModalVisible(false)}
                                        style={styles.closeButton}
                                    >
                                        <Ionicons name="close" size={24} color="#000" />
                                    </TouchableOpacity>
                                </View>

                                <ScrollView showsVerticalScrollIndicator={false}>
                                    {Object.entries(options).map(([key, values]) => (
                                        <View key={key} style={styles.modalSection}>
                                            <Text style={styles.sectionTitle}>
                                                {key.charAt(0).toUpperCase() + key.slice(1)}
                                            </Text>
                                            <View style={styles.optionsContainer}>
                                                {values.map((option) => (
                                                    <TouchableOpacity
                                                        key={option}
                                                        style={[
                                                            styles.preferenceOption,
                                                            preferences[key] === option && styles.selectedPreferenceOption,
                                                        ]}
                                                        onPress={() => handlePreferenceSelect(key, option)}
                                                        activeOpacity={0.7}
                                                    >
                                                        <Text
                                                            style={[
                                                                styles.preferenceOptionText,
                                                                preferences[key] === option && styles.selectedPreferenceOptionText,
                                                            ]}
                                                        >
                                                            {option}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>
                                    ))}

                                    <View style={styles.modalButtonsContainer}>
                                        <TouchableOpacity
                                            style={styles.clearButton}
                                            onPress={clearPreferences}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={styles.clearButtonText}>Clear All</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.applyButton}
                                            onPress={savePreferences}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={styles.applyButtonText}>Apply</Text>
                                        </TouchableOpacity>
                                    </View>
                                </ScrollView>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </SafeAreaView>
    );
}

const createStyles = (theme) => StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.background,
    },
    scrollContainer: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
        paddingBottom: 100, // Add padding for floating tab bar
    },
    // Loading Animation Styles
    loadingModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingModalContent: {
        backgroundColor: theme.surface,
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        width: '80%',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 5,
    },
    lottieAnimation: {
        width: 200,
        height: 200,
    },
    loadingText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.primary,
        marginTop: 10,
        textAlign: 'center',
    },
    // Toast styles
    toast: {
        position: 'absolute',
        top: 60,
        left: '5%',
        right: '5%',
        backgroundColor: theme.success,
        padding: 14,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 9999,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 5,
    },
    toastText: {
        color: theme.onPrimary,
        marginLeft: 10,
        fontSize: 15,
        fontWeight: '500',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: theme.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    dateContainer: {
        justifyContent: 'center',
    },
    dayText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.text,
    },
    dateText: {
        fontSize: 14,
        color: theme.textSecondary,
        marginTop: 4,
    },
    preferenceButton: {
        padding: 8,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.mode === 'dark' ? '#2C3E33' : '#F5EAE1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        backgroundColor: theme.surface,
        borderRadius: 24, // Softer corners
        padding: 20,
        marginBottom: 20,
        shadowColor: theme.primary,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.08, // Softer shadow
        shadowRadius: 12,
        elevation: 3,
        // borderColor: '#F5EAE1',
        // borderWidth: 1,
    },
    question: {
        fontSize: 18,
        marginBottom: 16,
        color: theme.text, // Darker brown for contrast
        fontWeight: '700',
    },
    
    // Search Bar
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.mode === 'dark' ? '#333' : '#F8F8F8',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: theme.border,
        marginBottom: 16,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
        color: theme.text,
    },
    addIconBtn: {
        padding: 4,
    },
    
    // Quick Suggestions
    quickSuggestionsContainer: {
        marginBottom: 20,
    },
    suggestionsLabel: {
        color: theme.textSecondary,
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    suggestionsScroll: {
        flexDirection: 'row',
    },
    suggestionPill: {
        backgroundColor: theme.surface,
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginRight: 10,
        borderWidth: 1,
        borderColor: theme.border,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    suggestionText: {
        color: theme.text,
        fontSize: 14,
        fontWeight: '500',
    },
    
    // Ingredients Basket
    ingredientsContainer: {
        marginTop: 0,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.primary,
        marginBottom: 10,
    },
    ingredientsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    ingredientChip: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderWidth: 1,
    },
    ingredientText: {
        fontWeight: '600',
        fontSize: 14,
        marginRight: 8,
    },
    removeIconContainer: {
        width: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    
    // Toggle Switch
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: theme.mode === 'dark' ? '#333' : '#F3F4F6',
        borderRadius: 16,
        padding: 4,
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 14,
    },
    activeToggle: {
        backgroundColor: theme.surface,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    toggleText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.textSecondary,
    },
    activeToggleText: {
        color: theme.primary,
    },
    
    // Meal Type Cards
    mealTypeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    mealTypeCard: {
        flex: 1,
        backgroundColor: theme.surface,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.border,
    },
    selectedMealTypeCard: {
        borderColor: theme.primary,
        backgroundColor: theme.mode === 'dark' ? '#1E3326' : '#F0FDF4',
    },
    mealTypeIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: theme.mode === 'dark' ? '#333' : '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    selectedMealTypeIconContainer: {
        backgroundColor: theme.primary,
    },
    mealTypeText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.text,
    },
    selectedMealTypeText: {
        color: theme.primary,
    },
    
    // Generate Button
    generateButton: {
        backgroundColor: theme.primary,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 18,
        borderRadius: 24,
        marginTop: 10,
        marginBottom: 30,
        shadowColor: theme.primary,
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    buttonIcon: {
        marginRight: 8,
    },
    generateButtonText: {
        color: theme.onPrimary,
        fontSize: 18,
        fontWeight: 'bold',
    },
    
    // Resume Card Styles
    resumeCard: {
        backgroundColor: theme.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: theme.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: theme.border,
    },
    resumeContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    resumeIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    resumeTextContainer: {
        flex: 1,
        marginRight: 8,
    },
    resumeLabel: {
        fontSize: 12,
        color: theme.textSecondary,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    resumeRecipeName: {
        fontSize: 16,
        color: theme.text,
        fontWeight: '700',
    },

    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: theme.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.text,
    },
    closeButton: {
        padding: 4,
    },
    modalSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginVertical: 10,
        color: theme.primary,
    },
    optionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
    },
    preferenceOption: {
        borderWidth: 2,
        borderColor: theme.border,
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 16,
        margin: 4,
        backgroundColor: theme.surface,
    },
    selectedPreferenceOption: {
        backgroundColor: theme.mode === 'dark' ? '#1E3326' : '#DCEFDF',
        borderColor: theme.primary,
    },
    preferenceOptionText: {
        color: theme.text,
        fontSize: 15,
    },
    selectedPreferenceOptionText: {
        color: theme.primary,
    },
    modalButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        marginBottom: 10,
    },
    clearButton: {
        backgroundColor: theme.surface,
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        marginRight: 8,
    },
    clearButtonText: {
        color: theme.error,
        fontSize: 16,
        fontWeight: 'bold',
    },
    applyButton: {
        backgroundColor: theme.primary,
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        marginLeft: 8,
    },
    applyButtonText: {
        color: theme.onPrimary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    // New Badge Styles
    preferencesSummary: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 4,
        marginBottom: 4,
    },
    preferenceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.mode === 'dark' ? '#1E3326' : '#F0FDF4',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.primary,
    },
    preferenceBadgeText: {
        fontSize: 12,
        color: theme.primary,
        fontWeight: '600',
        marginLeft: 6,
    },
});