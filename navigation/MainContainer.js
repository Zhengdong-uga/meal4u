import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useState, useEffect } from 'react'
import { onAuthStateChanged, getAuth } from 'firebase/auth'
import firebaseApp from '../backend/src/firebase'

// Screens
import HomeScreen from './screens/HomeScreen';
import CalendarScreen from './screens/CalendarScreen';
import AIScreen from './screens/AIScreen';
import ProfileScreen from './screens/ProfileScreen';
import SavedRecipesScreen from './screens/SavedRecipesScreen'; // Import your new screen
import GeneratedRecipeScreen from './screens/GeneratedRecipeScreen';
import LoginPage from './screens/LoginPage';


// Screen names
const loginName = "Login";
const homeName = "Home";
const calendarName = "Calendar";
const aiName = "AI";
const profileName = "Profile";
const savedRecipesName = "SavedRecipes";  // Declare the new screen name

const Tab = createBottomTabNavigator();



function MainContainer() {

  const [user, setUser] = useState(null)

  useEffect(() => {
    // Monitor Firebase Auth state
    const unsubscribe = onAuthStateChanged(getAuth(firebaseApp), (user) => {
      setUser(user);  // Update the user state when the auth state changes
    });

    // Cleanup the listener on component unmount
    return () => unsubscribe();
  }, []);

  if (user === null) {
    // If the user is not logged in, show the LoginPage
    return <LoginPage />;
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName={homeName}
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            let rn = route.name;

            if (rn === homeName) {
              iconName = focused ? 'home' : 'home-outline';
            } else if (rn === calendarName) {
              iconName = focused ? 'calendar' : 'calendar-outline';
            } else if (rn === aiName) {
              iconName = focused ? 'rocket' : 'rocket-outline';
            } else if (rn === profileName) {
              iconName = focused ? 'person' : 'person-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: 'black',
          tabBarInactiveTintColor: 'grey',
          tabBarLabelStyle: { fontSize: 14 },
          tabBarStyle: { height: 80 },
          tabBarIconStyle: { marginTop: 5 },
        })}
      >
        <Tab.Screen name={homeName} component={HomeScreen} />
        <Tab.Screen name={calendarName} component={CalendarScreen} />
        <Tab.Screen name={aiName} component={AIScreen} />
        <Tab.Screen name={profileName} component={ProfileScreen} />

        {/* SavedRecipesScreen is not part of the bottom tab bar, so we hide it */}
        <Tab.Screen
          name={savedRecipesName}
          component={SavedRecipesScreen}
          options={{ tabBarButton: () => null }}  // Hide from tab bar
        />
        {/* 隐藏生成页面 */}
        <Tab.Screen
          name="GeneratedRecipe"
          component={GeneratedRecipeScreen}
          options={{ tabBarButton: () => null }}  // Hide from tab bar
        />


      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default MainContainer;
