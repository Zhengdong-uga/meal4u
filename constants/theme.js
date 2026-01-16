export const COLORS = {
  primary: '#3F614C', // Deep Forest Green (Blank Street logo/button color)
  onPrimary: '#FFFFFF',
  secondary: '#E8E2D6', // Beige/Tan accent
  background: '#F9F5F1', // Warm Cream background
  surface: '#FFFFFF', // White cards
  text: '#1A1A1A', // Dark charcoal/black
  textSecondary: '#6B7280', // Gray text
  border: '#E5E7EB',
  error: '#EF4444',
  success: '#10B981',
};

export const LIGHT_THEME = {
  ...COLORS,
  mode: 'light',
};

export const DARK_THEME = {
  primary: '#4F7A60', // Lighter Green for dark mode
  onPrimary: '#FFFFFF',
  secondary: '#2C2C2C', // Dark gray accent
  background: '#121212', // Dark background
  surface: '#1E1E1E', // Darker gray cards
  text: '#E0E0E0', // Light gray/white text
  textSecondary: '#A0A0A0', // Dimmer gray text
  border: '#333333',
  error: '#FF6B6B',
  success: '#34D399',
  mode: 'dark',
};

export const SPACING = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 40,
};

export const RADIUS = {
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
  xxl: 32,
};

export const SHADOWS = {
  light: {
    shadowColor: '#3F614C',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  medium: {
    shadowColor: '#3F614C',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
  strong: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
};

export const FONTS = {
  header: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: COLORS.text,
  },
  subHeader: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.textSecondary,
  },
};
