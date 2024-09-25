import * as React from 'react';
import {View, Text} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Screens
import HomeScreen from './screens/HomeScreen';
import CalendarScreen from './screens/CalendarScreen';
import AIScreen from './screens/AIScreen';
import ProfileScreen from './screens/ProfileScreen';


//Screen names
const homeName = "Home";
const calendarName = "Calendar";
const aiName = "AI";
const profileName = "Profile";

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

            }else if (rn === profileName) {
                iconName = focused ? 'person' : 'person-outline';
            }

            // You can return any component that you like here!
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
        tabBarOptions={{
          activeTintColor: 'black',
          inactiveTintColor: 'grey',
          labelStyle: { fontSize: 14 },
          style: { height: 70}
        }}>

        <Tab.Screen name={homeName} component={HomeScreen} />
        <Tab.Screen name={calendarName} component={CalendarScreen} />
        <Tab.Screen name={aiName} component={AIScreen} />
        <Tab.Screen name={profileName} component={ProfileScreen} />

      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default MainContainer;