import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [authUser, setAuthUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // On mount, restore session from storage
    useEffect(() => {
        const checkToken = async () => {
            try {
                const token = await AsyncStorage.getItem('access');
                if (token) {
                    setAuthUser({ token });
                } else {
                    setAuthUser(null);
                }
            } catch (error) {
                console.error('Error checking token:', error);
                setAuthUser(null);
            } finally {
                setIsLoading(false);
            }
        };
        checkToken();
    }, []);

    // FIX: previously login() only updated state but never wrote the token to
    // AsyncStorage, so the session was lost on app restart.
    const login = async (userData) => {
        try {
            await AsyncStorage.setItem('access', userData.token);
        } catch (e) {
            console.error('Error saving token:', e);
        }
        setAuthUser(userData);
    };

    const logout = async () => {
        try {
            await AsyncStorage.removeItem('access');
        } catch (e) {
            console.error('Error removing token:', e);
        }
        setAuthUser(null);
    };

    return (
        <AuthContext.Provider value={{ user: authUser, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};