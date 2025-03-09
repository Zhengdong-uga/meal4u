import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

const RESTRICTION_OPTIONS = [
  { id: 'shellfish-free', title: 'Shellfish-Free' },
  { id: 'fish-free', title: 'Fish-Free' },
  { id: 'gluten-free', title: 'Gluten-Free' },
  { id: 'dairy', title: 'Dairy' },
  { id: 'peanut', title: 'Peanut' },
  { id: 'tree-nut', title: 'Tree-nut' },
  { id: 'soy', title: 'Soy' },
  { id: 'egg', title: 'Egg' },
  { id: 'sesame', title: 'Sesame' },
  { id: 'mustard', title: 'Mustard' },
  { id: 'sulfite', title: 'Sulfite' },
  { id: 'nightshade', title: 'Nightshade' },
];

export default function RestrictionsStep({ selectedRestrictions, onSelectRestrictions }) {
  
  const toggleRestriction = (restrictionId) => {
    if (selectedRestrictions.includes(restrictionId)) {
      onSelectRestrictions(selectedRestrictions.filter(id => id !== restrictionId));
    } else {
      onSelectRestrictions([...selectedRestrictions, restrictionId]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Next...</Text>
      <Text style={styles.subtitle}>Food restrictions?</Text>
      <Text style={styles.description}>
        Select any foods or ingredients you need to avoid
      </Text>
      
      <View style={styles.tagsContainer}>
        {RESTRICTION_OPTIONS.map((restriction) => (
          <TouchableOpacity
            key={restriction.id}
            style={[
              styles.tag,
              selectedRestrictions.includes(restriction.id) && styles.selectedTag
            ]}
            onPress={() => toggleRestriction(restriction.id)}
          >
            <Text 
              style={[
                styles.tagText,
                selectedRestrictions.includes(restriction.id) && styles.selectedTagText
              ]}
            >
              {restriction.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <Text style={styles.infoText}>
        We'll make sure to exclude these items from your meal recommendations
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
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    margin: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedTag: {
    backgroundColor: '#E8F5E9',
    borderColor: '#48755C',
  },
  tagText: {
    fontSize: 14,
    color: '#333333',
  },
  selectedTagText: {
    color: '#48755C',
    fontWeight: '500',
  },
  infoText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
});