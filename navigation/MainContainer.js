import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import firebaseApp from '../backend/src/firebase';

// Screens
import HomeScreen from './screens/HomeScreen';
import CalendarScreen from './screens/CalendarScreen';
import AIScreen from './screens/AIScreen';
import ProfileScreen from './screens/ProfileScreen';
import SavedRecipesScreen from './screens/SavedRecipesScreen';
import GeneratedRecipeScreen from './screens/GeneratedRecipeScreen';
import LoginPage from './screens/LoginPage';
import EatingPreferenceScreen from './screens/EatingPreference';
import IntroductionPage from './screens/IntroductionPage';
import IntroductionPage2 from './screens/IntroductionPage2';

// Screen names
const loginName = "Login";
const homeName = "Home";
const calendarName = "Calendar";
const aiName = "AI";
const profileName = "Profile";
const savedRecipesName = "SavedRecipes";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabNavigator() {
    return (
        <Tab.Navigator
            initialRouteName={homeName}
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size = 24 }) => {
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

                    return <Ionicons name={iconName} size={Number(size)} color={color} />;
                },
                tabBarActiveTintColor: '#664E2D', // Updated color
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
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
      const unsubscribe = onAuthStateChanged(getAuth(firebaseApp), (user) => {
          setUser(user);
      });
      return () => unsubscribe();
  }, []);

  return (
      <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
              {showIntro ? (
                  <>
                      <Stack.Screen
                          name="IntroductionPage1"
                          component={IntroductionPage}
                          initialParams={{
                              navigateToNext: () => {
                                  // Navigate to the next introduction page
                                  setShowIntro(true);
                              },
                          }}
                      />
                      <Stack.Screen
                          name="IntroductionPage2"
                          component={IntroductionPage2}
                          initialParams={{
                              onIntroComplete: () => setShowIntro(false),
                          }}
                      />
                  </>
              ) : user === null ? (
                  <>
                      <Stack.Screen name="Login" component={LoginPage} />
                  </>
              ) : (
                  <>
                      <Stack.Screen name="Main" component={TabNavigator} />
                  </>
              )}
          </Stack.Navigator>
      </NavigationContainer>
  );
}

export default MainContainer;