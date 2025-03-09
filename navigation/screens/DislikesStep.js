import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function DislikesStep({ dislikes, onUpdateDislikes, likes, onUpdateLikes }) {
  const [dislikeInput, setDislikeInput] = useState('');
  const [likeInput, setLikeInput] = useState('');
  const [activeTab, setActiveTab] = useState('dislikes'); // 'dislikes' or 'likes'

  const handleAddDislike = () => {
    if (dislikeInput.trim() && !dislikes.includes(dislikeInput.trim())) {
      onUpdateDislikes([...dislikes, dislikeInput.trim()]);
      setDislikeInput('');
    }
  };

  const handleRemoveDislike = (item) => {
    onUpdateDislikes(dislikes.filter((dislike) => dislike !== item));
  };

  const handleAddLike = () => {
    if (likeInput.trim() && !likes.includes(likeInput.trim())) {
      onUpdateLikes([...likes, likeInput.trim()]);
      setLikeInput('');
    }
  };

  const handleRemoveLike = (item) => {
    onUpdateLikes(likes.filter((like) => like !== item));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Final few steps...</Text>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'dislikes' && styles.activeTab]} 
          onPress={() => setActiveTab('dislikes')}
        >
          <Text style={[styles.tabText, activeTab === 'dislikes' && styles.activeTabText]}>
            Food you dislike
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'likes' && styles.activeTab]} 
          onPress={() => setActiveTab('likes')}
        >
          <Text style={[styles.tabText, activeTab === 'likes' && styles.activeTabText]}>
            Food you like
          </Text>
        </TouchableOpacity>
      </View>
      
      {activeTab === 'dislikes' ? (
        <View style={styles.inputSection}>
          <Text style={styles.subtitle}>Food you dislike.</Text>
          <Text style={styles.description}>
            We'll avoid these in your meal plans
          </Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Add food you dislike"
              value={dislikeInput}
              onChangeText={setDislikeInput}
              onSubmitEditing={handleAddDislike}
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddDislike}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.tagsContainer}>
            {dislikes.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.tag}
                onPress={() => handleRemoveDislike(item)}
              >
                <Text style={styles.tagText}>{item}</Text>
                <Ionicons name="close-circle" size={16} color="#666666" style={styles.tagIcon} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.inputSection}>
          <Text style={styles.subtitle}>Food you like.</Text>
          <Text style={styles.description}>
            We'll try to include these in your meal plans
          </Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Add food you like"
              value={likeInput}
              onChangeText={setLikeInput}
              onSubmitEditing={handleAddLike}
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddLike}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.tagsContainer}>
            {likes.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.tag, styles.likeTag]}
                onPress={() => handleRemoveLike(item)}
              >
                <Text style={[styles.tagText, styles.likeTagText]}>{item}</Text>
                <Ionicons name="close-circle" size={16} color="#48755C" style={styles.tagIcon} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
      
      <Text style={styles.infoText}>
        You can always update these preferences later in your profile
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  activeTab: {
    backgroundColor: '#48755C',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  inputSection: {
    flex: 1,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#48755C',
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    margin: 4,
  },
  likeTag: {
    backgroundColor: '#E8F5E9',
  },
  tagText: {
    fontSize: 14,
    marginRight: 4,
    color: '#333333',
  },
  likeTagText: {
    color: '#48755C',
  },
  tagIcon: {
    marginLeft: 2,
  },
  infoText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginTop: 30,
    marginBottom: 20,
    },
});