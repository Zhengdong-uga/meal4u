import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DIET_OPTIONS = [
  {
    id: 'protein_plus',
    title: 'Protein Plus',
    description: '30 grams of protein or more per serving',
    image: require('../../assets/protein_plus.jpg'), 
  },
  {
    id: 'classic',
    title: 'Classic',
    description: '30 grams of protein or more per serving',
    image: require('../../assets/classic.jpg'), 
  },
  {
    id: 'keto',
    title: 'Keto',
    description: 'Low carb, high fat meals',
    image: require('../../assets/keto.jpg'), 
  },
  {
    id: 'paleo',
    title: 'Paleo',
    description: 'Whole foods based diet',
    image: require('../../assets/paleo.jpg'),
  },
  {
    id: 'vegetarian',
    title: 'Vegetarian',
    description: 'Plant-based meals without meat',
    image: require('../../assets/vegetarian.jpg'), 
  },
  {
    id: 'vegan',
    title: 'Vegan',
    description: 'No animal products',
    image: require('../../assets/vegan.jpg'), 
  },
  {
    id: 'mediterranean',
    title: 'Mediterranean',
    description: 'Rich in healthy fats, vegetables, and lean proteins',
    image: require('../../assets/mediterranean.jpg'),
  },
  {
    id: 'no_carb',
    title: 'No Carb',
    description: 'Meals without carbohydrates',
    image: require('../../assets/no carb.webp'),
  },
  {
    id: 'low_fat',
    title: 'Low Fat',
    description: 'Meals with reduced fat content',
    image: require('../../assets/low fat.webp'),
  },
];

export default function DietTypeStep({ selectedDietTypes, onSelectDietTypes }) {
  
  const toggleDietType = (dietId) => {
    if (selectedDietTypes.includes(dietId)) {
      onSelectDietTypes(selectedDietTypes.filter(id => id !== dietId));
    } else {
      onSelectDietTypes([...selectedDietTypes, dietId]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>One more...</Text>
      <Text style={styles.subtitle}>Pick your diet type.</Text>
      
      <ScrollView style={styles.optionsContainer}>
        <View style={styles.gridContainer}>
          {DIET_OPTIONS.map((diet) => (
            <TouchableOpacity
              key={diet.id}
              style={[
                styles.dietOption,
                selectedDietTypes.includes(diet.id) && styles.selectedOption
              ]}
              onPress={() => toggleDietType(diet.id)}
            >
              {diet.image ? (
                <Image source={diet.image} style={styles.dietImage} />
              ) : (
                <View style={styles.placeholderImage}>
                  <Ionicons name="restaurant-outline" size={40} color="#CCCCCC" />
                </View>
              )}
              
              <View style={styles.dietInfo}>
                <Text style={styles.dietTitle}>{diet.title}</Text>
                <Text style={styles.dietDescription}>{diet.description}</Text>
              </View>
              
              {selectedDietTypes.includes(diet.id) && (
                <View style={styles.selectedOverlay}>
                  <Ionicons name="checkmark-circle" size={32} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      
      <Text style={styles.infoText}>
        We use this info to set up your profile and provide you recommendations with your goal
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 20,
  },
  optionsContainer: {
    flex: 1,
    marginTop: 10,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dietOption: {
    width: '48%',
    aspectRatio: 0.8,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    position: 'relative',
  },
  selectedOption: {
    borderColor: '#48755C',
    borderWidth: 2,
  },
  dietImage: {
    width: '100%',
    height: '70%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '70%',
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dietInfo: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    height: '30%',
  },
  dietTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
  },
  dietDescription: {
    fontSize: 10,
    color: '#666666',
    marginTop: 2,
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(72, 117, 92, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
});