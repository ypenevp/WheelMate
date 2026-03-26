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