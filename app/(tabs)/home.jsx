import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../../configs/FirebaseConfig";
import Header from "../../pages/Home/Header";
import Slider from "../../pages/Home/Slider";
import Category from "../../pages/Home/Category";
import BusinessList from "../../pages/Home/BusinessList";
import NewTaskCard from "../../pages/Home/NewTaskCard";
import { updateRole } from "../../services/updateRole";
import Challenges from "../tasks/challenges";
import { useUserContext } from "../../contexts/UserContext";
import Modal from "../../components/Modal";
import PhoneVerification from "../login/phoneVerification";

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
    } else {
      await setDoc(teacherNetworkRef, {
        members: [],
        createdAt: new Date(),
        uniqueTeacherCode: uniqueCode,
        requests: [],
      });
    }
  } catch (error) {
    console.error("Error handling teacher network", error);
  }
};

// Function to sync user data into Firestore
const syncUserToFirebase = async (user, token) => {
  try {
    const userRef = doc(db, "users", user.id);
    const userSnapshot = await getDoc(userRef);

    const userData = {
      email: user.emailAddresses[0]?.emailAddress || "",
      fullName: user.fullName || "",
      clerkId: user.id,
      role: user.publicMetadata?.role || "member",
    };

    if (!user.publicMetadata?.role) {
      await updateRole(user.id, token, "member");
    }

    // Handle logic for teacher's uniqueTeacherCode only if necessary
    if (user.publicMetadata?.role === "teacher") {
      if (!userSnapshot.exists() || !userSnapshot.data()?.uniqueTeacherCode) {
        const uniqueTeacherCode = generateUniqueTeacherCode();
        userData.uniqueTeacherCode = uniqueTeacherCode;
        await syncTeacherNetwork(user, uniqueTeacherCode);
      } else {
        userData.uniqueTeacherCode = userSnapshot.data()?.uniqueTeacherCode;
      }
    }
    // Write the user data to the Firestore database
    await setDoc(userRef, userData, {
      merge: true,
    });
  } catch (error) {
    console.error("Error syncing user to Firebase", error);
  }
};

export default function Home() {
  const { user, isLoaded } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState(null);
  const { getToken } = useAuth();
  const { userTeacher, userId } = useUserContext();
  const [showPhoneModal, setShowPhoneModal] = useState(false);

  useEffect(() => {
    handleRefresh();
  }, [isLoaded]);

  const handleRefresh = async () => {
    setIsLoading(true);

    try {
      if (user && isLoaded) {
        const token = await getToken();

        if (!token) {
          throw new Error("Something went wrong");
        }

        await syncUserToFirebase(user, token);
        const userRole = user.publicMetadata?.role || "member";
        setRole(userRole);
        const userRef = doc(db, "users", user.id);
        const userSnapshot = await getDoc(userRef);

        if (!userSnapshot.exists() || !userSnapshot.data()?.phoneVerified) {
          setShowPhoneModal(true);
        }
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
      <Header role={role} userTeacher={userTeacher} userId={userId} />

      {/* Scrollable area */}
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={handleRefresh} />
        }
      >
        <Slider />
        {role === "admin" && <Category />}
        {role === "admin" && <BusinessList />}
        {role === "teacher" && <NewTaskCard />}
        {role !== "teacher" && role !== "admin" && <Challenges />}
        <View style={{ height: 50 }} />
      </ScrollView>

      {/* Centered loader */}
      {isLoading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#007bff" />
        </View>
      )}
      <Modal visible={showPhoneModal} position="center" showCloseIcon={false}>
        <PhoneVerification
          onVerified={async (phone) => {
            // Update Firestore with phoneVerified status
            const userRef = doc(db, "users", user.id);
            await setDoc(
              userRef,
              { phoneVerified: true, phone },
              { merge: true }
            );
            setShowPhoneModal(false);
          }}
        />
      </Modal>
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
