import { View, Text, Image, ActivityIndicator, StatusBar, Dimensions } from "react-native";
import React from "react";
import { useUser } from "@clerk/clerk-expo";
import { Colors } from "../../constants/Colors";

export default function Header() {
  const { isLoaded, user } = useUser();
  const screenWidth = Dimensions.get("window").width; // Get screen width

  if (!isLoaded) {
    // Show a loading indicator while user data is loading
    return (
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="small" color="#0000ff" />
      </View>
    );
  }

  return (
    <View
      style={{
        position: "absolute", // Makes it fixed at the top
        top: 0,
        left: 0,
        width: screenWidth +15, // Extend beyond the right edge to hide corners
        zIndex: 10, // Ensures it appears above the scrollable content
        padding: 20,
        paddingTop: 50,
        backgroundColor: Colors.PRIMARY,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 500, // Keep the right border radius
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.9,
        shadowRadius: 2,
        elevation: 10,
      }}
    >
      <StatusBar backgroundColor={Colors.PRIMARY} barStyle="light-content" translucent={true} />
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Image
          source={{ uri: user?.imageUrl }}
          style={{
            width: 50,
            height: 50,
            borderRadius: 99,
            borderWidth: 3,
            borderColor: Colors.PRIMARY_LIGHT,
          }}
        />
        <View style={{ marginLeft: 20 }}>
          <Text style={{ fontFamily: "outfit-medium", color: "#fff" }}>
            Welcome,
          </Text>
          <Text
            style={{
              fontSize: 19,
              fontFamily: "outfit-medium",
              color: "#fff",
            }}
          >
            {user?.fullName}
          </Text>
        </View>
      </View>
    </View>
  );
}
