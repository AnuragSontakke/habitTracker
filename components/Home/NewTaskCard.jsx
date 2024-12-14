import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "../../constants/Colors";

// NewTaskCard Component
export default function NewTaskCard() {
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.push("/tasks/new-task")}
      activeOpacity={0.7}
      style={styles.card}
    >
      <View style={styles.cardContent}>
        {/* Animated GIF */}
        <Image
          source={require('../../assets/images/achieve.png')}
          style={styles.gif}
          resizeMode="contain"
        />
        {/* Text */}
        <Text style={styles.cardText}>Create Challenge</Text>
      </View>
    </TouchableOpacity>
  );
}

// Styles
const styles = StyleSheet.create({
  card: {
    marginTop: 20,
    borderWidth: 2,
    borderColor: Colors.PRIMARY,
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 25,
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
    width: 250,
    height: 100,
    alignSelf: "center",
    backgroundColor: "#fff",
    elevation: 5,
    shadowColor: Colors.GRAY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  gif: {
    width: 50, 
    height: 50,
    marginRight: 10,
  },
  cardText: {
    fontSize: 16,
    fontFamily: "outfit-medium",
    color: Colors.GRAY,
  },
});
