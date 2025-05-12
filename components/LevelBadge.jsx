import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Rect } from "react-native-svg";
import { Colors } from "../constants/Colors";
import { LEVEL_PROGRESSION } from "../constants/Levels";
import { getLevelDataFromStreak } from "../services/dataFromStreak";



// Define styles for each category
const LEVEL_STYLES = {
  Beginner: {
    backgroundColor: Colors.PRIMARY,
    textColor: "#fff",
    progressColor: Colors.PRIMARY_DARK, // Darker shade for progress
  },
  "Brass Bravery": {
    backgroundColor: "#b36a18",
    textColor: "#fff",
    progressColor: "#d89b3e", // Lighter brass
  },
  "Iron Will": {
    backgroundColor: "#4B4B4B",
    textColor: "#fff",
    progressColor: "#6a6a6a", // Lighter iron
  },
  "Copper Glow": {
    backgroundColor: "#cb6d51",
    textColor: "#fff",
    progressColor: "#e88a6e", // Lighter copper
  },
  "Silver Peace": {
    backgroundColor: "#c0c0c0",
    textColor: "#000",
    progressColor: "#e0e0e0", // Lighter silver
  },
  "Gold Harmony": {
    backgroundColor: "#FFD700",
    textColor: "#000",
    progressColor: "#FFEA80", // Lighter gold
  },
  "Divine Radiance": {
    backgroundColor: "#f5e6ff",
    textColor: "#000",
    progressColor: "#ffffff", // White for divine glow
  },
};

// Function to get level data and progress based on streak


const LevelBadge = ({
  levelText = null,
  streak = 0,
  bottom = 0,
  paddingVertical = 2,
  fontSize = 8,
  minWidth = 60,
  borderWidth = 1.5,
  height = 20,
  opacity = 1,
}) => {
  // Get level data and progress
  const { category, progress } = getLevelDataFromStreak(streak);
  const displayText = levelText || category;
  const levelStyle = LEVEL_STYLES[displayText] || LEVEL_STYLES["Beginner"];

  // Calculate SVG dimensions (slightly larger than badge to account for stroke)
  const svgWidth = minWidth + borderWidth * 2;
  const svgHeight = height + borderWidth * 2;

  return (
    <View style={[styles.badgeContainer, { bottom, opacity }]}>
      {/* Progress bar (SVG border) */}
      <Svg
        width={svgWidth}
        height={svgHeight}
        style={styles.progressSvg}
      >
        {/* Background border (empty) */}
        <Rect
          x={borderWidth / 2}
          y={borderWidth / 2}
          width={minWidth}
          height={height}
          rx={5}
          ry={5}
          stroke="#fff"
          strokeWidth={borderWidth}
          fill="none"
        />
        {/* Progress border */}
        <Rect
          x={borderWidth / 2}
          y={borderWidth / 2}
          width={minWidth}
          height={height}
          rx={5}
          ry={5}
          stroke={levelStyle.progressColor}
          strokeWidth={borderWidth}
          fill="none"
          strokeDasharray={`${minWidth * 2 + height * 2}`}
          strokeDashoffset={`${(minWidth * 2 + height * 2) * (1 - progress)}`}
        />
      </Svg>

      {/* Badge content */}
      <View
        style={[
          styles.badge,
          {
            paddingVertical,
            minWidth,
            height,
            backgroundColor: levelStyle.backgroundColor,
          },
        ]}
      >
        <Text
          style={[styles.text, { fontSize, color: levelStyle.textColor }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {displayText}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  badgeContainer: {
    position: "absolute",
    left: "90%", // Center horizontally
    transform: [{ translateX: -50 }], // Offset by half its width
    zIndex: 2, // Above profile picture
  },
  badge: {
    paddingHorizontal: 6, // Balanced padding for short/long text
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontWeight: "bold",
    textAlign: "center",
    fontFamily: "outfit",
    flexShrink: 1,
    textShadowColor: "rgba(0, 0, 0, 0.2)", // Subtle shadow for readability
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  progressSvg: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 1, // Below badge content but above profile picture
  },
});

export default LevelBadge;