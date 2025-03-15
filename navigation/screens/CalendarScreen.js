import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  ScrollView,
  Image,
  Alert,
  SafeAreaView,
  BackHandler
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../../backend/src/firebase';
import { doc, getDoc, updateDoc, getFirestore } from 'firebase/firestore';

export default function EnhancedCalendarScreen({ navigation, route }) {
  // Helper function to get the current date in YYYY-MM-DD format based on local time
  const getLocalDateString = (date = new Date()) => {
    return date.getFullYear() + "-" +
      (date.getMonth() + 1).toString().padStart(2, "0") + "-" +
      date.getDate().toString().padStart(2, "0");
  };

  // All state declarations in one place
  const [selectedDate, setSelectedDate] = useState('');
  const [mealsByDate, setMealsByDate] = useState({});
  const [markedDates, setMarkedDates] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [mealType, setMealType] = useState('breakfast');
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [shoppingList, setShoppingList] = useState([]);

  // Load meals data from storage
  useEffect(() => {
    const loadMeals = async () => {
      try {
        const data = await AsyncStorage.getItem('mealPlanData');
        if (data) {
          const parsedData = JSON.parse(data);
          setMealsByDate(parsedData);
          updateMarkedDates(parsedData);
        }

        // Set today as default selected date - USING LOCAL DATE STRING
        const today = getLocalDateString();
        setSelectedDate(today);
      } catch (error) {
        console.error('Error loading meal data:', error);
        Alert.alert('Error', 'Failed to load your meal plan data');
      } finally {
        setLoading(false);
      }
    };

    loadMeals();
  }, []);

  // Handle hardware back button
  useEffect(() => {
    const backAction = () => {
      if (detailsModalVisible) {
        setDetailsModalVisible(false);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [detailsModalVisible]);

  // Save meals data to storage whenever it changes
  useEffect(() => {
    const saveMeals = async () => {
      try {
        await AsyncStorage.setItem('mealPlanData', JSON.stringify(mealsByDate));
        // Completely rebuild the marked dates to ensure only one date is selected
        updateMarkedDates(mealsByDate);
      } catch (error) {
        console.error('Error saving meal data:', error);
      }
    };

    if (!loading) {
      saveMeals();
    }
  }, [mealsByDate, loading, selectedDate]);

  // Handle new recipe additions from navigation
  useEffect(() => {
    if ((route.params?.newRecipe || route.params?.selectedRecipe) && selectedDate && mealType) {
      const recipe = route.params.newRecipe || route.params.selectedRecipe;

      setMealsByDate((prevMeals) => {
        const dateMeals = prevMeals[selectedDate] || {
          breakfast: [],
          lunch: [],
          dinner: [],
          snacks: []
        };

        return {
          ...prevMeals,
          [selectedDate]: {
            ...dateMeals,
            [mealType]: [...dateMeals[mealType], recipe]
          }
        };
      });

      navigation.setParams({ newRecipe: null, selectedRecipe: null });
    }
  }, [route.params?.newRecipe, route.params?.selectedRecipe, selectedDate, mealType, navigation]);

  // Update marked dates on calendar based on meal data
  const updateMarkedDates = (meals) => {
    const marked = {};

    // Mark dates with meals
    Object.keys(meals).forEach(date => {
      const dateMeals = meals[date];
      const hasMeals =
        (dateMeals.breakfast && dateMeals.breakfast.length > 0) ||
        (dateMeals.lunch && dateMeals.lunch.length > 0) ||
        (dateMeals.dinner && dateMeals.dinner.length > 0) ||
        (dateMeals.snacks && dateMeals.snacks.length > 0);

      // Only add a dot if it's not the selected date
      if (hasMeals && date !== selectedDate) {
        marked[date] = {
          marked: true,
          dotColor: '#48755C'
        };
      }
    });

    // Mark only the currently selected date with selection styling
    if (selectedDate) {
      marked[selectedDate] = {
        selected: true,
        selectedColor: '#48755C',
        selectedTextColor: '#FFFFFF',
        // Add a dot if the selected date has meals
        ...(meals[selectedDate] &&
          ((meals[selectedDate].breakfast && meals[selectedDate].breakfast.length > 0) ||
            (meals[selectedDate].lunch && meals[selectedDate].lunch.length > 0) ||
            (meals[selectedDate].dinner && meals[selectedDate].dinner.length > 0) ||
            (meals[selectedDate].snacks && meals[selectedDate].snacks.length > 0))
          ? { marked: true, dotColor: '#FFFFFF' } : {})
      };
    }

    setMarkedDates(marked);
  };

  // Handle day selection
  const handleDayPress = useCallback((day) => {
    // If day is a date object, ensure we use the local date
    // Otherwise, use the dateString property (compatibility with calendar libraries)
    const dateString = day.dateString || getLocalDateString(day);

    // Set the selected date
    setSelectedDate(dateString);

    // Update marked dates
    updateMarkedDates(mealsByDate);
  }, [mealsByDate]);

  const handleAddMeal = async (type) => {
    setModalVisible(false);

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

    if (type === 'saved') {
      navigation.navigate('SavedRecipes', { returnScreen: 'Calendar', mealType });

    } else if (type === 'new') {
      navigation.navigate('AI', { returnScreen: 'Calendar', mealType });
    }
  };

  const showAddMealModal = (type) => {
    if (!selectedDate) {
      Alert.alert('Select Date', 'Please select a date first.');
      return;
    }
    setMealType(type);
    setModalVisible(true);
  };

  const handleDeleteMeal = (mealTime, index) => {
    Alert.alert(
      "Delete Meal",
      "Are you sure you want to remove this meal?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setMealsByDate(prev => {
              const updatedDateMeals = { ...prev[selectedDate] };
              updatedDateMeals[mealTime].splice(index, 1);
              return { ...prev, [selectedDate]: updatedDateMeals };
            });
          }
        }
      ]
    );
  };

  const generateShoppingList = () => {
    // Show "coming soon" alert
    Alert.alert(
      "Coming Soon",
      "Shopping list feature will be available in the next update!",
      [{ text: "OK", onPress: () => console.log("OK Pressed") }]
    );
  };

  // Function to get dates for current week - UPDATED FOR LOCAL DATE STRING
  const getWeekDates = () => {
    const dates = [];
    const day = new Date(currentWeek);
    day.setDate(day.getDate() - day.getDay()); // Start with Sunday

    for (let i = 0; i < 7; i++) {
      const date = new Date(day);
      dates.push(getLocalDateString(date));
      day.setDate(day.getDate() + 1);
    }
    return dates;
  };

  // Jump to today - UPDATED FOR LOCAL DATE STRING
  const goToToday = () => {
    const today = new Date();
    setCurrentWeek(today);
    setSelectedDate(getLocalDateString(today));
  };

  // Render meal section for a specific meal type
  const renderMealSection = (mealTitle, mealKey) => {
    const meals = selectedDate && mealsByDate[selectedDate] && mealsByDate[selectedDate][mealKey]
      ? mealsByDate[selectedDate][mealKey]
      : [];

    return (
      <View style={styles.mealTypeSection}>
        <View style={styles.mealHeaderRow}>
          <Text style={styles.mealTypeTitle}>{mealTitle}</Text>
          <TouchableOpacity
            style={styles.addMealButton}
            onPress={() => showAddMealModal(mealKey)}
          >
            <Ionicons name="add" size={24} color="#48755C" />
          </TouchableOpacity>
        </View>

        {meals.length > 0 ? (
          <FlatList
            data={meals}
            keyExtractor={(item, index) => `${mealKey}-${index}`}
            renderItem={({ item, index }) => (
              <View style={styles.recipeRow}>
                <TouchableOpacity
                  style={styles.recipeButton}
                  onPress={() => {
                    setSelectedRecipe(item);
                    setDetailsModalVisible(true);
                    setActiveTab('details');
                  }}
                >
                  <Text style={styles.mealItem}>{item.name}</Text>
                  {item.time && <Text style={styles.mealTime}>{item.time}</Text>}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteMeal(mealKey, index)}
                >
                  <Ionicons name="trash-outline" size={20} color="#664E2D" />
                </TouchableOpacity>
              </View>
            )}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptyMealSlot}>
            <Text style={styles.emptyMealText}>Tap + to add a meal</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading your meal plans...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>


      <View style={styles.calendarContainer}>
        {/* Week view */}
        <View style={styles.weekViewContainer}>
          <View style={styles.weekNavigation}>
            <TouchableOpacity
              onPress={() => {
                const prevWeek = new Date(currentWeek);
                prevWeek.setDate(prevWeek.getDate() - 7);
                setCurrentWeek(prevWeek);
              }}
              style={styles.weekNavButton}
            >
              <Ionicons name="chevron-back" size={24} color="#48755C" />
            </TouchableOpacity>

            <Text style={styles.weekViewTitle}>
              {new Date(currentWeek.getTime() + 86400000 * 2).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Text>

            <TouchableOpacity
              onPress={() => {
                const nextWeek = new Date(currentWeek);
                nextWeek.setDate(nextWeek.getDate() + 7);
                setCurrentWeek(nextWeek);
              }}
              style={styles.weekNavButton}
            >
              <Ionicons name="chevron-forward" size={24} color="#48755C" />
            </TouchableOpacity>
          </View>

          <View style={styles.weekDaysContainer}>
            {getWeekDates().map((date, index) => {
              const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index];
              const dateObj = new Date(date + 'T12:00:00'); // Using noon to avoid timezone issues
              const dayNumber = dateObj.getDate();
              const isSelected = date === selectedDate;
              const isToday = date === getLocalDateString(); // UPDATED FOR LOCAL DATE STRING
              const hasMeals = mealsByDate[date] && (
                (mealsByDate[date].breakfast && mealsByDate[date].breakfast.length > 0) ||
                (mealsByDate[date].lunch && mealsByDate[date].lunch.length > 0) ||
                (mealsByDate[date].dinner && mealsByDate[date].dinner.length > 0) ||
                (mealsByDate[date].snacks && mealsByDate[date].snacks.length > 0)
              );

              return (
                <TouchableOpacity
                  key={date}
                  style={[
                    styles.weekDay,
                    isSelected && styles.selectedWeekDay,
                    isToday && styles.todayWeekDay
                  ]}
                  onPress={() => handleDayPress({ dateString: date })}
                >
                  <Text style={[
                    styles.weekDayName,
                    isSelected && styles.selectedWeekDayText
                  ]}>
                    {dayName}
                  </Text>
                  <Text style={[
                    styles.weekDayNumber,
                    isSelected && styles.selectedWeekDayText
                  ]}>
                    {dayNumber}
                  </Text>
                  {hasMeals && <View style={[
                    styles.weekDayDot,
                    isSelected && styles.selectedWeekDayDot
                  ]} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      <ScrollView style={styles.mealPlanContainer}>
        <View style={styles.selectedDateContainer}>
          <Text style={styles.selectedDateText}>
            {selectedDate ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Select a Date'}
          </Text>
          {selectedDate && (
            <View style={styles.selectedDateIndicator} />
          )}
        </View>

        {selectedDate ? (
          <>
            {renderMealSection('Breakfast', 'breakfast')}
            {renderMealSection('Lunch', 'lunch')}
            {renderMealSection('Dinner', 'dinner')}
            {renderMealSection('Snacks', 'snacks')}
          </>
        ) : (
          <View style={styles.noDateSelected}>
            <Text style={styles.noDateText}>Please select a date to view or add meals</Text>
          </View>
        )}
      </ScrollView>

      {/* Recipe Details Modal */}
      <Modal
        visible={detailsModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDetailsModalVisible(false)}
        statusBarTranslucent={true}
      >
        <SafeAreaView style={styles.modalContainer}>


          <ScrollView
            style={styles.modalScrollView}
            showsVerticalScrollIndicator={true}
            bounces={true}
          >
            <View style={styles.recipeCard}>
              {selectedRecipe?.image && (
                <Image
                  source={{ uri: selectedRecipe.image }}
                  style={styles.recipeImage}
                  resizeMode="cover"
                />
              )}

              <Text style={styles.recipeName}>{selectedRecipe?.name || 'Recipe'}</Text>

              <View style={styles.recipeInfo}>
                {selectedRecipe?.time && (
                  <View style={styles.infoItem}>
                    <Ionicons name="time-outline" size={18} color="#664E2D" />
                    <Text style={styles.infoText}>{selectedRecipe.time}</Text>
                  </View>
                )}
                {selectedRecipe?.servings && (
                  <View style={styles.infoItem}>
                    <Ionicons name="people-outline" size={18} color="#664E2D" />
                    <Text style={styles.infoText}>{selectedRecipe.servings} servings</Text>
                  </View>
                )}
                {selectedRecipe?.difficulty && (
                  <View style={styles.infoItem}>
                    <Ionicons name="speedometer-outline" size={18} color="#664E2D" />
                    <Text style={styles.infoText}>{selectedRecipe.difficulty}</Text>
                  </View>
                )}
              </View>

              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[styles.tabButton, activeTab === 'details' && styles.activeTab]}
                  onPress={() => setActiveTab('details')}
                >
                  <Text style={[styles.tabText, activeTab === 'details' && styles.activeTabText]}>Ingredients</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tabButton, activeTab === 'instructions' && styles.activeTab]}
                  onPress={() => setActiveTab('instructions')}
                >
                  <Text style={[styles.tabText, activeTab === 'instructions' && styles.activeTabText]}>Instructions</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tabButton, activeTab === 'nutrition' && styles.activeTab]}
                  onPress={() => setActiveTab('nutrition')}
                >
                  <Text style={[styles.tabText, activeTab === 'nutrition' && styles.activeTabText]}>Nutrition</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.tabContent}>
                {activeTab === 'details' && (
                  <View style={styles.ingredientsContainer}>
                    {selectedRecipe?.ingredients?.map((ingredient, index) => (
                      <View key={index} style={styles.ingredientRow}>
                        <Ionicons name="checkmark-circle-outline" size={20} color="#48755C" />
                        <Text style={styles.ingredientItem}>{ingredient}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {activeTab === 'instructions' && (
                  <View style={styles.instructionsContainer}>
                    {selectedRecipe?.instructions?.map((instruction, index) => (
                      <View key={index} style={styles.instructionRow}>
                        <View style={styles.instructionNumber}>
                          <Text style={styles.stepNumber}>{index + 1}</Text>
                        </View>
                        <Text style={styles.instructionText}>{instruction}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {activeTab === 'nutrition' && (
                  <View style={styles.nutritionContainer}>
                    {selectedRecipe?.nutrition ? (
                      <>
                        {Object.entries(selectedRecipe.nutrition).map(([key, value], index) => (
                          <View key={index} style={styles.nutritionRow}>
                            <Text style={styles.nutritionLabel}>{key}</Text>
                            <Text style={styles.nutritionValue}>{value}</Text>
                          </View>
                        ))}
                      </>
                    ) : (
                      <Text style={styles.noNutritionText}>Nutrition information not available</Text>
                    )}
                  </View>
                )}
              </View>

              {/* Close button at the bottom */}
              <TouchableOpacity
                style={styles.closeButtonBottom}
                onPress={() => setDetailsModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Close Recipe</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Modal for Adding Meals */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Add Recipe to {mealType.charAt(0).toUpperCase() + mealType.slice(1)}</Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => handleAddMeal('saved')}
            >
              <Ionicons name="bookmark" size={24} color="#FFFFFF" />
              <Text style={styles.modalButtonText}>From Saved Recipes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => handleAddMeal('new')}
            >
              <Ionicons name="nutrition" size={24} color="#FFFFFF" />
              <Text style={styles.modalButtonText}>Generate New Recipe</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'light grey'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FBF0E9'
  },

  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    margin: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  weekViewContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
  },
  weekNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  weekNavButton: {
    padding: 5,
  },
  weekViewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#664E2D',
  },
  weekDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  weekDay: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    margin: 2,
  },
  selectedWeekDay: {
    backgroundColor: '#48755C',
  },
  todayWeekDay: {
    borderWidth: 1,
    borderColor: '#48755C',
  },
  weekDayName: {
    fontSize: 12,
    color: '#664E2D',
    marginBottom: 5,
    fontWeight: '500',
  },
  weekDayNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d4150',
  },
  selectedWeekDayText: {
    color: '#FFFFFF',
  },
  weekDayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#48755C',
    marginTop: 4,
  },
  selectedWeekDayDot: {
    backgroundColor: '#FFFFFF',
  },
  mealPlanContainer: {
    flex: 1,
    padding: 10,
  },
  selectedDateContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  selectedDateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#664E2D',
    textAlign: 'center',
  },
  selectedDateIndicator: {
    height: 3,
    width: 50,
    backgroundColor: '#48755C',
    borderRadius: 2,
    marginTop: 5,
  },
  mealTypeSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  mealHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#664E2D',
  },
  addMealButton: {
    padding: 5,
  },
  recipeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F8F8',
    padding: 12,
    marginVertical: 5,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#B8CCBA',
  },
  recipeButton: {
    flex: 1,
  },
  mealItem: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2E2E2E',
  },
  mealTime: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  emptyMealSlot: {
    padding: 15,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    alignItems: 'center',
  },
  emptyMealText: {
    color: '#999999',
    fontSize: 14,
  },
  noDateSelected: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDateText: {
    fontSize: 16,
    color: '#664E2D',
    textAlign: 'center',
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FBF0E9',
  },
  modalScrollView: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    zIndex: 10,
  },
  backButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#664E2D',
  },
  recipeCard: {
    margin: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recipeImage: {
    height: 200,
    width: '100%',
    borderRadius: 10,
    marginBottom: 15,
  },
  recipeName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#664E2D',
    marginBottom: 10,
  },
  recipeInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 5,
  },
  infoText: {
    fontSize: 14,
    color: '#664E2D',
    marginLeft: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    marginBottom: 15,
  },
  tabButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#B8CCBA',
  },
  tabText: {
    fontWeight: '500',
    color: '#664E2D',
  },
  activeTabText: {
    fontWeight: 'bold',
    color: '#48755C',
  },
  tabContent: {
    minHeight: 100,
    maxHeight: 1000,
  },
  ingredientsContainer: {
    paddingBottom: 20,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  ingredientItem: {
    fontSize: 16,
    color: '#2E2E2E',
    marginLeft: 10,
    flex: 1,
  },
  instructionsContainer: {
    paddingBottom: 20,
  },
  instructionRow: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  instructionNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#48755C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  stepNumber: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  instructionText: {
    fontSize: 16,
    color: '#2E2E2E',
    flex: 1,
    lineHeight: 22,
  },
  nutritionContainer: {
    paddingBottom: 20,
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
  closeButtonBottom: {
    backgroundColor: '#48755C',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },

  // Add Meal Modal
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#664E2D',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#48755C',
    width: '100%',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    justifyContent: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  cancelButtonText: {
    color: '#664E2D',
    fontWeight: 'bold',
    fontSize: 16,
  }
});