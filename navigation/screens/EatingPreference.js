import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc, getFirestore } from 'firebase/firestore';
import { auth } from '../../backend/src/firebase';

export default function EatingPreference({ navigation }) {
  const [preferences, setPreferences] = useState({
    eatingGoals: [],
    dietTypes: [],
    restrictions: [],
    dislikes: [],
    likes: [],
  });

  const [isEatingGoalsModalVisible, setEatingGoalsModalVisible] = useState(false);
  const [isDietTypesModalVisible, setDietTypesModalVisible] = useState(false);

  useEffect(() => {
    loadUserPreferences();
  }, []);

  const loadUserPreferences = async () => {
    const user = auth.currentUser;
    if (user) {
      const firestore = getFirestore();
      const userDocRef = doc(firestore, 'Users', user.uid);
      try {
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setPreferences({
            eatingGoals: Array.isArray(userData.goal) ? userData.goal : [],
            dietTypes: Array.isArray(userData.diet) ? userData.diet : [],
            restrictions: userData.restrictions || [],
            dislikes: userData.dislikes || [],
            likes: userData.likes || [],
          });
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    }
  };

  const handleUpdate = async () => {
    const user = auth.currentUser;
    if (user) {
      const firestore = getFirestore();
      const userDocRef = doc(firestore, 'Users', user.uid);
      try {
        // Validate that `eatingGoals` and `dietTypes` are arrays of strings
        const sanitizedGoals = preferences.eatingGoals.filter((goal) => typeof goal === 'string');
        const sanitizedDietTypes = preferences.dietTypes.filter((type) => typeof type === 'string');

        await updateDoc(userDocRef, {
          goal: sanitizedGoals,
          diet: sanitizedDietTypes,
          restrictions: preferences.restrictions,
          dislikes: preferences.dislikes,
          likes: preferences.likes,
        });
        navigation.navigate('Profile');
      } catch (error) {
        console.error('Error updating preferences:', error);
      }
    }
  };


  const PreferenceItemWithInput = ({ title, values, setValues }) => {
    const [input, setInput] = useState('');

    const handleAddValue = () => {
      if (input.trim() && !values.includes(input.trim())) {
        setValues([...values, input.trim()]);
        setInput('');
      }
    };

    const handleRemoveValue = (value) => {
      setValues(values.filter((item) => item !== value));
    };

    return (
      <View style={styles.preferenceInputContainer}>
        <Text style={styles.preferenceTitle}>{title}</Text>
        <View style={styles.ingredientInputContainer}>
          <TextInput
            style={styles.ingredientInput}
            placeholder={`Add ${title}`}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleAddValue}
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddValue}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={values}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.tag}
              onPress={() => handleRemoveValue(item)}
            >
              <Text style={styles.tagText}>{item} ×</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item, index) => index.toString()}
          horizontal
        />
      </View>
    );
  };

  const MultiSelectPicker = ({ visible, onClose, selectedItems, onSelect, options, title }) => {
    const [tempItems, setTempItems] = useState([]);

    useEffect(() => {
      if (visible) {
        setTempItems([...selectedItems]); // Reset tempItems to selectedItems when the modal is shown
      }
    }, [visible]);

    const toggleItem = (item) => {
      if (tempItems.includes(item)) {
        setTempItems(tempItems.filter((i) => i !== item));
      } else {
        setTempItems([...tempItems, item]);
      }
    };

    const handleDone = () => {
      onSelect(tempItems); // Update the selected items
      onClose(); // Close the modal
    };

    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{title}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={
                    tempItems.includes(item)
                      ? [styles.optionItem, { backgroundColor: '#d1f0d1' }]
                      : styles.optionItem
                  }
                  onPress={() => toggleItem(item)} // Toggle selection
                >
                  <Text style={styles.optionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={onClose} style={styles.modalButton}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDone} style={styles.modalButton}>
                <Text style={styles.modalButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const PreferenceItem = ({ title, value, onPress }) => (
    <TouchableOpacity style={styles.preferenceItem} onPress={onPress}>
      <View style={styles.preferenceContent}>
        <Text style={styles.preferenceTitle}>{title}</Text>
        <Text style={styles.preferenceValue}>{Array.isArray(value) && value.length > 0 ? value.join(', ') : 'Select'}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#000" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerCompact}>
        <TouchableOpacity
          style={styles.backButtonCompact}
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Profile' }] })}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.sectionWrapper}>
          <PreferenceItem
            title="Eating Goals"
            value={preferences.eatingGoals}
            onPress={() => setEatingGoalsModalVisible(true)}
          />
        </View>

        <View style={styles.sectionWrapper}>
          <PreferenceItem
            title="Diet Types"
            value={preferences.dietTypes}
            onPress={() => setDietTypesModalVisible(true)}
          />
        </View>

        <View style={styles.sectionWrapper}>
          <PreferenceItemWithInput
            title="Restrictions"
            values={preferences.restrictions}
            setValues={(newValues) =>
              setPreferences({ ...preferences, restrictions: newValues })
            }
          />
        </View>

        <View style={styles.sectionWrapper}>
          <PreferenceItemWithInput
            title="Dislikes"
            values={preferences.dislikes}
            setValues={(newValues) =>
              setPreferences({ ...preferences, dislikes: newValues })
            }
          />
        </View>

        <View style={styles.sectionWrapper}>
          <PreferenceItemWithInput
            title="Likes"
            values={preferences.likes}
            setValues={(newValues) =>
              setPreferences({ ...preferences, likes: newValues })
            }
          />
        </View>

        <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
          <Text style={styles.updateButtonText}>Update</Text>
        </TouchableOpacity>
      </ScrollView>

      <MultiSelectPicker
        visible={isEatingGoalsModalVisible}
        selectedItems={preferences.eatingGoals}
        onClose={() => setEatingGoalsModalVisible(false)}
        onSelect={(goals) => setPreferences({ ...preferences, eatingGoals: goals })}
        options={['Lose Fat', 'Gain Muscle', 'Maintain Weight', 'Nutrition Balance', 'Simple Meals']}
        title="Select Eating Goals"
      />

      <MultiSelectPicker
        visible={isDietTypesModalVisible}
        selectedItems={preferences.dietTypes}
        onClose={() => setDietTypesModalVisible(false)}
        onSelect={(dietTypes) => setPreferences({ ...preferences, dietTypes: dietTypes })}
        options={['Keto', 'Paleo', 'Vegetarian', 'Vegan', 'Mediterranean', 'No Carb', 'Raw', 'No Sugar', 'Low Fat']}
        title="Select Diet Types"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  backButtonCompact: {
    padding: 4,
    marginLeft: 0,
  },
  content: {
    flex: 1,
  },
  sectionWrapper: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  preferenceInputContainer: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingHorizontal: 20,
  },
  preferenceContent: {
    flex: 1,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  preferenceValue: {
    fontSize: 14,
    color: '#666',
  },
  ingredientInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#f0f0f0',
  },
  ingredientInput: {
    flex: 1,
    padding: 10,
    marginRight: 10,
  },
  addButton: {
    backgroundColor: '#000',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tag: {
    backgroundColor: '#ddd',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 10,
    marginTop: 10,
  },
  tagText: {
    fontSize: 14,
    color: '#000',
  },
  updateButton: {
    backgroundColor: '#000',
    margin: 30,
    padding: 16,
    borderRadius: 25,
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  optionItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  optionText: {
    fontSize: 16,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    padding: 10,
    flex: 1,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
});
