import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Modal } from "../../components";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { Colors } from "../../constants/Colors";
import { config } from "../../config";

export default function Feed() {
  const [modalVisible, setModalVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const sound = useRef(new Audio.Sound());
  const audioUri = config.AUDIO;

  useEffect(() => {
    return () => {
      // Ensure sound is cleaned up when the component unmounts.
      sound.current.unloadAsync();
    };
  }, []);

  const updateProgress = async () => {
    const status = await sound.current.getStatusAsync();
    if (status.isLoaded) {
      setProgress(status.positionMillis);
      setDuration(status.durationMillis);
    }
  };

  const playAudio = async () => {
    try {
      const status = await sound.current.getStatusAsync();
      if (!status.isLoaded) {
        setLoading(true);
        await sound.current.loadAsync({ uri: audioUri });
        setLoading(false);
      }
      await sound.current.playAsync();
      setIsPlaying(true);
      sound.current.setOnPlaybackStatusUpdate(updateProgress);
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
  

  const formatTime = (millis) => {
    const minutes = Math.floor(millis / 60000);
    const seconds = Math.floor((millis % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text>Feed</Text>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>Open Modal</Text>
        </TouchableOpacity>
        <Modal
          visible={modalVisible}
          onClose={handleModalClose}
          showCloseIcon={true}
          position="bottom"
        >
          <Text style={styles.modalText}>Short Kriya</Text>
          {loading ? (
            <ActivityIndicator size="large" color={Colors.PRIMARY} />
          ) : (
            <View style={styles.audioPlayerContainer}>
              {/* Row to align Restart and Play/Pause buttons */}
              <View style={styles.controlsContainer}>
                <TouchableOpacity
                  onPress={restartAudio}
                  style={styles.iconButton}
                >
                  <Ionicons name="refresh-circle" size={60} color={Colors.PRIMARY} />
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: Colors.BACKGROUND,
    flexGrow: 1,
  },
  modalText: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: Colors.PRIMARY,
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 15,
  },
  addButtonText: {
    color: Colors.PRIMARY_LIGHT,
    fontFamily: "outfit-medium",
    fontSize: 16,
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
