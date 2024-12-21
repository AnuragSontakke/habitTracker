import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from "react-native";
import { useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../configs/FirebaseConfig";
import { Colors } from "../../constants/Colors";
import { useUserContext } from "../../contexts/UserContext";

// NewTaskCard Component
export default function NewTaskCard() {
  const router = useRouter();
  const [existingChallenges, setExistingChallenges] = useState([]);
  const {userId} = useUserContext()

  // Fetch challenges for the teacher
  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const teacherChallengesRef = doc(db, "challenge", userId);
        const docSnap = await getDoc(teacherChallengesRef);
        if (docSnap.exists()) {
          const challengesData = docSnap.data().challenges || [];
          setExistingChallenges(challengesData);
        } else {
          console.log("No challenges found for this teacher.");
        }
      } catch (error) {
        console.error("Error fetching teacher's challenges:", error);
      }
    };

    fetchChallenges();
  }, [userId]);

  // Handle task creation navigation
  const handlePress = () => {
   
      router.push("/tasks/new-task");
   
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
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
        <Text style={styles.cardText}>{existingChallenges.length > 0 ? "View Challenges" : "Create Challenge"}</Text>
      </View>
    </TouchableOpacity>
  );
}

// Styles
const styles = StyleSheet.create({
  card: {
    margin: 20,
    borderWidth: 2,
    borderColor: Colors.GRAY,
    borderRadius: 25,  // Increased border radius
    paddingVertical: 15,
    paddingHorizontal: 25,
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
    width: "90%", // Full width
    maxWidth: 350,  // Optional: You can set a max width if you want to limit it on larger screens
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
    width: 70, 
    height: 70,
    marginRight: 10,
  },
  cardText: {
    fontSize: 16,
    fontFamily: "outfit-bold",
    color: Colors.GRAY,
  },
});
