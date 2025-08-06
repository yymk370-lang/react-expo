import { Image } from 'expo-image';
import {View,Text, Platform, StyleSheet } from 'react-native';
import { useState } from 'react';

export default function App() {
    const [userInfo, setUserIfno] = useState({})
  return (
    <View>
     <Text onPress={() => setUserIfno({name: 'Jane'})}>App</Text>
    </View>
  );
}

