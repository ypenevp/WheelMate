import { API_URL } from "@env";
console.log("IP from env:", API_URL);
import AsyncStorage from "@react-native-async-storage/async-storage";

export async function AddRelative(email){
    try {
        const token = await AsyncStorage.getItem("access");

        const response = await fetch(`${API_URL}/api/relationships/relative/add`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email
            })
        });

        if (response.ok){
            const data = await response.json();
            return data;
        } else {
            throw new Error("Failed to add relative");
        }
    } catch (error) {
        console.error("Error adding relative:", error);
        throw error;
    }
}

export async function AddCareTaker(email){
    try {
        const token = await AsyncStorage.getItem("access");

        const response = await fetch(`${API_URL}/api/relationships/caretaker/add`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email
            })
        });

        if (response.ok){
            const data = await response.json();
            return data;
        } else {
            throw new Error("Failed to add caretaker");
        }
    } catch (error) {
        console.error("Error adding caretaker:", error);
        throw error;
    }
}

export async function GetAllRelatives(){
    try {
        const token = await AsyncStorage.getItem("access");

        const response = await fetch(`${API_URL}/api/relationships/relatives`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
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

export async function GetAllCaretakers(){
    try {
        const token = await AsyncStorage.getItem("access");

        const response = await fetch(`${API_URL}/api/relationships/caretakers`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
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