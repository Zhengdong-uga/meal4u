import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Image, ActivityIndicator } from 'react-native';
import { SPACING, RADIUS, SHADOWS, FONTS } from '../constants/theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const RecipeCard = ({ recipe, userIngredients = [], onSave, onAddToPlan, onBack, onDiscard, onShare, contentContainerStyle }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (!recipe) return null;

  const {
    name,
    title,
    time,
    difficulty,
    description,
    ingredients = [],
    instructions = [],
    nutrition = {},
    category,
    image,
    imageLoading,
  } = recipe;

  const displayName = name || title || 'Untitled Recipe';
  
  // Tab state for the card content
  const [activeTab, setActiveTab] = useState('details'); // details | instructions
  
  // Local state to track image loading
  const [isImageLoading, setIsImageLoading] = useState(imageLoading || false);
  const [currentImage, setCurrentImage] = useState(image);

  // Update image when it loads
  useEffect(() => {
    if (image && image !== currentImage) {
      setCurrentImage(image);
      setIsImageLoading(false);
    }
  }, [image]);

  // Helper to check if ingredient is owned by user
  const isIngredientAvailable = (ingredientLine) => {
    if (!userIngredients || userIngredients.length === 0) return false;
    const lowerLine = ingredientLine.toLowerCase();
    return userIngredients.some(owned => lowerLine.includes(owned.toLowerCase()));
  };

  return (
    <View style={[styles.container, contentContainerStyle]}>
      {/* Main Card */}
      <View style={styles.card}>
        
        {/* Recipe Image with Overlay Buttons or Loading State */}
        <View style={styles.imageContainer}>
          {isImageLoading || !currentImage ? (
            <View style={styles.imageLoadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={styles.imageLoadingText}>Loading image...</Text>
            </View>
          ) : (
            <Image 
              source={{ uri: currentImage }} 
              style={styles.recipeImage}
              resizeMode="cover"
            />
          )}
          
          {/* Overlay Navigation Buttons */}
          <View style={styles.imageOverlay}>
            {onBack ? (
              <TouchableOpacity onPress={onBack} style={styles.overlayBackButton}>
                  <Ionicons name="chevron-back-outline" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            ) : <View />}
            
            {onShare && (
              <TouchableOpacity onPress={onShare} style={styles.overlayShareButton}>
                  <Ionicons name="share-social-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{displayName}</Text>
          
          <View style={styles.tagsRow}>
            {time && (
              <View style={styles.tag}>
                <Ionicons name="time-outline" size={14} color={theme.text} />
                <Text style={styles.tagText}>{time}</Text>
              </View>
            )}
            {difficulty && (
              <View style={styles.tag}>
                <Ionicons name="flash-outline" size={14} color={theme.text} />
                <Text style={styles.tagText}>{difficulty}</Text>
              </View>
            )}
            {category && (
              <View style={[styles.tag, { backgroundColor: theme.secondary }]}>
                <Text style={[styles.tagText, { color: theme.primary }]}>{category}</Text>
              </View>
            )}
          </View>

          {description ? (
            <Text style={styles.description}>{description}</Text>
          ) : null}
        </View>

        {/* Action Buttons Row - Only show if actions are provided */}
        {(onSave || onAddToPlan) && (
          <View style={styles.actionRow}>
            {onSave && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryButton]} 
            onPress={onSave}
          >
            <Ionicons name="heart-outline" size={20} color={theme.primary} />
            <Text style={styles.secondaryButtonText}>Save</Text>
          </TouchableOpacity>
            )}

            {onAddToPlan && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.primaryButton]} 
                onPress={onAddToPlan}
              >
                <Text style={styles.primaryButtonText}>Add to Plan</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        
        {/* Discard Button (Text Only) */}
        {onDiscard && (
            <TouchableOpacity onPress={onDiscard} style={styles.discardButton}>
                <Ionicons name="trash-bin-outline" size={16} color={theme.error} />
                <Text style={styles.discardText}>Discard Recipe</Text>
            </TouchableOpacity>
        )}

        {/* Content Tabs */}
        <View style={styles.tabContainer}>
           <TouchableOpacity 
             style={[styles.tab, activeTab === 'details' && styles.activeTab]}
             onPress={() => setActiveTab('details')}
           >
             <Text style={[styles.tabText, activeTab === 'details' && styles.activeTabText]}>Ingredients</Text>
           </TouchableOpacity>
           <TouchableOpacity 
             style={[styles.tab, activeTab === 'instructions' && styles.activeTab]}
             onPress={() => setActiveTab('instructions')}
           >
             <Text style={[styles.tabText, activeTab === 'instructions' && styles.activeTabText]}>Instructions</Text>
           </TouchableOpacity>
        </View>

        {/* Content Area (Not Scrollable here, handled by parent) */}
        <View style={styles.contentBody}>
          {activeTab === 'details' ? (
            <View style={styles.contentSection}>
              {/* Ingredients */}
              <View style={styles.listContainer}>
                {ingredients.map((item, index) => {
                  const isAvailable = isIngredientAvailable(item);
                  return (
                    <View key={index} style={styles.ingredientRow}>
                      <View style={[styles.checkbox, isAvailable && styles.checkboxChecked]}>
                        {isAvailable && <Ionicons name="checkmark" size={12} color={theme.onPrimary} />}
                      </View>
                      <Text style={[styles.listItemText, isAvailable && styles.listItemTextAvailable]}>
                        {item}
                      </Text>
                      {isAvailable && (
                        <View style={styles.availableBadge}>
                          <Text style={styles.availableText}>Have</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>

              {/* Nutrition Divider */}
              {Object.keys(nutrition).length > 0 && (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.sectionTitle}>Nutrition</Text>
                  <View style={styles.nutritionGrid}>
                    {Object.entries(nutrition).map(([label, value]) => (
                      <View key={label} style={styles.nutritionItem}>
                        <Text style={styles.nutritionLabel}>{label}</Text>
                        <Text style={styles.nutritionValue}>{value}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>
          ) : (
            <View style={styles.contentSection}>
              {/* Instructions */}
              <View style={styles.listContainer}>
                {instructions.map((step, index) => (
                  <View key={index} style={styles.instructionRow}>
                    <View style={styles.stepNumberContainer}>
                      <Text style={styles.stepNumber}>{index + 1}</Text>
                    </View>
                    <Text style={styles.listItemText}>{step}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

      </View>
    </View>
  );
};

const createStyles = (theme) => StyleSheet.create({
  container: {
    padding: SPACING.m,
  },
  card: {
    backgroundColor: theme.surface,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.medium,
    shadowColor: theme.mode === 'dark' ? '#000' : theme.primary,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
  },
  recipeImage: {
    width: '100%',
    height: 240,
    backgroundColor: theme.mode === 'dark' ? '#333' : '#F3F4F6',
  },
  imageLoadingContainer: {
    width: '100%',
    height: 240,
    backgroundColor: theme.mode === 'dark' ? '#333' : '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.m,
  },
  imageLoadingText: {
    color: theme.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginTop: SPACING.s,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.m,
    paddingTop: SPACING.l,
  },
  overlayBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayShareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.l,
    marginBottom: SPACING.m,
  },
  title: {
    ...FONTS.header,
    marginBottom: SPACING.m,
    color: theme.text,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
  },
  description: {
    ...FONTS.body,
    marginTop: SPACING.m,
    color: theme.textSecondary,
    lineHeight: 22,
    paddingRight: SPACING.s,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.s,
    marginTop: SPACING.xs,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.mode === 'dark' ? '#333' : '#F3F4F6',
    paddingHorizontal: SPACING.m,
    paddingVertical: 6,
    borderRadius: RADIUS.xl,
    gap: 4,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  
  // Buttons
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.m,
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.l,
  },
  actionButton: {
    flex: 1,
    height: 50,
    borderRadius: 25, // Pill shape
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryButton: {
    backgroundColor: theme.primary,
    ...SHADOWS.light,
  },
  primaryButtonText: {
    color: theme.onPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  secondaryButtonText: {
    color: theme.primary,
    fontWeight: '700',
    fontSize: 16,
  },
  discardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.l,
    padding: SPACING.s,
    gap: 4,
    paddingHorizontal: SPACING.l,
  },
  discardText: {
    color: theme.error,
    fontWeight: '600',
    fontSize: 14,
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    marginBottom: SPACING.m,
    paddingHorizontal: SPACING.l,
  },
  tab: {
    paddingVertical: SPACING.m,
    marginRight: SPACING.l,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: theme.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  activeTabText: {
    color: theme.primary,
    fontWeight: '700',
  },

  // Content
  contentBody: {
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.l,
  },
  listContainer: {
    gap: SPACING.m,
  },
  sectionTitle: {
    ...FONTS.subHeader,
    color: theme.text,
    marginBottom: SPACING.m,
  },
  
  // Ingredients
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.m,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6, // Square with rounded corners
    borderWidth: 1.5,
    borderColor: theme.primary,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: theme.primary,
  },
  listItemTextAvailable: {
    color: theme.primary, // Highlight color for available items
    fontWeight: '600',
  },
  availableBadge: {
    backgroundColor: theme.mode === 'dark' ? '#1E3326' : '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  availableText: {
    color: theme.primary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  
  // Instructions
  instructionRow: {
    flexDirection: 'row',
    gap: SPACING.m,
  },
  stepNumberContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.primary,
  },
  listItemText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: theme.text,
  },

  // Nutrition
  divider: {
    height: 1,
    backgroundColor: theme.border,
    marginVertical: SPACING.xl,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.m,
  },
  nutritionItem: {
    width: '45%',
    backgroundColor: theme.mode === 'dark' ? '#333' : '#FAFAFA',
    padding: SPACING.m,
    borderRadius: RADIUS.m,
  },
  nutritionLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.primary,
  },
});

export default RecipeCard;
