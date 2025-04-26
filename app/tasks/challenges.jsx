import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from "react-native";
import { useUserContext } from "../../contexts/UserContext";
import { db } from "../../configs/FirebaseConfig";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
} from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import Slider from "@react-native-community/slider";
import { Colors } from "../../constants/Colors";
import { config } from "../../config";
import { Modal } from "../../components"; // Import the Modal component
import YoutubePlayer from "react-native-youtube-iframe";
import * as Progress from "react-native-progress";

export default function Challenges() {
  const { userTeacher, userId, userName, userImage, userRole } =
    useUserContext();
  const [challenges, setChallenges] = useState([]);
  const [userChallengeData, setUserChallengeData] = useState({});
  const [loading, setLoading] = useState(true);
  const [meditationLoading, setMeditationLoading] = useState(false);
  const [audioLoading, setAudioLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [audioUri, setAudioUri] = useState(""); // Store the audio URI for the modal
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const sound = useRef(new Audio.Sound());
  const challengeCompletionTracker = useRef(new Set());
  const [meditationList, setMeditationList] = useState([]);
  const [meditationModalVisible, setMeditationModalVisible] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [selectedMeditation, setSelectedMeditation] = useState(null);
  const [meditationProgressUpdated, setMeditationProgressUpdated] =
    useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [meditationProgress, setMeditationProgress] = useState(0);
  const playerRef = useRef();

  useEffect(() => {
    const interval = setInterval(async () => {
      const elapsed_sec = await playerRef.current.getCurrentTime(); // Get current time in seconds

      const totalDuration = await playerRef.current.getDuration(); // Get total video duration in seconds
      const progressPercent = (elapsed_sec / totalDuration) * 100; // Calculate percentage progress

      // Update the progress state
      setMeditationProgress(progressPercent);

      if (
        !meditationProgressUpdated &&
        progressPercent >= 3 &&
        progressPercent < 4
      ) {
        updateProgressMeditation(selectedMeditation);
        setSelectedMeditation(null);
        // Call any function here to mark video as nearly complete
        setMeditationProgressUpdated(true); // Set the state to prevent further triggers
      }

      // Optional: Format and update the elapsed time in mm:ss:ms format
      const elapsed_ms = Math.floor(elapsed_sec * 1000);
      const ms = elapsed_ms % 1000;
      const min = Math.floor(elapsed_ms / 60000);
      const seconds = Math.floor((elapsed_ms - min * 60000) / 1000);

      setElapsed(
        min.toString().padStart(2, "0") +
          ":" +
          seconds.toString().padStart(2, "0") +
          ":" +
          ms.toString().padStart(3, "0")
      );
    }, 100); // Refresh every 100ms for smooth progress tracking

    return () => {
      clearInterval(interval); // Cleanup on component unmount
    };
  }, [meditationProgressUpdated]);

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

  const getMeditationList = async () => {
    try {
      setMeditationLoading(true); // Start loading before fetching
      const q = query(collection(db, "slider"));
      const querySnapshot = await getDocs(q);
      const sliders = [];
      querySnapshot.forEach((doc) => {
        sliders.push(doc.data());
      });
      setMeditationList(sliders);
    } catch (err) {
      console.error("Error fetching slider data:", err);
      setError("Failed to load data. Please try again later.");
    } finally {
      setMeditationLoading(false); // Stop loading after fetch (success or error)
    }
  };

  useEffect(() => {
    getMeditationList();
  }, []);

  const handleVideoSelect = (item) => {
    const videoId = extractYouTubeVideoId(item?.videoUrl);
    if (videoId) {
      setSelectedVideoId(videoId);
    }
  };

  const updateProgress = async (status, item) => {
    if (status.isLoaded) {
      setProgress(status.positionMillis);
      setDuration(status.durationMillis);

      const tenPercent = status.durationMillis * 0.9;
      const today = new Date().toISOString().split("T")[0];
      const challengeKey = `${item.challengeId}-${today}`;

      if (
        status.positionMillis >= tenPercent &&
        !userChallengeData[item.challengeId]?.completed?.some(
          (entry) => entry.date === today
        ) &&
        !challengeCompletionTracker.current.has(challengeKey)
      ) {
        challengeCompletionTracker.current.add(challengeKey); // Mark as completed
        await handleChallengeCompletion(item.challengeId);
      }
    }
  };

  const updateProgressMeditation = async (item) => {
    const today = new Date().toISOString().split("T")[0];
    const challengeKey = `${item.challengeId}-${today}`;

    if (
      !userChallengeData[item.challengeId]?.completed?.some(
        (entry) => entry.date === today
      ) &&
      !challengeCompletionTracker.current.has(challengeKey)
    ) {
      challengeCompletionTracker.current.add(challengeKey); // Mark as completed
      await handleChallengeCompletion(item.challengeId);
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
      sound.current.setOnPlaybackStatusUpdate((status) =>
        updateProgress(status, item)
      );
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
      await setDoc(coinsRef, { coins: userCoins }, { merge: true });

      Alert.alert(
        "Challenge Completed!",
        `Streak: ${challenge.streak} days. Coins Earned: ${coinsEarned}.`
      );
    } catch (error) {
      console.error("Error updating challenge completion:", error);
      Alert.alert("Error", "Failed to update challenge completion.");
    }
  };

  const handleStartMeditation = async (item) => {
    setMeditationModalVisible(true);
    setSelectedMeditation(item);
  };

  const extractYouTubeVideoId = (url) => {
    const regExp =
      /(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/[^\/]+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=))([a-zA-Z0-9_-]{11})/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  const getYouTubeThumbnail = (videoUrl) => {
    const videoId = extractYouTubeVideoId(videoUrl); // Extract video ID
    return videoId
      ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      : null;
  };

  const renderChallengeItem = ({ item }) => {
    const today = new Date().toISOString().split("T")[0];
    const userChallenge = userChallengeData[item.challengeId];
    const challengeCompletedToday = userChallenge?.completed?.some(
      (entry) => entry.date === today
    );
    const audioUri = config.AUDIO;
    const completedDates =
      userChallenge?.completed?.map((entry) => entry.date) || [];

    const handleStartAudio = (item) => {
      setAudioUri(audioUri);
      setModalVisible(true);
      playAudio(audioUri, item);
    };

    const getLast365Days = () => {
      const days = [];
      for (let i = 364; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        days.push(dateStr);
      }
      return days;
    };

    const allDays = getLast365Days();
    const todayIndex = allDays.findIndex((date) => date === today);

    const renderDateItem = ({ item: date, index }) => {
      const completed = completedDates.includes(date);
      const day = new Date(date).getDate();
      const month = new Date(date).toLocaleString("default", {
        month: "short",
      });

      const isNewMonth =
        index === 0 ||
        new Date(date).getMonth() !== new Date(allDays[index - 1]).getMonth();

      return (
        <View style={styles.dateCircle}>
          <View
            style={[
              styles.circle,
              {
                backgroundColor: completed ? Colors.PRIMARY : "white",
                borderColor: completed ? "transparent" : Colors.PRIMARY,
                borderWidth: completed ? 0 : 2,
              },
            ]}
          >
            <Text
              style={[
                styles.dateTextInside,
                {
                  color: completed ? "white" : Colors.PRIMARY,
                },
              ]}
            >
              {day}
            </Text>
          </View>
          {isNewMonth && <Text style={styles.monthArrow}>↑ {month}</Text>}
        </View>
      );
    };

    return (
      <View style={styles.challengeItem}>
        {!challengeCompletedToday && (
          <View style={styles.challengeTextContainer}>
            <Text style={styles.challengeName}>{item.challengeName}</Text>
            <Text style={styles.challengeDuration}>
              {item.challengeDuration}
            </Text>
          </View>
        )}

        {!challengeCompletedToday ? (
          item.challengeName.toLowerCase() === "kriya" ? (
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => handleStartAudio(item)}
            >
              <Text style={styles.startButtonText}>
                {isPlaying ? "Pause" : "Start"}
              </Text>
            </TouchableOpacity>
          ) : item.challengeName.toLowerCase() === "meditation" ? (
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => handleStartMeditation(item)}
            >
              <Text style={styles.startButtonText}>Start Meditation</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => handleChallengeCompletion(item.challengeId)}
            >
              <Ionicons name="checkbox-outline" size={36} color="gray" />
            </TouchableOpacity>
          )
        ) : (
          <View style={styles.progressContainer}>
            <Text style={styles.challengeName}>
              {item.challengeName} Streak: {userChallenge?.streak || 0}{" "}
              {userChallenge?.streak > 5 ? "🔥" : ""}
            </Text>

            <FlatList
              data={allDays}
              keyExtractor={(item) => item}
              renderItem={renderDateItem}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dateCircleContainer}
              initialScrollIndex={todayIndex}
              getItemLayout={(data, index) => ({
                length: 40, // item width + margin
                offset: 40 * index,
                index,
              })}
              decelerationRate="fast"
            />
          </View>
        )}
      </View>
    );
  };

  const formatTime = (millis) => {
    const minutes = Math.floor(millis / 60000);
    const seconds = Math.floor((millis % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };
console.log("selectedMeditation",selectedMeditation)
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

      <Modal
        position="center"
        visible={meditationModalVisible}
        onClose={() => {
          setMeditationModalVisible(false);
          setSelectedVideoId(null);
          setMeditationProgressUpdated(false);
          setSelectedMeditation(null);
        }}
      >
        <SafeAreaView>
          {
            <Text style={styles.meditationModalTitle}>
              {!selectedVideoId
                ? "Select Meditation"
                : "You can close your eyes now"}
            </Text>
          }

          {meditationLoading ? (
            <ActivityIndicator size="large" color={Colors.PRIMARY} />
          ) : selectedVideoId ? (
            <>
              <YoutubePlayer
                height={250}
                ref={playerRef}
                videoId={selectedVideoId}
                play={true}
                webViewStyle={{ opacity: 0.99 }} // Fix tiny bug where player sometimes flickers
                initialPlayerParams={{
                  controls: 0, // Show controls (progress bar)
                  modestbranding: true, // Hide YouTube logo
                  showinfo: false, // Hide title
                  rel: false, // Don't show related videos at end
                  fs: false, // Hide fullscreen button
                  cc_load_policy: 0, // Hide captions
                  iv_load_policy: 3, // Hide annotations
                }}
                onChangeState={(state) => {
                  if (state === "ended") {
                    setSelectedVideoId(null);
                  }
                }}
              />
              <View style={{ marginTop: 10 }}>
                <Progress.Bar
                  progress={meditationProgress / 100} // Convert percentage to a fraction
                  width={null} // Full width of the parent container
                  height={10} // Progress bar height
                  borderRadius={5} // Rounded corners
                  color={Colors.PRIMARY_DARK} // Green color
                  unfilledColor={Colors.PRIMARY} // Light gray color for unfilled part
                  borderWidth={0} // No border around the progress bar
                />
                <Text>Progress: {meditationProgress.toFixed(2)}%</Text>
                {/* Display the progress percentage */}
              </View>
            </>
          ) : (
            <FlatList
              data={meditationList}
              nestedScrollEnabled={true}
              contentContainerStyle={styles.flatListContent}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <View style={styles.meditationItem}>
                  <TouchableOpacity onPress={() => handleVideoSelect(item)}>
                    <View style={styles.thumbnailContainer}>
                      <Image
                        source={{
                          uri:
                            getYouTubeThumbnail(item.videoUrl) ||
                            "https://via.placeholder.com/250x145",
                        }}
                        style={styles.thumbnail}
                      />
                      <Ionicons
                        name="play-circle-outline"
                        size={50}
                        color="white"
                        style={styles.playIcon}
                      />
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    marginTop: 20,
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
    marginBottom: 20,
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
  progressContainer: {
    marginTop: 10,
  },

  streakText: {
    fontSize: 14,
    color: Colors.PRIMARY_DARK,
    marginBottom: 4,
    fontFamily: "outfit-medium",
  },

  dateCircleContainer: {
    flexDirection: "row",
    paddingHorizontal: 4,
    paddingVertical: 8,
    gap: 8,
  },

  dateCircle: {
    alignItems: "center",
    width: 40,
  },

  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 2, // Optional: extra spacing inside the scroll
  },

  dateTextInside: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "outfit-medium",
  },

  dateCircleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },

  dateCircle: {
    alignItems: "center",
    width: 40,
  },

  progressContainer: {
    marginTop: 10,
    flex: 1,
  },

  streakText: {
    fontSize: 14,
    color: Colors.PRIMARY_DARK,
    marginBottom: 6,
    fontFamily: "outfit-medium",
  },
  monthArrow: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.PRIMARY,
    marginTop: 4,
    fontFamily: "outfit-medium",
    textAlign: "center",
  },
  // meditationModalContainer: {
  //   flex: 1,
  //   padding: 20,
  //   backgroundColor: "#fff",
  // },
  meditationModalTitle: {
    fontSize: 20,
    fontFamily: "outfit-bold",
    marginBottom: 20,
    color: Colors.PRIMARY,
  },
  flatListContent: {
    paddingBottom: 20,
  },
  meditationItem: {
    marginBottom: 20,
    alignItems: "center",
  },
  thumbnailContainer: {
    position: "relative",
  },
  thumbnail: {
    width: 250,
    height: 145,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: Colors.PRIMARY_LIGHT,
  },
  playIcon: {
    position: "absolute",
    backgroundColor: Colors.PRIMARY_LIGHT,
    borderRadius: 99,
    top: "50%",
    left: "50%",
    transform: [{ translateX: -25 }, { translateY: -25 }],
  },
});
