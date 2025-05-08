import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useUserContext } from "../../contexts/UserContext";
import { db } from "../../configs/FirebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";
import { ChallengeCompletionModal } from "../../components";
import { useNavigation } from "expo-router";
import { getISOWeekNumber, getWeekNumber } from "../../services/weekNumber";

export default function CommonKriyaAttendance() {
  const { userTeacher, userRole, userId } = useUserContext();
  const [users, setUsers] = useState([]);
  const [userAttendanceStatus, setUserAttendanceStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completionModal, setCompletionModal] = useState({
    visible: false,
    challengeName: "",
    streak: 0,
    coinsEarned: 0,
    message: "",
  });
  const navigation = useNavigation();
  const teacherId =
    userRole === "teacher" ? userId : userTeacher?.teacherId || "";

  useEffect(() => {
    navigation.setOptions({
      headerTitle: "Long Kriya Attendance",
      headerShown: true,
      headerStyle: {
        backgroundColor: Colors.PRIMARY,
      },
      headerTitleStyle: {
        color: "#fff",
        fontFamily: "outfit-bold",
        fontSize: 18,
      },
      headerTintColor: "#fff",
    });
  }, []);

  // Fetch all users under the teacher and their attendance status
  useEffect(() => {
    const fetchUsers = async () => {
      if (!teacherId) {
        setError("Teacher ID is not available.");
        setLoading(false);
        return;
      }

      try {
        const coinsRef = doc(db, "coin", teacherId);
        const coinsSnap = await getDoc(coinsRef);
        let userCoins = [];

        if (coinsSnap.exists()) {
          userCoins = coinsSnap.data().coins || [];
        } else {
          setError("No users found for this teacher.");
        }

        // Fetch Kriya challenge ID
        const challengesRef = doc(db, "challenge", teacherId);
        const challengesSnap = await getDoc(challengesRef);
        let kriyaChallengeId = null;
        if (challengesSnap.exists()) {
          const challenges = challengesSnap.data().challenges || [];
          const kriyaChallenge = challenges.find(
            (c) => c.challengeName.toLowerCase() === "kriya"
          );
          kriyaChallengeId = kriyaChallenge?.challengeId;
        }

        if (!kriyaChallengeId) {
          setError("Kriya challenge not found.");
          setLoading(false);
          return;
        }

        // Fetch attendance status for each user
        const todayDate = new Date().toISOString().split("T")[0];
        const attendanceStatus = {};
        for (const user of userCoins) {
          const userChallengeRef = doc(db, "userChallenge", user.userId);
          const userChallengeSnap = await getDoc(userChallengeRef);
          let completedToday = false;

          if (userChallengeSnap.exists()) {
            const challenges = userChallengeSnap.data().challenges || {};
            const kriyaChallenge = challenges[kriyaChallengeId];
            completedToday =
              kriyaChallenge?.completed?.some(
                (entry) => entry.date === todayDate
              ) || false;
          }

          attendanceStatus[user.userId] = completedToday;
        }

        setUsers(userCoins);
        setUserAttendanceStatus(attendanceStatus);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Failed to load users.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [userTeacher, teacherId]);

  // Handle marking attendance for Kriya
  const handleAttendance = async (selectedUser) => {
    try {
      const today = new Date();
      const useISO = new Date() >= new Date("2025-05-12"); // Next Monday
      const weekNumber = useISO
        ? getISOWeekNumber(today)
        : getWeekNumber(today);
      const year = today.getFullYear();
      const weekKey = `week${weekNumber}year${year}`;
      const todayDate = today.toISOString().split("T")[0];
      const coinsEarned = 15;
      const challengeName = "Kriya";

      // Fetch user's challenge data
      const userChallengeRef = doc(db, "userChallenge", selectedUser.userId);
      const userChallengeSnap = await getDoc(userChallengeRef);
      let updatedChallenges = userChallengeSnap.exists()
        ? userChallengeSnap.data().challenges || {}
        : {};

      // Find Kriya challenge ID
      const challengesRef = doc(db, "challenge", teacherId);
      const challengesSnap = await getDoc(challengesRef);
      let kriyaChallengeId = null;
      if (challengesSnap.exists()) {
        const challenges = challengesSnap.data().challenges || [];
        const kriyaChallenge = challenges.find(
          (c) => c.challengeName.toLowerCase() === "kriya"
        );
        kriyaChallengeId = kriyaChallenge?.challengeId;
      }

      if (!kriyaChallengeId) {
        setCompletionModal({
          visible: true,
          challengeName,
          streak: 0,
          coinsEarned: 0,
          message: "Kriya challenge not found.",
        });
        return;
      }

      // Initialize challenge data if not exists
      if (!updatedChallenges[kriyaChallengeId]) {
        updatedChallenges[kriyaChallengeId] = { completed: [], streak: 0 };
      }

      const challenge = updatedChallenges[kriyaChallengeId];
      const completedToday = challenge.completed.some(
        (entry) => entry.date === todayDate
      );

      if (completedToday) {
        setCompletionModal({
          visible: true,
          challengeName,
          streak: challenge.streak,
          coinsEarned: 0,
          message: `${selectedUser.userName} has already completed Kriya today.`,
        });
        return;
      }

      // Update challenge completion
      challenge.completed.push({ date: todayDate, status: true });
      const yesterday = new Date(today.setDate(today.getDate() - 1))
        .toISOString()
        .split("T")[0];
      const lastCompletion =
        challenge.completed[challenge.completed.length - 2];
      challenge.streak =
        lastCompletion && lastCompletion.date === yesterday
          ? challenge.streak + 1
          : 1;

      // Save updated challenge data
      await setDoc(
        userChallengeRef,
        { challenges: updatedChallenges },
        { merge: true }
      );

      // Update coins
      const coinsRef = doc(db, "coin", teacherId);
      const coinsSnap = await getDoc(coinsRef);
      let userCoins = coinsSnap.exists() ? coinsSnap.data().coins : [];

      let userCoinData = userCoins.find(
        (coin) => coin.userId === selectedUser.userId
      );
      if (!userCoinData) {
        userCoinData = {
          userName: selectedUser.userName,
          userId: selectedUser.userId,
          userImage: selectedUser.userImage,
          userRole: selectedUser.userRole,
          weekly: {},
          allTime: { coins: 0, streak: 0 },
        };
        userCoins.push(userCoinData);
      }

      if (!userCoinData.weekly[weekKey]) {
        userCoinData.weekly[weekKey] = { coins: 0, streak: 0 };
      }

      userCoinData.weekly[weekKey].coins += coinsEarned;
      userCoinData.weekly[weekKey].streak = challenge.streak;
      userCoinData.allTime.coins += coinsEarned;
      userCoinData.allTime.streak = Math.max(
        userCoinData.allTime.streak,
        challenge.streak
      );

      await setDoc(coinsRef, { coins: userCoins }, { merge: true });

      // Update attendance status
      setUserAttendanceStatus((prev) => ({
        ...prev,
        [selectedUser.userId]: true,
      }));

      // Show success modal
      setCompletionModal({
        visible: true,
        challengeName,
        streak: challenge.streak,
        coinsEarned,
        message: `Kriya attendance marked for ${selectedUser.userName}!`,
      });
    } catch (err) {
      console.error("Error updating attendance:", err);
      setCompletionModal({
        visible: true,
        challengeName: "Kriya",
        streak: 0,
        coinsEarned: 0,
        message: "Failed to mark attendance.",
      });
    }
  };

  // Render each user item
  const renderUserItem = ({ item }) => {
    const isAttended = userAttendanceStatus[item.userId];

    return (
      <View style={styles.userItem}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.userName}</Text>
          <Text style={styles.userRole}>{item.userRole}</Text>
        </View>
        {isAttended ? (
          <View style={styles.attendedContainer}>
            <Ionicons
              name="checkmark-circle"
              size={28}
              color={Colors.PRIMARY}
            />
          </View>
        ) : (
          <TouchableOpacity
            style={styles.attendButton}
            onPress={() => handleAttendance(item)}
            accessibilityLabel={`Mark Kriya attendance for ${item.userName}`}
            accessibilityRole="button"
          >
            <Ionicons name="checkmark-circle-outline" size={24} color="#fff" />
            <Text style={styles.attendButtonText}>Attended</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Handle modal close
  const handleCompletionModalClose = () => {
    setCompletionModal((prev) => ({ ...prev, visible: false }));
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.userId}
          renderItem={renderUserItem}
          ListEmptyComponent={
            <Text style={styles.noUsersText}>No users found.</Text>
          }
        />
      )}
      <ChallengeCompletionModal
        visible={completionModal.visible}
        onClose={handleCompletionModalClose}
        challengeName={completionModal.challengeName}
        streak={completionModal.streak}
        coinsEarned={completionModal.coinsEarned}
        message={completionModal.message}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  userItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#f9f9f9",
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontFamily: "outfit-bold",
    color: Colors.TEXT,
  },
  userRole: {
    fontSize: 14,
    fontFamily: "outfit",
    color: "#555",
  },
  attendButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  attendButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "outfit-medium",
    marginLeft: 6,
  },
  attendedContainer: {
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
    marginTop: 20,
    fontFamily: "outfit",
  },
  noUsersText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginTop: 20,
    fontFamily: "outfit",
  },
});
