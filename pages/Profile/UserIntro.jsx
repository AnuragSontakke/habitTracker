import { View, Text, Image } from 'react-native'
import React from 'react'
import { useUser } from '@clerk/clerk-expo'
import { useUserContext } from '../../contexts/UserContext';

export default function UserIntro() {
    const {user} = useUser();
    const {userTeacher} = useUserContext();
  return (
    <View style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 30
    }}> 
      <Image source={{uri: user?.imageUrl}} 
      style={{
        width: 100,
        height: 100,
        borderRadius: 99
      }}
      />
      <Text style={{fontFamily: 'outfit-bold', fontSize: 20}}>{user?.fullName}</Text>
      <Text style={{fontFamily: 'outfit', fontSize: 16}}>{user?.primaryEmailAddress?.emailAddress}</Text>
      {userTeacher && <Text style={{fontFamily: 'outfit', fontSize: 16}}>You are connected to {userTeacher?.teacherName}</Text>}
    </View>
  )
}