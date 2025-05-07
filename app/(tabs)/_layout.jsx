import { View, StyleSheet, TouchableOpacity } from "react-native";
import React, { useContext } from "react";
import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Colors } from "../../constants/Colors";
import { FeedContext } from "../../contexts/FeedContext";
import LottieView from "lottie-react-native";

export default function TabLayout() {
  const { hasNewFeed, setHasNewFeed } = useContext(FeedContext);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.PRIMARY,
        tabBarLabelStyle: {
          fontFamily: "outfit-bold",
          fontSize: 13,
        },
        tabBarStyle: {
          height: 60,
          paddingBottom: 10,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          tabBarLabel: "Feed",
          tabBarIcon: ({ color }) => (
            <View style={styles.iconContainer}>
              <Ionicons name="newspaper" size={24} color={color} />
              {hasNewFeed && (
                <LottieView
                  source={require("../../assets/lottie/redDot.json")}
                  style={styles.redDot}
                  autoPlay={true}
                  loop={true}
                />
              )}
            </View>
          ),
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              onPress={() => {
                setHasNewFeed(false); // Clear animation when tab is pressed
                props.onPress();
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          tabBarLabel: "Leaderboard",
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="ranking-star" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ color }) => (
            <Ionicons name="people-circle" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    position: "relative",
  },
  redDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 16,
    height: 16,
  },
});