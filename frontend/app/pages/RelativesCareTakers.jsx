import { Text, View, TouchableOpacity, TextInput } from 'react-native';
import "../global.css"
import { useState } from 'react';
import { AddRelative, AddCareTaker } from '../services/userRelationship';

export default function RelativesCareTakers() {
    const [relativeEmail, setRelativeEmail] = useState('');
    const [caretakerEmail, setCaretakerEmail] = useState('');

    const handleAddRelative = async () => {
        if (!relativeEmail) {
            alert("Please enter the relative's email.");
            return;
        }
        try {
            const response = await AddRelative(relativeEmail);
            console.log("Relative added successfully:", response);
            alert("Relative added successfully!");
            setRelativeEmail('');
        } catch (error) {
            console.error("Error adding relative:", error);
            alert("An error occurred while adding the relative.");
        }
    };

    const handleAddCareTaker = async () => {
        if (!caretakerEmail) {
            alert("Please enter the care taker's email.");
            return;
        }
        try {
            const response = await AddCareTaker(caretakerEmail);
            console.log("CareTaker added successfully:", response);
            alert("CareTaker added successfully!");
            setCaretakerEmail('');
        } catch (error) {
            console.error("Error adding careTaker:", error);
            alert("An error occurred while adding the care taker.");
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#fff', alignItems: 'center', paddingTop: 20, paddingBottom: 20 }}>

            <View style={{ flexDirection: 'column', justifyContent: 'space-between', width: '90%', marginBottom: 20 }}>
                <Text className="font-bold text-blue-500 text-4xl mb-4">Relatives Add</Text>
                
                <TextInput 
                    placeholder="Relative's Email" 
                    value={relativeEmail}
                    onChangeText={setRelativeEmail} 
                    style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 12 }} 
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
                
                <TouchableOpacity onPress={handleAddRelative} style={{ flexDirection: "row", width: '100%', backgroundColor: '#3b82f6', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9999, justifyContent: 'center' }}>
                    <Text style={{ color: 'white', fontSize: 16 }}>Add Relative</Text>
                </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'column', justifyContent: 'space-between', width: '90%', marginBottom: 20 }}>
                <Text className="font-bold text-blue-500 text-4xl mb-4">CareTakers Add</Text>
                
                <TextInput 
                    placeholder="CareTaker's Email" 
                    value={caretakerEmail}
                    onChangeText={setCaretakerEmail} 
                    style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 12 }} 
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
                
                <TouchableOpacity onPress={handleAddCareTaker} style={{ flexDirection: "row", width: '100%', backgroundColor: '#3b82f6', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9999, justifyContent: 'center' }}>
                    <Text style={{ color: 'white', fontSize: 16 }}>Add CareTaker</Text>
                </TouchableOpacity>
            </View>

        </View>
    );
}