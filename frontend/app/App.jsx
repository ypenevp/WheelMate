import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';

import Home from './pages/Home.jsx';
import Stats from './pages/Stats.jsx';
import Settings from './pages/Settings.jsx'

import TopNav from './components/topNav.jsx';
import BottomNav from './components/bottomNav.jsx';
// import { UIProvider, useUI } from '../context/UIContext.jsx';

const Stack = createStackNavigator();

function RootLayout() {
  const navigation = useNavigation();

  const [currentRoute, setCurrentRoute] = useState('Home');

  useEffect(() => {
    const sync = () => {
      const state = navigation.getState();
      const name = state?.routes[state.index]?.name;
      if (name) setCurrentRoute(name);
    };
    sync();
    const unsub = navigation.addListener('state', sync);
    return unsub;
  }, [navigation]);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <TopNav navigation={navigation} currentRoute={currentRoute} />
      <View style={{ flex: 1 }}>
        <Stack.Navigator screenOptions={{ headerShown: false, detachInactiveScreens: false }}>
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen name="Stats" component={Stats} />
          <Stack.Screen name="Settings" component={Settings} />
        </Stack.Navigator>
      </View>
      <BottomNav navigation={navigation} currentRoute={currentRoute} />
    </View>
  );
}

export default function App() {
  return (
    //<UIProvider>
      <NavigationContainer>
        <RootLayout />
      </NavigationContainer>
    //</UIProvider>
  );
}