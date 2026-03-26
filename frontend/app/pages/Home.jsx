import { Text, View } from 'react-native';
import "../global.css"
import { useEffect, useState } from 'react';
import { DATA } from '@env';

export default function App() {
  return (
    <View className="items-center justify-center mt-[100%]">
      <Text className="font-bold text-green-500">Welcome to Legendss Team!</Text> 
      <Text className="font-bold text-green-500">{DATA}</Text>
    </View>
  );
}
