import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useUserContext } from "../../contexts/UserContext";
import { db } from "../../configs/FirebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore"; // Firestore methods
import { Ionicons } from "@expo/vector-icons"; // For circular checkbox icon

export default function Challenges() {
  const { userTeacher, userId, userName, userImage, userRole } = useUserContext();
  const [challenges, setChallenges] = useState([]);
  const [userChallengeData, setUserChallengeData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChallenges = async () => {
      if (!userTeacher || !userTeacher.teacherId) {
        setLoading(false);
        Alert.alert("Error", "Teacher ID is not available.");
        return;
      }

      try {
        // Fetch challenges for the teacher
        const challengesRef = doc(db, "challenge", userTeacher.teacherId);
        const challengesSnap = await getDoc(challengesRef);

        if (challengesSnap.exists()) {
          setChallenges(challengesSnap.data().challenges || []);
        } else {
          Alert.alert("No Challenges", "This teacher has no challenges.");
        }

        // Fetch user's challenge completion data
        const userChallengeRef = doc(db, "userChallenge", userId);
        const userChallengeSnap = await getDoc(userChallengeRef);

        if (userChallengeSnap.exists()) {
          setUserChallengeData(userChallengeSnap.data().challenges || {});
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        Alert.alert("Error", "Failed to load challenges.");
      } finally {
        setLoading(false);
      }
    };
    if (userTeacher?.teacherId) {
      fetchChallenges();
    } else {
      setLoading(false);
    }
  }, [userTeacher, userId]);

  const handleChallengeCompletion = async (challengeId) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const userChallengeRef = doc(db, "userChallenge", userId);

      let updatedChallenges = { ...userChallengeData };
      if (!updatedChallenges[challengeId]) {
        updatedChallenges[challengeId] = { completed: [], streak: 0 };
      }

      const challenge = updatedChallenges[challengeId];
      const completedToday = challenge.completed.find(
        (entry) => entry.date === today
      );

      if (completedToday) {
        Alert.alert(
          "Already marked",
          "This challenge is already marked as completed for today."
        );
        return;
      }

      challenge.completed.push({ date: today, status: true });

      // Update streak logic
      const yesterday = new Date(new Date().setDate(new Date().getDate() - 1))
        .toISOString()
        .split("T")[0];
      const lastCompletion =
        challenge.completed[challenge.completed.length - 2];
      challenge.streak =
        lastCompletion && lastCompletion.date === yesterday
          ? challenge.streak + 1
          : 1;

      // Calculate coins based on challenge type and streak
      let coinsEarned = 0;
      const challengeData = challenges.find(
        (challengeItem) => challengeItem.challengeId === challengeId
      );

      if (challengeData) {
        switch (challengeData.challengeName.toLowerCase()) {
          case "meditation":
            if (challenge.streak <= 10) coinsEarned = 4;
            else if (challenge.streak <= 15) coinsEarned = 5;
            else if (challenge.streak <= 21) coinsEarned = 6;
            else coinsEarned = 7;
            break;

          case "kriya":
            if (challenge.streak <= 10) coinsEarned = 5;
            else if (challenge.streak <= 15) coinsEarned = 7;
            else if (challenge.streak <= 21) coinsEarned = 9;
            else coinsEarned = 10;
            break;

          default:
            coinsEarned = 10; // custom points
            break;
        }
      }

      // Save updated challenge data
      await setDoc(
        userChallengeRef,
        { challenges: updatedChallenges },
        { merge: true }
      );
      setUserChallengeData(updatedChallenges); // Update local state

      // Update coins in the "coin" collection for the user
      const coinsRef = doc(db, "coin", userTeacher.teacherId); // Teacher's coin collection
      const coinsSnap = await getDoc(coinsRef);
      let userCoins = coinsSnap.exists() ? coinsSnap.data().coins : [];

      const userCoinData = userCoins.find((coin) => coin.userId === userId);

      if (userCoinData) {
        userCoinData.coins += coinsEarned; // Add earned coins
      } else {
        userCoins.push({
          userName: userName,
          userId,
          userImage: userImage, // Add user profile if needed
          coins: coinsEarned,
          userRole,
          redeemed: 0,
        });
      }

      // Save updated coins data
      await setDoc(
        coinsRef,
        { coins: userCoins },
        { merge: true }
      );

      Alert.alert(
        "Challenge Completed!",
        `Your streak is now: ${challenge.streak} day(s). You earned ${coinsEarned} coins.`
      );
    } catch (error) {
      console.error("Error updating challenge completion:", error);
      Alert.alert("Error", "Failed to update challenge completion.");
    }
  };

  const renderChallengeItem = ({ item }) => {
    const today = new Date().toISOString().split("T")[0];
    const userChallenge = userChallengeData[item.challengeId];
    const challengeCompletedToday = userChallenge?.completed?.some(
      (entry) => entry.date === today
    );

    return (
      <View style={styles.challengeItem}>
        <View style={styles.challengeTextContainer}>
          <Text style={styles.challengeName}>{item.challengeName}</Text>
          <Text style={styles.challengeDuration}>{item.challengeDuration}</Text>
          <Text style={styles.challengeDate}>
            Created on:{" "}
            {new Date(item.createdDate.seconds * 1000).toLocaleDateString()}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => handleChallengeCompletion(item.challengeId)}
        >
          <Ionicons
            name={challengeCompletedToday ? "checkbox" : "checkbox-outline"}
            size={36}
            color={challengeCompletedToday ? "green" : "gray"}
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <>
          <Text style={styles.title}>Teacher's Challenges</Text>
          <FlatList
            data={challenges}
            renderItem={renderChallengeItem}
            keyExtractor={(item, index) => index.toString()}
            ListEmptyComponent={
              <Text style={styles.emptyListText}>No challenges available.</Text>
            }
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: "left",
    fontFamily:"outfit-bold"
  },
  challengeItem: {
    flexDirection: "row",
    padding: 15,
    backgroundColor: "#f9f9f9",
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    alignItems: "center",
  },
  challengeTextContainer: {
    flex: 1,
  },
  challengeName: {
    fontSize: 18,
    fontFamily:"outfit-bold"
  },
  challengeDuration: {
    fontSize: 16,
    color: "#555",
    fontFamily:"outfit-medium"
  },
  challengeDate: {
    fontSize: 14,
    color: "#888",
    fontFamily:"outfit"
  },
  checkboxContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  emptyListText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginTop: 20,
    fontFamily:"outfit"
  },
});
