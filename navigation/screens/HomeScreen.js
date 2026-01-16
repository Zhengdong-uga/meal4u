import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../constants/theme';
import EmptyState from '../../components/EmptyState';
import SkeletonLoader from '../../components/SkeletonLoader';
import HapticsService from '../../utils/haptics';
import { auth } from '../../backend/src/firebase';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';

export default function HomeScreen({ navigation }) {
  const { theme } = useTheme();
  const [todaysMeals, setTodaysMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('');

  const getLocalDateString = (date = new Date()) => {
    return date.getFullYear() + "-" +
      (date.getMonth() + 1).toString().padStart(2, "0") + "-" +
      date.getDate().toString().padStart(2, "0");
  };

  const fetchUserData = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        // Fetch user name
        const firestore = getFirestore();
        const userDocRef = doc(firestore, 'Users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.name) {
            setUserName(userData.name.split(' ')[0]); // First name
          }
          
          // Fetch meals from Firestore
          if (userData.mealPlan) {
             const today = getLocalDateString();
             const dayPlan = userData.mealPlan[today];
             processMeals(dayPlan);
             return;
          }
        }
      } 
      
      // Fallback to AsyncStorage if no user or no Firestore data (or offline)
      const data = await AsyncStorage.getItem('mealPlanData');
      if (data) {
        const parsedData = JSON.parse(data);
        const today = getLocalDateString();
        const dayPlan = parsedData[today];
        processMeals(dayPlan);
      } else {
        setTodaysMeals([]);
      }
      
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const processMeals = (dayPlan) => {
    if (!dayPlan) {
      setTodaysMeals([]);
      return;
    }

    const meals = [];
    const types = ['breakfast', 'lunch', 'dinner', 'snacks'];
    
    types.forEach(type => {
      if (dayPlan[type] && dayPlan[type].length > 0) {
        dayPlan[type].forEach(meal => {
          meals.push({
            ...meal,
            type: type // Ensure type is attached
          });
        });
      }
    });

    // Sort by time (simple heuristic based on type if time not present)
    const typeOrder = { 'breakfast': 1, 'lunch': 2, 'snacks': 3, 'dinner': 4 };
    meals.sort((a, b) => {
       return typeOrder[a.type] - typeOrder[b.type];
    });

    setTodaysMeals(meals);
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    HapticsService.light();
    fetchUserData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const MealCard = ({ meal }) => (
    <TouchableOpacity 
      style={styles.mealCard}
      onPress={() => {
        HapticsService.light();
        navigation.navigate('GeneratedRecipe', { recipe: meal });
      }}
    >
      <Image 
        source={{ uri: meal.image || 'https://via.placeholder.com/150' }} 
        style={styles.mealImage} 
      />
      <View style={styles.mealInfo}>
        <View style={styles.mealHeader}>
            <Text style={styles.mealType}>{meal.type}</Text>
            <Text style={styles.mealTime}>{meal.time || ''}</Text>
        </View>
        <Text style={styles.mealName} numberOfLines={2}>{meal.name}</Text>
        <View style={styles.mealMeta}>
            <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
            <Text style={styles.mealMetaText}>{meal.timeToCook || '30m'}</Text>
            <View style={styles.metaDivider}/>
            <Ionicons name="flame-outline" size={14} color={theme.textSecondary} />
            <Text style={styles.mealMetaText}>{meal.calories ? `${meal.calories} kcal` : 'N/A'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} tintColor={COLORS.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}{userName ? `, ${userName}!` : '!'}</Text>
            <Text style={styles.subtitle}>Ready to eat something delicious?</Text>
          </View>
          <TouchableOpacity onPress={() => {
             HapticsService.light();
             navigation.navigate('Profile');
          }}>
             <Ionicons name="person-circle-outline" size={40} color={COLORS.primary || '#48755C'} />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={styles.actionCard} 
              onPress={() => {
                HapticsService.light();
                navigation.navigate('Meal Generating');
              }}
            >
              <View style={[styles.iconBox, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="sparkles-outline" size={24} color="#48755C" />
              </View>
              <Text style={styles.actionText}>Generate Meal</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard} 
              onPress={() => {
                HapticsService.light();
                navigation.navigate('Calendar');
              }}
            >
              <View style={[styles.iconBox, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="calendar-clear-outline" size={24} color="#E65100" />
              </View>
              <Text style={styles.actionText}>View Schedule</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Today's Preview Placeholder */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Plan</Text>
            <TouchableOpacity onPress={() => {
              HapticsService.light();
              navigation.navigate('Calendar');
            }}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {loading ? (
             <SkeletonLoader type="card" />
          ) : todaysMeals.length > 0 ? (
            <View style={styles.mealsList}>
                {todaysMeals.map((meal, index) => (
                    <MealCard key={index} meal={meal} />
                ))}
            </View>
          ) : (
            <EmptyState
                icon="calendar-outline"
                title="No meals planned"
                message="No meals planned for today."
                actionLabel="Create a Plan"
                onAction={() => {
                    HapticsService.light();
                    navigation.navigate('Meal Generating');
                }}
                style={{ padding: 30, backgroundColor: '#F9FAFB', borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6', borderStyle: 'dashed' }}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  seeAll: {
    color: '#48755C',
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#F9FAFB', // Very light grey
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionText: {
    fontWeight: '600',
    color: '#333',
  },
  mealsList: {
    gap: 15,
  },
  mealCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  mealImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  mealInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  mealType: {
    fontSize: 12,
    fontWeight: '700',
    color: '#48755C',
    textTransform: 'uppercase',
  },
  mealTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  mealMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealMetaText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  metaDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  emptyState: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderStyle: 'dashed',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 16,
    marginBottom: 15,
  },
  createPlanButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#E8F5E9',
    borderRadius: 20,
  },
  createPlanText: {
    color: '#48755C',
    fontWeight: '600',
  },
});
