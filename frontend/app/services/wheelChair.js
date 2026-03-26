import { API_URL } from '@env'
import AsyncStorage from "@react-native-async-storage/async-storage";

export const postWheelChair = async ({speed, GPScoordinates}) => {
    try {
        const token = await AsyncStorage.getItem("access");

        if(!token){
            console.log("Error getting token");
            throw new Error("No authentication token found");
        }

        const payload = {
            gpsCoordinate: GPScoordinates, // Java expects 'gpsCoordinate'
            speed: parseInt(speed),        // Ensure speed is a number
            panicStatus: false             // Default value
        };

        console.log("Sending payload:", JSON.stringify(payload));

        const response = await fetch(`${API_URL}/wheelchair/addwheelchair`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const data = await response.json();
            console.log("Wheelchair added successfully");
            return data;
        } else {
            const errorText = await response.text();
            console.error("Server response:", response.status, errorText);
            throw new Error(`Failed to create update: ${response.status} - ${errorText}`);
        }

    } catch (error) {
        console.error("Error posting a new wheelchair", error);
        throw error;
    }
}

export const getAllWheelChair = async() => {
    try {
        const token = await AsyncStorage.getItem("access");

        if(!token){
            console.error("No token found")
            return [];
        }

        const response = await fetch(`${API_URL}/wheelchair/getallwheelchair`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
        });

        if (response.ok){
            const data = await response.json();
            console.log("Wheelchairs data fetched successfully");
            return data;
        } else {
            const errorText = await response.text();
            console.error("Server Error Status:", response.status);
            console.error("Server Error Body:", errorText);
            throw new Error(`Failed to fetch wheelchairs: ${response.status}`);
        }
    } catch (error) {
        console.error("Error fetching wheelchairs data:", error);
        throw error;
    }
}