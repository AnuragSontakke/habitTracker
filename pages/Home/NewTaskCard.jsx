import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../configs/FirebaseConfig";
import { Colors } from "../../constants/Colors";
import { useUserContext } from "../../contexts/UserContext";

export default function NewTaskCard() {
  const router = useRouter();
  const { userId } = useUserContext();
  const [existingChallenges, setExistingChallenges] = useState([]);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const docRef = doc(db, "challenge", userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setExistingChallenges(docSnap.data().challenges || []);
        }
      } catch (error) {
        console.error("Error fetching challenges:", error);
      }
    };
    fetchChallenges();
  }, [userId]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.97,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.push("/tasks/new-task");
    });
  };

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.85}
        style={styles.card}
      >
        <Image
          source={require("../../assets/images/achieve.png")}
          style={styles.image}
          resizeMode="contain"
        />
        <Text style={styles.text}>
          {existingChallenges.length > 0 ? "View Challenges" : "Create Challenge"}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginVertical: 40,
    alignItems: "center",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    paddingVertical: 18,
    paddingHorizontal: 25,
    borderRadius: 22,
    width: "90%",
    maxWidth: 350,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#eee",
  },
  image: {
    width: 60,
    height: 60,
    marginRight: 16,
  },
  text: {
    fontSize: 17,
    fontFamily: "outfit-bold",
    color: Colors.GRAY,
  },
});
