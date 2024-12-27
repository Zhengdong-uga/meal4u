import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Modal, TextInput, Button } from 'react-native';
import { Calendar } from 'react-native-calendars';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function CalendarScreen({ navigation, route }) {
  const [selectedDate, setSelectedDate] = useState(''); // Track the selected date
  const [mealsByDate, setMealsByDate] = useState({}); // Store meals for each date
  const [modalVisible, setModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null); // Selected recipe for viewing details
  const [editedRecipe, setEditedRecipe] = useState(null); // Recipe being edited

  // Handle new recipe or selected recipe being added
  useEffect(() => {
    if ((route.params?.newRecipe || route.params?.selectedRecipe) && selectedDate) {
      const recipe = route.params.newRecipe || route.params.selectedRecipe;

      setMealsByDate((prevMeals) => ({
        ...prevMeals,
        [selectedDate]: [...(prevMeals[selectedDate] || []), recipe], // Store the full recipe object
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
            renderItem={({ item, index }) => (
              <View style={styles.recipeRow}>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedRecipe(item); // Pass the full recipe object
                    setDetailsModalVisible(true);
                  }}
                >
                  <Text style={styles.mealItem}>{item.name}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setEditedRecipe(item); // Pass the recipe to edit
                    setEditModalVisible(true);
                  }}
                >
                  <Ionicons name="create" size={20} color="blue" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setMealsByDate((prev) => {
                      const updatedMeals = [...(prev[selectedDate] || [])];
                      updatedMeals.splice(index, 1);
                      return { ...prev, [selectedDate]: updatedMeals };
                    });
                  }}
                >
                  <Ionicons name="trash" size={20} color="red" />
                </TouchableOpacity>
              </View>
            )}
          />
        ) : (
          <Text style={styles.noMealsText}>No Planning for this Date</Text>
        )}

        {/* Add meal button */}
        <TouchableOpacity style={styles.addButton} onPress={showAddMealModal}>
          <Ionicons name="add-circle" size={50} color="green" />
        </TouchableOpacity>
      </View>

      {/* Recipe Details Modal */}
      <Modal
        visible={detailsModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalView}>
          {selectedRecipe ? (
            <>
              <Text style={styles.modalText}>{selectedRecipe.name}</Text>
              <Text>{selectedRecipe.description}</Text>
              <Text>Ingredients:</Text>
              {selectedRecipe.ingredients.map((ingredient, index) => (
                <Text key={index}>- {ingredient}</Text>
              ))}
              <Text>Steps:</Text>
              {selectedRecipe.instructions.map((step, index) => (
                <Text key={index}>{index + 1}. {step}</Text>
              ))}
            </>
          ) : (
            <Text>No details available.</Text>
          )}
          <Button title="Close" onPress={() => setDetailsModalVisible(false)} />
        </View>
      </Modal>

      {/* Recipe Edit Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalView}>
          <Text style={styles.modalText}>Edit Recipe</Text>

          <Text>Notes:</Text>
          <TextInput
            style={styles.input}
            value={editedRecipe?.notes?.[0] || ''}
            onChangeText={(text) =>
              setEditedRecipe((prev) => ({
                ...prev,
                notes: [text], // Update notes
              }))
            }
          />

          <Text>Ingredients:</Text>
          <FlatList
            data={editedRecipe?.ingredients || []}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index }) => (
              <View style={styles.editRow}>
                <TextInput
                  style={styles.input}
                  value={item}
                  onChangeText={(text) => {
                    const updatedIngredients = [...editedRecipe.ingredients];
                    updatedIngredients[index] = text;
                    setEditedRecipe((prev) => ({
                      ...prev,
                      ingredients: updatedIngredients,
                    }));
                  }}
                />
                <TouchableOpacity
                  onPress={() => {
                    const updatedIngredients = [...editedRecipe.ingredients];
                    updatedIngredients.splice(index, 1);
                    setEditedRecipe((prev) => ({
                      ...prev,
                      ingredients: updatedIngredients,
                    }));
                  }}
                >
                  <Ionicons name="trash" size={20} color="red" />
                </TouchableOpacity>
              </View>
            )}
          />

          {/* Save Changes */}
          <Button
            title="Save Changes"
            onPress={() => {
              setMealsByDate((prev) => {
                const updatedMeals = prev[selectedDate].map((meal) =>
                  meal === editedRecipe ? editedRecipe : meal
                );
                return { ...prev, [selectedDate]: updatedMeals };
              });
              setEditModalVisible(false);
            }}
          />
          <Button title="Cancel" color="red" onPress={() => setEditModalVisible(false)} />
        </View>
      </Modal>

      {/* Modal for Adding Meals */}
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
  recipeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5,
    padding: 10,
    backgroundColor: '#ffe599',
    borderRadius: 5,
  },
  mealItem: {
    fontSize: 16,
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderRadius: 10,
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#f0f0f0',
    marginBottom: 10,
    width: '100%',
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
});
