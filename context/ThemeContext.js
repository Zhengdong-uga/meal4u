import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LIGHT_THEME, DARK_THEME } from '../constants/theme';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [theme, setTheme] = useState(LIGHT_THEME);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadThemePreference();
  }, []);

  useEffect(() => {
    setTheme(isDarkMode ? DARK_THEME : LIGHT_THEME);
  }, [isDarkMode]);

  const loadThemePreference = async () => {
    try {
      const storedPreference = await AsyncStorage.getItem('theme_preference');
      if (storedPreference) {
        setIsDarkMode(storedPreference === 'dark');
      } else {
        // Default to system preference
        setIsDarkMode(systemScheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const toggleTheme = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    try {
      await AsyncStorage.setItem('theme_preference', newMode ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const setMode = async (mode) => {
    const isDark = mode === 'dark';
    setIsDarkMode(isDark);
    try {
      await AsyncStorage.setItem('theme_preference', mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  if (!isLoaded) {
    return null; // Or a splash screen
  }

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
