import React, { useEffect, useRef } from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Text,
  BackHandler,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import LottieView from "lottie-react-native";
import { Colors } from "../constants/Colors";
import { firstStreakMessages, motivationalMessages } from "../constants/streaks";

const ChallengeCompletionModal = ({
  visible,
  onClose,
  challengeName,
  streak,
  coinsEarned,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 10,
          tension: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          onClose();
          return true;
        }
      );

      return () => backHandler.remove();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const getStreakMessage = (streak, challengeName, coinsEarned) => {
    if (streak === 1) {
      // Select a random message from the firstStreakMessages for streak = 1
      const randomIndex = Math.floor(
        Math.random() * firstStreakMessages.length
      );
      return firstStreakMessages[randomIndex]
        .replace("{challengeName}", challengeName)
        .replace("{coinsEarned}", coinsEarned);
    } else {
      // Select a random message from motivationalMessages for streak > 1
      const randomIndex = Math.floor(
        Math.random() * motivationalMessages.length
      );
      return motivationalMessages[randomIndex]
        .replace("{challengeName}", challengeName)
        .replace("{streak}", streak)
        .replace("{coinsEarned}", coinsEarned);
    }
  };

  return (
    <Modal
      transparent
      animationType="none"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Close Button */}
          <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
            <Ionicons name="close-circle" size={40} color={Colors.PRIMARY} />
          </TouchableOpacity>

          {/* Main Content */}
          <View style={styles.mainContentContainer}>
            {/* Tick Animation */}
            <LottieView
              source={require("../assets/lottie/tick.json")}
              autoPlay
              loop={true} // or true if you want
              style={styles.lottieStyle}
            />

            <Text style={styles.congratulationText}>
              {getStreakMessage(streak, challengeName, coinsEarned)}
            </Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: "80%",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
    position: "relative",
  },
  closeIcon: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
  },
  mainContentContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  lottieStyle: {
    width: 120,
    height: 120,
  },
  infoText: {
    marginTop: 20,
    fontSize: 16,
    fontFamily: "outfit",
    color: Colors.TEXT,
    textAlign: "center",
  },
  highlight: {
    fontFamily: "outfit-bold",
    color: Colors.PRIMARY,
  },
  congratulationText: {
    fontSize: 18,
    textAlign: "center",
    color: Colors.TEXT,
    fontFamily: "outfit-medium",
    marginTop: 20,
    paddingHorizontal: 20,
  },
});

export default ChallengeCompletionModal;
