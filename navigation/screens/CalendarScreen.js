import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Modal, Button } from 'react-native';
import { Calendar } from 'react-native-calendars';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function CalendarScreen({ navigation, route }) {
  const [selectedDate, setSelectedDate] = useState(''); // Track the selected date
  const [mealsByDate, setMealsByDate] = useState({}); // Store meals for each date
  const [modalVisible, setModalVisible] = useState(false);

  // Handle new recipe or selected recipe being added
  useEffect(() => {
    if ((route.params?.newRecipe || route.params?.selectedRecipe) && selectedDate) {
        const recipe = route.params.newRecipe || route.params.selectedRecipe;

        setMealsByDate((prevMeals) => ({
            ...prevMeals,
            [selectedDate]: [...(prevMeals[selectedDate] || []), recipe.name || recipe.title], // Ensure proper field is used
        }));

        // Clear the navigation params to prevent re-adding
        navigation.setParams({ newRecipe: null, selectedRecipe: null });
    }
  }, [route.params?.newRecipe, route.params?.selectedRecipe, selectedDate, navigation]);


  const handleAddMeal = (type) => {
    setModalVisible(false);

    if (type === 'saved') {
      navigation.navigate('SavedRecipes');
    } else if (type === 'new') {
      navigation.navigate('AI');
    }
  };

  const showAddMealModal = () => {
    if (!selectedDate) {
      alert('Please select a date first.');
      return;
    }
    setModalVisible(true);
  };

  const handleDayPress = useCallback((day) => {
    setSelectedDate(day.dateString); // Set the selected date
  }, []);

  //  navigation.setOptions({
  //       headerTransparent: true,
  //       headerTitle: '',
  //   });

  return (
    <View style={styles.container}>
      {/* Calendar */}
      <Calendar
        onDayPress={handleDayPress}
        markedDates={{
          [selectedDate]: { selected: true, marked: true, selectedColor: 'green' },
        }}
      />

      {/* Meal Planning Section */}
      <View style={styles.mealSection}>
        <Text style={styles.mealTitle}>
          Meal Planning for {selectedDate || 'Select a Date'}
        </Text>

        {/* Meal List */}
        {mealsByDate[selectedDate] && mealsByDate[selectedDate].length > 0 ? (
          <FlatList
            data={mealsByDate[selectedDate]}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => <Text style={styles.mealItem}>{item}</Text>}
          />
        ) : (
          <Text style={styles.noMealsText}>No Planning for this Date</Text>
        )}

        {/* Add meal button */}
        <TouchableOpacity style={styles.addButton} onPress={showAddMealModal}>
          <Ionicons name="add-circle" size={50} color="green" />
        </TouchableOpacity>
      </View>

      {/* Modal for meal options */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
        }}
      >
        <View style={styles.modalView}>
          <Text style={styles.modalText}>Choose an Option</Text>
          <Button title="Add from Saved Recipes" onPress={() => handleAddMeal('saved')} />
          <Button title="Generate New Recipe" onPress={() => handleAddMeal('new')} />
          <Button title="Cancel" color="red" onPress={() => setModalVisible(false)} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  mealSection: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  mealTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  mealItem: {
    fontSize: 16,
    padding: 10,
    backgroundColor: '#ffe599',
    marginBottom: 5,
    borderRadius: 5,
  },
  noMealsText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginVertical: 20,
  },
  addButton: {
    alignSelf: 'flex-end',
    marginTop: 10,
  },
  modalView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    backgroundColor: 'white',
    padding: 35,
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
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
