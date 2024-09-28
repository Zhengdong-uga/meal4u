import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Screens
import HomeScreen from './screens/HomeScreen';
import CalendarScreen from './screens/CalendarScreen';
import AIScreen from './screens/AIScreen';
import ProfileScreen from './screens/ProfileScreen';
import SavedRecipesScreen from './screens/SavedRecipesScreen'; // Import your new screen
import GeneratedRecipeScreen from './screens/GeneratedRecipeScreen'; 


// Screen names
const homeName = "Home";
const calendarName = "Calendar";
const aiName = "AI";
const profileName = "Profile";
const savedRecipesName = "SavedRecipes";  // Declare the new screen name

const Tab = createBottomTabNavigator();

function MainContainer() {
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
