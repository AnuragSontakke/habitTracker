import React, { useEffect, useRef } from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  Animated,
  StyleSheet,
  BackHandler,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Colors } from "../constants/Colors";

const CustomModal = ({
  visible,
  onClose,
  showCloseIcon = true,
  position = "bottom", // Default position
  children,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current; // For opacity
  const slideAnim = useRef(new Animated.Value(300)).current; // For sliding (initially off-screen)

  useEffect(() => {
    if (visible) {
      // Show modal animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0, // Slide to the visible position
          friction: 10, // Lower value for more bounce
          tension: 200, // Higher value for faster spring effect
          useNativeDriver: true,
        }),
      ]).start();

      // Add back button listener
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        () => true // Prevent back button from closing the modal
      );

      return () => backHandler.remove(); // Cleanup back button listener
    } else {
      // Hide modal animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 300, // Slide back to the hidden position
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const getModalPosition = () => {
    switch (position) {
      case "center":
        return { justifyContent: "center" };
      case "top":
        return { justifyContent: "flex-start", paddingTop: 50 };
      case "bottom":
      default:
        return { justifyContent: "flex-end" };
    }
  };

  return (
    <Modal
      transparent
      animationType="none"
      visible={visible}
      onRequestClose={() => {}} // Disable default back button close
    >
      <View style={[styles.overlay, getModalPosition()]}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: fadeAnim, // Bind opacity to fade animation
              transform: [{ translateY: slideAnim }], // Bind position to slide animation
              width: position === "center" ? "90%" : "100%", // Adjust width dynamically
            },
          ]}
        >
          {showCloseIcon && (
            <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
              <Ionicons name="close-circle" size={40} color={Colors.PRIMARY_DARK} />
            </TouchableOpacity>
          )}
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Dimmed background
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeIcon: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
  },
});

export default CustomModal;
