import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS, FONTS, SPACING } from '../constants/theme';

const EmptyState = ({ 
  icon = "albums-outline", 
  title = "Nothing here yet", 
  message = "Start by adding some content.", 
  actionLabel, 
  onAction,
  imageSource,
  style
}) => {
  return (
    <View style={[styles.container, style]}>
      {imageSource ? (
        <Image source={imageSource} style={styles.image} resizeMode="contain" />
      ) : (
        <View style={styles.iconContainer}>
            <Ionicons name={icon} size={64} color={COLORS.textSecondary || '#CCC'} />
        </View>
      )}
      
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.button} onPress={onAction}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl || 24,
  },
  iconContainer: {
    marginBottom: SPACING.l || 16,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 200,
    height: 150,
    marginBottom: SPACING.l || 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text || '#1A1A1A',
    textAlign: 'center',
    marginBottom: SPACING.s || 8,
  },
  message: {
    fontSize: 16,
    color: COLORS.textSecondary || '#6B7280',
    textAlign: 'center',
    marginBottom: SPACING.xl || 32,
    maxWidth: 300,
    lineHeight: 24,
  },
  button: {
    backgroundColor: COLORS.primary || '#3F614C',
    paddingVertical: SPACING.m || 12,
    paddingHorizontal: SPACING.xl || 32,
    borderRadius: 30,
    shadowColor: COLORS.primary || '#3F614C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: COLORS.onPrimary || '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default EmptyState;
