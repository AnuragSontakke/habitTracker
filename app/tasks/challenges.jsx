import React, { useState, useEffect, useRef } from "react";
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
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import Slider from "@react-native-community/slider";
import { Colors } from "../../constants/Colors";
import { config } from "../../config";
import { Modal } from "../../components"; // Import the Modal component

export default function Challenges() {
  const { userTeacher, userId, userName, userImage, userRole } =
    useUserContext();
  const [challenges, setChallenges] = useState([]);
  const [userChallengeData, setUserChallengeData] = useState({});
  const [loading, setLoading] = useState(true);
  const [audioLoading, setAudioLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [audioUri, setAudioUri] = useState(""); // Store the audio URI for the modal
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const sound = useRef(new Audio.Sound());

  useEffect(() => {
    const fetchChallenges = async () => {
      if (!userTeacher || !userTeacher.teacherId) {
        setLoading(false);
        Alert.alert("Error", "Teacher ID is not available.");
        return;
      }

      try {
        const challengesRef = doc(db, "challenge", userTeacher.teacherId);
        const challengesSnap = await getDoc(challengesRef);

        if (challengesSnap.exists()) {
          setChallenges(challengesSnap.data().challenges || []);
        } else {
          Alert.alert("No Challenges", "This teacher has no challenges.");
        }

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

  const updateProgress = async (status, item) => {
    if (status.isLoaded) {
      setProgress(status.positionMillis);
      setDuration(status.durationMillis);

      const tenPercent = status.durationMillis * 0.02;
      const today = new Date().toISOString().split("T")[0];

      if (
        status.positionMillis >= tenPercent &&
        !userChallengeData[item.challengeId]?.completed?.some(
          (entry) => entry.date === today
        )
      ) {
        await handleChallengeCompletion(item.challengeId);
      }
    }
  };

  const playAudio = async (audioUri, item) => {
    try {
      const status = await sound.current.getStatusAsync();
      if (!status.isLoaded) {
        setAudioLoading(true);
        await sound.current.loadAsync({ uri: audioUri });
        setAudioLoading(false);
      }
      await sound.current.playAsync();
      setIsPlaying(true);
      sound.current.setOnPlaybackStatusUpdate((status)=>updateProgress(status, item));
    } catch (error) {
      console.error("Error playing audio:", error);
    }
  };

  const pauseAudio = async () => {
    try {
      await sound.current.pauseAsync();
      setIsPlaying(false);
    } catch (error) {
      console.error("Error pausing audio:", error);
    }
  };

  const restartAudio = async () => {
    try {
      await sound.current.setPositionAsync(0); // Reset to the beginning
      if (isPlaying) {
        await sound.current.playAsync(); // Restart playback if audio is playing
      }
      setProgress(0); // Update UI to reflect the reset
    } catch (error) {
      console.error("Error restarting audio:", error);
    }
  };

  const handleModalClose = async () => {
    setModalVisible(false);
    try {
      const status = await sound.current.getStatusAsync(); // Check if the sound is loaded
      if (status.isLoaded) {
        await sound.current.setPositionAsync(0); // Reset to the beginning
        setProgress(0); // Reset progress
        if (isPlaying) {
          await pauseAudio(); // Pause if playing
        }
      } else {
        // Handle case when sound is not loaded yet
        setProgress(0);
      }
    } catch (error) {
      console.error("Error resetting audio on modal close:", error);
    }
  };

  function getWeekNumber(date = new Date()) {
    // Get the first day of the year
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    
    // Calculate the number of milliseconds since the start of the year
    const diff = date - startOfYear;
  
    // Convert the difference to days
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  
    // Calculate the week number
    const weekNumber = Math.ceil(dayOfYear / 7);
  
    return weekNumber;
  }

  const handleChallengeCompletion = async (challengeId) => {
    try {
      const today = new Date();
      const weekNumber = getWeekNumber(today); // Calculate current week
      const year = today.getFullYear();
      const weekKey = `week${weekNumber}year${year}`;
  
      const todayDate = today.toISOString().split("T")[0];

      const userChallengeRef = doc(db, "userChallenge", userId);
  
      // Fetch existing user challenges
      let updatedChallenges = { ...userChallengeData };
      if (!updatedChallenges[challengeId]) {
        updatedChallenges[challengeId] = { completed: [], streak: 0 };
      }

      const challenge = updatedChallenges[challengeId];
      const completedToday = challenge.completed.some(
        (entry) => entry.date === todayDate
      );

      if (completedToday) {
        Alert.alert(
          "Already Marked",
          "This challenge is already marked as completed for today."
        );
        return;
      }

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
  
      // Find or initialize user data
      let userCoinData = userCoins.find((coin) => coin.userId === userId);

      if (!userCoinData) {
        userCoinData = {
          userName,
          userId,
          userImage,
          userRole,
          weekly: {},
          allTime: { coins: 0, streak: 0 },
        };
        userCoins.push(userCoinData);
      }

      // Update weekly data
      if (!userCoinData.weekly[weekKey]) {
        userCoinData.weekly[weekKey] = { coins: 0, streak: 0 };
      }

      userCoinData.weekly[weekKey].coins += coinsEarned;
      userCoinData.weekly[weekKey].streak = challenge.streak;
  
      // Update all-time data
      userCoinData.allTime.coins += coinsEarned;
      userCoinData.allTime.streak = Math.max(
        userCoinData.allTime.streak,
        challenge.streak
      );

      // Save updated coins
      await setDoc(
        coinsRef,
        { coins: userCoins },
        { merge: true }
      );

      Alert.alert(
        "Challenge Completed!",
        `Streak: ${challenge.streak} days. Coins Earned: ${coinsEarned}.`
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
    const audioUri = config.AUDIO;

    const handleStartAudio = (item) => {
      setAudioUri(audioUri);
      setModalVisible(true);
      playAudio(audioUri, item);
    };

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

        {item.challengeName.toLowerCase() === "kriya" ? (
          <TouchableOpacity
            style={!challengeCompletedToday ? styles.startButton : {}}
            onPress={() => handleStartAudio(item)}
            disabled={challengeCompletedToday}
          >
            {challengeCompletedToday ? <Ionicons
              name="checkbox"
              size={36}
              color="green"
            /> : <Text style={styles.startButtonText}>
              {isPlaying ? "Pause" : "Start"}
            </Text>}
          </TouchableOpacity>
        ) : (
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
        )}
      </View>
    );
  };

  const formatTime = (millis) => {
    const minutes = Math.floor(millis / 60000);
    const seconds = Math.floor((millis % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
      ) : (
        <FlatList
          data={challenges}
          keyExtractor={(item) => item.challengeId}
          renderItem={renderChallengeItem}
          ListEmptyComponent={
            <Text style={styles.noChallengesText}>
              No challenges available.
            </Text>
          }
        />
      )}

      <Modal
        visible={modalVisible}
        onClose={handleModalClose}
        showCloseIcon={true}
        position="bottom"
      >
        <Text style={styles.modalText}>Short Kriya</Text>
        {audioLoading ? (
          <ActivityIndicator size="large" color={Colors.PRIMARY} />
        ) : (
          <View style={styles.audioPlayerContainer}>
            {/* Row to align Restart and Play/Pause buttons */}
            <View style={styles.controlsContainer}>
              <TouchableOpacity
                onPress={restartAudio}
                style={styles.iconButton}
              >
                <Ionicons
                  name="refresh-circle"
                  size={60}
                  color={Colors.PRIMARY}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={isPlaying ? pauseAudio : playAudio}
                style={styles.iconButton}
              >
                <Ionicons
                  name={isPlaying ? "pause-circle" : "play-circle"}
                  size={80}
                  color={Colors.PRIMARY}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.progressBarContainer}>
              <Text style={styles.timeText}>{formatTime(progress)}</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={duration}
                value={progress}
                minimumTrackTintColor={Colors.PRIMARY}
                maximumTrackTintColor={Colors.BACKGROUND}
                thumbTintColor={Colors.PRIMARY}
                disabled={true} // Prevent manual movement
              />
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          </View>
        )}
      </Modal>
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
    fontFamily: "outfit-bold",
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
    fontFamily: "outfit-bold",
  },
  challengeDuration: {
    fontSize: 16,
    color: "#555",
    fontFamily: "outfit-medium",
  },
  challengeDate: {
    fontSize: 14,
    color: "#888",
    fontFamily: "outfit",
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
    fontFamily: "outfit",
  },
  startButton: {
    backgroundColor: Colors.PRIMARY,
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  startButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "outfit-medium",
  },
  modalText: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  audioPlayerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  controlsContainer: {
    flexDirection: "row", // Align buttons horizontally
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
  },
  iconButton: {
    marginHorizontal: 20, // Add spacing between buttons
  },
  progressBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  timeText: {
    width: 40,
    textAlign: "center",
    fontSize: 14,
    color: Colors.TEXT,
  },
});
