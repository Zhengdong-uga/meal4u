import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';

import { auth } from '../../backend/src/firebase';
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, setDoc, getFirestore } from 'firebase/firestore';

const checkIfUserExists = async (uid, email, name) => {
  const firestore = getFirestore();
  const userDocRef = doc(firestore, 'Users', uid);  // Assuming your collection is 'users'
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    console.log('User exists:', userDoc.data());
    // Proceed with the existing user data

    return userDoc.data().name.split(' ')[0] // returns first name;
  } else {
    console.log('No such user!');

    const newUser = {
      uid,
      email,
      name,
      // age: 0,
      createdAt: new Date().toISOString(),  // Adding a creation date
      goal: [],
      diet: [],
      restrictions: [],
      dislikes: [],
      likes: [],
      // height: 0, // Add height and weight potentially?
      // weight: 0, // o, and gender maybe?
      // Add any other user-specific data you want to store'
      savedRecipes: [],
    };

    // Add new user to Firestore
    await setDoc(userDocRef, newUser)
      .then(() => {
        console.log('New user added to Firestore:', newUser);
      })
      .catch((error) => {
        console.error('Error adding new user to Firestore:', error);
      });

    return userDoc.data().name.split(' ')[0] // returns first name;
  }
};

const healthySections = [
  {
    title: "Healthy Tips",
    items: [
      { title: "Best Core Exercises", link: "https://www.healthline.com/health/best-core-exercises", image: require('../../assets/healthline.png') },
      { title: "Brain Health Tips", link: "https://www.mayoclinic.org/healthy-lifestyle/healthy-aging/in-depth/brain-health-tips/art-20555198", image: require('../../assets/bowl-peanuts.webp') },
      { title: "Health Checklist for Women Over 40", link: "https://www.webmd.com/women/health-checklist-for-women-over-40", image: require('../../assets/webmd.jpg') },
      { title: "Hormone Balancing Meal Plan", link: "https://www.verywellfit.com/hormone-balancing-meal-plan-8304151", image: require('../../assets/verywell.png') },
      { title: "Best Cold Plunge Tubs", link: "https://www.mindbodygreen.com/articles/best-cold-plunge-tubs", image: require('../../assets/mbg.webp') },
      { title: "Are Peanuts Good for You?", link: "https://www.eatthis.com/are-peanuts-good-for-you/", image: require('../../assets/bowl-peanuts.webp') },
    ]
  },
  {
    title: "Podcast Channels",
    items: [
      { title: "The Doctor's Farmacy", link: "https://podcasts.apple.com/us/podcast/the-doctors-farmacy-with-mark-hyman-m-d/id1382804627" },
      { title: "Found My Fitness", link: "https://www.foundmyfitness.com/episodes" },
      { title: "The Model Health Show", link: "https://podcasts.apple.com/us/podcast/the-model-health-show/id640246578" },
      { title: "Mind Pump", link: "https://podcasts.apple.com/us/podcast/mind-pump-raw-fitness-truth/id954100822" },
      { title: "The Minimalists", link: "https://podcasts.apple.com/us/podcast/the-minimalists/id1069757084" },
      { title: "Ultimate Health Podcast", link: "https://ultimatehealthpodcast.com/" },
    ]
  },
  {
    title: "Healthy News",
    items: [
      { title: "Medical News Today", link: "https://www.medicalnewstoday.com/" },
      { title: "Science Daily Health News", link: "https://www.sciencedaily.com/news/top/health/" },
      { title: "CNN Health", link: "https://www.cnn.com/health" },
      { title: "BBC Health News", link: "https://www.bbc.com/news/health" },
      { title: "NPR Health News", link: "https://www.npr.org/sections/health/" },
      { title: "Reuters Health News", link: "https://www.reuters.com/business/healthcare-pharmaceuticals/" },
    ]
  },
  {
    title: "Healthy Blogs",
    items: [
      { title: "Wellness Mama", link: "https://wellnessmama.com/" },
      { title: "Oh She Glows", link: "https://ohsheglows.com/" },
      { title: "Avocadu", link: "https://avocadu.com/" },
      { title: "Fit Bottomed Girls", link: "https://fitbottomedgirls.com/" },
      { title: "The Real Food Dietitians", link: "https://therealfooddietitians.com/" },
      { title: "The Balanced Blonde", link: "https://thebalancedblonde.com/" },
    ]
  },
];

const PodcastCard = ({ title, link }) => (
  <TouchableOpacity onPress={() => Linking.openURL(link)} style={styles.podcastCard}>
    <Image source={{ uri: `https://picsum.photos/seed/${title}/300/200` }} style={styles.podcastImage} />
    <Text style={styles.podcastTitle} numberOfLines={2}>{title}</Text>
  </TouchableOpacity>
);

const ContentCard = ({ title, link }) => (
  <TouchableOpacity onPress={() => Linking.openURL(link)} style={styles.contentCard}>
    <Image source={{ uri: `https://picsum.photos/seed/${title}/300/200` }} style={styles.contentImage} />
    <Text style={styles.contentTitle} numberOfLines={2}>{title}</Text>
  </TouchableOpacity>
);

const SectionHeader = ({ title }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <TouchableOpacity>
      <Text style={styles.seeAllButton}>See All</Text>
    </TouchableOpacity>
  </View>
);

