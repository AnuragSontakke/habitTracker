import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  FlatList,
} from "react-native";
import {
  collection,
  query,
  where,
  getDocs,
  limit,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "../../configs/FirebaseConfig";
import { useUserContext } from "../../contexts/UserContext";
import { useNavigation } from "expo-router";
import { Colors } from "../../constants/Colors";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function JoinNetwork() {
  const navigation = useNavigation();
  const { userRole, userId } = useUserContext();
  const [teacherCode, setTeacherCode] = useState("");
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: "Join Network",
      headerShown: true,
      headerStyle: {
        backgroundColor: Colors.PRIMARY,
      },
      headerTitleStyle: {
        color: "#fff",
      },
      headerTintColor: "#fff",
    });

    if (userRole === "teacher") {
      fetchTeacherRequests();
    }
  }, [userRole]);

  const handleJoinNetwork = async () => {
    try {
      if (userRole !== "member" && userRole !== "volunteer") {
        Alert.alert("Only members or volunteers can join networks.");
        return;
      }

      const usersRef = collection(db, "users");
      const userQuery = query(usersRef, where("uniqueTeacherCode", "==", teacherCode), limit(1));
      const userQuerySnapshot = await getDocs(userQuery);

      if (userQuerySnapshot.empty) {
        Alert.alert("Invalid teacher code.");
        return;
      }

      const teacherUserId = userQuerySnapshot.docs[0].data()?.clerkId;
      const teacherNetworkRef = doc(db, "teacherNetworks", teacherUserId);

      const teacherNetworkSnapshot = await getDoc(teacherNetworkRef);

      if (!teacherNetworkSnapshot.exists()) {
        Alert.alert("Teacher's network doesn't exist.");
        return;
      }

      await updateDoc(teacherNetworkRef, {
        requests: arrayUnion(userId),
      });

      Alert.alert("Request sent successfully.");
      setTeacherCode("");
    } catch (error) {
      console.error("Error sending join request", error);
      Alert.alert("Failed to send join request.");
    }
  };

  const fetchTeacherRequests = async () => {
    try {
      const teacherDocRef = doc(db, "teacherNetworks", userId);
      const teacherDocSnapshot = await getDoc(teacherDocRef);

      if (teacherDocSnapshot?.exists()) {
        const pendingRequests = teacherDocSnapshot?.data()?.requests || [];
        setRequests(pendingRequests);
      }
    } catch (error) {
      console.error("Error fetching teacher requests", error);
      Alert.alert("Failed to fetch teacher requests.");
    }
  };

  const approveRequest = async (requestId) => {
    try {
      const teacherDocRef = doc(db, "teacherNetworks", userId);
      await updateDoc(teacherDocRef, {
        members: arrayUnion(requestId),
        requests: arrayRemove(requestId),
      });

      Alert.alert("User approved successfully.");
      fetchTeacherRequests();
    } catch (error) {
      console.error("Error approving request", error);
      Alert.alert("Failed to approve request.");
    }
  };

  const rejectRequest = async (requestId) => {
    try {
      const teacherDocRef = doc(db, "teacherNetworks", userId);
      await updateDoc(teacherDocRef, {
        requests: arrayRemove(requestId),
      });

      Alert.alert("User rejected successfully.");
      fetchTeacherRequests();
    } catch (error) {
      console.error("Error rejecting request", error);
      Alert.alert("Failed to reject request.");
    }
  };

  const renderRequestCard = ({ item }) => {
    return (
      <View style={styles.requestCard}>
        <Text style={styles.requestText}>User ID: {item}</Text>
        <View style={styles.iconContainer}>
          <Ionicons
            name="checkmark-circle-outline"
            size={24}
            color="green"
            onPress={() => approveRequest(item)}
            style={styles.icon}
          />
          <Ionicons
            name="remove-circle-outline"
            size={24}
            color="red"
            onPress={() => rejectRequest(item)}
            style={styles.icon}
          />
        </View>
      </View>
    );
  };

  if (userRole === "teacher") {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Pending Requests</Text>
        {requests.length === 0 ? (
          <Text style={styles.noRequests}>No pending requests.</Text>
        ) : (
          <FlatList
            data={requests}
            keyExtractor={(item) => item}
            renderItem={renderRequestCard}
          />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.noRole}>You don't have access to this feature.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  noRequests: {
    color: "gray",
    marginTop: 10,
  },
  noRole: {
    color: "gray",
  },
  requestCard: {
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "lightgray",
    justifyContent: "space-between",
  },
  requestText: {
    fontSize: 16,
    marginBottom: 10,
  },
  iconContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  icon: {
    marginHorizontal: 10,
  },
});
