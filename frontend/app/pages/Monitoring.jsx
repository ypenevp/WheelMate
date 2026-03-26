import { Text, View, ScrollView, TouchableOpacity } from 'react-native';
import "../global.css"
import { MaterialIcons, Feather, Ionicons } from '@expo/vector-icons';
import { postWheelChair, getAllWheelChair } from '../services/wheelChair.js';
import { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';

export default function Monitoring() {
    const [wheelchairs, setWheelchairs] = useState([]);
    const navigation = useNavigation();

    useEffect(() => {
        const fetchWheelchairs = async () => {
            try {
                const wheelchairsData = await getAllWheelChair();
                console.log("Data received on frontend:", wheelchairsData);
                setWheelchairs(wheelchairsData);
            } catch (error) {
                console.error("Error fetching wheelchairs:", error);
            }
        };
        fetchWheelchairs();
    }, []);

    return (
        <ScrollView contentContainerStyle={{ alignItems: 'center', paddingTop: 20, paddingBottom: 20, flexDirection: 'column' }}>
            <Text className="font-bold text-blue-500 text-2xl mb-4">All Wheelchairs</Text>
            <TouchableOpacity onPress={() => navigation.navigate('FormData')} style = {{flexDirection: "row", marginBottom: 20, paddingHorizontal: 15, paddingVertical: 10, backgroundColor: '#3b82f6', borderRadius: 9999 }}>
                <Text style={{ color: 'white', flexBasis: "flex-end" }}>+</Text>
            </TouchableOpacity>

            {wheelchairs.length === 0 ? (
                <Text className="text-gray-500">No wheelchairs found.</Text>
            ) : (
                wheelchairs.map((wheelchair) => (
                    <View key={wheelchair.id} className="bg-gray-100 rounded-lg p-4 m-2 w-[90%] border border-gray-300">
                        <Text className="text-gray-800 font-bold text-lg">Wheelchair #{wheelchair.id}</Text>
                        <Text className="text-gray-700">Speed: <Text className="font-bold">{wheelchair.speed} km/h</Text></Text>
                        
                        <Text className="text-gray-700">Coordinates: {wheelchair.gpsCoordinate}</Text>

                        <Text className="text-gray-600 text-xs mt-2">
                            Status: {wheelchair.panicStatus ? "PANIC" : "Normal"}
                        </Text>
                    </View>
                ))
            )}
        </ScrollView>
    );
}