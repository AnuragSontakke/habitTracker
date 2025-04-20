import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  StyleSheet,
} from "react-native";
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
  const animatedValue = useRef(new Animated.Value(0)).current;
  const breezeRef = useRef(null);
  const currentLevel = getCurrentLevel(coinCount);

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

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={triggerAnimation}>
        <View style={styles.levelBox}>
          <Text style={styles.levelText}>
            {currentLevel.emoji} {currentLevel.name}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Plant */}
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
        <Text style={styles.plantEmoji}>🌱</Text>
      </Animated.View>

      {/* Breeze */}
      <View style={styles.breezeContainer}>
        <LottieView
          ref={breezeRef}
          source={require("../../assets/lottie/breeze.json")} // put your path
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
    overflow: "hidden",
  },
  levelText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "outfit-bold",
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
