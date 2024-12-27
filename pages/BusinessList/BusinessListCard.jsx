import { View, Text, Image, TouchableOpacity } from "react-native";
import React from "react";
import { Colors } from '../../constants/Colors';
import { useRouter } from "expo-router";

export default function BusinessListCard({ business }) {
  const router =  useRouter();
  return (
    <TouchableOpacity
      style={{
        padding: 10,
        margin: 10,
        borderRadius: 15,
        backgroundColor: "#fff",
        display: "flex",
        flexDirection: 'row',
        gap: 10
      }}
      onPress={()=> router.push('/businessdetail/'+ business.id)}
    >
      <Image
        source={{ uri: business.image }}
        style={{
          width: 120,
          height: 120,
          borderRadius: 15,
        }}
      />
      <View style={{flex: 1, gap: 7}}>
        <Text style={{fontFamily: 'outfit-bold', fontSize: 20}}>{business?.about}</Text>
        <Text style={{fontFamily: 'outfit', fontSize: 15, color: Colors.GRAY}}>{business.address}</Text>
        <Text style={{fontFamily: 'outfit', fontSize: 15, color: Colors.GRAY}}>{business.contact}</Text>
      </View>
    </TouchableOpacity>
  );
}
