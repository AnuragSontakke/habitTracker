import { useEffect, useState } from "react";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "../configs/FirebaseConfig";
import { Audio } from "expo-av";

const playCoinSound = async () => {
  try {
    const { sound } = await Audio.Sound.createAsync(
      require("../assets/music/coin-recieved.mp3")
    );
    await sound.playAsync();
  } catch (error) {
    console.warn("Could not play sound", error);
  }
};

export const useCoinCount = (teacherId, userId) => {
  const [coinCount, setCoinCount] = useState(0);

  useEffect(() => {
    if (!teacherId || !userId) return;

    const docRef = doc(db, "coin", teacherId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const users = docSnap.data().coins || [];
        const userEntry = users.find((u) => u.userId === userId);
        if (userEntry?.allTime?.coins != null) {
          setCoinCount((prev) => {
            if (userEntry.allTime.coins > prev) {
              playCoinSound();
            }
            return userEntry.allTime.coins;
          });
        }
      }
    });

    return () => unsubscribe();
  }, [teacherId, userId]);

  return coinCount;
};
