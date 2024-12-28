import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ScrollView, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { savedRecipes } from '../../data/savedRecipeData.js';

import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, firestore } from '../../backend/src/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function ProfileScreen({ navigation }) {
    const [showAllRecipes, setShowAllRecipes] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [userEmail, setUserEmail] = useState(''); // Local state for storing user email
    const [userFirstName, setUserFirstName] = useState(''); // Local state for storing user first name

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userDocRef = doc(firestore, 'Users', user.uid);
                try {
                    const userDoc = await getDoc(userDocRef);
                    if (userDoc.exists()) {
                        console.log('User exists:', userDoc.data());
                        setUserEmail(userDoc.data().email);
                        setUserFirstName(userDoc.data().name.split(' ')[0]); // Split in case there's a full name
                    } else {
                        console.log('No such user!');
                    }
                } catch {
                    console.error("Error fetching user info: ", error);
                }
            } else {
                setUserEmail('');
                setUserFirstName('');
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

    const Achievement = ({ color, value, label, shapeStyle }) => (
        <View style={[styles.achievement, shapeStyle, { backgroundColor: color }]}>
            <Text style={styles.achievementValue}>{value}</Text>
            <Text style={styles.achievementLabel}>{label}</Text>
        </View>
    );

    const handleRecipePress = (recipe) => {
        alert(`Selected Recipe: ${recipe.title}`);
    };

    const renderRecipeItem = ({ item }) => (
        <TouchableOpacity onPress={() => handleRecipePress(item)} style={styles.recipeItemContainer}>
            <Image source={{ uri: item.image }} style={styles.recipeImage} />
            <Text style={styles.recipeTitle}>{item.title}</Text>
        </TouchableOpacity>
    );

    const logout = () => {
        signOut(auth)
            .then(() => {
                Alert.alert('Logged out', 'You have been logged out successfully');
            })
            .catch((error) => {
                console.error('Error signing out: ', error);
                Alert.alert('Logout Error', error.message);
            });
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.profileSection}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>ZP</Text>
                </View>
                <Text style={styles.name}>{userFirstName}</Text>
                <Text style={styles.email}>{userEmail}</Text>
                <TouchableOpacity style={styles.editButton} onPress={() => setModalVisible(true)}>
                    <Text style={styles.editButtonText}>Edit Profile</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Achievements</Text>
                <View style={styles.achievementsContainer}>
                    <Achievement color="#FFE082" value="130" label="Meals Generated" shapeStyle={styles.circleAchievement} />
                    <Achievement color="#A5D6A7" value="85" label="Implemented" shapeStyle={styles.starAchievement} />
                    <Achievement color="#90CAF9" value="50-60%" label="Food Waste Reduced" shapeStyle={styles.starAchievement} />
                    <Achievement color="#F48FB1" value="$800" label="Money Saved" shapeStyle={styles.squareAchievement} />
                </View>
            </View>

            <View style={styles.recipeSection}>
                <Text style={styles.sectionTitle}>Recent Recipes</Text>
                <FlatList
                    data={showAllRecipes ? savedRecipes : savedRecipes.slice(0, 2)}
                    renderItem={renderRecipeItem}
                    keyExtractor={(item) => item.id}
                    numColumns={2}
                    columnWrapperStyle={styles.row}
                    scrollEnabled={false}
                />
                <TouchableOpacity onPress={() => setShowAllRecipes(!showAllRecipes)}>
                    <Text style={styles.seeAllText}>{showAllRecipes ? 'See Less' : 'See All'}</Text>
                </TouchableOpacity>
            </View>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalView}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Manage account</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Icon name="close" size={24} color="black" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView>
                        <View style={styles.modalSection}>
                            <Text style={styles.modalSectionTitle}>SETTINGS</Text>
                            {[
                                { title: 'Account details', onPress: () => alert('Account details clicked') },
                                { title: 'Payment cards', onPress: () => alert('Payment cards clicked') },
                                { title: 'Notification', onPress: () => alert('Notification clicked') },
                                {
                                    title: 'Eating preference',
                                    onPress: () => {
                                        setModalVisible(false);
                                        navigation.navigate('EatingPreference');
                                    },
                                },
                            ].map((item, idx) => (
                                <TouchableOpacity key={idx} style={styles.modalItem} onPress={item.onPress}>
                                    <Text>{item.title}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <View style={styles.modalSection}>
                            <Text style={styles.modalSectionTitle}>SUPPORT</Text>
                            {['Support center', 'Contact us', 'About', 'Report a problem'].map((item, idx) => (
                                <TouchableOpacity key={idx} style={styles.modalItem}>
                                    <Text>{item}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <View style={styles.modalSection}>
                            <Text style={styles.modalSectionTitle}>OTHER</Text>
                            {['Meet our nutritionist', 'Support sustainability', 'Share M4U', 'Leave a Feedback'].map((item, idx) => (
                                <TouchableOpacity key={idx} style={styles.modalItem}>
                                    <Text>{item}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                            <Text style={styles.logoutButtonText}>Log out</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    profileSection: {
        alignItems: 'center',
        backgroundColor: '#F5D867',
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        padding: 30,
        paddingTop: 70,
        borderWidth: 1,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    avatarText: {
        color: 'white',
        fontSize: 36,
        fontWeight: 'bold',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 10,
    },
    email: {
        color: '#4B934D',
        marginTop: 8,
    },
    editButton: {
        backgroundColor: 'black',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 20,
        marginTop: 20,
    },
    editButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    section: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    achievementsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        flexWrap: 'nowrap',
        marginBottom: 10,
    },
    achievement: {
        width: '30%',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
        marginBottom: 15,
    },
    circleAchievement: {
        borderRadius: 100,
        borderWidth: 1,
    },
    starAchievement: {
        width: '30%',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
    },
    squareAchievement: {
        borderRadius: 10,
        borderWidth: 1,
    },
    achievementValue: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    achievementLabel: {
        textAlign: 'center',
        fontSize: 16,
    },
    recipeSection: {
        padding: 20,
    },
    recipeItemContainer: {
        flex: 1,
        margin: 10,
        borderRadius: 10,
        overflow: 'hidden',
    },
    recipeImage: {
        width: '100%',
        height: 120,
        borderRadius: 10,
    },
    recipeTitle: {
        marginTop: 5,
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    seeAllText: {
        color: 'grey',
        textAlign: 'right',
        margin: 16,
    },
    row: {
        justifyContent: 'space-between',
    },
    modalView: {
        flex: 1,
        marginTop: 100,
        backgroundColor: 'white',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 30,
        borderWidth: 2,
        borderColor: '#90CAF9',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    modalSection: {
        marginBottom: 20,
    },
    modalSectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#A5A5A5',
        marginBottom: 10,
        textAlign: 'left',
    },
    modalItem: {
        paddingVertical: 10,
        paddingLeft: 20,
    },
    logoutButton: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: 'black',
        paddingVertical: 10,
        paddingHorizontal: 30,
        borderRadius: 20,
        alignItems: 'center',
        alignSelf: 'center',
        marginTop: 20,
        marginBottom: 40,
    },
    logoutButtonText: {
        color: 'black',
    },
});
