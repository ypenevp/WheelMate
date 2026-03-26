import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    ScrollView,
    Animated,
    Modal,
} from 'react-native';
import { MaterialIcons, Feather, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import "../global.css";
import TopNav from '../components/topNav.jsx';
import BottomNav from '../components/bottomNav.jsx';
import PersonalInfoModal from '../components/PersonalInfo.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useUser } from '../../context/UserContext.jsx';

const mockUser = {
    name: 'Borislav Stoinev',
    email: 'borislav@example.com',
    role: 'Random User',
};

const languageOptions = [
    { label: 'English', value: 'en' },
    { label: 'Български', value: 'bg' },
    { label: 'Русский', value: 'ru' },
    { label: 'Deutsch', value: 'de' },
];

const LanguageDropdown = ({ selectedLanguage, onSelect, isOpen, onToggle }) => {
    const slideAnim = useRef(new Animated.Value(-50)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        if (isOpen) {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: -50,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [isOpen]);

    return (
        <>
            <TouchableOpacity
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    backgroundColor: '#f3f4f6',
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#e5e7eb',
                }}
                onPress={onToggle}
            >
                <Text style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: '#111827',
                    marginRight: 8,
                }}>
                    {selectedLanguage}
                </Text>
                <Ionicons
                    name={isOpen ? "chevron-up" : "chevron-down"}
                    size={16}
                    color="#6b7280"
                />
            </TouchableOpacity>

            <Modal
                visible={isOpen}
                transparent
                animationType="none"
                onRequestClose={onToggle}
            >
                <TouchableOpacity
                    style={{
                        flex: 1,
                    }}
                    onPress={onToggle}
                    activeOpacity={1}
                >
                    <Animated.View
                        style={{
                            position: 'absolute',
                            top: '75%',
                            right: 16,
                            backgroundColor: '#fff',
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: '#e5e7eb',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.15,
                            shadowRadius: 12,
                            elevation: 10,
                            minWidth: 140,
                            overflow: 'hidden',
                            transform: [{ translateY: slideAnim }],
                            opacity: opacityAnim,
                        }}>
                        {languageOptions.map((lang, index) => (
                            <TouchableOpacity
                                key={lang.value}
                                style={{
                                    paddingHorizontal: 14,
                                    paddingVertical: 12,
                                    borderBottomWidth: index < languageOptions.length - 1 ? 1 : 0,
                                    borderBottomColor: '#f0f0f0',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    backgroundColor: selectedLanguage === lang.label ? '#f0f4ff' : '#fff',
                                }}
                                onPress={() => {
                                    onSelect(lang.label, lang.value);
                                    onToggle();
                                }}
                            >
                                <Text style={{
                                    fontSize: 13,
                                    color: selectedLanguage === lang.label ? '#3b82f6' : '#111827',
                                    fontWeight: selectedLanguage === lang.label ? '600' : '400',
                                }}>
                                    {lang.label}
                                </Text>
                                {selectedLanguage === lang.label && (
                                    <Ionicons name="checkmark" size={14} color="#3b82f6" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </Animated.View>
                </TouchableOpacity>
            </Modal>
        </>
    );
};

const CustomToggle = ({ value, onValueChange }) => {
    const [animatedValue] = useState(new Animated.Value(value ? 1 : 0));

    const handleToggle = () => {
        Animated.timing(animatedValue, {
            toValue: value ? 0 : 1,
            duration: 300,
            useNativeDriver: false,
        }).start();
        onValueChange(!value);
    };

    const translateX = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 25],
    });

    const backgroundColor = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['#e5e7eb', '#3b82f6'],
    });

    return (
        <TouchableOpacity
            style={{
                width: 60,
                height: 35,
                borderRadius: 20,
                padding: 4,
                justifyContent: 'center',
            }}
            onPress={handleToggle}
            activeOpacity={0.8}
        >
            <Animated.View
                style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: 20,
                    backgroundColor: backgroundColor,
                    justifyContent: 'center',
                }}
            >
                <Animated.View
                    style={{
                        width: 28,
                        height: 28,
                        borderRadius: 16,
                        backgroundColor: '#fff',
                        transform: [{ translateX }],
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.15,
                        shadowRadius: 3,
                        elevation: 3,
                    }}
                />
            </Animated.View>
        </TouchableOpacity>
    );
};

