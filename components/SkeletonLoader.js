import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const SkeletonItem = ({ width, height, style }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, opacity },
        style,
      ]}
    />
  );
};

const SkeletonLoader = ({ type = 'list' }) => {
  if (type === 'card') {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <SkeletonItem width={80} height={80} style={{ borderRadius: 12 }} />
          <View style={{ marginLeft: 15, flex: 1 }}>
            <SkeletonItem width="30%" height={12} style={{ marginBottom: 8 }} />
            <SkeletonItem width="80%" height={16} style={{ marginBottom: 8 }} />
            <SkeletonItem width="50%" height={12} />
          </View>
        </View>
        <View style={styles.card}>
          <SkeletonItem width={80} height={80} style={{ borderRadius: 12 }} />
          <View style={{ marginLeft: 15, flex: 1 }}>
            <SkeletonItem width="30%" height={12} style={{ marginBottom: 8 }} />
            <SkeletonItem width="80%" height={16} style={{ marginBottom: 8 }} />
            <SkeletonItem width="50%" height={12} />
          </View>
        </View>
        <View style={styles.card}>
          <SkeletonItem width={80} height={80} style={{ borderRadius: 12 }} />
          <View style={{ marginLeft: 15, flex: 1 }}>
            <SkeletonItem width="30%" height={12} style={{ marginBottom: 8 }} />
            <SkeletonItem width="80%" height={16} style={{ marginBottom: 8 }} />
            <SkeletonItem width="50%" height={12} />
          </View>
        </View>
      </View>
    );
  }

  // Recipe Grid Skeleton
  if (type === 'grid') {
    return (
      <View style={styles.gridContainer}>
        <View style={styles.gridItem}>
          <SkeletonItem width="100%" height={120} style={{ borderRadius: 12, marginBottom: 8 }} />
          <SkeletonItem width="80%" height={14} style={{ marginBottom: 6 }} />
          <SkeletonItem width="60%" height={12} />
        </View>
        <View style={styles.gridItem}>
          <SkeletonItem width="100%" height={120} style={{ borderRadius: 12, marginBottom: 8 }} />
          <SkeletonItem width="80%" height={14} style={{ marginBottom: 6 }} />
          <SkeletonItem width="60%" height={12} />
        </View>
        <View style={styles.gridItem}>
          <SkeletonItem width="100%" height={120} style={{ borderRadius: 12, marginBottom: 8 }} />
          <SkeletonItem width="80%" height={14} style={{ marginBottom: 6 }} />
          <SkeletonItem width="60%" height={12} />
        </View>
        <View style={styles.gridItem}>
          <SkeletonItem width="100%" height={120} style={{ borderRadius: 12, marginBottom: 8 }} />
          <SkeletonItem width="80%" height={14} style={{ marginBottom: 6 }} />
          <SkeletonItem width="60%" height={12} />
        </View>
      </View>
    );
  }

  // List Item Skeleton (default)
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={styles.listItem}>
          <SkeletonItem width={50} height={50} style={{ borderRadius: 25, marginRight: 15 }} />
          <View style={{ flex: 1 }}>
            <SkeletonItem width="70%" height={16} style={{ marginBottom: 8 }} />
            <SkeletonItem width="40%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  skeleton: {
    backgroundColor: '#E1E9EE',
    borderRadius: 4,
  },
  card: {
    flexDirection: 'row',
    marginBottom: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderRadius: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 10,
  },
  gridItem: {
    width: '48%',
    marginBottom: 20,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
});

export default SkeletonLoader;
