import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const GOAL_OPTIONS = [
  {
    id: 'lose_fat',
    title: 'Lose fat',
    icon: 'nutrition-outline',
    color: '#FF6B6B',
  },
  {
    id: 'maintain_weight',
    title: 'Maintain weight',
    icon: 'fitness-outline',
    color: '#4ECDC4',
  },
  {
    id: 'gain_muscle',
    title: 'Gain muscle',
    icon: 'barbell-outline',
    color: '#FF9F1C',
  },
  {
    id: 'nutrition_balance',
    title: 'Nutrition Balance',
    icon: 'leaf-outline',
    color: '#2EC4B6',
  },
  {
    id: 'simple_meals',
    title: 'Simple Meals',
    icon: 'timer-outline',
    color: '#9B5DE5',
  },
];

export default function GoalsStep({ selectedGoals, onSelectGoals }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  const toggleGoal = (goalId) => {
    if (selectedGoals.includes(goalId)) {
      onSelectGoals(selectedGoals.filter(id => id !== goalId));
    } else {
      onSelectGoals([...selectedGoals, goalId]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Let's start...</Text>
      <Text style={styles.subtitle}>What goals do you have in mind?</Text>
      <Text style={styles.selectAllText}>Select all that apply</Text>
      
      <View style={styles.optionsContainer}>
        {GOAL_OPTIONS.map((goal) => (
          <TouchableOpacity
            key={goal.id}
            style={[
              styles.goalOption,
              selectedGoals.includes(goal.id) && styles.selectedOption
            ]}
            onPress={() => toggleGoal(goal.id)}
          >
            <View style={[styles.iconContainer, { backgroundColor: goal.color }]}>
              <Ionicons name={goal.icon} size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.optionTitle}>{goal.title}</Text>
            
            {selectedGoals.includes(goal.id) && (
              <View style={styles.checkmark}>
                <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
      
      <Text style={styles.infoText}>
        We use this info to set up your profile and provide you recommendations with your goal
      </Text>
    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  selectAllText: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 20,
  },
  optionsContainer: {
    marginTop: 10,
  },
  goalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.surface,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  selectedOption: {
    borderColor: theme.primary,
    backgroundColor: theme.mode === 'dark' ? '#1E3326' : '#F0F8F0',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.text,
    flex: 1,
  },
  checkmark: {
    position: 'absolute',
    right: 16,
  },
  infoText: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
});