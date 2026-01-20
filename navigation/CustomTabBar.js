import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { useTheme } from '../context/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SHADOWS } from '../constants/theme';

const { width } = Dimensions.get('window');

// Separate component for individual tab buttons to handle animations
const TabButton = ({ 
  isFocused, 
  onPress, 
  onLongPress, 
  iconName, 
  theme,
  accessibilityLabel
}) => {
  const scaleAnim = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isFocused ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 50
    }).start();
  }, [isFocused]);

  const iconTranslateY = scaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -2] // Slight move up when active
  });

  const dotScale = scaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });

  const dotOpacity = scaleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1]
  });

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabButton}
      activeOpacity={0.7}
    >
      <Animated.View style={{ transform: [{ translateY: iconTranslateY }] }}>
        <Ionicons 
          name={iconName} 
          size={24} 
          color={isFocused ? theme.primary : theme.textSecondary} 
        />
      </Animated.View>
      <Animated.View 
        style={[
          styles.activeDot, 
          { 
            backgroundColor: theme.primary,
            transform: [{ scale: dotScale }],
            opacity: dotOpacity
          }
        ]} 
      />
    </TouchableOpacity>
  );
};

// Component for the center floating button
const CenterTabButton = ({ 
  isFocused, 
  onPress, 
  onLongPress, 
  iconName, 
  theme,
  accessibilityLabel 
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.centerTabWrapper}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={accessibilityLabel}
        onPress={() => {
            onPress();
        }}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1} 
      >
        <Animated.View 
            style={[
                styles.centerTabButton, 
                { 
                    backgroundColor: theme.primary,
                    transform: [{ scale: scaleAnim }]
                }
            ]}
        >
          <Ionicons name={iconName} size={28} color={theme.onPrimary} />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <GlassView
        glassEffectStyle="regular"
        style={[styles.tabBar, { 
          borderColor: theme.border,
          ...SHADOWS.medium,
          shadowColor: theme.mode === 'dark' ? '#000' : theme.primary,
          overflow: 'hidden',
          backgroundColor: Platform.OS === 'android' ? theme.surface : 'transparent',
        }]}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          
          // Skip screens that shouldn't be in the tab bar
          if (options.tabBarButton && options.tabBarButton() === null) {
            return null;
          }

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          // Icon mapping
          let iconName;
          if (route.name === 'Home') {
            iconName = isFocused ? 'home' : 'home-outline';
          } else if (route.name === 'Calendar') {
            iconName = isFocused ? 'calendar' : 'calendar-clear-outline';
          } else if (route.name === 'Meal Generating') {
            iconName = isFocused ? 'sparkles' : 'sparkles-outline';
          } else if (route.name === 'Profile') {
            iconName = isFocused ? 'person-circle' : 'person-circle-outline';
          }

          const isCenterTab = route.name === 'Meal Generating';

          if (isCenterTab) {
            return (
              <CenterTabButton
                key={route.key}
                isFocused={isFocused}
                onPress={onPress}
                onLongPress={onLongPress}
                iconName={iconName}
                theme={theme}
                accessibilityLabel={options.tabBarAccessibilityLabel}
              />
            );
          }

          return (
            <TabButton
              key={route.key}
              isFocused={isFocused}
              onPress={onPress}
              onLongPress={onLongPress}
              iconName={iconName}
              theme={theme}
              accessibilityLabel={options.tabBarAccessibilityLabel}
            />
          );
        })}
      </GlassView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    backgroundColor: 'transparent',
    pointerEvents: 'box-none', // Allow touches to pass through empty areas
  },
  tabBar: {
    flexDirection: 'row',
    width: width * 0.9,
    height: 70,
    borderRadius: 35,
    justifyContent: 'space-around',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 10,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  centerTabWrapper: {
    marginTop: -40, // Float above the bar
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  centerTabButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
});

export default CustomTabBar;
