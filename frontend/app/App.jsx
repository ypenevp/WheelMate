import React, { useState, useEffect } from 'react';
import { View, Modal, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';

import Home from './pages/Home.jsx';
import Stats from './pages/Stats.jsx';
import Settings from './pages/Settings.jsx';

import TopNav from './components/topNav.jsx';
import BottomNav from './components/bottomNav.jsx';
import Login from './components/logIn.jsx';
import SignUp from './components/signUp.jsx';
import VerifyCode from './components/verify.jsx';
import Success from './components/success.jsx';

import { AuthProvider } from '../context/AuthContext.jsx';
import { UIProvider, useUI } from '../context/UIContext.jsx';
import { UserProvider } from '../context/UserContext.jsx';

const Stack = createStackNavigator();

function RootLayout() {
    const navigation = useNavigation();
    const { modal, openLogin, openSignup, closeModal } = useUI();
    const [currentRoute, setCurrentRoute] = useState('Home');
    const [screen, setScreen] = useState(null); // 'login' | 'signup' | 'verify' | 'success'

    useEffect(() => {
        if (modal === 'login') setScreen('login');
        else if (modal === 'signup') setScreen('signup');
        else if (!modal && !screen?.match(/verify|success/)) setScreen(null);
    }, [modal]);

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

    const closeAll = () => {
        setScreen(null);
        closeModal();
    };

    const isVisible = screen !== null;

    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            <TopNav navigation={navigation} currentRoute={currentRoute} />

            <View style={{ flex: 1 }}>
                <Stack.Navigator screenOptions={{ headerShown: false, detachInactiveScreens: false }}>
                    <Stack.Screen name="Home" component={Home} />
                    <Stack.Screen name="Settings" component={Settings} />
                    <Stack.Screen name="Stats" component={Stats} />
                </Stack.Navigator>
            </View>

            <BottomNav navigation={navigation} currentRoute={currentRoute} />

            <Modal visible={isVisible} transparent animationType="slide" onRequestClose={closeAll}>
                <TouchableOpacity activeOpacity={1} onPress={closeAll}
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
                    <TouchableOpacity activeOpacity={1}>
                        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                            <View style={{
                                backgroundColor: '#fff',
                                borderTopLeftRadius: 28,
                                borderTopRightRadius: 28,
                                padding: 28,
                                paddingBottom: 40,
                            }}>
                                {screen === 'login' && (
                                    <Login
                                        onSignUpPress={() => setScreen('signup')}
                                        onLoginSuccess={closeAll}
                                        onClose={closeAll}
                                    />
                                )}
                                {screen === 'signup' && (
                                    <SignUp
                                        onLoginPress={() => setScreen('login')}
                                        onClose={closeAll}
                                        onShowVerify={() => setScreen('verify')}
                                    />
                                )}
                                {screen === 'verify' && (
                                    <VerifyCode
                                        onSuccess={() => setScreen('success')}
                                    />
                                )}
                                {screen === 'success' && (
                                    <Success onDone={closeAll} />
                                )}
                            </View>
                        </KeyboardAvoidingView>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

export default function App() {
    return (
        <AuthProvider>
          <UserProvider>
            <UIProvider>
                <NavigationContainer>
                    <RootLayout />
                </NavigationContainer>
            </UIProvider>
          </UserProvider>
        </AuthProvider>
    );
}
