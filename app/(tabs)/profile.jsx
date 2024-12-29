import { View, Text } from 'react-native'
import React from 'react'
import UserIntro from '../../pages/Profile/UserIntro'
import MenuList from '../../pages/Profile/MenuList'

export default function profile() {
  return (
    <View style={{
      padding: 20,
      marginTop: 75
    }}>
     
      <UserIntro/>
      <MenuList/>
    </View>
  )
}