const SettingRow = ({ icon, label, value, trailing, onPress, destructive, isCheckbox, isChecked, onCheckChange }) => (
    <TouchableOpacity
        style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 14,
            gap: 14,
            ...(destructive && { justifyContent: 'center' })
        }}
        onPress={isCheckbox ? () => onCheckChange(!isChecked) : onPress}
        activeOpacity={0.7}
    >
        <View style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor: destructive ? 'rgba(239,68,68,0.1)' : '#f3f4f6',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            {icon}
        </View>

        <Text style={{
            flex: 1,
            fontSize: 16,
            fontWeight: '500',
            color: destructive ? '#ef4444' : '#111827',
        }}>
            {label}
        </Text>

        {value && !isCheckbox && !trailing && (
            <Text style={{
                fontSize: 14,
                color: '#9ca3af',
                marginRight: 4,
            }}>
                {value}
            </Text>
        )}

        {trailing}

        {!trailing && !destructive && isCheckbox && (
            <View style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                borderWidth: 2,
                borderColor: isChecked ? '#3b82f6' : '#d1d5db',
                backgroundColor: isChecked ? '#3b82f6' : '#fff',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                {isChecked && (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                )}
            </View>
        )}

        {!trailing && !destructive && !isCheckbox && (
            <Ionicons name="chevron-forward" size={18} color="#a0a0a0" />
        )}
    </TouchableOpacity>
);

const SectionTitle = ({ children }) => (
    <Text style={{
        fontSize: 12,
        fontWeight: '700',
        color: '#9ca3af',
        letterSpacing: 1.5,
        marginBottom: 8,
        marginLeft: 4,
    }}>
        {children}
    </Text>
);

