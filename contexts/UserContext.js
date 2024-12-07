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
  const [userName, setUserName] = useState(null); // Stores user Name
  const [loading, setLoading] = useState(true);  // Loading state
  const { user } = useUser(); // Get the current user from Clerk

  useEffect(() => {
    if (user) {
      setUserId(user.id); // Save user id from Clerk
      setUserEmail(user.primaryEmailAddress?.emailAddress); // Save user email from Clerk
      setUserName(user.fullName); // Save user Name from Clerk
      fetchUserRole(user.id); // Fetch role from Firebase
    }
  }, [user]);

  const fetchUserRole = async (clerkId) => {
    try {
      const userRef = doc(db, "users", clerkId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        setUserRole(userDoc.data().role); // Set the role
      } else {
        console.error("User not found in Firebase.");
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
    } finally {
      setLoading(false); // Set loading to false
    }
  };

  return (
    <UserContext.Provider value={{ userRole, loading, userId, userEmail, userName }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom Hook to Use Context
export const useUserContext = () => useContext(UserContext);
