import { Text, View, TouchableOpacity } from 'react-native';
import "../global.css"
import { DATA } from '@env';

export default function App() {

  return (
    <View className="flex-1 bg-white items-center">
      
      <View className="mt-10 items-center">
          <Text className="font-bold text-green-500 text-lg">Welcome to Legendss Team!</Text> 
          <Text className="font-bold text-green-500">{DATA}</Text>
      </View>
    </View>
  );
}