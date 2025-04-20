import { View, Dimensions, StatusBar } from "react-native";
import React from "react";
import UserIntro from "../../pages/Profile/UserIntro";
import MenuList from "../../pages/Profile/MenuList";
import { Colors } from "../../constants/Colors";
export default function profile() {
  return (
    <View>
      <HeaderBackground />
      <UserIntro />
      <MenuList />
    </View>
  );
}

function HeaderBackground() {
  const screenWidth = Dimensions.get("window").width;
  const borderWidth = 5;

  return (
    <>
      <StatusBar
        backgroundColor={Colors.PRIMARY}
        barStyle="light-content"
        translucent={true}
      />

      {/* Outer Border Layer */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: -borderWidth,
          width: screenWidth + borderWidth * 2,
          height: 200 + borderWidth,
          backgroundColor: Colors.PRIMARY,
          borderBottomLeftRadius: 200,
          borderBottomRightRadius: 200,
          zIndex: -2,
          borderBottomWidth: 50,
          borderColor: Colors.PRIMARY_DARK,
        }}
      >
        {/* Inner Curved Layer */}
        <View
          style={{
            width: screenWidth,
            height: 200,
            marginHorizontal: borderWidth,
            backgroundColor: Colors.PRIMARY,
            borderBottomLeftRadius: 300,
            borderBottomRightRadius: 300,
          }}
        />
      </View>
    </>
  );
}
