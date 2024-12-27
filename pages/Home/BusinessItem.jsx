import { View, Text, Image, TouchableOpacity } from 'react-native'
import React from 'react'
import { useRouter } from 'expo-router'

export default function BusinessItem({business}) {
  const router = useRouter();
  return (
    <TouchableOpacity 
    onPress={()=> router.push("/businessdetail/" + business?.id)}
    style={{marginLeft: 20, padding: 10, borderRadius: 10, backgroundColor: "#fff"}}>
      <Image source={{uri: business?.image}} style={{
        width: 200, height: 130
      }} />
      <View style={{marginTop: 7}}>
        <Text style={{fontFamily: 'outfit-medium', fontSize: 15}}>{business.about}</Text>
      </View>
    </TouchableOpacity>
  )
}