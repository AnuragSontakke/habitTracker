import {
  View,
  Text,
  Image,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Animated,
  Easing,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-expo";
import { Colors } from "../../constants/Colors";
import CoinImage from "../../assets/images/coins.png";
import { db } from "../../configs/FirebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";
import { Audio } from "expo-av";

const playCoinSound = async () => {
  try {
    const { sound } = await Audio.Sound.createAsync(
      require("../../assets/music/coin-recieved.mp3")
    );
    await sound.playAsync();
  } catch (error) {
    console.warn("Could not play sound", error);
  }
};



const RoleTag = ({ role }) => {
  const roleStyles = {
    admin: { backgroundColor: "#FF0000", color: "#fff" },
    teacher: { backgroundColor: Colors.PRIMARY_DARK, color: "#fff" },
    volunteer: { backgroundColor: Colors.PRIMARY_DARK, color: "#fff" },
    member: { backgroundColor: Colors.PRIMARY_DARK, color: "#fff" },
  };

  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        backgroundColor: roleStyles[role]?.backgroundColor || "#777",
        marginTop: 5,
        alignSelf: "flex-start",
      }}
    >
      <Text
        style={{
          color: roleStyles[role]?.color,
          fontFamily: "outfit-medium",
          fontSize: 12,
          textAlign: "center",
        }}
      >
        {role}
      </Text>
    </View>
  );
};

export default function Header({ role, userTeacher, userId }) {
  const { isLoaded, user } = useUser();
  const screenWidth = Dimensions.get("window").width;

  const [coinCount, setCoinCount] = useState(0);
  const animatedValue = useState(new Animated.Value(1))[0];

  useEffect(() => {
    let unsubscribe;

    const listenToCoins = async () => {
      try {
        if (!userTeacher?.teacherId || !userId) return;

        const docRef = doc(db, "coin", userTeacher.teacherId);
        unsubscribe = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const users = docSnap.data().coins || [];
            const userEntry = users.find((u) => u.userId === userId);
            if (userEntry?.allTime?.coins != null) {
              setCoinCount((prev) => {
                if (userEntry.allTime.coins > prev) {
                  playCoinSound(); // 🔊 play sound when coins increased
                }
                return userEntry.allTime.coins;
              });
              
            }
          }
        });
      } catch (error) {
        console.error("Error listening to coin data:", error);
      }
    };

    listenToCoins();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userTeacher?.teacherId, userId]);

  // Animate coin icon on coin count change
  useEffect(() => {
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease),
      }),
    ]).start();
  }, [coinCount]);

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
        borderBottomWidth: 5,
        borderRightWidth: 5,
        borderColor: Colors.PRIMARY_DARK,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.9,
        shadowRadius: 2,
        elevation: 10,
      }}
    >
      <StatusBar
        backgroundColor={Colors.PRIMARY}
        barStyle="light-content"
        translucent={true}
      />
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Left Section */}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Image
            source={{ uri: user?.imageUrl }}
            style={{
              width: 50,
              height: 50,
              borderRadius: 99,
              borderWidth: 5,
              borderColor: Colors.PRIMARY_DARK,
            }}
          />
          <View style={{ marginLeft: 15 }}>
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
            {role && <RoleTag role={role} />}
          </View>
        </View>

        {/* Right Section - Coins */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: Colors.PRIMARY_DARK,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20,
            marginRight: 35,
          }}
        >
          <Animated.Image
            source={CoinImage}
            style={{
              width: 30,
              height: 30,
              marginRight: 6,
              resizeMode: "contain",
              transform: [{ scale: animatedValue }],
            }}
          />
          <Text
            style={{ color: "#fff", fontFamily: "outfit-bold", fontSize: 14 }}
          >
            {coinCount}
          </Text>
        </View>
      </View>
    </View>
  );
}
