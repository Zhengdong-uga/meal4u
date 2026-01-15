import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    StatusBar,
    Alert,
    Linking,
    Switch,
    Modal,
    ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getAuth, signOut, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, deleteDoc, getFirestore } from 'firebase/firestore';
import { auth } from '../../backend/src/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../constants/theme';

// Privacy Policy URL - Replace with your actual URL
const PRIVACY_POLICY_URL = 'https://www.persimmoners.com/privacy-policy';
const TERMS_OF_SERVICE_URL = 'https://www.persimmoners.com/terms-of-service';

export default function SettingsScreen({ navigation }) {
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [mealReminders, setMealReminders] = useState(true);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
    const [termsModalVisible, setTermsModalVisible] = useState(false);

    const handleOpenPrivacyPolicy = () => {
        Linking.openURL(PRIVACY_POLICY_URL).catch(() => {
            setPrivacyModalVisible(true);
        });
    };

    const handleOpenTermsOfService = () => {
        Linking.openURL(TERMS_OF_SERVICE_URL).catch(() => {
            setTermsModalVisible(true);
        });
    };

    const handleLogout = () => {
        Alert.alert(
            'Log Out',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Log Out',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await signOut(auth);
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Login' }],
                            });
                        } catch (error) {
                            Alert.alert('Error', 'Failed to log out. Please try again.');
                        }
                    },
                },
            ]
        );
    };

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        
        try {
            const user = auth.currentUser;
            
            if (!user) {
                Alert.alert('Error', 'No user is currently signed in.');
                setIsDeleting(false);
                setDeleteModalVisible(false);
                return;
            }

            const firestore = getFirestore();
            
            // Delete user data from Firestore
            try {
                await deleteDoc(doc(firestore, 'Users', user.uid));
            } catch (firestoreError) {
                console.log('Firestore deletion error (may not exist):', firestoreError);
            }

            // Clear local storage
            try {
                await AsyncStorage.clear();
            } catch (storageError) {
                console.log('AsyncStorage clear error:', storageError);
            }

            // Delete the Firebase Auth account
            await deleteUser(user);

            setIsDeleting(false);
            setDeleteModalVisible(false);
            
            Alert.alert(
                'Account Deleted',
                'Your account has been permanently deleted.',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Login' }],
                            });
                        },
                    },
                ]
            );
        } catch (error) {
            setIsDeleting(false);
            console.error('Delete account error:', error);
            
            if (error.code === 'auth/requires-recent-login') {
                Alert.alert(
                    'Re-authentication Required',
                    'For security reasons, please log out and log back in before deleting your account.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Log Out',
                            onPress: handleLogout,
                        },
                    ]
                );
            } else {
                Alert.alert('Error', 'Failed to delete account. Please try again later.');
            }
            
            setDeleteModalVisible(false);
        }
    };

    const confirmDeleteAccount = () => {
        setDeleteModalVisible(true);
    };

    const SettingItem = ({ icon, title, subtitle, onPress, showArrow = true, rightComponent }) => (
        <TouchableOpacity style={styles.settingItem} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.settingIconContainer}>
                <Ionicons name={icon} size={22} color={COLORS.primary} />
            </View>
            <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{title}</Text>
                {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
            </View>
            {rightComponent ? rightComponent : (
                showArrow && <Ionicons name="chevron-forward" size={20} color="#CCC" />
            )}
        </TouchableOpacity>
    );

    const SectionHeader = ({ title }) => (
        <Text style={styles.sectionHeader}>{title}</Text>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton} 
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={styles.headerPlaceholder} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Notifications Section */}
                <SectionHeader title="NOTIFICATIONS" />
                <View style={styles.section}>
                    <SettingItem
                        icon="notifications-outline"
                        title="Push Notifications"
                        subtitle="Receive app notifications"
                        showArrow={false}
                        rightComponent={
                            <Switch
                                value={notificationsEnabled}
                                onValueChange={setNotificationsEnabled}
                                trackColor={{ false: '#E0E0E0', true: '#B8D4BE' }}
                                thumbColor={notificationsEnabled ? COLORS.primary : '#F4F4F4'}
                            />
                        }
                    />
                    <SettingItem
                        icon="alarm-outline"
                        title="Meal Reminders"
                        subtitle="Get reminded about planned meals"
                        showArrow={false}
                        rightComponent={
                            <Switch
                                value={mealReminders}
                                onValueChange={setMealReminders}
                                trackColor={{ false: '#E0E0E0', true: '#B8D4BE' }}
                                thumbColor={mealReminders ? COLORS.primary : '#F4F4F4'}
                            />
                        }
                    />
                </View>

                {/* Preferences Section */}
                <SectionHeader title="PREFERENCES" />
                <View style={styles.section}>
                    <SettingItem
                        icon="restaurant-outline"
                        title="Eating Preferences"
                        subtitle="Diet type, restrictions, likes & dislikes"
                        onPress={() => navigation.navigate('EatingPreference')}
                    />
                </View>

                {/* Legal Section */}
                <SectionHeader title="LEGAL" />
                <View style={styles.section}>
                    <SettingItem
                        icon="shield-checkmark-outline"
                        title="Privacy Policy"
                        subtitle="How we handle your data"
                        onPress={handleOpenPrivacyPolicy}
                    />
                    <SettingItem
                        icon="document-text-outline"
                        title="Terms of Service"
                        subtitle="Terms and conditions"
                        onPress={handleOpenTermsOfService}
                    />
                </View>

                {/* Support Section */}
                <SectionHeader title="SUPPORT" />
                <View style={styles.section}>
                    <SettingItem
                        icon="help-circle-outline"
                        title="Help & FAQ"
                        subtitle="Get answers to common questions"
                        onPress={() => Linking.openURL('https://www.persimmoners.com/help')}
                    />
                    <SettingItem
                        icon="mail-outline"
                        title="Contact Us"
                        subtitle="Send us feedback or report issues"
                        onPress={() => Linking.openURL('mailto:support@persimmoners.com')}
                    />
                    <SettingItem
                        icon="star-outline"
                        title="Rate the App"
                        subtitle="Love Meal4U? Leave us a review!"
                        onPress={() => {
                            // Will be updated with actual App Store link after launch
                            Alert.alert('Coming Soon', 'Rating will be available after App Store launch.');
                        }}
                    />
                </View>

                {/* Account Section */}
                <SectionHeader title="ACCOUNT" />
                <View style={styles.section}>
                    <SettingItem
                        icon="log-out-outline"
                        title="Log Out"
                        onPress={handleLogout}
                    />
                    <TouchableOpacity 
                        style={[styles.settingItem, styles.dangerItem]} 
                        onPress={confirmDeleteAccount}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.settingIconContainer, styles.dangerIconContainer]}>
                            <Ionicons name="trash-outline" size={22} color={COLORS.error} />
                        </View>
                        <View style={styles.settingContent}>
                            <Text style={[styles.settingTitle, styles.dangerText]}>Delete Account</Text>
                            <Text style={styles.settingSubtitle}>Permanently delete your account and data</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* App Info */}
                <View style={styles.appInfo}>
                    <Text style={styles.appVersion}>Meal4U Version 1.0.0</Text>
                    <Text style={styles.copyright}>© 2026 Persimmoners. All rights reserved.</Text>
                </View>
            </ScrollView>

            {/* Delete Account Confirmation Modal */}
            <Modal
                visible={deleteModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setDeleteModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalIconContainer}>
                            <Ionicons name="warning" size={50} color={COLORS.error} />
                        </View>
                        
                        <Text style={styles.modalTitle}>Delete Account?</Text>
                        
                        <Text style={styles.modalDescription}>
                            This action cannot be undone. All your data, including saved recipes, 
                            meal plans, and preferences will be permanently deleted.
                        </Text>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setDeleteModalVisible(false)}
                                disabled={isDeleting}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.deleteButton]}
                                onPress={handleDeleteAccount}
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <Text style={styles.deleteButtonText}>Delete</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Privacy Policy Fallback Modal */}
            <Modal
                visible={privacyModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setPrivacyModalVisible(false)}
            >
                <View style={styles.legalModalOverlay}>
                    <View style={styles.legalModalContent}>
                        <View style={styles.legalModalHeader}>
                            <Text style={styles.legalModalTitle}>Privacy Policy</Text>
                            <TouchableOpacity onPress={() => setPrivacyModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.legalModalBody}>
                            <Text style={styles.legalText}>
                                {`Privacy Policy for Meal4U

Last updated: January 2026

1. Information We Collect
We collect information you provide directly, including:
• Account information (name, email)
• Dietary preferences and restrictions
• Recipe interactions and meal plans

2. How We Use Your Information
We use collected information to:
• Personalize your meal recommendations
• Improve our AI recipe generation
• Send meal reminders (if enabled)

3. Data Storage
Your data is stored securely using Firebase services. We implement industry-standard security measures to protect your information.

4. Third-Party Services
We use:
• Google Firebase for authentication and data storage
• Google Gemini AI for recipe generation

5. Your Rights
You can:
• Access your data through the app
• Update your preferences at any time
• Delete your account and all associated data

6. Contact Us
For privacy concerns, contact us at:
support@persimmoners.com

7. Changes to This Policy
We may update this policy periodically. Continued use of the app constitutes acceptance of any changes.`}
                            </Text>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Terms of Service Fallback Modal */}
            <Modal
                visible={termsModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setTermsModalVisible(false)}
            >
                <View style={styles.legalModalOverlay}>
                    <View style={styles.legalModalContent}>
                        <View style={styles.legalModalHeader}>
                            <Text style={styles.legalModalTitle}>Terms of Service</Text>
                            <TouchableOpacity onPress={() => setTermsModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.legalModalBody}>
                            <Text style={styles.legalText}>
                                {`Terms of Service for Meal4U

Last updated: January 2026

1. Acceptance of Terms
By using Meal4U, you agree to these terms. If you disagree, please do not use the app.

2. Description of Service
Meal4U provides AI-powered meal planning and recipe generation based on your dietary preferences.

3. User Accounts
• You must provide accurate information
• You are responsible for maintaining account security
• One account per person

4. Acceptable Use
You agree not to:
• Misuse the service
• Attempt to access unauthorized areas
• Use the app for commercial purposes without permission

5. AI-Generated Content
• Recipes are generated by AI and may not be perfect
• Always verify nutritional information
• Use common sense with food allergies and restrictions

6. Disclaimer
The app provides suggestions only. We are not responsible for:
• Nutritional accuracy
• Allergic reactions
• Cooking outcomes

7. Limitation of Liability
Meal4U is provided "as is" without warranties. We are not liable for any damages arising from use.

8. Changes to Service
We may modify or discontinue features at any time.

9. Termination
We reserve the right to terminate accounts that violate these terms.

10. Contact
Questions? Contact us at support@persimmoners.com`}
                            </Text>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F8F8',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    headerPlaceholder: {
        width: 40,
    },
    content: {
        flex: 1,
    },
    sectionHeader: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
        marginTop: 24,
        marginBottom: 8,
        marginLeft: 20,
        letterSpacing: 0.5,
    },
    section: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#EEEEEE',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    settingIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#F0F8F0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    settingContent: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    settingSubtitle: {
        fontSize: 13,
        color: '#888',
        marginTop: 2,
    },
    dangerItem: {
        borderBottomWidth: 0,
    },
    dangerIconContainer: {
        backgroundColor: '#FEE2E2',
    },
    dangerText: {
        color: COLORS.error,
    },
    appInfo: {
        alignItems: 'center',
        paddingVertical: 30,
        paddingBottom: 50,
    },
    appVersion: {
        fontSize: 14,
        color: '#999',
        marginBottom: 4,
    },
    copyright: {
        fontSize: 12,
        color: '#BBB',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 340,
        alignItems: 'center',
    },
    modalIconContainer: {
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
        marginBottom: 12,
    },
    modalDescription: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#F0F0F0',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    deleteButton: {
        backgroundColor: COLORS.error,
    },
    deleteButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    // Legal Modal Styles
    legalModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    legalModalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '85%',
    },
    legalModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    legalModalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    legalModalBody: {
        padding: 20,
    },
    legalText: {
        fontSize: 14,
        color: '#444',
        lineHeight: 22,
    },
});
