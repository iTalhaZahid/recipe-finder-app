// components/NetworkBanner.js
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetwork } from '../context/NetworkContext';

export default function NetworkBanner() {
  const { isConnected } = useNetwork();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets(); // detect notch / status bar height

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isConnected ? 0 : 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [isConnected]);

  if (isConnected) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        { opacity: fadeAnim, top: insets.top + 10 }, // offset from status bar
      ]}
    >
      <Text style={styles.text}>🚫 No Internet Connection</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: '#ffcccc',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    zIndex: 1000,
  },
  text: {
    color: '#333',
    fontWeight: '600',
  },
});