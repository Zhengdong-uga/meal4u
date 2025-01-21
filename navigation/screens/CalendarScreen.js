import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Modal, ScrollView, Button } from 'react-native';
import { Calendar } from 'react-native-calendars';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function CalendarScreen({ navigation, route }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [mealsByDate, setMealsByDate] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if ((route.params?.newRecipe || route.params?.selectedRecipe) && selectedDate) {
      const recipe = route.params.newRecipe || route.params.selectedRecipe;

      setMealsByDate((prevMeals) => ({
        ...prevMeals,
        [selectedDate]: [...(prevMeals[selectedDate] || []), recipe],
      }));

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
    setSelectedDate(day.dateString);
  }, []);

  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={handleDayPress}
        markedDates={{
          [selectedDate]: { selected: true, marked: true, selectedColor: '#48755C' },
        }}
      />

      <View style={styles.mealSection}>
        <Text style={styles.mealTitle}>
          Meal Planning for {selectedDate || 'Select a Date'}
        </Text>

        {mealsByDate[selectedDate] && mealsByDate[selectedDate].length > 0 ? (
          <FlatList
            data={mealsByDate[selectedDate]}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index }) => (
              <View style={styles.recipeRow}>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedRecipe(item);
                    setDetailsModalVisible(true);
                    setActiveTab('details');
                  }}
                >
                  <Text style={styles.mealItem}>{item.name}</Text>
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
                  <Ionicons name="trash" size={20} color="black" />
                </TouchableOpacity>
              </View>
            )}
          />
        ) : (
          <Text style={styles.noMealsText}>No Planning for this Date</Text>
        )}

        <TouchableOpacity style={styles.addButton} onPress={showAddMealModal}>
          <Ionicons name="add-circle" size={50} color="#48755C" />
        </TouchableOpacity>
      </View>

      {/* Recipe Details Modal */}
      <Modal
        visible={detailsModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setDetailsModalVisible(false);
              navigation.goBack(); // Navigate back to CalendarScreen
            }}
          >
            <Ionicons name="arrow-back-outline" size={30} color="black" />
          </TouchableOpacity>

          <View style={styles.recipeCard}>
            <Text style={styles.recipeName}>
              {selectedRecipe?.name || 'Recipe Details'}
            </Text>
            <View style={styles.recipeInfo}>
              <Text>{selectedRecipe?.time || 'Time not specified'}</Text>
              <Text>{selectedRecipe?.difficulty || 'Difficulty: Medium'}</Text>
            </View>

            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'details' && styles.activeTab]}
                onPress={() => setActiveTab('details')}
              >
                <Text style={styles.tabText}>Details</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'instructions' && styles.activeTab]}
                onPress={() => setActiveTab('instructions')}
              >
                <Text style={styles.tabText}>Instructions</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.detailsOrInstructions}>
              {activeTab === 'details' ? (
                <>
                  <Text style={styles.sectionTitle}>Ingredients:</Text>
                  {selectedRecipe?.ingredients?.map((ingredient, index) => (
                    <Text key={index} style={styles.ingredientItem}>
                      • {ingredient}
                    </Text>
                  ))}
                </>
              ) : (
                <>
                  <Text style={styles.sectionTitle}>Instructions:</Text>
                  {selectedRecipe?.instructions?.map((instruction, index) => (
                    <Text key={index} style={styles.instructionItem}>
                      {index + 1}. {instruction}
                    </Text>
                  ))}
                </>
              )}
            </ScrollView>
          </View>
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
          <Button title="Add from Saved Recipes" color="#48755C" onPress={() => handleAddMeal('saved')} />
          <Button title="Generate New Recipe" color="#48755C" onPress={() => handleAddMeal('new')} />
          <Button title="Cancel" color="grey" onPress={() => setModalVisible(false)} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#FBF0E9' },
  mealSection: { marginTop: 20, padding: 20, backgroundColor: '#B8CCBA', borderRadius: 20 },
  mealTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  recipeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', padding: 15, marginVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#E0E0E0' },
  mealItem: { flex: 1, fontSize: 18, fontWeight: '600', color: '#2E2E2E', marginRight: 10 },
  noMealsText: { fontSize: 20, color: '#639271', textAlign: 'center', marginVertical: 20 },
  addButton: { alignSelf: 'flex-end', marginTop: 10 },
  modalView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0DED0', padding: 35, borderRadius: 10 },
  modalText: { marginBottom: 15, textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: '#664E2D' },
  modalContainer: { flex: 1, backgroundColor: '#FEF8F5', padding: 20 },
  backButton: { position: 'absolute', top: 60, left: 20, zIndex: 1 },
  recipeCard: { padding: 30, borderRadius: 15, backgroundColor: '#FFFFFF', marginTop: 100, borderWidth: 1,borderColor:'#664E2D', },
  recipeName: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'left' , color: '#664E2D'},
  recipeInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, color: '#231F20' },
  tabContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, backgroundColor: '#E0E0E0', borderRadius: 10 },
  tabButton: { flex: 1, padding: 15, alignItems: 'center', borderRadius: 10, },
  activeTab: { backgroundColor: '#B8CCBA' },
  tabText: { fontWeight: 'bold', color:'#664E2D', },
  detailsOrInstructions: { maxHeight: 300, marginBottom: 20 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, color: '#231F20' },
  ingredientItem: { fontSize: 18, marginBottom: 5 },
  instructionItem: { fontSize: 18, marginBottom: 10 },
});