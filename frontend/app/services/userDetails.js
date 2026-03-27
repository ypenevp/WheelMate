import { API_URL } from "@env";
console.log("IP from env:", API_URL);
import AsyncStorage from "@react-native-async-storage/async-storage";

export async function GetUserDetails() {
    try {
        const token = await AsyncStorage.getItem("access");

        const response = await fetch(`${API_URL}/api/auth/me`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
            }
        });

        if (response.ok) {
            
            const data = await response.json();
            console.log("data from GetUserDetails:", data);
            return data;
            
        } else {
            throw new Error("Failed to fetch user data");
        }

    } catch(error) {
        console.error("Error fetching user data:", error);
        throw error;
    }
}

export async function GetAllUsers(){
    try {
        const response = await fetch(`${API_URL}/api/auth/getallusers`, {
            method: "GET",
        });

        if (response.ok){
            const data = await response.json();
            return data;
        } else {
            throw new Error("Failed to fetch users");
        }
    } catch (error) {
        console.error("Error fetching users data:", error);
        throw error;
    }
}

export async function EditUserDetails(id, address, telephone, photo) { 
    try {
        const token = await AsyncStorage.getItem("access"); 
        if (!token) throw new Error("Authentication failed!");

        const payload = {
            address: address,
            telephone: telephone,
            photo: photo 
        };

        const response = await fetch(`${API_URL}/userprofile/updateuserprofile/${id}`, { 
            method: "PATCH", 
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const responseText = await response.text();
            if (!responseText) return {}; 
            return JSON.parse(responseText);
        } else {
            const errorText = await response.text();
            console.log("Server error body:", errorText);
            throw new Error(`Failed to edit update: ${response.status}`);
        }

    } catch (error) { 
        console.error('Error editing update:', error);
        throw error;
    }
}