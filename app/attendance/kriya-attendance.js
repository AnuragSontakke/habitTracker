import React, { useState, useEffect, useRef } from "react";
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
  const teacherId = userRole === "teacher" ? userId : userTeacher?.teacherId || "";
  const challengeCompletionTracker = useRef(new Set());

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
        // Fetch users from teacherNetworks
        const teacherSnapshot = await getDoc(doc(db, "teacherNetworks", teacherId));
        const usersList = teacherSnapshot.exists()
          ? teacherSnapshot.data()?.members || []
          : [];

        if (usersList.length === 0) {
          setError("No users found in this teacher's network.");
          setLoading(false);
          return;
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

        // Batch fetch attendance status for all users
        const todayDate = new Date().toISOString().split("T")[0];
        const attendanceStatus = {};
        const userChallengePromises = usersList.map((user) =>
          getDoc(doc(db, "userChallenge", user.userId))
        );
        const userChallengeSnaps = await Promise.all(userChallengePromises);

        userChallengeSnaps.forEach((snap, index) => {
          const user = usersList[index];
          let completedToday = false;
          if (snap.exists()) {
            const challenges = snap.data().challenges || {};
            const kriyaChallenge = challenges[kriyaChallengeId];
            completedToday =
              kriyaChallenge?.completed?.some(
                (entry) => entry.date === todayDate
              ) || false;
          }
          attendanceStatus[user.userId] = completedToday;
        });

        setUsers(usersList.map((user) => ({ ...user, challengeId: kriyaChallengeId })));
        setUserAttendanceStatus(attendanceStatus);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError(`Failed to load users: ${err.message}`);
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
      const useISO = new Date() >= new Date("2025-05-12");
      const weekNumber = useISO ? getISOWeekNumber(today) : getWeekNumber(today);
      const year = today.getFullYear();
      const weekKey = `week${weekNumber}year${year}`;
      const todayDate = today.toISOString().split("T")[0];
      const coinsEarned = 15; // Fixed 15 coins for group Kriya attendance
      const challengeName = "Kriya";
      const challengeId = selectedUser.challengeId;
      const challengeKey = `${challengeId}-${selectedUser.userId}-${todayDate}`;

      // Prevent duplicate completion
      if (challengeCompletionTracker.current.has(challengeKey)) {
        setCompletionModal({
          visible: true,
          challengeName,
          streak: 0,
          coinsEarned: 0,
          message: "Attendance already being processed.",
        });
        return;
      }

      // Fetch user's challenge data
      const userChallengeRef = doc(db, "userChallenge", selectedUser.userId);
      const userChallengeSnap = await getDoc(userChallengeRef);
      let updatedChallenges = userChallengeSnap.exists()
        ? userChallengeSnap.data().challenges || {}
        : {};

      // Initialize challenge data if not exists
      if (!updatedChallenges[challengeId]) {
        updatedChallenges[challengeId] = { completed: [], streak: 0 };
      }

      const challenge = updatedChallenges[challengeId];
      const completedToday = challenge.completed.some(
        (entry) => entry.date === todayDate
      );

      if (completedToday) {
        setCompletionModal({
          visible: true,
          challengeName,
          streak: challenge.streak,
          coinsEarned: 0,
          message: `${selectedUser.fullName} has already completed Kriya today.`,
        });
        return;
      }

      // Update challenge completion
      challenge.completed.push({ date: todayDate, status: true });
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yesterdayDate = yesterday.toISOString().split("T")[0];
      const lastCompletion = challenge.completed.find(
        (entry) => entry.date === yesterdayDate
      );
      challenge.streak = lastCompletion ? challenge.streak + 1 : 1;

      // Save updated challenge data
      await setDoc(
        userChallengeRef,
        { challenges: updatedChallenges },
        { merge: true }
      );

      // Update coins
      const coinsRef = doc(db, "coin", teacherId);
      const coinsSnap = await getDoc(coinsRef);
      let userCoins = coinsSnap.exists() ? coinsSnap.data().coins || [] : [];

      let userCoinData = userCoins.find(
        (coin) => coin.userId === selectedUser.userId
      );
      if (!userCoinData) {
        userCoinData = {
          userName: selectedUser.fullName || `User ${selectedUser.userId}`,
          userId: selectedUser.userId,
          userImage: selectedUser.userImage || null,
          userRole: selectedUser.userRole || "student",
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

      // Mark completion in tracker
      challengeCompletionTracker.current.add(challengeKey);

      // Show success modal
      setCompletionModal({
        visible: true,
        challengeName,
        streak: challenge.streak,
        coinsEarned,
        message: `Kriya attendance marked for ${selectedUser.fullName}!`,
      });
    } catch (err) {
      console.error("Error updating attendance:", err);
      let errorMessage = "Failed to mark attendance.";
      if (err.code === "permission-denied") {
        errorMessage = "Permission denied. Please check Firestore rules.";
      } else if (err.code === "not-found") {
        errorMessage = "Required data not found in Firestore.";
      } else {
        errorMessage = `Error: ${err.message}`;
      }
      setCompletionModal({
        visible: true,
        challengeName: "Kriya",
        streak: 0,
        coinsEarned: 0,
        message: errorMessage,
      });
    }
  };

  // Render each user item
  const renderUserItem = ({ item }) => {
    const isAttended = userAttendanceStatus[item.userId];

    return (
      <View style={styles.userItem}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.fullName || `User ${item.userId}`}</Text>
          <Text style={styles.userRole}>{item.userRole || "Student"}</Text>
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
            accessibilityLabel={`Mark Kriya attendance for ${item.fullName || "user"}`}
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