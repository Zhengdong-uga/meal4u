import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Haptic feedback utility
 * Wraps expo-haptics to provide safe execution and consistent patterns
 */

// Check if haptics are available (basic check)
const isHapticsAvailable = Platform.OS === 'ios' || Platform.OS === 'android';

export const HapticsService = {
  // Light feedback for general interactions (presses, toggles)
  light: async () => {
    if (isHapticsAvailable) {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        // Fail silently
      }
    }
  },

  // Medium feedback for more significant actions (add to cart, save)
  medium: async () => {
    if (isHapticsAvailable) {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {
        // Fail silently
      }
    }
  },

  // Heavy feedback for major actions (delete, submit)
  heavy: async () => {
    if (isHapticsAvailable) {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch (e) {
        // Fail silently
      }
    }
  },

  // Success feedback (completion of task)
  success: async () => {
    if (isHapticsAvailable) {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {
        // Fail silently
      }
    }
  },

  // Error feedback (validation failure, error)
  error: async () => {
    if (isHapticsAvailable) {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch (e) {
        // Fail silently
      }
    }
  },

  // Warning feedback
  warning: async () => {
    if (isHapticsAvailable) {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch (e) {
        // Fail silently
      }
    }
  },
  
  // Selection change (scroll pickers)
  selection: async () => {
    if (isHapticsAvailable) {
      try {
        await Haptics.selectionAsync();
      } catch (e) {
        // Fail silently
      }
    }
  }
};

export default HapticsService;
