import { useState } from "react";
import { Text, View, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { postWheelChair } from '../services/wheelChair.js';

export default function FormData() {
    const [GPScoordinates, setGPSCoordinates] = useState("");
    const [speed, setSpeed] = useState("");
    const [loading, setLoading] = useState(false);

    const onFormSubmitPress = () => {
        if (!GPScoordinates || !speed) {
            alert("Please fill in all fields.");
            return;
        }

        setLoading(true);

        const formData = {
            GPScoordinates,
            speed,
        };

        postWheelChair(formData);
        console.log("Posting to API:", formData);

        console.log("Form Data:", formData);

        setTimeout(() => {
            setLoading(false);
            let message = `Form submitted!`;
            alert(message);
        }, 1000);
    };

    return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", width: "100%" }}>
            <View style={{
                width: 370,
                maxWidth: "100%",
                padding: 30,
                backgroundColor: "#fff",
                borderRadius: 24,
                shadowColor: "#000",
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 8,
                alignItems: "center",
            }}>
                <Text style={{
                    fontSize: 32,
                    fontWeight: "bold",
                    color: "#256df1",
                    marginBottom: 24
                }}>Form Data</Text>

                <TextInput
                    style={{
                        width: "100%",
                        borderWidth: 1,
                        borderColor: "#d1d5db",
                        borderRadius: 16,
                        paddingHorizontal: 20,
                        paddingVertical: 12,
                        marginBottom: 15,
                        fontSize: 18,
                        backgroundColor: "#F7FAFC",
                        color: "#222",
                        fontWeight: "500",
                        letterSpacing: 0.5,
                    }}
                    placeholder="GPS Coordinates"
                    placeholderTextColor="#888"
                    keyboardType="default"
                    value={GPScoordinates}
                    onChangeText={setGPSCoordinates}
                />

                <TextInput
                    style={{
                        width: "100%",
                        borderWidth: 1,
                        borderColor: "#d1d5db",
                        borderRadius: 16,
                        paddingHorizontal: 20,
                        paddingVertical: 12,
                        fontSize: 18,
                        backgroundColor: "#F7FAFC",
                        color: "#222",
                        fontWeight: "500",
                        letterSpacing: 0.5,
                        marginBottom: 15,
                        textAlignVertical: "top",
                    }}
                    placeholder="Speed"
                    placeholderTextColor="#888"
                    keyboardType="numeric"
                    value={speed}
                    onChangeText={setSpeed}
                />

                <TouchableOpacity
                    style={{
                        width: "100%",
                        backgroundColor: "#256df1",
                        borderRadius: 16,
                        paddingVertical: 14,
                        alignItems: "center",
                        shadowColor: "#fff",
                        shadowOpacity: 0.15,
                        shadowRadius: 8,
                        elevation: 6,
                    }}
                    onPress={onFormSubmitPress}
                    disabled={loading}
                >
                    <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 20 }}>
                        {loading ? "Submitting..." : "Submit"}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}