export default function Component({ navigation }) {
  const [selectedTab, setSelectedTab] = useState('Today');
  const [userFirstName, setUserFirstName] = useState('');  // State to store user's first name

  useEffect(() => {
    navigation.setOptions({
      headerTransparent: true,
      headerTitle: '',
    });
  }, [navigation]);

  // Listen to auth state changes and set the user's email when signed in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('User is signed in:', user); // Logs the user object
        const firstName = checkIfUserExists(user.uid, user.email, user.displayName);
        setUserFirstName(firstName)
      } else {
        console.log('No user is signed in');
        setUserFirstName('');  // Reset the email if no user is signed in
      }
    });

    // Cleanup the listener on component unmount
    return () => unsubscribe();
  }, []);

  const getDateInfo = (tab) => {
    if (tab === 'Today') {
      return dayjs();
    } else if (tab === 'Tomorrow') {
      return dayjs().add(1, 'day');
    } else if (tab === 'All') {
      return dayjs();
    }
  };

  const navigateToCalendar = () => {
    navigation.navigate('Calendar');
  };

  const dateInfo = getDateInfo(selectedTab);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>
              Hello, {userFirstName || 'Loading...'}
            </Text>
            <View style={styles.statusContainer}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>VIP Member</Text>
            </View>
          </View>


          <Image
            source={require('../../assets/avatar.jpg')}
            style={styles.avatar}
          />
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            onPress={() => setSelectedTab('Today')}
            style={[styles.tab, selectedTab === 'Today' && styles.selectedTab]}
          >
            <Text style={[styles.tabText, selectedTab === 'Today' && styles.selectedTabText]}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedTab('Tomorrow')}
            style={[styles.tab, selectedTab === 'Tomorrow' && styles.selectedTab]}
          >
            <Text style={[styles.tabText, selectedTab === 'Tomorrow' && styles.selectedTabText]}>Tomorrow</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={navigateToCalendar}
            style={[styles.tab, selectedTab === 'All' && styles.selectedTab]}
          >
            <Ionicons name="calendar-outline" size={16} color={selectedTab === 'All' ? '#fff' : '#000'} />
          </TouchableOpacity>
        </View>

        <View style={styles.mealPlanDashboard}>
          <Text style={styles.dashboardTitle}>
            {selectedTab === 'All' ? 'All Meal Plans' : dateInfo.format('dddd')}
          </Text>

          {selectedTab === 'All' ? (
            <Text>Redirecting to calendar...</Text>
          ) : (
            <View style={styles.dateInfoContainer}>
              <View>
                <Text style={styles.dateNumber}>{dateInfo.format('D')}</Text>
                <Text style={styles.dateMonth}>{dateInfo.format('MMMM')}</Text>
              </View>

              <View style={styles.dateDivider} />

              <View style={styles.mealTimeContainer}>
                <Text style={styles.mealTime}>8:00 AM</Text>
                <Text style={styles.mealType}>Breakfast</Text>
              </View>
            </View>
          )}
        </View>

        <Text style={styles.healthyTipsHeader}>Check Out More Pro Healthy Content!</Text>

        {healthySections.map((section, index) => (
          <View key={index}>
            <View style={styles.healthySection}>
              <SectionHeader title={section.title} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.healthySectionContent}>
                {section.items.map((item, itemIndex) => (
                  section.title === "Podcast Channels" ? (
                    <PodcastCard key={itemIndex} title={item.title} link={item.link} />
                  ) : (
                    <ContentCard key={itemIndex} title={item.title} link={item.link} />
                  )
                ))}
              </ScrollView>
            </View>
            {index < healthySections.length - 1 && <View style={styles.sectionSeparator} />}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollViewContent: {
    paddingBottom: 50,
    paddingTop: hp(9),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: 'green',
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#888',
  },
  avatar: {
    height: hp(5.5),
    width: hp(5.5),
    borderRadius: hp(3),
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 14,
    marginBottom: 20,
    marginTop: 12,
  },
  tab: {
    backgroundColor: '#ccc',
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 20,
  },
  selectedTab: {
    backgroundColor: 'black',
  },
  tabText: {
    color: '#000',
  },
  selectedTabText: {
    color: '#fff',
  },
  mealPlanDashboard: {
    paddingHorizontal: 16,
  },
  dashboardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  dateInfoContainer: {
    marginTop: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateNumber: {
    fontSize: 52,
    fontWeight: 'bold',
  },
  dateMonth: {
    fontSize: 40,
  },
  dateDivider: {
    width: 1,
    backgroundColor: '#000',
    marginHorizontal: 20,
  },
  mealTimeContainer: {
    alignItems: 'flex-end',
  },
  mealTime: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  mealType: {
    color: '#888',
  },
  healthyTipsHeader: {
    fontSize: 30,
    fontWeight: 'bold',
    marginLeft: 16,
    marginTop: 30,
    marginBottom: 10,
  },
  healthySection: {
    marginTop: 20,
    marginBottom: 20,
  },
  healthySectionContent: {
    paddingLeft: 16,
    paddingRight: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  seeAllButton: {
    color: '#007AFF',
    fontSize: 16,
  },
  podcastCard: {
    width: wp(70),
    marginRight: 15,
  },
  podcastImage: {
    width: wp(70),
    height: hp(20),
    borderRadius: 10,
  },
  podcastTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 5,
  },
  contentCard: {
    width: wp(40),
    marginRight: 15,
  },
  contentImage: {
    width: wp(40),
    height: wp(40),
    borderRadius: 10,
  },
  contentTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 5,
  },
  sectionSeparator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
  },
});