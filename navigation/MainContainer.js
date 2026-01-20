import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Platform } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { firebaseApp, auth } from '../backend/src/firebase';
import { useTheme } from '../context/ThemeContext';
import CustomTabBar from './CustomTabBar';

// Screens
import CalendarScreen from './screens/CalendarScreen';
import HomeScreen from './screens/HomeScreen';
import AIScreen from './screens/AIScreen';
import ProfileScreen from './screens/ProfileScreen';
import SavedRecipesScreen from './screens/SavedRecipesScreen';
import GeneratedRecipeScreen from './screens/GeneratedRecipeScreen';
import LoginPage from './screens/LoginPage';
import EatingPreferenceScreen from './screens/EatingPreference';
import OnboardingQuestionnaire from './screens/OnboardingQuestionnaire';
import SettingsScreen from './screens/SettingsScreen';

// Screen names
const loginName = "Login";
const homeName = "Home";
const calendarName = "Calendar";
const aiName = "Meal Generating";
const profileName = "Profile";
const savedRecipesName = "SavedRecipes";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Define common transition animations
const screenOptions = {
  headerShown: false,
  gestureEnabled: true, // Enable gestures for navigation
  cardOverlayEnabled: true, // Show a overlay during transitions
  gestureDirection: 'horizontal', // Set the gesture direction
  // Animation configurations
  cardStyleInterpolator: ({ current, layouts }) => {
    return {
      cardStyle: {
        transform: [
          {
            translateX: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [layouts.screen.width, 0],
            }),
          },
        ],
      },
      overlayStyle: {
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0.5],
        }),
      },
    };
  },
};

function TabNavigator() {
    const { theme } = useTheme();
    return (
        <Tab.Navigator
            initialRouteName={homeName}
            tabBar={props => <CustomTabBar {...props} />}
            screenOptions={{
                headerShown: false,
                // Make background transparent for floating effect
                tabBarStyle: {
                    position: 'absolute',
                    backgroundColor: 'transparent',
                    borderTopWidth: 0,
                    elevation: 0,
                }
            }}
        >
            <Tab.Screen name={homeName} component={HomeScreen} />
            <Tab.Screen name={calendarName} component={CalendarScreen} />
            <Tab.Screen name={aiName} component={AIScreen} />
            <Tab.Screen name={profileName} component={ProfileScreen} />

            <Tab.Screen
                name={savedRecipesName}
                component={SavedRecipesScreen}
                options={{ tabBarButton: () => null }}
            />
            <Tab.Screen
                name="GeneratedRecipe"
                component={GeneratedRecipeScreen}
                options={{ tabBarButton: () => null }}
            />
            <Tab.Screen
                name="EatingPreference"
                component={EatingPreferenceScreen}
                options={{ tabBarButton: () => null }}
            />
        </Tab.Navigator>
    );
}

function MainContainer() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Check if user has completed onboarding
        const firestore = getFirestore(firebaseApp);
        const userDocRef = doc(firestore, 'Users', currentUser.uid);
        
        try {
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            // Check if user has preferences set
            // If they don't have any preferences set, consider them a new user
            setIsNewUser(!userData.goal || userData.goal.length === 0);
          } else {
            // Document doesn't exist, definitely a new user
            setIsNewUser(true);
          }
        } catch (error) {
          console.error('Error checking user status:', error);
          // Default to showing onboarding if there's an error
          setIsNewUser(true);
        }
      }
      
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  if (loading) {
    // You could add a loading screen here
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={screenOptions}>
          {user === null ? (
            // Step 1: Not logged in - show login screen
            <Stack.Screen name="Login" component={LoginPage} />
          ) : isNewUser ? (
            // Step 2: Logged in but new user - show onboarding
            <Stack.Screen
              name="Onboarding"
              component={OnboardingQuestionnaire}
              initialParams={{
                onIntroComplete: () => setIsNewUser(false)
              }}
            />
          ) : (
            // Step 3: Logged in and has preferences - show main app
            <>
              <Stack.Screen name="Main" component={TabNavigator} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

export default MainContainer;