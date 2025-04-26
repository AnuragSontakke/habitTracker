import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  StyleSheet,
  LayoutChangeEvent,
} from "react-native";
import Svg, { Rect } from "react-native-svg";
import LottieView from "lottie-react-native";

const LEVELS = [
  { minCoins: 0, name: "Seed", emoji: "🌱" },
  { minCoins: 100, name: "Sprout", emoji: "🌿" },
  { minCoins: 200, name: "Sapling", emoji: "🌾" },
  { minCoins: 500, name: "Young Tree", emoji: "🌳" },
  { minCoins: 700, name: "Blooming Tree", emoji: "🌸" },
  { minCoins: 1000, name: "Fruiting Tree", emoji: "🍎" },
  { minCoins: 2000, name: "Sacred Grove", emoji: "🌲" },
  { minCoins: 5000, name: "Ancient Tree", emoji: "🌴" },
  { minCoins: 7000, name: "Enlightened Tree", emoji: "🧘‍♂️" },
  { minCoins: 9000, name: "Tree of Light", emoji: "✨🌳" },
];

const getCurrentLevel = (coinCount) => {
  return [...LEVELS].reverse().find((level) => coinCount >= level.minCoins) || LEVELS[0];
};

export default function LevelWithAnimation({ coinCount }) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [boxSize, setBoxSize] = useState({ width: 0, height: 0 });
  const animatedValue = useRef(new Animated.Value(0)).current;
  const breezeRef = useRef(null);
  const currentLevel = getCurrentLevel(coinCount);

  const nextLevelIndex = LEVELS.findIndex(l => l.minCoins === currentLevel.minCoins) + 1;
  const nextLevel = LEVELS[nextLevelIndex] || currentLevel;

  const progressPercent = Math.min(
    (coinCount - currentLevel.minCoins) / (nextLevel.minCoins - currentLevel.minCoins || 1),
    1
  );

  const triggerAnimation = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    animatedValue.setValue(0);
    breezeRef.current?.play();
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.timing(animatedValue, {
        toValue: 1.5,
        duration: 1500,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease),
      }),
    ]).start(() => {
      setIsAnimating(false);
    });
  };

  const onBoxLayout = (event) => {
    const { width, height } = event.nativeEvent.layout;
    setBoxSize({ width, height });
  };

  const strokeWidth = 4;
  const radius = Math.max(boxSize.width, boxSize.height) / 2 + strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressPercent);

  return (
    <View style={styles.container}>
      {/* Progress Circle */}
      {boxSize.width > 0 && (
        <Svg
        width={boxSize.width + 8}
        height={boxSize.height + 8}
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          marginLeft: -(boxSize.width + 8) / 2,
          marginTop: -(boxSize.height + 8) / 2,
          zIndex: -1,
        }}
      >
        {/* Full Border Background */}
        <Rect
          x={4}
          y={4}
          width={boxSize.width}
          height={boxSize.height}
          rx={20} // same as your levelBox borderRadius
          ry={20}
          stroke="#444"
          strokeWidth={4}
          fill="none"
        />
        
        {/* Progress */}
        <Rect
          x={4}
          y={4}
          width={boxSize.width}
          height={boxSize.height}
          rx={20}
          ry={20}
          stroke="#4CAF50"
          strokeWidth={4}
          strokeDasharray={(boxSize.width + boxSize.height) * 2}
          strokeDashoffset={(boxSize.width + boxSize.height) * 2 * (1 - progressPercent)}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
      
      )}

      {/* Level Box */}
      <TouchableOpacity onPress={triggerAnimation} onLayout={onBoxLayout}>
        <View style={styles.levelBox}>
          <Text style={styles.levelText}>
            {currentLevel.emoji} {currentLevel.name}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Plant Animation */}
      <Animated.View
        style={[
          styles.plantBox,
          {
            transform: [{ scale: animatedValue }],
            opacity: animatedValue.interpolate({
              inputRange: [0, 0.5, 1.5],
              outputRange: [0, 1, 0],
            }),
          },
        ]}
      >
        <Text style={styles.plantEmoji}>{currentLevel.emoji}</Text>
      </Animated.View>

      {/* Lottie */}
      <View style={styles.breezeContainer}>
        <LottieView
          ref={breezeRef}
          source={require("../../assets/lottie/birds.json")}
          style={styles.breezeAnimation}
          loop={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "flex-end",
    zIndex: 50,
  },
  levelBox: {
    backgroundColor: "#222",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 5,
  },
  levelText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "outfit-bold",
    textAlign: "center",
  },
  plantBox: {
    position: "absolute",
    bottom: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  plantEmoji: {
    fontSize: 40,
  },
  breezeContainer: {
    position: "absolute",
    bottom: 50,
    width: 250,
    height: 160,
  },
  breezeAnimation: {
    width: "100%",
    height: "100%",
  },
});
