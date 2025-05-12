import React from "react";
import { View, Text, StyleSheet } from "react-native";

const LEVEL_STYLES = {
  Beginner: {
    backgroundColor: "#333",
    textColor: "#fff",
  },
  "Iron Will": {
    backgroundColor: "#4B4B4B",
    textColor: "#fff",
  },
  "Brass Bravery": {
    backgroundColor: "#b36a18",
    textColor: "#fff",
  },
  "Copper Glow": {
    backgroundColor: "#cb6d51",
    textColor: "#fff",
  },
  "Silver Peace": {
    backgroundColor: "#c0c0c0",
    textColor: "#000",
  },
  "Gold Harmony": {
    backgroundColor: "#FFD700",
    textColor: "#000",
  },
  "Divine Radiance": {
    backgroundColor: "#f5e6ff",
    textColor: "#000",
  },
};

const LevelBadge = ({
  levelText = "Beginner",
  top,
  right,
  paddingVertical = 2,
  fontSize = 8,
  minWidth = 30,
  borderWidth = 1.5,
  height = 20,
  opacity = 1,
}) => {
  const levelStyle = LEVEL_STYLES[levelText] || LEVEL_STYLES["Beginner"];

  return (
    <View
      style={[
        styles.badge,
        {
          top,
          right,
          paddingVertical,
          minWidth,
          borderWidth,
          height,
          opacity,
          backgroundColor: levelStyle.backgroundColor,
        },
      ]}
    >
      <Text style={[styles.text, { fontSize, color: levelStyle.textColor }]}>
        {levelText}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    paddingHorizontal: 2,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
    borderColor: "#fff",
  },
  text: {
    fontWeight: "bold",
    textAlign: "center",
    fontFamily: "outfit",
  },
});

export default LevelBadge;
