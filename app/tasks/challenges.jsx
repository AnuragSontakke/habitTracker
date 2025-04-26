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
  Dimensions,
  ScrollView,
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
import { Modal } from "../../components";
import YoutubePlayer from "react-native-youtube-iframe";
import * as Progress from "react-native-progress";

const { width } = Dimensions.get("window");

export default function Challenges() {
  const { userTeacher, userId, userName, userImage, userRole } =
    useUserContext();
  const [challenges, setChallenges] = useState([]);
  const [userChallengeData, setUserChallengeData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [meditationLoading, setMeditationLoading] = useState(false);
  const [audioLoading, setAudioLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [audioUri, setAudioUri] = useState("");
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

  // Cleanup audio on component unmount
  useEffect(() => {
    return () => {
      sound.current.unloadAsync().catch((error) => {
        console.warn("Error unloading audio:", error);
      });
    };
  }, []);

  // YouTube player progress tracking
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!playerRef.current || !selectedMeditation) return;

      try {
        const elapsed_sec = await playerRef.current.getCurrentTime();
        const totalDuration = await playerRef.current.getDuration();

        if (totalDuration <= 0) return;

        const progressPercent = (elapsed_sec / totalDuration) * 100;
        setMeditationProgress(progressPercent);

        if (!meditationProgressUpdated && progressPercent >= 3) {
          updateProgressMeditation(selectedMeditation);
          setMeditationProgressUpdated(true);
        }

        const elapsed_ms = Math.floor(elapsed_sec * 1000);
        const ms = elapsed_ms % 1000;
        const min = Math.floor(elapsed_ms / 60000);
        const seconds = Math.floor((elapsed_ms - min * 60000) / 1000);

        setElapsed(
          `${min.toString().padStart(2, "0")}:${seconds
            .toString()
            .padStart(2, "0")}:${ms.toString().padStart(3, "0")}`
        );
      } catch (error) {
        console.warn("Error fetching YouTube player data:", error);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [meditationProgressUpdated, selectedMeditation]);

  // Fetch challenges
  useEffect(() => {
    const fetchChallenges = async () => {
      if (!userTeacher?.teacherId) {
        setLoading(false);
        setError("Teacher ID is not available.");
        return;
      }

      try {
        const challengesRef = doc(db, "challenge", userTeacher.teacherId);
        const challengesSnap = await getDoc(challengesRef);

        if (challengesSnap.exists()) {
          setChallenges(challengesSnap.data().challenges || []);
        } else {
          setError("This teacher has no challenges.");
        }

        const userChallengeRef = doc(db, "userChallenge", userId);
        const userChallengeSnap = await getDoc(userChallengeRef);

        if (userChallengeSnap.exists()) {
          setUserChallengeData(userChallengeSnap.data().challenges || {});
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load challenges.");
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

  // Fetch meditation list
  const getMeditationList = async () => {
    try {
      setMeditationLoading(true);
      const q = query(collection(db, "slider"));
      const querySnapshot = await getDocs(q);
      const sliders = [];
      querySnapshot.forEach((doc) => {
        sliders.push(doc.data());
      });
  
      // Shuffle the array
      const shuffledSliders = sliders.sort(() => Math.random() - 0.5);
  
      setMeditationList(shuffledSliders);
    } catch (err) {
      console.error("Error fetching slider data:", err);
      setError("Failed to load meditation data. Please try again later.");
    } finally {
      setMeditationLoading(false);
    }
  };
  

  useEffect(() => {
    getMeditationList();
  }, []);

  const handleVideoSelect = (item) => {
    const videoId = extractYouTubeVideoId(item?.videoUrl);
    if (videoId) {
      setSelectedVideoId(videoId);
      setSelectedMeditation(item);
    }
  };

  const handleRandomMeditation = () => {
    if (meditationList.length === 0) {
      Alert.alert("Error", "No meditations available.");
      return;
    }
    const randomIndex = Math.floor(Math.random() * meditationList.length);
    const randomMeditation = meditationList[randomIndex];
    handleVideoSelect(randomMeditation);
  };

  const updateProgress = async (status, item) => {
    if (status.isLoaded) {
      setProgress(status.positionMillis);
      setDuration(status.durationMillis);

      const tenPercent = status.durationMillis * 0.01;
      const today = new Date().toISOString().split("T")[0];
      const challengeKey = `${item.challengeId}-${today}`;

      if (
        status.positionMillis >= tenPercent &&
        !userChallengeData[item.challengeId]?.completed?.some(
          (entry) => entry.date === today
        ) &&
        !challengeCompletionTracker.current.has(challengeKey)
      ) {
        challengeCompletionTracker.current.add(challengeKey);
        await handleChallengeCompletion(item.challengeId);
      }
    }
  };

  const updateProgressMeditation = async (item) => {
    if (!item) return;

    const today = new Date().toISOString().split("T")[0];
    const challengeKey = `${item.challengeId}-${today}`;

    if (
      !userChallengeData[item.challengeId]?.completed?.some(
        (entry) => entry.date === today
      ) &&
      !challengeCompletionTracker.current.has(challengeKey)
    ) {
      challengeCompletionTracker.current.add(challengeKey);
      await handleChallengeCompletion(item.challengeId);
    }
  };

  const playAudio = async (audioUri, item) => {
    try {
      setAudioLoading(true);
      const { sound: audioSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true }
      );
      sound.current = audioSound;
      setAudioLoading(false);
      setIsPlaying(true);
      sound.current.setOnPlaybackStatusUpdate((status) =>
        updateProgress(status, item)
      );
    } catch (error) {
      console.error("Error playing audio:", error);
      setAudioLoading(false);
      setError("Failed to play audio.");
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
      await sound.current.setPositionAsync(0);
      if (isPlaying) {
        await sound.current.playAsync();
      }
      setProgress(0);
    } catch (error) {
      console.error("Error restarting audio:", error);
    }
  };

  const handleModalClose = async () => {
    setModalVisible(false);
    setAudioUri("");
    setIsPlaying(false);
    setProgress(0);
    try {
      const status = await sound.current.getStatusAsync();
      if (status.isLoaded) {
        await sound.current.unloadAsync();
      }
    } catch (error) {
      console.error("Error resetting audio on modal close:", error);
    }
  };

  function getWeekNumber(date = new Date()) {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const diff = date - startOfYear;
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
    return Math.ceil(dayOfYear / 7);
  }

  const handleChallengeCompletion = async (challengeId) => {
    try {
      const today = new Date();
      const weekNumber = getWeekNumber(today);
      const year = today.getFullYear();
      const weekKey = `week${weekNumber}year${year}`;
      const todayDate = today.toISOString().split("T")[0];

      const userChallengeRef = doc(db, "userChallenge", userId);
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
            coinsEarned = 10;
            break;
        }
      }
      await setDoc(
        userChallengeRef,
        { challenges: updatedChallenges },
        { merge: true }
      );
      setUserChallengeData(updatedChallenges);

      const coinsRef = doc(db, "coin", userTeacher.teacherId);
      const coinsSnap = await getDoc(coinsRef);
      let userCoins = coinsSnap.exists() ? coinsSnap.data().coins : [];

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
    return url && typeof url === "string" ? url.match(regExp)?.[1] : null;
  };

  const getYouTubeThumbnail = (videoUrl) => {
    const videoId = extractYouTubeVideoId(videoUrl);
    return videoId
      ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      : null;
  };

  const getLast30Days = () => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      days.push(dateStr);
    }
    return days;
  };

  const renderChallengeItem = ({ item }) => {
    const today = new Date().toISOString().split("T")[0];
    const userChallenge = userChallengeData[item.challengeId];
    const challengeCompletedToday = userChallenge?.completed?.some(
      (entry) => entry.date === today
    );
    const audioUri = item.audioUri || config.AUDIO;
    const completedDates =
      userChallenge?.completed?.map((entry) => entry.date) || [];

    const handleStartAudio = () => {
      if (!audioUri) {
        Alert.alert("Error", "No audio available for this challenge.");
        return;
      }
      setAudioUri(audioUri);
      setModalVisible(true);
      playAudio(audioUri, item);
    };

    const allDays = getLast30Days();
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
              onPress={handleStartAudio}
              accessibilityLabel={`Start ${item.challengeName}`}
              accessibilityRole="button"
            >
              <Text style={styles.startButtonText}>
                {isPlaying ? "Pause" : "Start"}
              </Text>
            </TouchableOpacity>
          ) : item.challengeName.toLowerCase() === "meditation" ? (
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => handleStartMeditation(item)}
              accessibilityLabel={`Start ${item.challengeName}`}
              accessibilityRole="button"
            >
              <Text style={styles.startButtonText}>Start</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => handleChallengeCompletion(item.challengeId)}
              accessibilityLabel={`Complete ${item.challengeName}`}
              accessibilityRole="checkbox"
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
                length: 40,
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

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
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
            <View style={styles.controlsContainer}>
              <TouchableOpacity
                onPress={restartAudio}
                style={styles.iconButton}
                accessibilityLabel="Restart audio"
                accessibilityRole="button"
              >
                <Ionicons
                  name="refresh-circle"
                  size={60}
                  color={Colors.PRIMARY}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={isPlaying ? pauseAudio : () => playAudio(audioUri)}
                style={styles.iconButton}
                accessibilityLabel={isPlaying ? "Pause audio" : "Play audio"}
                accessibilityRole="button"
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
                disabled={true}
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
        style={styles.meditationModal}
        title={
          selectedVideoId ? "Meditation in Progress" : "Select a Meditation"
        }
        stickyButtonText="Choose Random Meditation"
        onStickyButtonPress={handleRandomMeditation}
      >
        <SafeAreaView style={styles.meditationModalContainer}>
          <ScrollView contentContainerStyle={styles.meditationScrollContent}>
            {meditationLoading ? (
              <ActivityIndicator size="large" color={Colors.PRIMARY} />
            ) : selectedVideoId ? (
              <>
                <YoutubePlayer
                  height={250}
                  ref={playerRef}
                  videoId={selectedVideoId}
                  play={true}
                  webViewStyle={{ opacity: 0.99 }}
                  initialPlayerParams={{
                    controls: 0,
                    modestbranding: true,
                    showinfo: false,
                    rel: false,
                    fs: false,
                    cc_load_policy: 0,
                    iv_load_policy: 3,
                  }}
                  onChangeState={(state) => {
                    if (state === "ended") {
                      setSelectedVideoId(null);
                    }
                  }}
                />
                <View style={{ marginTop: 10 }}>
                  <Progress.Bar
                    progress={meditationProgress / 100}
                    width={null}
                    height={10}
                    borderRadius={5}
                    color={Colors.PRIMARY_DARK}
                    unfilledColor={Colors.PRIMARY}
                    borderWidth={0}
                  />
                  <Text>Progress: {meditationProgress.toFixed(2)}%</Text>
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
                    <TouchableOpacity
                      onPress={() => handleVideoSelect(item)}
                      accessibilityLabel={`Play meditation video ${
                        item.title || "Meditation"
                      }`}
                      accessibilityRole="button"
                    >
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
            
          </ScrollView>
          {!selectedVideoId && <TouchableOpacity
            style={styles.randomButton}
            onPress={handleRandomMeditation}
            accessibilityLabel="Choose Random Meditation"
            accessibilityRole="button"
          >
            <Text style={styles.randomButtonText}>
              Choose Random Meditation
            </Text>
          </TouchableOpacity>}
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
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
    marginTop: 20,
    fontFamily: "outfit",
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
  checkboxContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  noChallengesText: {
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
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
  },
  iconButton: {
    marginHorizontal: 20,
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
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 2,
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
  meditationModalTitle: {
    fontSize: 20,
    fontFamily: "outfit-bold",
    marginBottom: 20,
    color: Colors.PRIMARY,
  },
  flatListContent: {
    paddingBottom: 2,
  },
  meditationItem: {
    marginBottom: 20,
    alignItems: "center",
  },
  thumbnailContainer: {
    position: "relative",
  },
  thumbnail: {
    width: width * 0.75,
    height: (width * 0.75 * 9) / 16,
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
  meditationModal: {
    height: Dimensions.get("window").height * 0.7, // Fixed height (70% of screen height)
    justifyContent: "space-between",
  },
  meditationModalContainer: {
    flex: 1,
    padding: 20,
  },
  meditationScrollContent: {
    paddingBottom: 20,
  },
  randomButton: {
    backgroundColor: Colors.PRIMARY_DARK,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    position: "sticky",
    bottom: 0,
  },
  randomButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "outfit-medium",
  },
});
