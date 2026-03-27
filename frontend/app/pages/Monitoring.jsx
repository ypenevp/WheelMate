import { Text, View, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import "../global.css"
import { MaterialIcons, Feather, Ionicons } from '@expo/vector-icons';
import { getAllWheelChair, postWheelChair } from '../services/wheelChair.js';
import { GetAllRelatives, GetAllCaretakers } from '../services/userRelationship.js';
import { useState, useEffect, use } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../../context/UserContext.jsx';


export default function Monitoring() {
    const [wheelchairs, setWheelchairs] = useState([]);
    const { user } = useUser();
    const [relativesData, setRelativesData] = useState([]);
    const [caretakersData, setCaretakersData] = useState([]);

    const fetchWheelchairs = async () => {
        try {
            const wheelchairsData = await getAllWheelChair();
            console.log("Data received on frontend:", wheelchairsData);
            setWheelchairs(wheelchairsData);
        } catch (error) {
            console.error("Error fetching wheelchairs:", error);
        }
    };

    const handleAddWheelchair = async () => {
        try {
            const newWheelchair = await postWheelChair();
            console.log("New wheelchair created:", newWheelchair);

            setWheelchairs(prev => [...prev, newWheelchair]);
        } catch (error) {
            console.error("Error creating new wheelchair:", error);
        }
    };

    const handleAllRelatives = async () => {
        try {
            const relatives = await GetAllRelatives();
            setRelativesData(relatives);
            console.log("Relatives:", relativesData);
        } catch (error) {
            console.error("Error fetching relatives:", error);
            alert("An error occurred while fetching relatives.");
        }
    };

    const handleAllCaretakers = async () => {
        try {
            const caretakers = await GetAllCaretakers();
            setCaretakersData(caretakers);
            console.log("CareTakers:", caretakersData);
        } catch (error) {
            console.error("Error fetching care takers:", error);
            alert("An error occurred while fetching care takers.");
        }
    };


    useEffect(() => {
        fetchWheelchairs();
        if (user?.role === "USER") {
            handleAllCaretakers();
            handleAllRelatives();
        }
    }, []);


    return (
        <ScrollView contentContainerStyle={{ alignItems: 'center', paddingTop: 20, paddingBottom: 20, flexDirection: 'column' }}>

            {user?.role === "RELATIVE" || user?.role === "CARETAKER" ? (
                <>
                    <Text className="font-bold text-blue-500 text-4xl mb-4">All Wheelchairs</Text>

                    {wheelchairs.map((wheelchair) => (
                        <>
                            {wheelchairs.length === 0 ? (
                                <Text className="text-gray-500 text-lg mt-4">No wheelchairs found.</Text>
                            ) : (
                                <View key={wheelchair.id} className="bg-gray-100 rounded-lg p-4 m-2 w-[90%] border border-gray-300">
                                    <Text className="text-gray-800 font-bold text-lg">Wheelchair: {wheelchair.id}</Text>
                                    <Text className="text-gray-700">Coordinates: {wheelchair.gpsCoordinate}</Text>
                                    <Text className="text-gray-700">In Chair: {wheelchair.inChair ? "Yes" : "No"}</Text>
                                    <Text className="text-gray-700">Status: {wheelchair.panicStatus ? "PANIC" : "SAFE"}</Text>
                                    <Text className="text-gray-700">Speed: <Text className="font-bold">{wheelchair.speed} km/h</Text></Text>
                                </View>
                            )}
                        </>
                    ))}

                </>
            ) : (
                <>
                    <Text style={{ fontSize: 26, fontWeight: 'bold', marginTop: 20 }} className="flex-start">
                        All Relatives
                    </Text>
                    {relativesData.length === 0 ? (
                        <Text className="text-gray-500 text-lg mt-4">No relatives found.</Text>
                    ) : (
                        <View style={{ flexDirection: 'column', marginTop: 10, width: '90%', justifyContent: 'space-between', height: '95%' }}>
                            {relativesData.map((relative) => (
                                <View key={relative.id} className="bg-gray-100 rounded-lg p-4 m-2 w-[90%] border border-gray-300">
                                    <Text className="text-gray-800 font-bold text-lg">Relative: {relative.name}</Text>
                                    <Text className="text-gray-700">Email: {relative.email}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    <Text style={{ fontSize: 26, fontWeight: 'bold', marginTop: 20 }} className="flex-start">
                        All Care Takers
                    </Text>
                    {caretakersData.length === 0 ? (
                        <Text className="text-gray-500 text-lg mt-4">No care takers found.</Text>
                    ) : (
                        <View style={{ flexDirection: 'column', marginTop: 10, width: '90%', justifyContent: 'space-between', height: '95%' }}>
                            {caretakersData.map((caretaker) => (
                                <View key={caretaker.id} className="bg-gray-100 rounded-lg p-4 m-2 w-[90%] border border-gray-300">
                                    <Text className="text-gray-800 font-bold text-lg">Caretaker: {caretaker.username}</Text>
                                    <Text className="text-gray-700">Email: {caretaker.email}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </>
            )
            }
        </ScrollView >
    );
}