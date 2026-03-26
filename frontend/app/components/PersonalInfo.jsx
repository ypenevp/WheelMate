import React from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Pressable,
} from 'react-native';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext.jsx';
import { useUser } from '../../context/UserContext.jsx';

const SectionLabel = ({ icon, label }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, marginBottom: 8 }}>
        {icon}
        <Text style={{ fontSize: 11, fontWeight: '700', color: '#9ca3af', letterSpacing: 1.5, textTransform: 'uppercase' }}>
            {label}
        </Text>
    </View>
);

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

const Field = ({ label, defaultValue, style }) => (
    <View style={[{ flex: 1 }, style]}>
        {label && (
            <Text style={{ fontSize: 12, fontWeight: '500', color: '#9ca3af', marginBottom: 4 }}>
                {label}
            </Text>
        )}
        <TextInput
            defaultValue={defaultValue}
            style={{
                backgroundColor: '#f4f5f7',
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 15,
                color: '#1f2937',
                borderWidth: 1,
                borderColor: '#e5e7eb',
            }}
        />
    </View>
);

export default function PersonalInfoModal({ visible, onClose }) {
    const [profileImage, setProfileImage] = React.useState(null);
    const { user: authUser, logout } = useAuth();
    const { user: userDetails } = useUser();

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <Pressable
                onPress={onClose}
                style={{
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 20,
                }}
            >
                <Pressable
                    onPress={(e) => e.stopPropagation()}
                    style={{
                        width: '100%',
                        maxWidth: 460,
                        backgroundColor: '#fff',
                        borderRadius: 20,
                        overflow: 'hidden',
                    }}
                >
                    {/* Dark Header */}
                    <View
                        style={{
                            backgroundColor: '#1e293b',
                            paddingHorizontal: 20,
                            paddingVertical: 18,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 14,
                        }}
                    >
                        <View
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: 14,
                                backgroundColor: '#334155',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Feather name="user" size={22} color="#94a3b8" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 18, fontWeight: '600', color: '#fff' }}>
                                Personal Information
                            </Text>
                            <Text style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>
                                Manage your profile details
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={onClose}
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Ionicons name="close" size={20} color="#94a3b8" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={{ maxHeight: 480 }}
                        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}
                    >
                        {/* Avatar Row */}
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginBottom: 4,
                            }}
                        >
                            <View
                                style={{
                                    width: 52,
                                    height: 52,
                                    borderRadius: 26,
                                    backgroundColor: '#7c3aed',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Text style={{ fontSize: 18, fontWeight: '700', color: '#fff' }}>
                                    {userDetails?.username ? userDetails.username.charAt(0) : 'BS'}
                                </Text>
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937' }}>
                                    {userDetails?.username || 'Borislav Stoinev'}
                                </Text>
                                <Text style={{ fontSize: 13, color: '#9ca3af', marginTop: 1 }}>
                                    {userDetails?.email || 'borislav@example.com'}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={pickImage}>
                                <Text style={{ fontSize: 14, fontWeight: '600', color: '#3b82f6' }}>
                                    Change photo
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Full Name */}
                        <SectionLabel
                            icon={<Feather name="user" size={16} color="#9ca3af" />}
                            label="Full Name"
                        />
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <Field label="First name" defaultValue={userDetails?.firstName || 'Borislav'} />
                            <Field label="Last name" defaultValue={userDetails?.lastName || 'Stoinev'} />
                        </View>

                        {/* Email */}
                        <SectionLabel
                            icon={<MaterialIcons name="mail-outline" size={16} color="#9ca3af" />}
                            label="Email Address"
                        />
                        <View>
                            <TextInput
                                defaultValue={userDetails?.email || 'borislav@example.com'}
                                style={{
                                    backgroundColor: '#f4f5f7',
                                    borderRadius: 10,
                                    paddingHorizontal: 14,
                                    paddingVertical: 12,
                                    fontSize: 15,
                                    color: '#1f2937',
                                    borderWidth: 1,
                                    borderColor: '#e5e7eb',
                                    paddingRight: 80,
                                }}
                            />
                            <View
                                style={{
                                    position: 'absolute',
                                    right: 12,
                                    top: '50%',
                                    transform: [{ translateY: -11 }],
                                    backgroundColor: '#ecfdf5',
                                    paddingHorizontal: 8,
                                    paddingVertical: 3,
                                    borderRadius: 999,
                                }}
                            >
                                <Text style={{ fontSize: 11, fontWeight: '600', color: '#059669' }}>Verified</Text>
                            </View>
                        </View>

                        {/* Phone */}
                        <SectionLabel
                            icon={<Feather name="phone" size={16} color="#9ca3af" />}
                            label="Phone Number"
                        />
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 6,
                                    backgroundColor: '#f4f5f7',
                                    borderRadius: 10,
                                    paddingHorizontal: 12,
                                    borderWidth: 1,
                                    borderColor: '#e5e7eb',
                                }}
                            >
                                <Text style={{ fontSize: 13, color: '#6b7280' }}>🇧🇬 +359</Text>
                            </View>
                            <Field defaultValue="888 123 456" style={{ flex: 1 }} />
                        </View>

                        {/* Address */}
                        <SectionLabel
                            icon={<Ionicons name="location-outline" size={16} color="#9ca3af" />}
                            label="Address"
                        />
                        <Field defaultValue="ul. Vitosha 15" />
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                            <Field defaultValue="Sofia" />
                            <Field defaultValue="Sofia" />
                            <Field defaultValue="1000" />
                        </View>
                    </ScrollView>

                    {/* Footer */}
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingHorizontal: 20,
                            paddingVertical: 16,
                            borderTopWidth: 1,
                            borderTopColor: '#f3f4f6',
                        }}
                    >
                        <TouchableOpacity onPress={onClose}>
                            <Text style={{ fontSize: 15, fontWeight: '600', color: '#1f2937' }}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{
                                backgroundColor: '#3b82f6',
                                paddingHorizontal: 24,
                                paddingVertical: 12,
                                borderRadius: 999,
                            }}
                        >
                            <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff' }}>Save changes</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}