import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
    StyleSheet,
    ScrollView,
    Modal,
    SafeAreaView,
    StatusBar,
    Alert,
    Linking,
    PanResponder,
    Animated,
    Dimensions,
    RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../backend/src/firebase'; // Remove firestore import from here
import { doc, getDoc, setDoc, updateDoc, getFirestore } from 'firebase/firestore';
import HapticsService from '../../utils/haptics';
import { AVATARS, getAvatarSource } from '../../utils/AvatarUtils';
import { useTheme } from '../../context/ThemeContext';

// Import the saved recipes mockup data for Recipe Gallery
import { savedRecipes as mockSavedRecipes } from '../../data/savedRecipeData.js';

const { height } = Dimensions.get('window');

// Get a consistent Firestore instance
const firestore = getFirestore();

export default function ProfileScreen({ navigation }) {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    // No longer need state for showing all recipes since we always show just 2
    const [modalVisible, setModalVisible] = useState(false);
    const [avatarModalVisible, setAvatarModalVisible] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [userFirstName, setUserFirstName] = useState('');
    const [userAvatar, setUserAvatar] = useState(null);
    const [userId, setUserId] = useState('');
    // We'll use mockup data for recipes display
    const [mealsGeneratedScore, setMealsGeneratedScore] = useState(0);
    const [mealsImplementedScore, setMealsImplementedScore] = useState(0);
    const [refreshing, setRefreshing] = useState(false);

    // Modal animation
    const panY = useRef(new Animated.Value(height)).current;
    const translateY = panY.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: [0, 0, 1],
    });

    // PanResponder for swipe gestures
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: (e, gestureState) => {
                // Only allow downward swipes
                if (gestureState.dy > 0) {
                    panY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (e, gestureState) => {
                if (gestureState.dy > 100) {
                    // If swiped down more than 100, close the modal
                    closeModals();
                } else {
                    // Otherwise, reset position
                    Animated.spring(panY, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    // Open and close animation for modals
    const resetModalPosition = () => {
        panY.setValue(height);
    };

    const openModal = (type) => {
        if (type === 'account') {
            setModalVisible(true);
        } else if (type === 'avatar') {
            setAvatarModalVisible(true);
        }

        Animated.timing(panY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    const closeModals = () => {
        Animated.timing(panY, {
            toValue: height,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setModalVisible(false);
            setAvatarModalVisible(false);
            resetModalPosition();
        });
    };

    // This function only fetches the user stats, not the recipes
    const fetchUserStats = async () => {
        try {
            const user = auth.currentUser;
            if (user) {
                const userDocRef = doc(firestore, 'Users', user.uid);

                try {
                    const userDoc = await getDoc(userDocRef); // Fetch the user document
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        // Set stats from user data in Firestore
                        setMealsGeneratedScore(userData.mealsGenerated || 0);
                        setMealsImplementedScore(userData.mealsImplemented || 0);
                    } else {
                        console.log("User document does not exist");
                        // Reset stats if no user document exists
                        setMealsGeneratedScore(0);
                        setMealsImplementedScore(0);
                    }
                } catch (error) {
                    console.error('Error fetching user document:', error);
                }
            } else {
                console.log("No user is currently authenticated");
                // Reset stats if no user is authenticated
                setMealsGeneratedScore(0);
                setMealsImplementedScore(0);
            }
        } catch (error) {
            console.error('Error fetching user from Firebase Auth:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        HapticsService.light();
        fetchUserStats();
    }, []);

    useEffect(() => {
        // Fetch user stats when component mounts
        fetchUserStats();

        // Also fetch stats when navigation focus changes
        const unsubscribeFocus = navigation.addListener('focus', () => {
            fetchUserStats();
        });

        return unsubscribeFocus;
    }, [navigation]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
                const userDocRef = doc(firestore, 'Users', user.uid);
                try {
                    const userDoc = await getDoc(userDocRef);
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        console.log('User data:', userData);
                        setUserEmail(userData.email || '');
                        setUserFirstName(userData.name?.split(' ')[0] || '');
                        setUserAvatar(userData.avatarId || 1); // Default to first avatar if none set
                    } else {
                        console.log('No user document found!');
                    }
                } catch (error) {
                    console.error('Error fetching user document:', error);
                }
            } else {
                console.log('No user signed in');
                setUserEmail('');
                setUserFirstName('');
                setUserAvatar(null);
                setUserId('');
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        navigation.setOptions({
            headerTransparent: true,
            headerTitle: '',
        });
    }, [navigation]);

    const Achievement = ({ color, value, label }) => (
        <View style={styles.achievementWrapper}>
            <View style={[styles.achievement, { backgroundColor: color }]}>
                <Text style={styles.achievementValue}>{value}</Text>
                <Text style={styles.achievementLabel}>{label}</Text>
            </View>
        </View>
    );

    const handleRecipePress = (recipe) => {
        navigation.navigate('GeneratedRecipe', { recipe });
    };

    const renderRecipeItem = ({ item }) => (
        <TouchableOpacity onPress={() => handleRecipePress(item)} style={styles.recipeItemContainer}>
            <Image source={{ uri: item.image }} style={styles.recipeImage} />
            <Text style={styles.recipeTitle}>{item.title}</Text>
        </TouchableOpacity>
    );

    const logout = () => {
        closeModals();

        signOut(auth)
            .then(() => {
                Alert.alert('Logged out', 'You have been logged out successfully');
            })
            .catch((error) => {
                console.error('Error signing out: ', error);
                Alert.alert('Logout Error', error.message);
            });
    };

    const handleContactUs = () => {
        closeModals();
        Linking.openURL('https://www.persimmoners.com/');
    };

    const handleAvatarPress = () => {
        openModal('avatar');
    };

    const selectAvatar = async (avatarId) => {
        try {
            if (userId) {
                const userDocRef = doc(firestore, 'Users', userId);
                await updateDoc(userDocRef, {
                    avatarId: avatarId
                });
                setUserAvatar(avatarId);
                closeModals();
                Alert.alert('Success', 'Your avatar has been updated!');
            }
        } catch (error) {
            console.error('Error updating avatar:', error);
            Alert.alert('Error', 'Failed to update avatar. Please try again.');
        }
    };

    const handleSettingsPress = () => {
        navigation.navigate('Settings');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
            <ScrollView 
                style={styles.container} 
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} tintColor={theme.primary} />
                }
            >
                <View style={styles.headerContainer}>
                    <TouchableOpacity 
                        style={styles.settingsButton} 
                        onPress={handleSettingsPress}
                    >
                        <Icon name="settings-outline" size={24} color={theme.text} />
                    </TouchableOpacity>
                </View>

                <View style={styles.profileSection}>
                    <TouchableOpacity
                        style={styles.avatarContainer}
                        onPress={handleAvatarPress}
                    >
                        <Image
                            source={getAvatarSource(userAvatar)}
                            style={styles.avatar}
                        />
                        <View style={styles.cameraIconContainer}>
                            <Icon name="camera" size={16} color="#FFFFFF" />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.name}>{userFirstName || 'Hi there'}</Text>
                    <Text style={styles.email}>{userEmail}</Text>
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => openModal('account')}
                    >
                        <Text style={styles.editButtonText}>Edit Profile</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Your Stats</Text>
                    <View style={styles.achievementsContainer}>
                        <Achievement color={theme.mode === 'dark' ? '#333' : '#F2F2F2'} value={mealsGeneratedScore} label="Meals Generated" />
                        <Achievement color={theme.mode === 'dark' ? '#333' : '#F2F2F2'} value={mealsImplementedScore} label="Implemented" />
                    </View>
                </View>

                <View style={styles.recipeSection}>
                    <View style={styles.recipeTitleRow}>
                        <Text style={styles.sectionTitle}>Recipe Gallery</Text>
                    </View>

                    {mockSavedRecipes.length > 0 ? (
                        <FlatList
                            data={mockSavedRecipes.slice(0, 2)}
                            renderItem={renderRecipeItem}
                            keyExtractor={(item) => item.id}
                            numColumns={2}
                            columnWrapperStyle={styles.row}
                            scrollEnabled={false}
                        />
                    ) : (
                        <View style={styles.emptyRecipesContainer}>
                            <Icon name="bookmark-outline" size={40} color={theme.textSecondary} />
                            <Text style={styles.emptyRecipesText}>No saved recipes yet</Text>
                            <TouchableOpacity
                                style={styles.addRecipeButton}
                                onPress={() => navigation.navigate('AI')}
                            >
                                <Text style={styles.addRecipeButtonText}>Create a Recipe</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.browseAllButton}
                        onPress={() => navigation.navigate('SavedRecipes', { fromScreen: 'Profile' })}
                    >
                        <Text style={styles.browseAllText}>Browse All Recipes</Text>
                    </TouchableOpacity>
                </View>

                {/* Account Management Modal */}
                <Modal
                    animationType="none"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={closeModals}
                    statusBarTranslucent
                >
                    <View style={styles.modalOverlay}>
                        <Animated.View
                            style={[
                                styles.modalContent,
                                { transform: [{ translateY: translateY }] }
                            ]}
                            {...panResponder.panHandlers}
                        >
                            <View style={styles.modalDragIndicator} />

                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Manage account</Text>
                                <TouchableOpacity onPress={closeModals}>
                                    <Icon name="close" size={24} color={theme.text} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView
                                style={styles.modalScrollView}
                                showsVerticalScrollIndicator={false}
                            >
                                <View style={styles.modalSection}>
                                    <Text style={styles.modalSectionTitle}>SETTINGS</Text>
                                    <TouchableOpacity
                                        style={styles.modalItem}
                                        onPress={() => {
                                            closeModals();
                                            navigation.navigate('EatingPreference');
                                        }}
                                    >
                                        <Text style={styles.modalItemText}>Eating preference</Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.modalSection}>
                                    <Text style={styles.modalSectionTitle}>SUPPORT</Text>
                                    <TouchableOpacity
                                        style={styles.modalItem}
                                        onPress={handleContactUs}
                                    >
                                        <Text style={styles.modalItemText}>Contact us</Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.modalSection}>
                                    <Text style={styles.modalSectionTitle}>OTHER</Text>
                                    {['Meet our nutritionist', 'Support sustainability'].map((item, idx) => (
                                        <TouchableOpacity key={idx} style={styles.modalItem}>
                                            <Text style={styles.modalItemText}>{item}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                                    <Text style={styles.logoutButtonText}>Log out</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </Animated.View>
                    </View>
                </Modal>

                {/* Avatar Selection Modal */}
                <Modal
                    animationType="none"
                    transparent={true}
                    visible={avatarModalVisible}
                    onRequestClose={closeModals}
                    statusBarTranslucent
                >
                    <View style={styles.modalOverlay}>
                        <Animated.View
                            style={[
                                styles.avatarModalContent,
                                { transform: [{ translateY: translateY }] }
                            ]}
                            {...panResponder.panHandlers}
                        >
                            <View style={styles.modalDragIndicator} />

                            <TouchableOpacity style={styles.avatarCloseButton} onPress={closeModals}>
                                <Icon name="close-circle" size={32} color={theme.textSecondary} />
                            </TouchableOpacity>

                            {/* Large Preview */}
                            <View style={styles.avatarPreviewContainer}>
                                <View style={styles.avatarPreviewGlow} />
                                <Image
                                    source={getAvatarSource(userAvatar)}
                                    style={styles.avatarPreviewImage}
                                />
                            </View>

                            {/* Horizontal Scroll Carousel */}
                            <FlatList
                                data={AVATARS}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.avatarCarouselContainer}
                                keyExtractor={(item) => item.id.toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[
                                            styles.avatarCarouselItem,
                                            (userAvatar === item.id || (!userAvatar && item.id === 1)) && styles.avatarCarouselItemSelected
                                        ]}
                                        onPress={() => selectAvatar(item.id)}
                                    >
                                        <Image source={item.source} style={styles.avatarCarouselImage} />
                                    </TouchableOpacity>
                                )}
                            />

                            <Text style={styles.avatarPickerTitle}>Pick a profile picture</Text>
                            <Text style={styles.avatarPickerSubtitle}>Tap on one of our signature avatars</Text>

                            <TouchableOpacity style={styles.avatarConfirmButton} onPress={closeModals}>
                                <Text style={styles.avatarConfirmButtonText}>Done</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                </Modal>
            </ScrollView>
        </SafeAreaView>
    );
}

