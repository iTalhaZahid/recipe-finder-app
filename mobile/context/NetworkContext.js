// 🔹 UPDATED: added useRef and new imports
import React, { createContext, useEffect, useState, useContext, useRef } from 'react'; // 🔹 UPDATED (added useRef)
import NetInfo from '@react-native-community/netinfo';
import { ToastAndroid, Platform } from 'react-native'; // 🔹 ADDED
import Toast from 'react-native-toast-message'; // 🔹 ADDED (for iOS cross-platform toast)

const NetworkContext = createContext();

export const NetworkProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const previousConnection = useRef(true); // 🔹 ADDED

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  // 🔹 ADDED: Show toast globally when network state changes
  useEffect(() => {
    if (previousConnection.current && !isConnected) {
      // 🔹 When connection is lost
      if (Platform.OS === 'android') {
        ToastAndroid.show('You have lost internet connection', ToastAndroid.LONG);
      } else {
        Toast.show({
          type: 'error',
          text1: 'No Internet Connection',
          text2: 'Please check your connection.',
        });
      }
    } else if (!previousConnection.current && isConnected) {
      // 🔹 When connection is restored
      if (Platform.OS === 'android') {
        ToastAndroid.show('Internet connection restored', ToastAndroid.SHORT);
      } else {
        Toast.show({
          type: 'success',
          text1: 'Back Online',
          text2: 'Internet connection restored.',
        });
      }
    }
    previousConnection.current = isConnected; // 🔹 keep last state
  }, [isConnected]);

  return (
    <NetworkContext.Provider value={{ isConnected }}>
      {children}
      {Platform.OS !== 'android' && <Toast />}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => useContext(NetworkContext);
