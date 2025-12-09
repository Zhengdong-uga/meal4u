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
import { doc, getDoc, updateDoc, getFirestore, setDoc } from 'firebase/firestore';
import { PanGestureHandler, State, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS, useAnimatedGestureHandler } from 'react-native-reanimated';
import RecipeCard from '../../components/RecipeCard';
import { COLORS } from '../../constants/theme';

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
  const [mealType, setMealType] = useState('breakfast');
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [shoppingList, setShoppingList] = useState([]);

  // Load meals data from storage and Firestore
  useEffect(() => {
    const loadMeals = async () => {
      try {
        const user = auth.currentUser;
        let parsedData = {};
        
        // Try loading from Firestore first if logged in
        if (user) {
            const firestore = getFirestore();
            const userDocRef = doc(firestore, 'Users', user.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists() && userDoc.data().mealPlan) {
                parsedData = userDoc.data().mealPlan;
                console.log('Loaded meal plan from Firestore');
            }
        }

        // If no data from Firestore (or not logged in), try AsyncStorage
        if (Object.keys(parsedData).length === 0) {
            const data = await AsyncStorage.getItem('mealPlanData');
            if (data) {
                parsedData = JSON.parse(data);
                console.log('Loaded meal plan from AsyncStorage');
            }
        }

        if (Object.keys(parsedData).length > 0) {
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

  // Save meals data to storage and Firestore whenever it changes
  useEffect(() => {
    const saveMeals = async () => {
      try {
        // Save to AsyncStorage
        await AsyncStorage.setItem('mealPlanData', JSON.stringify(mealsByDate));
        
        // Save to Firestore if logged in
        const user = auth.currentUser;
        if (user) {
            const firestore = getFirestore();
            const userDocRef = doc(firestore, 'Users', user.uid);
            await updateDoc(userDocRef, {
                mealPlan: mealsByDate
            });
            console.log('Saved meal plan to Firestore');
        }
        
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
      // Updated this line to navigate to 'Meal Generating' instead of 'AI'
      navigation.navigate('Meal Generating', { returnScreen: 'Calendar', mealType });
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

  // Default time mapping for meals that don't have specific times
  const DEFAULT_TIMES = {
    breakfast: 8,
    lunch: 13,
    snacks: 16,
    dinner: 19
  };

  // Helper to format time
  const formatTime = (hour) => {
    const ampm = hour >= 12 ? 'pm' : 'am';
    const hour12 = hour % 12 || 12;
    return `${hour12}:00 ${ampm}`;
  };


  // --- Draggable Event Card Component ---
  const DraggableEventCard = ({ meal, hour, index, totalMealsInSlot, onDrop }) => {
    const translateY = useSharedValue(0);
    const isDragging = useSharedValue(false);
    const ROW_HEIGHT = 80; // Assuming fixed row height for calculation

    const panGesture = useAnimatedGestureHandler({
      onStart: (_, ctx) => {
        isDragging.value = true;
        ctx.startY = translateY.value;
      },
      onActive: (event, ctx) => {
        translateY.value = ctx.startY + event.translationY;
      },
      onEnd: (event, ctx) => {
        isDragging.value = false;
        // Snap to nearest row
        const rowOffset = Math.round(translateY.value / ROW_HEIGHT);
        const newHour = hour + rowOffset;
        
        runOnJS(onDrop)(meal, hour, newHour);
        translateY.value = withSpring(0); // Reset position after drop
      },
    });

    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ translateY: translateY.value }],
        zIndex: isDragging.value ? 100 : 1,
        opacity: isDragging.value ? 0.8 : 1,
        shadowOpacity: isDragging.value ? 0.2 : 0.05,
        elevation: isDragging.value ? 5 : 1,
      };
    });

    return (
      <PanGestureHandler onGestureEvent={panGesture}>
        <Animated.View style={[
            styles.eventCard,
            animatedStyle,
            { 
                borderTopColor: meal.type === 'dinner' || meal.type === 'snacks' ? '#664E2D' : '#48755C',
                backgroundColor: meal.type === 'dinner' || meal.type === 'snacks' ? '#FFFCF9' : '#F8FDF9'
            }
        ]}>
            <TouchableOpacity
                onPress={() => {
                    setSelectedRecipe(meal);
                    setDetailsModalVisible(true);
                }}
                activeOpacity={1} // Prevent opacity change on drag start
            >
                <Text style={styles.eventTitle}>{meal.name}</Text>
                <Text style={styles.eventTime}>
                    {meal.time || `${formatTime(hour)} • ${meal.type.charAt(0).toUpperCase() + meal.type.slice(1)}`}
                </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
                style={styles.deleteIcon}
                onPress={() => {
                    // Delete logic
                    const currentMeals = mealsByDate[selectedDate] || {};
                    const originalIndex = currentMeals[meal.type].findIndex(m => m.name === meal.name);
                    if (originalIndex !== -1) {
                        handleDeleteMeal(meal.type, originalIndex);
                    }
                }}
            >
                <Ionicons name="trash-bin-outline" size={16} color="#664E2D" />
            </TouchableOpacity>
        </Animated.View>
      </PanGestureHandler>
    );
  };

  const handleDropMeal = (meal, oldHour, newHour) => {
    if (newHour < 6 || newHour > 21) return; // Bounds check (6am - 9pm)
    if (oldHour === newHour) return;

    // Determine new time string
    const newTime = formatTime(newHour);
    
    // Update meal object
    const updatedMeal = { ...meal, time: newTime };
    
    // Update state
    setMealsByDate(prev => {
        const dateMeals = { ...prev[selectedDate] };
        
        // 1. Remove from old location (type array)
        // Since we are organizing by 'type' but displaying by 'time', 
        // we just update the time property within the same type array 
        // OR move it to a different type if we wanted to change type based on time.
        // For now, let's just update the 'time' property.
        
        const type = meal.type;
        const typeList = [...dateMeals[type]];
        const mealIndex = typeList.findIndex(m => m.name === meal.name);
        
        if (mealIndex !== -1) {
            typeList[mealIndex] = updatedMeal;
            
            return {
                ...prev,
                [selectedDate]: {
                    ...dateMeals,
                    [type]: typeList
                }
            };
        }
        return prev;
    });
  };

  // Render the timeline view
  const renderTimeline = () => {
    const hours = Array.from({ length: 16 }, (_, i) => i + 6); // 6 AM to 9 PM

    const currentMeals = mealsByDate[selectedDate] || {};
    
    // Group meals by hour
    const mealsByHour = {};
    
    ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(type => {
      if (currentMeals[type]) {
        currentMeals[type].forEach(meal => {
          let hour = DEFAULT_TIMES[type];
          // If meal has a time string like "08:30", try to parse it
          if (meal.time) {
            const match = meal.time.match(/(\d+):/);
            if (match) {
              const parsed = parseInt(match[1]);
              // Adjust for PM if needed (basic heuristic or assume 24h if > 12)
              // This is a simplification. Assuming 24h or standard mapping.
              if (meal.time.includes('pm') && parsed < 12) hour = parsed + 12;
              else if (meal.time.includes('am') && parsed === 12) hour = 0;
              else hour = parsed;
            }
          }
          
          if (!mealsByHour[hour]) mealsByHour[hour] = [];
          mealsByHour[hour].push({ ...meal, type });
        });
      }
    });

    return (
      <ScrollView style={styles.timelineContainer} contentContainerStyle={styles.timelineContent}>
        {hours.map(hour => (
          <View key={hour} style={styles.timeRow}>
            <View style={styles.timeLabelContainer}>
              <Text style={styles.timeLabel}>{formatTime(hour)}</Text>
            </View>
            <View style={[styles.timeSlot, { borderLeftWidth: 1, borderLeftColor: '#EFEFEF', paddingLeft: 10 }]}>
              <View style={styles.timeLine} />
              {mealsByHour[hour] && mealsByHour[hour].map((meal, index) => (
                <DraggableEventCard 
                    key={`${hour}-${index}`}
                    meal={meal}
                    hour={hour}
                    index={index}
                    totalMealsInSlot={mealsByHour[hour].length}
                    onDrop={handleDropMeal}
                />
              ))}
            </View>
          </View>
        ))}
        <View style={{ height: 80 }} /> 
      </ScrollView>
    );
  };

  // State for FAB menu
  const [fabOpen, setFabOpen] = useState(false);

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
        <View style={styles.headerContainer}>
           <Text style={styles.headerTitle}>Check-Ins</Text>
           <View style={styles.monthSelector}>
             <Text style={styles.monthText}>
               {new Date(currentWeek.getTime() + 86400000 * 2).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
             </Text>
             <Ionicons name="chevron-down-outline" size={20} color="#000" />
           </View>
        </View>

        {/* Week view */}
        <View style={styles.weekViewContainer}>
          <View style={styles.weekDaysContainer}>
            {getWeekDates().map((date, index) => {
              const dayName = ['S', 'M', 'T', 'W', 'T', 'F', 'S'][index]; // Single letter
              const dateObj = new Date(date + 'T12:00:00'); 
              const dayNumber = dateObj.getDate();
              const isSelected = date === selectedDate;
              const isToday = date === getLocalDateString();
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
                    isToday && !isSelected && styles.todayWeekDay
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

      <View style={styles.mealPlanContainer}>
        {selectedDate ? (
          renderTimeline()
        ) : (
          <View style={styles.noDateSelected}>
            <Text style={styles.noDateText}>Please select a date to view or add meals</Text>
          </View>
        )}
      </View>

      {/* FAB */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setFabOpen(!fabOpen)}
      >
        <Ionicons name={fabOpen ? "close-outline" : "add-outline"} size={30} color="#FFF" />
      </TouchableOpacity>
      
      {fabOpen && (
        <View style={styles.fabMenu}>
          {['Breakfast', 'Lunch', 'Snacks', 'Dinner'].map((type) => (
             <TouchableOpacity 
               key={type}
               style={styles.fabMenuItem}
               onPress={() => {
                 setFabOpen(false);
                 showAddMealModal(type.toLowerCase());
               }}
             >
               <Text style={styles.fabMenuText}>{type}</Text>
               <View style={styles.fabMenuIcon}>
                 <Ionicons name="restaurant-outline" size={20} color="#FFF" />
               </View>
             </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Recipe Details Modal */}
      <Modal
        visible={detailsModalVisible}
        transparent={false} // Make it full screen opaque to match standard screen feel
        animationType="slide"
        onRequestClose={() => setDetailsModalVisible(false)}
        statusBarTranslucent={false} // Match standard SafeAreaView behavior
      >
        <SafeAreaView style={styles.modalContainer}>
          <ScrollView
            style={styles.modalScrollView}
            showsVerticalScrollIndicator={false}
            bounces={true}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            <RecipeCard 
              recipe={selectedRecipe}
              userIngredients={[]} // We don't have user ingredients context here yet
              onBack={() => setDetailsModalVisible(false)}
              onDiscard={() => {
                // Logic to discard/delete the meal
                if (selectedRecipe && selectedRecipe.type) {
                   const currentMeals = mealsByDate[selectedDate] || {};
                   const typeMeals = currentMeals[selectedRecipe.type];
                   if (typeMeals) {
                      const idx = typeMeals.findIndex(m => m.name === selectedRecipe.name);
                      if (idx !== -1) {
                         Alert.alert(
                            "Remove Meal",
                            "Are you sure you want to remove this meal from your plan?",
                            [
                              { text: "Cancel", style: "cancel" },
                              { 
                                text: "Remove", 
                                style: "destructive",
                                onPress: () => {
                                  handleDeleteMeal(selectedRecipe.type, idx);
                                  setDetailsModalVisible(false);
                                }
                              }
                            ]
                         );
                      }
                   }
                }
              }}
            />
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
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    zIndex: 10,
  },
  headerContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 5,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginRight: 5,
  },
  weekViewContainer: {
    paddingHorizontal: 15,
  },
  weekDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekDay: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderRadius: 12,
    width: 45,
  },
  selectedWeekDay: {
    backgroundColor: '#48755C',
    shadowColor: '#48755C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  todayWeekDay: {
    // borderWidth: 1,
    // borderColor: '#48755C',
  },
  weekDayName: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
    fontWeight: '600',
  },
  weekDayNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  selectedWeekDayText: {
    color: '#FFFFFF',
  },
  weekDayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#48755C',
    marginTop: 6,
  },
  selectedWeekDayDot: {
    backgroundColor: '#FFFFFF',
  },
  mealPlanContainer: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  timelineContainer: {
    flex: 1,
  },
  timelineContent: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  timeRow: {
    flexDirection: 'row',
    minHeight: 80,
  },
  timeLabelContainer: {
    width: 60,
    alignItems: 'flex-start',
  },
  timeLabel: {
    fontSize: 12,
    color: '#999',
    transform: [{ translateY: -8 }], // Align with the line
  },
  timeSlot: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
    paddingBottom: 10,
  },
  timeLine: {
    // position: 'absolute',
    // top: 0,
    // left: 0,
    // right: 0,
    // height: 1,
    // backgroundColor: '#EFEFEF',
  },
  eventCard: {
    // backgroundColor: '#E8F5E9', // Overridden dynamically
    borderRadius: 6,
    padding: 12,
    marginTop: 5,
    marginBottom: 5,
    borderTopWidth: 3,
    // borderLeftWidth: 4, // Removed
    // borderLeftColor: '#48755C', // Removed
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#48755C',
    marginBottom: 2,
  },
  eventTime: {
    fontSize: 12,
    color: '#664E2D',
  },
  deleteIcon: {
    position: 'absolute',
    right: 10,
    top: 10,
  },
  noDateSelected: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#48755C',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    zIndex: 100,
  },
  fabMenu: {
    position: 'absolute',
    bottom: 100,
    right: 30,
    alignItems: 'flex-end',
    zIndex: 99,
  },
  fabMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  fabMenuText: {
    backgroundColor: '#FFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 10,
    elevation: 2,
    color: '#48755C',
    fontWeight: '600',
  },
  fabMenuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#48755C',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FBF0E9', // Using background color from generated screen might be better, but this matches calendar theme
  },
  modalScrollView: {
    flex: 1,
    backgroundColor: '#FBF0E9',
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