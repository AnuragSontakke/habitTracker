import { View, Text, Image, ActivityIndicator, StatusBar, Dimensions } from "react-native";
import React from "react";
import { useUser } from "@clerk/clerk-expo";
import { Colors } from "../../constants/Colors";

// Role Tag UI
const RoleTag = ({ role }) => {
  const roleStyles = {
    admin: { backgroundColor: '#FF0000', color: "#fff" },
    teacher: { backgroundColor: '#FF8C00', color: "#fff" },
    volunteer: { backgroundColor: '#1E90FF', color: "#fff" },
    member: { backgroundColor: '#32CD32', color: "#fff" },
  };

  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        backgroundColor: roleStyles[role]?.backgroundColor || "#777",
        marginTop: 5,
      }}
    >
      <Text
        style={{
          color: roleStyles[role]?.color,
          fontFamily: "outfit-medium",
          fontSize: 12,
          textAlign: "center"
        }}
      >
        {role}
      </Text>
    </View>
  );
};

export default function Header({ role }) {
  const { isLoaded, user } = useUser();
  const screenWidth = Dimensions.get("window").width; // Get screen width

  if (!isLoaded) {
    return (
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="small" color="#0000ff" />
      </View>
    );
  }

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: screenWidth + 15,
        zIndex: 10,
        padding: 20,
        paddingTop: 50,
        backgroundColor: Colors.PRIMARY,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 500,
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
          <Text style={{ fontFamily: "outfit-medium", color: "#fff" }}>Welcome,</Text>
          <Text
            style={{
              fontSize: 19,
              fontFamily: "outfit-medium",
              color: "#fff",
            }}
          >
            {user?.fullName}
          </Text>
          {/* Render Role Tag */}
          {role && <RoleTag role={role} />}
        </View>
      </View>
    </View>
  );
}
