import React, { useState, useEffect, useRef } from 'react';
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
    Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
// import { savedRecipes } from '../../data/savedRecipeData.js';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, firestore } from '../../backend/src/firebase';
import { doc, getDoc, setDoc, updateDoc, getFirestore } from 'firebase/firestore';

const { height } = Dimensions.get('window');

export default function ProfileScreen({ navigation }) {
    // Add state to track whether to show all recipes in expanded view
    const [showAllRecipes, setShowAllRecipes] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [avatarModalVisible, setAvatarModalVisible] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [userFirstName, setUserFirstName] = useState('');
    const [userAvatar, setUserAvatar] = useState(null);
    const [userId, setUserId] = useState('');
    const [savedRecipes, setSavedRecipes] = useState([]);
    const [mealsGeneratedScore, setMealsGeneratedScore] = useState(0);
    const [mealsImplementedScore, setMealsImplementedScore] = useState(0);

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

    // Diet-themed avatars
    const avatarOptions = [
        { id: 1, name: 'Default', source: require('../../assets/avatar.png') },
        { id: 2, name: 'Vegetarian', source: require('../../assets/avatar.png') },
        { id: 3, name: 'Vegan', source: require('../../assets/avatar.png') },
        { id: 4, name: 'Pescatarian', source: require('../../assets/avatar.png') },
        { id: 5, name: 'Keto', source: require('../../assets/avatar.png') },
        { id: 6, name: 'Paleo', source: require('../../assets/avatar.png') },
    ];

    const fetchSavedRecipes = async () => {
        try {
            const user = auth.currentUser;
            if (user) {
                const firestore = getFirestore();
                const userDocRef = doc(firestore, 'Users', user.uid);

                try {
                    const userDoc = await getDoc(userDocRef); // Fetch the user document
                    if (userDoc.exists()) {
                        setSavedRecipes(userDoc.data().savedRecipes);
                        setMealsGeneratedScore(savedRecipes.length);
                        setMealsImplementedScore(userDoc.data().mealsImplemented);
                    } else {
                        console.log("User document does not exist");
                    }
                } catch (error) {
                    console.error('Error fetching user document:', error);
                }
            } else {
                console.log("No user is currently authenticated");
            }
        } catch (error) {
            console.error('Error fetching user from Firebase Auth:', error);
        }
    };

    useEffect(() => {
        fetchSavedRecipes();
    })

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
                navigation.navigate('Login');
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

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" />
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.profileSection}>
                    <TouchableOpacity
                        style={styles.avatarContainer}
                        onPress={handleAvatarPress}
                    >
                        <Image
                            source={userAvatar ? avatarOptions[userAvatar - 1]?.source : avatarOptions[0].source}
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
                        <Achievement color="#F2F2F2" value={mealsGeneratedScore} label="Meals Generated" />
                        <Achievement color="#F2F2F2" value={mealsImplementedScore} label="Implemented" />
                    </View>
                </View>

                <View style={styles.recipeSection}>
                    <TouchableOpacity
                        style={styles.recipeTitleRow}
                        onPress={() => setShowAllRecipes(!showAllRecipes)}
                    >
                        <Text style={styles.sectionTitle}>Saved Recipes</Text>
                        <View style={styles.viewAllContainer}>
                            <Text style={styles.seeAllText}>View All</Text>
                            <Icon
                                name={showAllRecipes ? "chevron-down" : "chevron-forward"}
                                size={16}
                                color="#48755C"
                            />
                        </View>
                    </TouchableOpacity>

                    {savedRecipes.length > 0 ? (
                        <FlatList
                            data={showAllRecipes ? savedRecipes : savedRecipes.slice(0, 2)}
                            renderItem={renderRecipeItem}
                            keyExtractor={(item) => item.id}
                            numColumns={2}
                            columnWrapperStyle={styles.row}
                            scrollEnabled={false}
                        />
                    ) : (
                        <View style={styles.emptyRecipesContainer}>
                            <Icon name="bookmark-outline" size={40} color="#CCCCCC" />
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
                        onPress={() => navigation.navigate('SavedRecipes')}
                    >
                        <Text style={styles.browseAllText}>Browse All Recipes</Text>
                    </TouchableOpacity>
                </View>

                {/* Updated Account Management Modal */}
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
                                    <Icon name="close" size={24} color="#333" />
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

                {/* Updated Avatar Selection Modal */}
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
                                styles.modalContent,
                                { transform: [{ translateY: translateY }] }
                            ]}
                            {...panResponder.panHandlers}
                        >
                            <View style={styles.modalDragIndicator} />

                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Choose your avatar</Text>
                                <TouchableOpacity onPress={closeModals}>
                                    <Icon name="close" size={24} color="#333" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.avatarsGrid}>
                                {avatarOptions.map((avatar) => (
                                    <TouchableOpacity
                                        key={avatar.id}
                                        style={[
                                            styles.avatarOption,
                                            userAvatar === avatar.id && styles.selectedAvatarOption
                                        ]}
                                        onPress={() => selectAvatar(avatar.id)}
                                    >
                                        <Image source={avatar.source} style={styles.avatarOptionImage} />
                                        <Text style={styles.avatarName}>{avatar.name}</Text>
                                        {userAvatar === avatar.id && (
                                            <View style={styles.selectedIndicator}>
                                                <Icon name="checkmark-circle" size={24} color="#48755C" />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </Animated.View>
                    </View>
                </Modal>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    profileSection: {
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 40,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    avatarContainer: {
        marginBottom: 16,
        position: 'relative',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#EEEEEE',
    },
    cameraIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#48755C',
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    name: {
        fontSize: 24,
        fontWeight: '600',
        marginBottom: 4,
        color: '#000000',
    },
    email: {
        fontSize: 14,
        color: '#666666',
        marginBottom: 20,
    },
    editButton: {
        backgroundColor: '#48755C',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
    },
    editButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    section: {
        padding: 20,
        backgroundColor: '#FFFFFF',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 16,
        color: '#49351C',
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
        borderColor: '#EEEEEE',
    },
    achievementValue: {
        fontSize: 28,
        fontWeight: '700',
        color: '#000000',
        marginBottom: 4,
    },
    achievementLabel: {
        fontSize: 14,
        color: '#666666',
    },
    recipeTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    recipeSection: {
        padding: 20,
        backgroundColor: '#FFFFFF',
        paddingBottom: 10,
    },
    recipeItemContainer: {
        flex: 1,
        margin: 6,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
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
        color: '#000000',
    },
    seeAllText: {
        fontSize: 14,
        color: '#48755C',
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
        backgroundColor: '#F8F8F8',
        borderRadius: 12,
        padding: 30,
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyRecipesText: {
        fontSize: 16,
        color: '#666666',
        marginTop: 10,
        marginBottom: 20,
    },
    addRecipeButton: {
        backgroundColor: '#48755C',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    addRecipeButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    browseAllButton: {
        borderWidth: 1,
        borderColor: '#48755C',
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
        marginTop: 10,
    },
    browseAllText: {
        color: '#48755C',
        fontWeight: '600',
        fontSize: 16,
    },

    // Updated Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
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
        backgroundColor: '#E0E0E0',
        borderRadius: 2.5,
        alignSelf: 'center',
        marginBottom: 16,
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
        color: '#333',
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
        color: '#49351C',
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    modalItem: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginVertical: 4,
        backgroundColor: '#F8F8F8',
    },
    modalItemText: {
        color: '#333',
        fontSize: 16,
        fontWeight: '500',
    },
    avatarsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        marginTop: 10,
    },
    avatarOption: {
        width: '30%',
        marginBottom: 20,
        alignItems: 'center',
        padding: 10,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    selectedAvatarOption: {
        borderColor: '#48755C',
        backgroundColor: '#F0F9F4',
    },
    avatarOptionImage: {
        width: 70,
        height: 70,
        borderRadius: 35,
        marginBottom: 8,
    },
    avatarName: {
        fontSize: 12,
        color: '#333333',
        textAlign: 'center',
        fontWeight: '500',
    },
    selectedIndicator: {
        position: 'absolute',
        top: 5,
        right: 5,
    },
    logoutButton: {
        backgroundColor: '#F0DED0',
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
        color: '#49351C',
        fontWeight: '700',
        fontSize: 16,
    },
});