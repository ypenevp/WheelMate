import { Text, View, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { MaterialIcons, Feather, Ionicons } from '@expo/vector-icons';
import { getAllWheelChair } from '../services/wheelChair.js';
import { GetAllRelatives, GetAllCaretakers } from '../services/userRelationship.js';
import { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext.jsx';

export default function Monitoring() {
    const [wheelchairs, setWheelchairs] = useState([]);
    const { user } = useUser();
    const [relativesData, setRelativesData] = useState([]);
    const [caretakersData, setCaretakersData] = useState([]);

    const fetchWheelchairs = async () => {
        try {
            const data = await getAllWheelChair();
            setWheelchairs(data);
        } catch (error) {
            console.error('Error fetching wheelchairs:', error);
        }
    };

    const handleAllRelatives = async () => {
        try {
            const relatives = await GetAllRelatives();
            setRelativesData(relatives);
        } catch (error) {
            console.error('Error fetching relatives:', error);
        }
    };

    const handleAllCaretakers = async () => {
        try {
            const caretakers = await GetAllCaretakers();
            setCaretakersData(caretakers);
        } catch (error) {
            console.error('Error fetching caretakers:', error);
        }
    };

    useEffect(() => {
        fetchWheelchairs();
        if (user?.role === 'USER') {
            handleAllCaretakers();
            handleAllRelatives();
        }
    }, []);

    const isRelativeOrCaretaker = user?.role === 'RELATIVE' || user?.role === 'CARETAKER';

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: '#f9fafb' }}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
        >
            <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 26, fontWeight: '700', color: '#111827', letterSpacing: -0.5 }}>
                    Monitoring
                </Text>
                <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
                    {isRelativeOrCaretaker ? 'Wheelchair fleet overview' : 'Your relatives & caretakers'}
                </Text>
            </View>

            {isRelativeOrCaretaker ? (
                <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                        <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#dbeafe', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                            <MaterialIcons name="accessible" size={18} color="#3b82f6" />
                        </View>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>
                            All Wheelchairs
                        </Text>
                        <View style={{ marginLeft: 'auto', backgroundColor: '#dbeafe', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 }}>
                            <Text style={{ fontSize: 12, fontWeight: '600', color: '#3b82f6' }}>
                                {wheelchairs.length} units
                            </Text>
                        </View>
                    </View>

                    {wheelchairs.length === 0 ? (
                        <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 56, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: '#f3f4f6' }}>
                            <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                                <MaterialIcons name="accessible" size={26} color="#d1d5db" />
                            </View>
                            <Text style={{ fontSize: 15, fontWeight: '600', color: '#9ca3af' }}>
                                No wheelchairs found
                            </Text>
                            <Text style={{ fontSize: 13, color: '#d1d5db', marginTop: 4 }}>
                                No units are registered yet
                            </Text>
                        </View>
                    ) : (
                        wheelchairs.map((wheelchair) => (
                            <View
                                key={wheelchair.id}
                                style={{ backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#f3f4f6' }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                                    <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                                        <MaterialIcons name="accessible" size={22} color="#3b82f6" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>
                                            Unit #{wheelchair.id}
                                        </Text>
                                        {wheelchair.gpsCoordinate ? (
                                            <TouchableOpacity
                                                onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${wheelchair.gpsCoordinate}`)}
                                            >
                                                <Text style={{ fontSize: 12, color: '#3b82f6', marginTop: 2, textDecorationLine: 'underline' }}>
                                                    {wheelchair.gpsCoordinate}
                                                </Text>
                                            </TouchableOpacity>
                                        ) : (
                                            <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                                                No coordinates
                                            </Text>
                                        )}
                                    </View>
                                    <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: wheelchair.panicStatus ? '#fef2f2' : '#f0fdf4', borderWidth: 1, borderColor: wheelchair.panicStatus ? '#fecaca' : '#bbf7d0' }}>
                                        <Text style={{ fontSize: 11, fontWeight: '700', color: wheelchair.panicStatus ? '#ef4444' : '#16a34a' }}>
                                            {wheelchair.panicStatus ? 'PANIC' : 'SAFE'}
                                        </Text>
                                    </View>
                                </View>

                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                    <View style={{ flex: 1, backgroundColor: '#f9fafb', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#f3f4f6' }}>
                                        <Feather name="activity" size={14} color="#3b82f6" style={{ marginBottom: 4 }} />
                                        <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>
                                            {wheelchair.speed ?? '—'} km/h
                                        </Text>
                                        <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Speed</Text>
                                    </View>

                                    <View style={{ flex: 1, backgroundColor: '#f9fafb', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#f3f4f6' }}>
                                        <Ionicons name="person" size={14} color="#8b5cf6" style={{ marginBottom: 4 }} />
                                        <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>
                                            {wheelchair.userInchair ? 'Yes' : 'No'}
                                        </Text>
                                        <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>In Chair</Text>
                                    </View>

                                    <View style={{ flex: 1, backgroundColor: '#f9fafb', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#f3f4f6' }}>
                                        <Ionicons name="location" size={14} color="#10b981" style={{ marginBottom: 4 }} />
                                        <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>Live</Text>
                                        <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>GPS</Text>
                                    </View>
                                </View>
                            </View>
                        ))
                    )}
                </View>
            ) : (
                <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                        <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#a3c0ff', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                            <Ionicons name="people" size={17} color="#2f61b1" />
                        </View>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>Relatives</Text>
                        <View style={{ marginLeft: 'auto', backgroundColor: '#a3c0ff', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 }}>
                            <Text style={{ fontSize: 12, fontWeight: '600', color: '#2f61b1' }}>{relativesData.length}</Text>
                        </View>
                    </View>

                    {relativesData.length === 0 ? (
                        <View style={{ alignItems: 'center', paddingVertical: 36, backgroundColor: '#fff', borderRadius: 20, marginBottom: 24, borderWidth: 1, borderColor: '#f3f4f6' }}>
                            <Text style={{ fontSize: 14, color: '#d1d5db', fontWeight: '500' }}>No relatives added yet</Text>
                        </View>
                    ) : (
                        <View style={{ marginBottom: 24 }}>
                            {relativesData.map((relative) => (
                                <View
                                    key={relative.id}
                                    style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1, borderWidth: 1, borderColor: '#f3f4f6' }}
                                >
                                    <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: '#a3c0ff', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                                        <Text style={{ fontSize: 16, fontWeight: '700', color: '#2f61b1' }}>
                                            {relative.username?.[0]?.toUpperCase() || '?'}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>{relative.username}</Text>
                                        <Text style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>{relative.email}</Text>
                                    </View>
                                    <View style={{ paddingHorizontal: 9, paddingVertical: 3, backgroundColor: '#a3c0ff', borderRadius: 20 }}>
                                        <Text style={{ fontSize: 11, fontWeight: '600', color: '#2f61b1' }}>Relative</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                        <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#d1fae5', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                            <Feather name="user-check" size={16} color="#059669" />
                        </View>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>Caretakers</Text>
                        <View style={{ marginLeft: 'auto', backgroundColor: '#d1fae5', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 }}>
                            <Text style={{ fontSize: 12, fontWeight: '600', color: '#059669' }}>{caretakersData.length}</Text>
                        </View>
                    </View>

                    {caretakersData.length === 0 ? (
                        <View style={{ alignItems: 'center', paddingVertical: 36, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: '#f3f4f6' }}>
                            <Text style={{ fontSize: 14, color: '#d1d5db', fontWeight: '500' }}>No caretakers added yet</Text>
                        </View>
                    ) : (
                        caretakersData.map((caretaker) => (
                            <View
                                key={caretaker.id}
                                style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1, borderWidth: 1, borderColor: '#f3f4f6' }}
                            >
                                <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: '#d1fae5', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#059669' }}>
                                        {caretaker.username?.[0]?.toUpperCase() || '?'}
                                    </Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>{caretaker.username}</Text>
                                    <Text style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>{caretaker.email}</Text>
                                </View>
                                <View style={{ paddingHorizontal: 9, paddingVertical: 3, backgroundColor: '#d1fae5', borderRadius: 20 }}>
                                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#059669' }}>Caretaker</Text>
                                </View>
                            </View>
                        ))
                    )}
                </View>
            )}
        </ScrollView>
    );
}