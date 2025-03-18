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
    ScrollView
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import dayjs from 'dayjs';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../backend/src/firebase';
import { doc, getDoc, updateDoc, getFirestore } from 'firebase/firestore';
import { ask_gemini } from '../../backend/api.js';
import LottieView from 'lottie-react-native';

// Loading Animation Modal Component
const LoadingModal = ({ visible, mealType }) => {
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

export default function AIScreen({ navigation }) {
    const [ingredientInput, setIngredientInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [preferencesModalVisible, setPreferencesModalVisible] = useState(false);

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
            setIngredients([...ingredients, ingredientInput.trim()]);
            setIngredientInput('');
        }
    };

    const handleRemoveIngredient = (ingredient) => {
        setIngredients(ingredients.filter(item => item !== ingredient));
    };

    const handlePreferenceSelect = (key, value) => {
        setPreferences((prev) => ({ ...prev, [key]: value }));
    };

    const savePreferences = () => {
        setPreferencesModalVisible(false);
        // Show the custom toast instead of alert
        showToast('Preferences applied!', 'success');
    };

    const clearPreferences = () => {
        setPreferences({
            prepareTime: '',
            dishType: '',
        });
        showToast('Preferences cleared', 'success');
    };

    const handleGenerateRecipe = async () => {
        // Check if meal type is selected
        if (!mealType) {
            showToast('Please select a meal type', 'error');
            return;
        }

        setLoading(true);
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

            const generatedRecipe = {
                name: result.name,
                description: result.description,
                time: result.time,
                difficulty: result.difficulty,
                ingredients: result.ingredients,
                instructions: result.stepsOfPreparation,
                nutrition: result.nutrition,
                notes: ['Generated with AI based on your preferences.'],
            };

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

            navigation.navigate('GeneratedRecipe', { recipe: generatedRecipe });
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
                    onPress={() => setPreferencesModalVisible(true)}
                    activeOpacity={0.7}
                >
                    <View style={styles.iconContainer}>
                        <Ionicons name="options-outline" size={20} color="#48755C" />
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
                        <View style={styles.card}>
                            <Text style={styles.question}>What ingredients do you have?</Text>
                            <View style={styles.ingredientInputContainer}>
                                <TextInput
                                    style={styles.ingredientInput}
                                    placeholder="Add ingredients..."
                                    placeholderTextColor="#999"
                                    value={ingredientInput}
                                    onChangeText={setIngredientInput}
                                    onSubmitEditing={handleAddIngredient}
                                    returnKeyType="done"
                                />

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
                                                    setIngredients([...ingredients, item]);
                                                }}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={styles.suggestionText}>{item}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>

                                {ingredients.length > 0 && (
                                    <View style={styles.ingredientsContainer}>
                                        <FlatList
                                            data={ingredients}
                                            renderItem={({ item }) => (
                                                <TouchableOpacity
                                                    style={styles.ingredient}
                                                    onPress={() => handleRemoveIngredient(item)}
                                                    activeOpacity={0.7}
                                                >
                                                    <Text style={styles.ingredientText}>{item}</Text>
                                                    <Ionicons name="close-circle" size={16} color="#48755C" />
                                                </TouchableOpacity>
                                            )}
                                            keyExtractor={(item, index) => index.toString()}
                                            horizontal={false}
                                            numColumns={2}
                                            columnWrapperStyle={styles.ingredientsRow}
                                        />
                                    </View>
                                )}
                            </View>
                        </View>

                        <View style={styles.card}>
                            <Text style={styles.question}>Would you like to add more ingredients to the meal?</Text>
                            <View style={styles.optionContainer}>
                                <TouchableOpacity
                                    style={[
                                        styles.optionButton,
                                        suggestionsNeeded === true ? styles.selectedOption : null
                                    ]}
                                    onPress={() => setSuggestionsNeeded(true)}
                                    activeOpacity={0.7}
                                >
                                    <Text
                                        style={[
                                            styles.optionText,
                                            suggestionsNeeded === true && styles.selectedOptionText,
                                        ]}
                                    >
                                        Yes
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.optionButton,
                                        suggestionsNeeded === false ? styles.selectedOption : null
                                    ]}
                                    onPress={() => setSuggestionsNeeded(false)}
                                    activeOpacity={0.7}
                                >
                                    <Text
                                        style={[
                                            styles.optionText,
                                            suggestionsNeeded === false && styles.selectedOptionText,
                                        ]}
                                    >
                                        No
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
                            <Text style={styles.question}>What type of meal?</Text>
                            <View style={styles.mealTypeContainer}>
                                {['Meals', 'Drinks', 'Dessert'].map((type) => (
                                    <TouchableOpacity
                                        key={type}
                                        style={[
                                            styles.mealTypeButton,
                                            mealType === type ? styles.selectedOption : null
                                        ]}
                                        onPress={() => setMealType(type)}
                                        activeOpacity={0.7}
                                    >
                                        <Text
                                            style={[
                                                styles.mealTypeText,
                                                mealType === type && styles.selectedOptionText,
                                            ]}
                                        >
                                            {type}
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
                                    <Ionicons name="bulb-outline" size={20} color="white" style={styles.buttonIcon} />
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

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: 'white',
    },
    scrollContainer: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
        paddingBottom: 30,
    },
    // Loading Animation Styles
    loadingModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingModalContent: {
        backgroundColor: 'white',
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
        color: '#664E2D',
        marginTop: 10,
        textAlign: 'center',
    },
    // Toast styles
    toast: {
        position: 'absolute',
        top: 60,
        left: '5%',
        right: '5%',
        backgroundColor: '#48755C',
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
        color: 'white',
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
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#F5EAE1',
    },
    dateContainer: {
        justifyContent: 'center',
    },
    dayText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#49351C',
    },
    dateText: {
        fontSize: 14,
        color: 'grey',
        marginTop: 4,
    },
    preferenceButton: {
        padding: 8,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F5EAE1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
        borderColor: '#F5EAE1',
        borderWidth: 1,
    },
    question: {
        fontSize: 16,
        marginBottom: 16,
        color: '#664E2D',
        fontWeight: '600',
    },
    ingredientInputContainer: {
        width: '100%',
    },
    ingredientInput: {
        backgroundColor: '#F8F4F0',
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
        color: '#49351C',
        borderColor: '#48755C',
        borderWidth: 1,
        marginBottom: 12,
    },
    quickSuggestionsContainer: {
        marginBottom: 16,
    },
    suggestionsLabel: {
        color: '#664E2D',
        fontSize: 14,
        marginBottom: 8,
    },
    suggestionsScroll: {
        flexDirection: 'row',
    },
    suggestionPill: {
        backgroundColor: '#F5EAE1',
        borderRadius: 16,
        paddingVertical: 6,
        paddingHorizontal: 12,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#F5EAE1',
    },
    suggestionText: {
        color: '#49351C',
        fontSize: 14,
    },
    ingredientsContainer: {
        marginTop: 8,
    },
    ingredientsRow: {
        justifyContent: 'flex-start',
    },
    ingredient: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#DCEFDF',
        borderRadius: 18,
        paddingVertical: 8,
        paddingHorizontal: 12,
        margin: 4,
        maxWidth: '48%',
    },
    ingredientText: {
        color: '#49351C',
        marginRight: 6,
        fontSize: 14,
    },
    optionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    optionButton: {
        flex: 1,
        padding: 14,
        backgroundColor: 'white',
        marginHorizontal: 4,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: '#F5EAE1',
        borderWidth: 1,
    },
    selectedOption: {
        backgroundColor: '#48755C',
    },
    optionText: {
        color: 'black',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    selectedOptionText: {
        color: 'white',
    },
    specialRequestInput: {
        backgroundColor: '#F8F4F0',
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
        color: '#49351C',
        minHeight: 80,
        textAlignVertical: 'top',
        borderColor: '#48755C',
        borderWidth: 1,
    },
    mealTypeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    mealTypeButton: {
        flex: 1,
        padding: 14,
        backgroundColor: 'white',
        marginHorizontal: 4,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: '#F5EAE1',
        borderWidth: 1,
    },
    mealTypeText: {
        color: 'black',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    preferencesSummary: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
        paddingHorizontal: 4,
    },
    preferenceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5EAE1',
        borderRadius: 16,
        paddingVertical: 6,
        paddingHorizontal: 10,
        marginRight: 8,
        marginBottom: 8,
    },
    preferenceBadgeText: {
        fontSize: 13,
        color: '#664E2D',
        marginLeft: 4,
    },
    generateButton: {
        backgroundColor: '#48755C',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        borderRadius: 10,
        marginTop: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 4,
            height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 2,
    },
    buttonIcon: {
        marginRight: 8,
    },
    generateButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
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
        borderBottomColor: '#F5EAE1',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#49351C',
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
        color: '#664E2D',
    },
    optionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
    },
    preferenceOption: {
        borderWidth: 2,
        borderColor: '#F5EAE1',
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 16,
        margin: 4,
        backgroundColor: 'white',
    },
    selectedPreferenceOption: {
        backgroundColor: '#DCEFDF',
        borderColor: '#48755C',
    },
    preferenceOptionText: {
        color: 'black',
        fontSize: 15,
    },
    selectedPreferenceOptionText: {
        color: '#49351C',
    },
    modalButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        marginBottom: 10,
    },
    clearButton: {
        backgroundColor: 'white',
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        marginRight: 8,
    },
    clearButtonText: {
        color: 'red',
        fontSize: 16,
        fontWeight: 'bold',
    },
    applyButton: {
        backgroundColor: '#48755C',
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        marginLeft: 8,
    },
    applyButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});