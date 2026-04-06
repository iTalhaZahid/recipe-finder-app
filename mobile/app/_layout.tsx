import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { Slot } from 'expo-router';
import SafeScreen from '../components/SafeScreen';
import { NetworkProvider } from '../context/NetworkContext'; 
import Toast from 'react-native-toast-message'; // 🔹 ADDED for iOS toast rendering

export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache}>
      <NetworkProvider>
        <SafeScreen>
          <StatusBar style="dark" backgroundColor="#fff" translucent={false} />
          {/* <NetworkBanner /> */}

          {/* 🔹 App Routes */}
          <Slot />

          {/* 🔹 iOS Toast Renderer (needed once globally) */}
          <Toast />
        </SafeScreen>
      </NetworkProvider>
    </ClerkProvider>
  );
}
