import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../configs/FirebaseConfig";
import Header from "../../components/Home/Header";
import Slider from "../../components/Home/Slider";
import Category from "../../components/Home/Category";
import BusinessList from "../../components/Home/BusinessList";

// Simulate user sync with Firebase
const syncUserToFirebase = async (user) => {
  console.log("firebase dkjdfgb", user?.publicMetadata)
  try {
    const userRef = doc(db, "users", user.id);
    await setDoc(userRef, {
      email: user.emailAddresses[0]?.emailAddress || '',
      fullName: user.fullName || '',
      clerkId: user.id,
      role: user.publicMetadata?.role || "member",
    });
    console.log("User synced to Firebase");
  } catch (error) {
    console.error("Error syncing user to Firebase", error);
  }
};

export default function Home() {
  const { user, isLoaded } = useUser(); 
  const [isLoading, setIsLoading] = useState(false); 
  const [role, setRole] = useState(null);
  
useEffect(()=>{
  handleRefresh();
},[])

  // Custom refresh logic
  const handleRefresh = async () => {
    console.log("Refreshing...", user?.publicMetadata);
    setIsLoading(true); // Show the custom loader
    try {
      if (user && isLoaded) {
        await syncUserToFirebase(user);
        const userRole = user.publicMetadata?.role || "member";
        console.log("userRole",userRole)
        setRole(userRole);
        console.log("Refresh completed.");
      }
    } catch (error) {
      console.error("Refresh error", error);
    } finally {
      setIsLoading(false); // Hide loader
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

      {/* Centered custom loader */}
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
    backgroundColor: "rgba(255, 255, 255, 0.7)", // Semi-transparent background
  },
  contentContainer: {
    paddingTop: 140,
  },
});