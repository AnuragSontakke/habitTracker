import React, { createContext, useContext, useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../configs/FirebaseConfig";
import { useUser } from "@clerk/clerk-expo";

// Create Context
const UserContext = createContext();

// Provider Component
export const UserProvider = ({ children }) => {
  const [userRole, setUserRole] = useState(null); // Stores user role
  const [userId, setUserId] = useState(null); // Stores user ID
  const [userEmail, setUserEmail] = useState(null); // Stores user email
  const [userName, setUserName] = useState(null); // Stores user name
  const [userImage, setUserImage] = useState(null); // Stores user image
  const [userTeacher, setUserTeacher] = useState(null); // Stores teacher data
  const [userPhone, setUserPhone] = useState(null); // Stores user phone
  const [userCourses, setUserCourses] = useState(null); // Stores user courses
  const [userProfession, setUserProfession] = useState(null); // Stores user profession
  const [userUpgradeSessionDone, setUserUpgradeSessionDone] = useState(false); // Stores upgrade session status
  const [loading, setLoading] = useState(true); // Loading state
  const { user } = useUser(); // Get the current user from Clerk

  useEffect(() => {
    if (user) {
      // User logged in or switched accounts
      setLoading(true);
      setUserId(user.id);
      setUserEmail(user.primaryEmailAddress?.emailAddress);
      setUserName(user.fullName);
      setUserImage(user?.imageUrl);
      fetchUserRole(user.id);
    } else {
      // User logged out: Reset state
      resetContext();
    }
  }, [user]);

  const fetchUserRole = async (clerkId) => {
    try {
      const userRef = doc(db, "users", clerkId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        console.log("user", data.phone, data.profession, data.courses, data.upgradeSessionDone);
        setUserUpgradeSessionDone(data.upgradeSessionDone || false);
        setUserPhone(data.phone);
        setUserCourses(data.courses);
        setUserProfession(data.profession);
        setUserRole(data.role);
        setUserTeacher(data.teacher || null);
      } else {
        setUserRole("member");
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetContext = () => {
    setUserRole(null);
    setUserId(null);
    setUserEmail(null);
    setUserName(null);
    setUserImage(null);
    setUserTeacher(null);
    setLoading(false);
  };
  return (
    <UserContext.Provider
      value={{
        userRole,
        loading,
        userId,
        userEmail,
        userName,
        userImage,
        userTeacher,
        userPhone,
        userCourses,
        userProfession,
        userUpgradeSessionDone
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

// Custom Hook to Use Context
export const useUserContext = () => useContext(UserContext);
