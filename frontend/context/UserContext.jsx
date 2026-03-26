import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GetUserDetails } from '../app/services/userDetails.js';
import { useAuth } from './AuthContext.jsx';

const UserContext = createContext(null);

export function UserProvider({ children }) {
    const [user, setUser] = useState(null);
    const { user: authUser, isLoading: authLoading } = useAuth();

    useEffect(() => {
        const fetchUserDetails = async () => {
            try {
                if (authLoading) return;
                if (authUser) {
                    const token = await AsyncStorage.getItem('access');
                    if (token) {
                        const userDetails = await GetUserDetails();
                        setUser(userDetails);
                    } else {
                        setUser(null);
                    }
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error('Error loading user details:', error);
                setUser(null);
            }
        };
        fetchUserDetails();
    }, [authUser, authLoading]);

    return (
        <UserContext.Provider value={{ user }}>
            {children}
        </UserContext.Provider>
    );
}

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error('useUser must be used within UserProvider');
    return context;
};