import React, { createContext, useState, useEffect, useContext, useCallback } from "react";
import { useUserContext } from "./UserContext";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../configs/FirebaseConfig";
import * as SecureStore from "expo-secure-store";

// Custom debounce function
const debounce = (func, delay) => {
  let timeoutId;
  const debounced = (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
  debounced.cancel = () => {
    clearTimeout(timeoutId);
  };
  return debounced;
};

export const FeedContext = createContext();

export const FeedProvider = ({ children }) => {
  const { userId, userRole, userTeacher } = useUserContext();
  const [hasNewFeed, setHasNewFeed] = useState(false);
  const [teacherId, setTeacherId] = useState(null);

  // Debounced function to set hasNewFeed
  const debouncedSetHasNewFeed = useCallback(
    debounce((value) => {
      setHasNewFeed(value);
    }, 500),
    []
  );

  // Set teacherId based on user role
  useEffect(() => {
    if (userRole === "teacher") {
      setTeacherId(userId);
    } else if (userRole === "volunteer" || userRole === "member") {
      setTeacherId(userTeacher?.teacherId);
    }
  }, [userRole, userId, userTeacher]);

  // Listen for new feeds
  useEffect(() => {
    if (!teacherId) return;

    const q = query(
      collection(db, "teacherNetworks", teacherId, "events"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      async (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Check for new feeds
        if (data.length > 0) {
          const latestEventTime = data[0].createdAt.toMillis();
          try {
            const storedTime = await SecureStore.getItemAsync("lastSeenFeedTime");
            const lastSeenTime = storedTime ? parseInt(storedTime) : null;
            if (!lastSeenTime || lastSeenTime < latestEventTime) {
              debouncedSetHasNewFeed(true);
            }
          } catch (error) {
            console.error("Error reading lastSeenFeedTime from SecureStore:", error);
            debouncedSetHasNewFeed(true); // Show animation as fallback
          }
        }
      },
      (error) => {
        console.error("Error fetching events for feed detection:", error);
        debouncedSetHasNewFeed(true); // Show animation as fallback
      }
    );

    return () => {
      unsub();
      debouncedSetHasNewFeed.cancel();
    };
  }, [teacherId, debouncedSetHasNewFeed]);

  return (
    <FeedContext.Provider value={{ hasNewFeed, setHasNewFeed }}>
      {children}
    </FeedContext.Provider>
  );
};