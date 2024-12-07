import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Button,
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
import { Ionicons } from "@expo/vector-icons";

export default function JoinNetwork() {
  const navigation = useNavigation();
  const { userRole, userId, userName, userEmail } = useUserContext(); // Fetch user role and ID from context
  const [teacherCode, setTeacherCode] = useState("");
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: userRole === "teacher" ? "Requests" : "Join Network",
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
console.log("userRole",userRole)
  /** Handle join network logic */
  const handleJoinNetwork = async () => {
    try {
      if (userRole !== "member" && userRole !== "volunteer") {
        Alert.alert("Only members or volunteers can join networks.");
        return;
      }

      const usersRef = collection(db, "users");
      const userQuery = query(
        usersRef,
        where("uniqueTeacherCode", "==", teacherCode),
        limit(1)
      );
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
        requests: arrayUnion({
          email: userEmail || "",
          name: userName || "",
          userId,          
        }),
      });

      Alert.alert("Request sent successfully.");
      setTeacherCode("");
    } catch (error) {
      console.error("Error sending join request", error);
      Alert.alert("Failed to send join request.");
    }
  };

  /** Fetch pending requests for teacher */
  const fetchTeacherRequests = async () => {
    try {
      const teacherDocRef = doc(db, "teacherNetworks", userId);
      const teacherDocSnapshot = await getDoc(teacherDocRef);

      if (teacherDocSnapshot?.exists()) {
        const pendingRequests = teacherDocSnapshot?.data()?.requests || [];
        setRequests(pendingRequests);
      }else {
        console.log("No network data found");
        setRequests([]); // Clear out the requests if none exist
      }
    } catch (error) {
      console.error("Error fetching teacher requests", error);
      Alert.alert("Failed to fetch teacher requests.");
    }
  };

  /** Approve request & add user to members array */

const approveRequest = async (requestId) => {
  try {
    // Fetch the user's data
    const userSnapshot = await getDoc(doc(db, "users", requestId));
    if (!userSnapshot.exists()) {
      Alert.alert("User data not found.");
      return;
    }

    const userData = userSnapshot.data();
    const newMember = {
      email: userData?.email || "",
      name: userData?.fullName || "",
      userId: requestId,
    };

    // Fetch teacher's data
    const teacherSnapshot = await getDoc(doc(db, "users", userId)); // `userId` is the teacher's ID
    if (!teacherSnapshot.exists()) {
      Alert.alert("Teacher data not found.");
      return;
    }

    const teacherData = teacherSnapshot.data();
    const teacherObject = {
      teacherId: userId,
      teacherName: teacherData?.fullName || "",
      teacherEmail: teacherData?.email || "",
    };

    // Update teacher's network (add member and remove request)
    const teacherDocRef = doc(db, "teacherNetworks", userId);
    await updateDoc(teacherDocRef, {
      members: arrayUnion(newMember),
      requests: arrayRemove({
        email: userData?.email || "",
        name: userData?.fullName || "",
        userId: requestId,
      }),
    });

    // Add the teacher object to the user's document
    const userDocRef = doc(db, "users", requestId);
    await updateDoc(userDocRef, {
      teacher: teacherObject, // Add the teacher details
    });

    Alert.alert("User approved successfully.");
    fetchTeacherRequests();
  } catch (error) {
    console.error("Error approving request", error);
    Alert.alert("Failed to approve request.");
  }
};


  /** Reject user request */
  const rejectRequest = async (requestId) => {
    try {
      // Fetch the user's data to construct the object
      const userSnapshot = await getDoc(doc(db, "users", requestId));
  
      if (!userSnapshot.exists()) {
        Alert.alert("User data not found.");
        return;
      }
  
      const userData = userSnapshot.data();
      const requestToRemove = {
        email: userData?.email || "",
        name: userData?.fullName || "",
        userId: requestId,
      };
  
      console.log("Request to remove:", requestToRemove);
  
      // Reference the teacher's network document
      const teacherDocRef = doc(db, "teacherNetworks", userId);
  
      // Remove the request object
      await updateDoc(teacherDocRef, {
        requests: arrayRemove(requestToRemove),
      });
  
      Alert.alert("User rejected successfully.");
      fetchTeacherRequests();
    } catch (error) {
      console.error("Error rejecting request", error);
      Alert.alert("Failed to reject request.");
    }
  };

  /** Render teacher pending requests */
  const renderRequestCard = ({ item }) => {
    return (
      <View style={styles.requestCard}>
        <Text style={styles.requestText}>
          Name: {item?.name || "Unknown"} | Email: {item?.email || "Unknown"}
        </Text>
        <View style={styles.iconContainer}>
          <Ionicons
            name="checkmark-circle-outline"
            size={24}
            color="green"
            onPress={() => approveRequest(item?.userId)}
            style={styles.icon}
          />
          <Ionicons
            name="remove-circle-outline"
            size={24}
            color="red"
            onPress={() => rejectRequest(item?.userId)}
            style={styles.icon}
          />
        </View>
      </View>
    );
  };

  /** Render UI based on roles */
  if (userRole === "teacher") {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Pending Requests</Text>
        {requests.length === 0 ? (
          <Text style={styles.noRequests}>No pending requests.</Text>
        ) : (
          <FlatList
            data={requests}
            keyExtractor={(item) => item.userId}
            renderItem={renderRequestCard}
          />
        )}
      </View>
    );
  }

  if (userRole === "member" || userRole === "volunteer") {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Enter Teacher Unique Code to Join Network</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter teacher unique code"
          value={teacherCode}
          onChangeText={setTeacherCode}
        />
        <Button
          title="Join Network"
          onPress={handleJoinNetwork}
          disabled={!teacherCode}
        />
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
  },
  requestText: {
    fontSize: 16,
  },
  iconContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  icon: {
    marginHorizontal: 10,
  },
  input: {
    borderWidth: 1,
    padding: 8,
    marginBottom: 10,
    borderRadius: 4,
  },
});
