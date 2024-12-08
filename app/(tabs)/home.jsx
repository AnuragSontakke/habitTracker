import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { doc, setDoc, getDoc, collection, query, where } from "firebase/firestore";
import { db } from "../../configs/FirebaseConfig";
import Header from "../../components/Home/Header";
import Slider from "../../components/Home/Slider";
import Category from "../../components/Home/Category";
import BusinessList from "../../components/Home/BusinessList";

// Synchronous helper function to generate unique teacher codes
const generateUniqueTeacherCode = () => {
  return Math.random().toString(36).substring(2, 8);
};

// Function to handle TeacherNetwork creation logic
const syncTeacherNetwork = async (user, uniqueCode) => {
  const teacherNetworkRef = doc(db, "teacherNetworks", user.id);

  try {
    const teacherNetworkDoc = await getDoc(teacherNetworkRef);

    if (teacherNetworkDoc.exists()) {
      console.log("Teacher network already exists.");
    } else {
      console.log("Creating teacher network...");
      await setDoc(teacherNetworkRef, {
        members: [],
        createdAt: new Date(),
        uniqueTeacherCode: uniqueCode,
        requests: [],
      });
      console.log("Teacher network created with uniqueTeacherCode:", uniqueCode);
    }
  } catch (error) {
    console.error("Error handling teacher network", error);
  }
};

// Function to sync user data into Firestore
const syncUserToFirebase = async (user) => {
  try {
    const userRef = doc(db, "users", user.id);

    const userSnapshot = await getDoc(userRef);

    const userData = {
      email: user.emailAddresses[0]?.emailAddress || '',
      fullName: user.fullName || '',
      clerkId: user.id,
      role: user.publicMetadata?.role || "member",
    };

    // Handle logic for teacher's uniqueTeacherCode only if necessary
    if (user.publicMetadata?.role === "teacher") {
      if (!userSnapshot.exists() || !userSnapshot.data()?.uniqueTeacherCode) {
        const uniqueTeacherCode = generateUniqueTeacherCode();
        userData.uniqueTeacherCode = uniqueTeacherCode;
        await syncTeacherNetwork(user, uniqueTeacherCode);
        console.log("Generated teacher code for new teacher:", uniqueTeacherCode);
      } else {
        userData.uniqueTeacherCode = userSnapshot.data()?.uniqueTeacherCode;
        console.log("Existing teacher code found:", userData.uniqueTeacherCode);
      }
    }

    // Write the user data to the Firestore database
    await setDoc(userRef, userData, {
      merge: true
    });

    console.log("User synced to 'users' collection.");
  } catch (error) {
    console.error("Error syncing user to Firebase", error);
  }
};

export default function Home() {
  const { user, isLoaded } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState(null);

  useEffect(() => {
    handleRefresh();
  }, [isLoaded]);

  const handleRefresh = async () => {
    setIsLoading(true);

    try {
      if (user && isLoaded) {
        await syncUserToFirebase(user);
        const userRole = user.publicMetadata?.role || "member";
        setRole(userRole);
      }
    } catch (error) {
      console.error("Error during refresh.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Fixed Header */}
      <Header role={role} />

      {/* Scrollable area */}
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={handleRefresh}
          />
        }
      >
        <Slider />
        {(role === "teacher" || role === "admin") && <Category />}
        <BusinessList role={role} />
        <View style={{ height: 50 }} />
      </ScrollView>

      {/* Centered loader */}
      {isLoading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#007bff" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loader: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
  },
  contentContainer: {
    paddingTop: 140,
  },
});
