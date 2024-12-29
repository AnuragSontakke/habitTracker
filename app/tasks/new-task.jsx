import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  FlatList,
  ScrollView,
} from "react-native";
import { useNavigation } from "expo-router";
import { useUserContext } from "../../contexts/UserContext";
import { Colors } from "../../constants/Colors";
import { doc, setDoc, arrayUnion, getDoc, Timestamp } from "firebase/firestore";
import { db } from "../../configs/FirebaseConfig";
import ChallangePoints from "../../pages/Instructions/challangePoints";

export default function NewTask() {
  const { userRole, userId } = useUserContext();
  const navigation = useNavigation();
  const [taskName, setTaskName] = useState("");
  const [challengeDuration, setChallengeDuration] = useState("");
  const [loading, setLoading] = useState(false);
  const [challenges, setChallenges] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const predefinedChallenges = [
    { name: "Meditation", duration: "Regular" },
    { name: "Kriya", duration: "Regular" },
  ];

  useEffect(() => {
    navigation.setOptions({
      headerTitle: "Create New Challenge",
      headerShown: true,
      headerStyle: { backgroundColor: Colors.PRIMARY },
      headerTitleStyle: {
        color: "#fff",
        fontFamily: "outfit-bold",
        fontSize: 18,
      },
      headerTintColor: "#fff",
    });

    fetchChallenges();
  }, [navigation]);

  const fetchChallenges = async () => {
    try {
      const userChallengesRef = doc(db, "challenge", userId);
      const docSnap = await getDoc(userChallengesRef);
      if (docSnap.exists()) {
        const allChallenges = docSnap.data().challenges || [];

        const currentTimestamp = Timestamp.now();
        const validChallenges = allChallenges.filter((challenge) => {
          // If it's a predefined (regular) challenge, do not delete it
          if (!challenge.custom) {
            return true;
          }

          // For custom challenges, check expiration
          const durationInDays = parseInt(
            challenge.challengeDuration.replace(" Days", "")
          );
          const expirationDate = challenge.createdDate.toDate();
          expirationDate.setDate(expirationDate.getDate() + durationInDays);

          return currentTimestamp.toDate() <= expirationDate;
        });

        setChallenges(validChallenges);

        // Update Firestore to remove only expired custom challenges
        await setDoc(
          userChallengesRef,
          { challenges: validChallenges },
          { merge: true }
        );
      } else {
        console.log("No challenges found.");
      }
    } catch (error) {
      console.error("Error fetching challenges:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateCustomTask = async () => {
    // Validate challenge name length
    if (taskName.trim().length > 15) {
      Alert.alert(
        "Validation Error",
        "Challenge name cannot be more than 15 characters."
      );
      return;
    }

    // Validate challenge duration (must be a number)
    const durationNumber = parseInt(challengeDuration);
    if (isNaN(durationNumber) || durationNumber <= 0) {
      Alert.alert("Validation Error", "Duration must be a valid number.");
      return;
    }

    if (challenges.some((c) => c.custom)) {
      Alert.alert("Limit Reached", "You can only create one custom challenge.");
      return;
    }

    if (!taskName.trim() || !challengeDuration) {
      Alert.alert("Validation Error", "Please fill all fields.");
      return;
    }

    setLoading(true);
    try {
      const newChallenge = {
        challengeId: Date.now().toString(),
        challengeName: taskName,
        challengeDuration: `${durationNumber} Days`, // Ensure duration is in days format
        createdDate: Timestamp.now(),
        custom: true,
      };

      const userChallengesRef = doc(db, "challenge", userId);
      await setDoc(
        userChallengesRef,
        { challenges: arrayUnion(newChallenge) },
        { merge: true }
      );

      Alert.alert("Success", "Custom challenge created.");
      setTaskName("");
      setChallengeDuration("");
      fetchChallenges();
    } catch (error) {
      console.error("Error creating task:", error);
      Alert.alert("Error", "Failed to create the task.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartPredefinedChallenge = async (challenge) => {
    if (challenges.some((c) => c.challengeName === challenge.name)) {
      Alert.alert("Already Started", `${challenge.name} is already added.`);
      return;
    }

    setLoading(true);
    try {
      const newChallenge = {
        challengeId: Date.now().toString(),
        challengeName: challenge.name,
        challengeDuration: challenge.duration,
        createdDate: Timestamp.now(),
        custom: false,
      };

      const userChallengesRef = doc(db, "challenge", userId);
      await setDoc(
        userChallengesRef,
        { challenges: arrayUnion(newChallenge) },
        { merge: true }
      );

      Alert.alert("Success", `${challenge.name} started.`);
      fetchChallenges();
    } catch (error) {
      console.error("Error starting challenge:", error);
      Alert.alert("Error", "Failed to start the challenge.");
    } finally {
      setLoading(false);
    }
  };

  const renderChallengeItem = ({ item }) => {
    const startedChallenge = challenges.find(
      (c) => c.challengeName === item.name && !c.custom
    );

    return (
      <View style={styles.challengeCard}>
        <Text style={styles.challengeName}>{item.name}</Text>
        <Text style={styles.challengeDuration}>{item.duration}</Text>
        {startedChallenge ? (
          <Text style={styles.createdDate}>
            Started:{" "}
            {startedChallenge.createdDate
              ? new Date(
                  startedChallenge.createdDate.toDate()
                ).toLocaleDateString()
              : "Unknown"}
          </Text>
        ) : (
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => handleStartPredefinedChallenge(item)}
            disabled={loading}
          >
            <Text style={styles.startButtonText}>Start</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderCustomChallenge = ({ item }) => {
    if (!item.custom) {
      return (
        <View style={styles.challengeCard}>
          <Text style={styles.challengeName}>{item.challengeName}</Text>
          <Text style={styles.challengeDuration}>{item.challengeDuration}</Text>
          <Text style={styles.createdDate}>
            Created:{" "}
            {item.createdDate
              ? new Date(item.createdDate.toDate()).toLocaleDateString()
              : "Unknown"}
          </Text>
        </View>
      );
    }

    // Calculate progress for custom challenges
    const totalDays = parseInt(item.challengeDuration.replace(" Days", ""));
    const createdDate = item.createdDate.toDate();
    const currentDate = new Date();

    const daysCompleted = Math.floor(
      (currentDate - createdDate) / (1000 * 60 * 60 * 24)
    );
    const progress = Math.min((daysCompleted / totalDays) * 100, 100);

    return (
      <View style={styles.challengeCard}>
        <Text style={styles.challengeName}>{item.challengeName}</Text>
        <Text style={styles.challengeDuration}>{item.challengeDuration}</Text>
        <Text style={styles.createdDate}>
          Created:{" "}
          {item.createdDate
            ? new Date(item.createdDate.toDate()).toLocaleDateString()
            : "Unknown"}
        </Text>
        <Text style={styles.progressText}>
          {Math.min(daysCompleted, totalDays)} / {totalDays} Days Completed
        </Text>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {userRole !== "teacher" ? (
        <Text style={styles.noPermissionText}>
          You don't have permission to create a task.
        </Text>
      ) : (
        <>
          <View style={styles.predefinedChallenges}>
            <Text style={styles.listHeader}>Predefined Challenges</Text>
            <FlatList
              data={predefinedChallenges}
              renderItem={renderChallengeItem}
              keyExtractor={(item) => item.name}
              numColumns={2}
              columnWrapperStyle={styles.row}
              contentContainerStyle={styles.flatListContent}
            />
          </View>

          <View style={styles.customChallengeForm}>
            <Text style={styles.listHeader}>Custom Challenge</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter custom challenge name"
              value={taskName}
              onChangeText={setTaskName}
              editable={!loading}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter duration (e.g., 21 Days)"
              value={challengeDuration}
              onChangeText={setChallengeDuration}
              editable={!loading}
            />
            <TouchableOpacity
              style={[
                styles.button,
                loading && { backgroundColor: Colors.GRAY },
              ]}
              onPress={handleCreateCustomTask}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Create Custom Challenge</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.customChallenges}>
            <Text style={styles.listHeader}>Your Challenges</Text>
            <FlatList
              data={challenges}
              renderItem={renderCustomChallenge}
              keyExtractor={(item) => item.challengeId}
              numColumns={2}
              columnWrapperStyle={styles.row}
              contentContainerStyle={styles.flatListContent}
              refreshing={refreshing}
              onRefresh={fetchChallenges}
            />
          </View>
          {/* Instructions */}
          <Text style={styles.listHeader}>Challenge Point Instructions</Text>
         <ChallangePoints />

        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 15,
  },
  challengeCard: {
    flex: 1,
    margin: 5,
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    alignItems: "center",
  },
  challengeName: {
    fontSize: 16,
    fontFamily: "outfit-bold",
  },
  challengeDuration: {
    fontSize: 14,
    color: "#555",
    fontFamily: "outfit-medium",
  },
  startButton: {
    marginTop: 10,
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  startButtonText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "outfit-medium",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    fontSize: 16,
    fontFamily: "outfit-medium",
  },
  button: {
    backgroundColor: Colors.PRIMARY,
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "outfit-bold",
  },
  listHeader: {
    fontSize: 18,
    marginBottom: 10,
    fontFamily: "outfit-bold",
  },
  flatListContent: {
    paddingBottom: 20,
  },
  noPermissionText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
    fontFamily: "outfit-medium",
  },
  createdDate: {
    marginTop: 10,
    fontSize: 14,
    color: "#555",
    fontFamily: "outfit-medium",
  },
  customChallengeForm: {
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  customChallenges: {
    marginTop: 20,
  },
  progressBarContainer: {
    height: 10,
    width: "100%",
    backgroundColor: "#e0e0e0",
    borderRadius: 5,
    overflow: "hidden",
    marginTop: 10,
  },
  progressBar: {
    height: "100%",
    backgroundColor: Colors.PRIMARY,
    borderRadius: 5,
  },
  progressText: {
    fontSize: 14,
    color: "#555",
    marginTop: 5,
    fontFamily: "outfit-medium",
  },
  instructions: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  instructionsText: {
    fontSize: 14,
    color: "#333",
  },
  bold: {
    fontFamily: "outfit-bold",
  },
  table: {
    marginTop: 15,
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    paddingTop: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tableHeader: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#555",
    flex: 1,
    padding: 5,
    textAlign: "center",
  },
  tableCell: {
    fontSize: 14,
    color: "#333",
    flex: 1,
    padding: 5,
    textAlign: "center",
  },
  
});