export default function Settings({ navigation }) {
    const [profileImage, setProfileImage] = useState(null);
    const [darkMode, setDarkMode] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [selectedLanguage, setSelectedLanguage] = useState('English');
    const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
    const [showPersonalInfo, setShowPersonalInfo] = useState(false);

    const { user: authUser, logout } = useAuth();
    const { user: userDetails } = useUser();
    const isLoggedIn = !!authUser;


    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            alert('Sorry, we need camera roll permissions!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            setProfileImage(result.assets[0].uri);
        }
    };

    const handleLanguageChange = (label, value) => {
        setSelectedLanguage(label);
        console.log('Selected language:', label, value);
    };

    const handleSignOut = async () => {
        await logout();
        navigation.navigate('Home');
    };


    return (
        <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>

            <ScrollView
                scrollEnabled={!languageDropdownOpen}
                contentContainerStyle={{
                    paddingHorizontal: 16,
                    paddingTop: 48,
                    paddingBottom: 50,
                }}
            >
                <View style={{
                    alignItems: 'center',
                    marginBottom: 32,
                }}>
                    <View style={{ position: 'relative', marginBottom: 16, marginTop: -15 }}>
                        <Image
                            source={
                                profileImage
                                    ? { uri: profileImage }
                                    : require('../../assets/defaultIcon.jpg')
                            }
                            style={{
                                width: 128,
                                height: 128,
                                borderRadius: 64,
                                borderWidth: 4,
                                borderColor: '#fff',
                            }}
                        />
                        <TouchableOpacity
                            style={{
                                position: 'absolute',
                                bottom: -2,
                                right: -2,
                                width: 36,
                                height: 36,
                                borderRadius: 18,
                                backgroundColor: '#3b82f6',
                                alignItems: 'center',
                                justifyContent: 'center',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.15,
                                shadowRadius: 4,
                                elevation: 4,
                            }}
                            onPress={pickImage}
                        >
                            <Ionicons name="camera" size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* User Info */}
                    <Text style={{
                        fontSize: 24,
                        fontWeight: '600',
                        color: '#111827',
                        letterSpacing: -0.5,
                    }}>
                        {userDetails?.username || mockUser.name}
                    </Text>

                    <Text style={{
                        fontSize: 14,
                        color: '#6b7280',
                        marginTop: 2,
                    }}>
                        {userDetails?.email || mockUser.email}
                    </Text>

                    <View style={{
                        marginTop: 8,
                        backgroundColor: 'rgba(59,130,246,0.1)',
                        paddingHorizontal: 12,
                        paddingVertical: 3,
                        borderRadius: 999,
                    }}>
                        <Text style={{
                            fontSize: 12,
                            fontWeight: '600',
                            color: '#3b82f6',
                        }}>
                            {userDetails?.role || mockUser.role}
                        </Text>
                    </View>
                </View>

                <SectionTitle>ACCOUNT</SectionTitle>
                <View style={{
                    backgroundColor: '#fff',
                    borderRadius: 16,
                    marginBottom: 16,
                    overflow: 'hidden',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.04,
                    shadowRadius: 3,
                    elevation: 1,
                }}>
                    <SettingRow
                        icon={<Feather name="user" size={18} color="#6b7280" />}
                        label="Personal Information"
                        value={userDetails?.username || mockUser.name}
                        onPress={() => setShowPersonalInfo(true)}
                    />
                    <View style={{
                        height: 1,
                        backgroundColor: '#f3f4f6',
                        marginLeft: 56,
                    }} />

                    <SettingRow
                        icon={<MaterialIcons name="lock" size={18} color="#6b7280" />}
                        label="Change Password"
                        onPress={() => {
                            console.log('Change Password pressed');
                        }}
                    />
                    <View style={{
                        height: 1,
                        backgroundColor: '#f3f4f6',
                        marginLeft: 56,
                    }} />

                    <SettingRow
                        icon={<Ionicons name="notifications-outline" size={18} color="#6b7280" />}
                        label="Notifications"
                        isCheckbox={true}
                        isChecked={notificationsEnabled}
                        onCheckChange={setNotificationsEnabled}
                    />
                </View>

                <SectionTitle>PREFERENCES</SectionTitle>
                <View style={{
                    backgroundColor: '#fff',
                    borderRadius: 16,
                    marginBottom: 16,
                    overflow: 'visible',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.04,
                    shadowRadius: 3,
                    elevation: 1,
                }}>
                    <SettingRow
                        icon={<Ionicons name="moon-outline" size={18} color="#6b7280" />}
                        label="Dark Mode"
                        trailing={
                            <CustomToggle
                                value={darkMode}
                                onValueChange={setDarkMode}
                            />
                        }
                        onPress={() => setDarkMode((p) => !p)}
                    />
                    <View style={{
                        height: 1,
                        backgroundColor: '#f3f4f6',
                        marginLeft: 56,
                    }} />

                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: 16,
                            paddingVertical: 14,
                            gap: 14,
                            position: 'relative',
                            zIndex: 1000,
                        }}
                    >
                        <View style={{
                            width: 36,
                            height: 36,
                            borderRadius: 12,
                            backgroundColor: '#f3f4f6',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <Ionicons name="globe-outline" size={18} color="#6b7280" />
                        </View>

                        <Text style={{
                            flex: 1,
                            fontSize: 16,
                            fontWeight: '500',
                            color: '#111827',
                        }}>
                            Language
                        </Text>

                        <LanguageDropdown
                            selectedLanguage={selectedLanguage}
                            onSelect={handleLanguageChange}
                            isOpen={languageDropdownOpen}
                            onToggle={() => setLanguageDropdownOpen(!languageDropdownOpen)}
                        />
                    </View>
                </View>

                {isLoggedIn && (
                    <View style={{
                        backgroundColor: '#fff',
                        borderRadius: 16,
                        marginTop: 12,
                        marginBottom: 16,
                        overflow: 'hidden',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.04,
                        shadowRadius: 3,
                        elevation: 1,
                    }}>
                        <SettingRow
                            icon={<Feather name="log-out" size={18} color="#ef4444" />}
                            label="Sign Out"
                            destructive
                            onPress={handleSignOut}
                        />
                    </View>
                )}

                <View style={{ height: 50 }} />
            </ScrollView>

            <PersonalInfoModal
                visible={showPersonalInfo}
                onClose={() => setShowPersonalInfo(false)}
            />

        </View>
    );
}