const createStyles = (theme) => StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.background,
    },
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 20,
        paddingTop: 10,
        backgroundColor: theme.surface,
    },
    settingsButton: {
        padding: 8,
    },
    profileSection: {
        alignItems: 'center',
        backgroundColor: theme.surface,
        paddingVertical: 40,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    avatarContainer: {
        marginBottom: 16,
        position: 'relative',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: theme.mode === 'dark' ? '#333' : '#EEEEEE',
    },
    cameraIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: theme.primary,
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.surface,
    },
    name: {
        fontSize: 24,
        fontWeight: '600',
        marginBottom: 4,
        color: theme.text,
    },
    email: {
        fontSize: 14,
        color: theme.textSecondary,
        marginBottom: 20,
    },
    editButton: {
        backgroundColor: theme.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
    },
    editButtonText: {
        color: theme.onPrimary,
        fontSize: 14,
        fontWeight: '600',
    },
    section: {
        padding: 20,
        backgroundColor: theme.surface,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 16,
        color: theme.primary,
    },
    achievementsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    achievementWrapper: {
        width: '48%',
        marginBottom: 16,
    },
    achievement: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'flex-start',
        borderWidth: 1,
        borderColor: theme.border,
    },
    achievementValue: {
        fontSize: 28,
        fontWeight: '700',
        color: theme.text,
        marginBottom: 4,
    },
    achievementLabel: {
        fontSize: 14,
        color: theme.textSecondary,
    },
    recipeTitleRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginBottom: 16,
    },
    recipeSection: {
        padding: 20,
        backgroundColor: theme.surface,
        paddingBottom: 10,
    },
    recipeItemContainer: {
        flex: 1,
        margin: 6,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: theme.surface,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        borderWidth: 1,
        borderColor: theme.border,
    },
    recipeImage: {
        width: '100%',
        height: 140,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    recipeTitle: {
        padding: 10,
        fontSize: 14,
        fontWeight: '500',
        color: theme.text,
    },
    seeAllText: {
        fontSize: 14,
        color: theme.primary,
        fontWeight: '500',
        marginRight: 4,
    },
    viewAllContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    row: {
        justifyContent: 'space-between',
    },
    emptyRecipesContainer: {
        backgroundColor: theme.background,
        borderRadius: 12,
        padding: 30,
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyRecipesText: {
        fontSize: 16,
        color: theme.textSecondary,
        marginTop: 10,
        marginBottom: 20,
    },
    addRecipeButton: {
        backgroundColor: theme.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    addRecipeButtonText: {
        color: theme.onPrimary,
        fontWeight: '600',
    },
    browseAllButton: {
        borderWidth: 1,
        borderColor: theme.primary,
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
        marginTop: 16,
    },
    browseAllText: {
        color: theme.primary,
        fontWeight: '600',
        fontSize: 16,
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: theme.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingBottom: 30,
        paddingTop: 12,
        maxHeight: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    modalDragIndicator: {
        width: 40,
        height: 5,
        backgroundColor: theme.textSecondary,
        borderRadius: 2.5,
        alignSelf: 'center',
        marginBottom: 16,
        opacity: 0.3,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 4,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.text,
    },
    modalScrollView: {
        maxHeight: '100%',
    },
    modalSection: {
        marginBottom: 24,
    },
    modalSectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.primary,
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    modalItem: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginVertical: 4,
        backgroundColor: theme.mode === 'dark' ? '#333' : '#F8F8F8',
    },
    modalItemText: {
        color: theme.text,
        fontSize: 16,
        fontWeight: '500',
    },
    avatarModalContent: {
        backgroundColor: theme.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 12,
        paddingBottom: 40,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    avatarCloseButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
    },
    avatarPreviewContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
        marginBottom: 30,
    },
    avatarPreviewGlow: {
        position: 'absolute',
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: theme.primary,
        opacity: 0.15,
    },
    avatarPreviewImage: {
        width: 150,
        height: 150,
        borderRadius: 75,
    },
    avatarCarouselContainer: {
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    avatarCarouselItem: {
        width: 70,
        height: 70,
        borderRadius: 35,
        marginHorizontal: 8,
        borderWidth: 2,
        borderColor: 'transparent',
        overflow: 'hidden',
    },
    avatarCarouselItemSelected: {
        borderColor: theme.primary,
    },
    avatarCarouselImage: {
        width: '100%',
        height: '100%',
        borderRadius: 35,
    },
    avatarPickerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: theme.text,
        marginTop: 24,
        textAlign: 'center',
    },
    avatarPickerSubtitle: {
        fontSize: 14,
        color: theme.textSecondary,
        marginTop: 8,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    avatarConfirmButton: {
        backgroundColor: theme.text,
        paddingVertical: 16,
        paddingHorizontal: 60,
        borderRadius: 30,
        marginTop: 24,
        width: '90%',
        alignItems: 'center',
    },
    avatarConfirmButtonText: {
        color: theme.surface,
        fontSize: 16,
        fontWeight: '700',
    },
    logoutButton: {
        backgroundColor: theme.secondary,
        paddingVertical: 16,
        paddingHorizontal: 40,
        borderRadius: 24,
        alignItems: 'center',
        alignSelf: 'center',
        marginTop: 10,
        marginBottom: 30,
        width: '80%',
    },
    logoutButtonText: {
        color: theme.primary,
        fontWeight: '700',
        fontSize: 16,
    },
});