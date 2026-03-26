import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, Image, Pressable,
    Animated, Dimensions, TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'react-native';


const TopNav = ({ navigation, currentRoute }) => {

    const allTabs = [
        { name: 'Home',     route: 'Home' },
        { name: 'Stats',    route: 'Stats' },
        { name: 'Settings', route: 'Settings' },
    ];

    const isHome = currentRoute === 'Home';

    const homeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(homeAnim, {
            toValue: isHome ? 1 : 0,
            useNativeDriver: true,
            tension: 90,
            friction: 10,
        }).start();
    }, [isHome]);


    const [open, setOpen] = useState(false);
    const screenWidth = Dimensions.get('window').width;
    const slideAnim = useRef(new Animated.Value(screenWidth)).current;

    const togglePanel = () => {
        if (open) {
            Animated.timing(slideAnim, {
                toValue: screenWidth,
                duration: 450,
                useNativeDriver: true,
            }).start(() => setOpen(false));
        } else {
            setOpen(true);
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 450,
                useNativeDriver: true,
            }).start();
        }
    };

    const navigateTo = (route) => {
        navigation.navigate(route);
        togglePanel();
    };

    // const visibleTabs = allTabs.filter(tab => {
    //     if (tab.adminOnly) return isLoggedIn && userDetails?.role === 'ADMIN';
    //     return true;
    // });

    return (
        <>
            <StatusBar barStyle="dark-content" />

            <View style={{
                width: '100%',
                height: 110,
                backgroundColor: '#fff',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.4,
                shadowRadius: 6,
                elevation: 8,
                zIndex: 50,
                paddingBottom: 4,
                paddingTop: 50,
                overflow: 'visible',
            }}>

                {/* ── Logo + name ─────────────────────────────────────────── */}
                <TouchableOpacity
                    onPress={() => navigation.navigate('Home')}
                    activeOpacity={0.8}
                    style={{ paddingLeft: 4, paddingRight: 12 }}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Image
                            source={require('../../assets/icon.png')}
                            style={{ width: 60, height: 60, resizeMode: 'cover' }}
                        />
                        <View style={{ alignItems: 'center' }}>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#15803d' }}>
                                BinTrack
                            </Text>
                            {/* Underline springs in when on Home */}
                            <Animated.View style={{
                                height: 2,
                                width: '85%',
                                borderRadius: 1,
                                backgroundColor: '#15803d',
                                marginTop: 2,
                                transform: [{ scaleX: homeAnim }],
                            }} />
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Login / Sign-up
                {!isLoggedIn && !authLoading && (
                    <View style={{
                        flexDirection: 'row',
                        backgroundColor: '#f8f9fa',
                        borderRadius: 15,
                        overflow: 'hidden',
                        borderWidth: 2,
                        borderColor: '#15803d',
                    }}>
                        <TouchableOpacity
                            onPress={openLogin}
                            style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#fff' }}
                        >
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#15803d' }}>Log In</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={openSignup}
                            style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#15803d' }}
                        >
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                )} */}

                <Pressable onPress={togglePanel} style={{ paddingHorizontal: 12, marginRight: 4 }}>
                    <Text style={{ fontSize: 38, color: '#15803d' }}>☰</Text>
                </Pressable>
            </View>

            {/* Backdrop */}
            {open && (
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={togglePanel}
                    style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        zIndex: 90,
                    }}
                />
            )}

            {/* Slide-in panel*/}
            {open && (
                <Animated.View style={{
                    position: 'absolute',
                    top: 0, bottom: 0, right: 0,
                    width: screenWidth * 0.40,
                    backgroundColor: '#fff',
                    zIndex: 100,
                    shadowColor: '#000',
                    shadowOpacity: 0.15,
                    shadowOffset: { width: -4, height: 0 },
                    shadowRadius: 8,
                    elevation: 10,
                    paddingTop: 60,
                    transform: [{ translateX: slideAnim }],
                }}>
                    <TouchableOpacity
                        onPress={togglePanel}
                        style={{ padding: 16, alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}
                    >
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#15803d' }}>✕</Text>
                    </TouchableOpacity>

                    {allTabs.map((tab) => (
                        <TouchableOpacity
                            key={tab.route}
                            onPress={() => navigateTo(tab.route)}
                            style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}
                        >
                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#15803d' }}>
                                {tab.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </Animated.View>
            )}
        </>
    );
};

export default TopNav;