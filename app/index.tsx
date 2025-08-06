import { Image } from 'expo-image';
import {View,Text, Platform, StyleSheet } from 'react-native';
import { useState ,useEffect} from 'react';

export default function App() {
    const [userInfo, setUserIfno] = useState({})

    useEffect(() => {
        fetch('https://api.github.com/users/jadensun')
        .then(res => res.json())
    }, []);
  return (
    <View>
     <Text onPress={() => setUserIfno({name: 'Jane'})}>App</Text>
    </View>
  );
}

