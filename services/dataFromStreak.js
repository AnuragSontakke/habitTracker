import { LEVEL_PROGRESSION } from "../constants/Levels";

export const getLevelDataFromStreak = (streak) => {
    const levelData = LEVEL_PROGRESSION.find(
      (level) => streak >= level.minDays && streak <= level.maxDays
    );
    if (!levelData) {
      return { category: "Beginner", progress: 0, subLevel: "Locked" };
    }
  
    const { minDays, maxDays, category, subLevel } = levelData;
    const range = maxDays === Infinity ? 1 : maxDays - minDays + 1;
    const completedDays = streak - minDays + 1;
    const progress = maxDays === Infinity ? 1 : completedDays / range;
  
    return { category, progress: Math.min(progress, 1), subLevel };
  };


  export const getMedalImage = (streak) => {
    const { category } = getLevelDataFromStreak(streak);
    switch (category) {
      case "Brass Bravery":
        return require("../assets/images/bronze.png");
      case "Iron Will":
        return require("../assets/images/iron.png");
      case "Copper Glow":
        return require("../assets/images/copper.png");
      case "Silver Peace":
        return require("../assets/images/silver.png");
      case "Gold Harmony":
        return require("../assets/images/gold.png");
      case "Divine Radiance":
        return require("../assets/images/divine.png");
      default:
        return null; // No medal for Beginner
    }
  };
  