import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  ScrollView,
  SafeAreaView,
  Alert,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, setDoc, getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from '../../backend/src/firebase';
import { useTheme } from '../../context/ThemeContext';

// Step components
import GoalsStep from './GoalsStep';
import DietTypeStep from './DietTypeStep';
import RestrictionsStep from './RestrictionsStep';
import DislikesStep from './DislikesStep';

const { width } = Dimensions.get('window');
const STEP_LABELS = ['Goals', 'Diet Type', 'Restrictions', 'Preferences', 'Complete'];

export default function OnboardingQuestionnaire({ navigation, route }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { onIntroComplete } = route.params || {};
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState({
    eatingGoals: [],
    dietTypes: [],
    restrictions: [],
    dislikes: [],
    likes: [],
  });
  const [preferenceSaved, setPreferenceSaved] = useState(false);

  // Progress indicator
  const totalSteps = 5; // Added completion step
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

  const handleNext = () => {
    // If we're on the last content step, save preferences before showing completion screen
    if (currentStep === 3) {
      handleSavePreferences();
      return;
    }

    // If we're on completion screen, finish the onboarding
    if (currentStep === 4) {
      finishOnboarding();
      return;
    }

    // Validate current step if needed
    if (currentStep === 0 && preferences.eatingGoals.length === 0) {
      Alert.alert("Selection Required", "Please select at least one eating goal to continue.");
      return;
    }

    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSavePreferences = async () => {
    const auth = getAuth(firebaseApp);
    const user = auth.currentUser;

    if (!user) {
      Alert.alert("Error", "You must be logged in to complete onboarding.");
      navigation.replace('Login');
      return;
    }

    // Save preferences to Firestore
    const firestore = getFirestore(firebaseApp);
    const userDocRef = doc(firestore, 'Users', user.uid);

    try {
      await setDoc(userDocRef, {
        goal: preferences.eatingGoals,
        diet: preferences.dietTypes,
        restrictions: preferences.restrictions,
        dislikes: preferences.dislikes,
        likes: preferences.likes,
        // Set this flag to indicate onboarding is complete
        onboardingComplete: true,
        savedRecipes: [],
        mealsGenerated: 0,
        mealsImplemented: 0,
      }, { merge: true });

      setPreferenceSaved(true);
      // Move to the completion screen
      setCurrentStep(4);

    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert("Error", "There was a problem saving your preferences. Please try again.");
    }
  };

  const finishOnboarding = () => {
    // Complete onboarding
    if (onIntroComplete) {
      onIntroComplete();
    } else {
      // Navigate directly to main app
      navigation.replace('Main');
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 0:
        return "Your Health Goals";
      case 1:
        return "Preferred Diet";
      case 2:
        return "Food Restrictions";
      case 3:
        return "Food Preferences";
      case 4:
        return "Profile Setup Complete";
      default:
        return "";
    }
  };

  const CompletionStep = () => (
    <View style={styles.completionContainer}>
      <View style={styles.completionIconContainer}>
        <Ionicons name="checkmark-circle" size={100} color={theme.primary} />
      </View>

      <Text style={styles.completionTitle}>All Set!</Text>

      <Text style={styles.completionDescription}>
        Your meal preferences have been saved successfully.
      </Text>

      <View style={styles.infoCard}>
        <View style={styles.infoCardIconContainer}>
          <Ionicons name="information-circle" size={24} color={theme.primary} />
        </View>
        <Text style={styles.infoCardText}>
          You can update your food preferences at any time in your profile settings.
        </Text>
      </View>

      <View style={styles.preferenceSummary}>
        <Text style={styles.summaryTitle}>Your Preferences</Text>

        {preferences.eatingGoals.length > 0 && (
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Goals:</Text>
            <Text style={styles.summaryValue}>{preferences.eatingGoals.join(', ')}</Text>
          </View>
        )}

        {preferences.dietTypes.length > 0 && (
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Diet Type:</Text>
            <Text style={styles.summaryValue}>{preferences.dietTypes.join(', ')}</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <GoalsStep
            selectedGoals={preferences.eatingGoals}
            onSelectGoals={(goals) => setPreferences({ ...preferences, eatingGoals: goals })}
          />
        );
      case 1:
        return (
          <DietTypeStep
            selectedDietTypes={preferences.dietTypes}
            onSelectDietTypes={(dietTypes) => setPreferences({ ...preferences, dietTypes: dietTypes })}
          />
        );
      case 2:
        return (
          <RestrictionsStep
            selectedRestrictions={preferences.restrictions}
            onSelectRestrictions={(restrictions) => setPreferences({ ...preferences, restrictions: restrictions })}
          />
        );
      case 3:
        return (
          <DislikesStep
            dislikes={preferences.dislikes}
            onUpdateDislikes={(dislikes) => setPreferences({ ...preferences, dislikes: dislikes })}
            likes={preferences.likes}
            onUpdateLikes={(likes) => setPreferences({ ...preferences, likes: likes })}
          />
        );
      case 4:
        return <CompletionStep />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Title in progress container instead of separate header */}
      <View style={styles.progressContainer}>
        <Text style={styles.stepTitle}>{getStepTitle()}</Text>
        <View style={styles.stepsLabelContainer}>
          {STEP_LABELS.map((label, index) => (
            <View key={index} style={styles.stepLabelWrapper}>
              <View style={[
                styles.stepCircle,
                currentStep >= index ? styles.activeStepCircle : {}
              ]}>
                {currentStep > index ? (
                  <Ionicons name="checkmark" size={16} color="#FFF" />
                ) : (
                  <Text style={[
                    styles.stepNumber,
                    currentStep >= index ? styles.activeStepNumber : {}
                  ]}>
                    {index + 1}
                  </Text>
                )}
              </View>
              <Text style={[
                styles.stepLabel,
                currentStep >= index ? styles.activeStepLabel : {}
              ]}>
                {label}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressPercentage}%` }
              ]}
            />
          </View>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {renderStep()}
      </ScrollView>

      <View style={styles.footer}>
        {currentStep > 0 && currentStep < 4 && (
          <TouchableOpacity style={styles.prevButton} onPress={handlePrevious}>
            <Ionicons name="arrow-back" size={18} color={theme.primary} />
            <Text style={styles.prevButtonText}>Previous</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.nextButton, currentStep === 4 ? styles.finishButton : {}]}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            {currentStep === 3 ? 'Save' : currentStep === 4 ? 'Get Started' : 'Next'}
          </Text>
          {currentStep < 3 && (
            <Ionicons name="arrow-forward" size={18} color="#FFF" style={styles.nextButtonIcon} />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  // Modern Progress Indicator Styles (with embedded title)
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: theme.mode === 'dark' ? '#1E1E1E' : '#F9F9F9',
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.primary,
    marginBottom: 16,
  },
  stepsLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  stepLabelWrapper: {
    alignItems: 'center',
    width: width / 5 - 20, // Adjusted for 5 steps
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.mode === 'dark' ? '#333' : '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    borderWidth: 2,
    borderColor: theme.mode === 'dark' ? '#333' : '#E0E0E0',
  },
  activeStepCircle: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  stepNumber: {
    color: theme.textSecondary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  activeStepNumber: {
    color: theme.onPrimary,
  },
  stepLabel: {
    fontSize: 10,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  activeStepLabel: {
    color: theme.primary,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    position: 'relative',
    marginTop: 8,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: theme.mode === 'dark' ? '#333' : '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.primary,
    borderRadius: 3,
  },
  // Content and Footer
  content: {
    flex: 1,
    padding: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  prevButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    backgroundColor: theme.surface,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  prevButtonText: {
    fontWeight: 'bold',
    color: theme.primary,
    marginLeft: 6,
  },
  nextButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    backgroundColor: theme.primary,
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextButtonText: {
    fontWeight: 'bold',
    color: theme.onPrimary,
  },
  nextButtonIcon: {
    marginLeft: 6,
  },
  finishButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 40,
  },
  // Completion Step Styles
  completionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  completionIconContainer: {
    marginBottom: 20,
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 16,
  },
  completionDescription: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.mode === 'dark' ? '#1E3326' : '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: theme.primary,
    width: '90%',
  },
  infoCardIconContainer: {
    marginRight: 12,
  },
  infoCardText: {
    flex: 1,
    fontSize: 14,
    color: theme.text,
    lineHeight: 20,
  },
  preferenceSummary: {
    width: '90%',
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  summaryItem: {
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    color: theme.text,
  },
});