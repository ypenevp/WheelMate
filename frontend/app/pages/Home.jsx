import { Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons, Feather, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import "../global.css"; 

export default function Home() {
    const navigation = useNavigation();
    return (
        <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} showsVerticalScrollIndicator={false}>

            <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 32 }}>
                <View style={{ backgroundColor: '#eff6ff', borderRadius: 24, padding: 24 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <View style={{ width: 40, height: 40, backgroundColor: '#3b82f6', borderRadius: 9999, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                            <MaterialIcons name="accessible" size={22} color="#fff" />
                        </View>
                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>WheelMate</Text>
                    </View>
                    <Text style={{ color: '#4b5563', fontSize: 14, lineHeight: 20 }}>
                        Интелигентна платформа за инвалидни колички — GPS проследяване, умна навигация, SOS сигнали и сензори за препятствия. Вашата мобилност, безопасност и независимост.
                    </Text>
                    <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 5 }}>
                        <TouchableOpacity  style={{ backgroundColor: '#3b82f6', borderRadius: 9999, paddingVertical: 12, paddingHorizontal: 24, alignSelf: 'flex-start', marginTop: 16 }} activeOpacity={0.7} >
                            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>+ Add new wheelchair</Text>
                        </TouchableOpacity>
                        <TouchableOpacity  style={{ backgroundColor: '#3b82f6', borderRadius: 9999, paddingVertical: 12, paddingHorizontal: 24, alignSelf: 'flex-start', marginTop: 16 }} activeOpacity={0.7} onPress={() => navigation.navigate('RelativesCareTakers')} >
                            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>+ Add relative/care taker</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                    <View style={{ width: '48%', backgroundColor: '#f9fafb', borderRadius: 16, padding: 16, marginBottom: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <View style={{ width: 40, height: 40, backgroundColor: '#dbeafe', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                                <MaterialIcons name="accessible" size={20} color="#3b82f6" />
                            </View>
                            <View style={{ backgroundColor: '#dcfce7', borderRadius: 9999, paddingHorizontal: 8, paddingVertical: 2 }}>
                                <Text style={{ color: '#16a34a', fontSize: 12, fontWeight: '600' }}>+3</Text>
                            </View>
                        </View>
                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>24</Text>
                        <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>Active Units</Text>
                    </View>

                    <View style={{ width: '48%', backgroundColor: '#f9fafb', borderRadius: 16, padding: 16, marginBottom: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <View style={{ width: 40, height: 40, backgroundColor: '#dbeafe', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                                <Feather name="users" size={18} color="#3b82f6" />
                            </View>
                            <View style={{ backgroundColor: '#dcfce7', borderRadius: 9999, paddingHorizontal: 8, paddingVertical: 2 }}>
                                <Text style={{ color: '#16a34a', fontSize: 12, fontWeight: '600' }}>+12</Text>
                            </View>
                        </View>
                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>156</Text>
                        <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>Users</Text>
                    </View>

                    <View style={{ width: '48%', backgroundColor: '#f9fafb', borderRadius: 16, padding: 16 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <View style={{ width: 40, height: 40, backgroundColor: '#dcfce7', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                                <Ionicons name="location" size={18} color="#22c55e" />
                            </View>
                            <View style={{ backgroundColor: '#dcfce7', borderRadius: 9999, paddingHorizontal: 8, paddingVertical: 2 }}>
                                <Text style={{ color: '#16a34a', fontSize: 12, fontWeight: '600' }}>+7</Text>
                            </View>
                        </View>
                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>89</Text>
                        <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>Routes Today</Text>
                    </View>
                    <View style={{ width: '48%', backgroundColor: '#f9fafb', borderRadius: 16, padding: 16 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <View style={{ width: 40, height: 40, backgroundColor: '#f3e8ff', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                                <Feather name="activity" size={18} color="#a855f7" />
                            </View>
                            <View style={{ backgroundColor: '#dcfce7', borderRadius: 9999, paddingHorizontal: 8, paddingVertical: 2 }}>
                                <Text style={{ color: '#16a34a', fontSize: 12, fontWeight: '600' }}>+0.2%</Text>
                            </View>
                        </View>
                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>99.8%</Text>
                        <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>Uptime</Text>
                    </View>
                </View>
            </View>

            <View style={{ paddingHorizontal: 20, marginBottom: 32 }}>
                {[
                    { icon: 'accessible', iconLib: 'material', color: '#3b82f6', bgVal: '#dbeafe', title: 'Fleet Management', desc: 'Track, add and manage your entire wheelchair fleet with ease.', route: "Settings" },
                    { icon: 'location', iconLib: 'ionicons', color: '#22c55e', bgVal: '#dcfce7', title: 'Live Tracking', desc: 'Real-time GPS monitoring and route navigation on an interactive map.', route: "Map" },
                    { icon: 'tablet-landscape', iconLib: 'ionicons', color: '#f59e0b', bgVal: '#fef3c7', title: 'Monitoring', desc: 'Continuous oversight of your fleet\'s performance and status.', route: "Monitoring" },
                ].map((item, i) => (
                    <TouchableOpacity
                        key={i}
                        style={{ backgroundColor: '#f9fafb', borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}
                        activeOpacity={0.7}
                        onPress={() => navigation.navigate(item.route)}
                    >

                        <View style={{ width: 48, height: 48, backgroundColor: item.bgVal, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                            {item.iconLib === 'material' && <MaterialIcons name={item.icon} size={22} color={item.color} />}
                            {item.iconLib === 'ionicons' && <Ionicons name={item.icon} size={22} color={item.color} />}
                            {item.iconLib === 'feather' && <Feather name={item.icon} size={22} color={item.color} />}
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: '#111827', fontWeight: 'bold', fontSize: 16 }}>{item.title}</Text>
                            <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 2, lineHeight: 16 }}>{item.desc}</Text>
                        </View>
                        <Feather name="chevron-right" size={20} color="#d1d5db" />
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView >
    );
}