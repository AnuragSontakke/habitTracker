import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image, // Added for displaying userImage
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
  const {
    userRole,
    userId,
    userName,
    userEmail,
    userPhone,
    userCourses,
    userProfession,
    userUpgradeSessionDone,
    userImage, // Added userImage from UserContext
  } = useUserContext();

  const [teacherCode, setTeacherCode] = useState("");
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: userRole === "teacher" ? "Join Requests" : "Join Network",
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
          userId,
          fullName: userName || "",
          email: userEmail || "",
          role: userRole || "member",
          phone: userPhone || "",
          courses: userCourses || [],
          profession: userProfession || "",
          upgradeSessionDone: userUpgradeSessionDone || false,
          userImage: userImage || "", // Added userImage
        }),
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
      } else {
        setRequests([]);
      }
    } catch (error) {
      Alert.alert("Failed to fetch teacher requests.");
    }
  };

  const approveRequest = async (requestId) => {
    try {
      const requestToApprove = requests.find((req) => req.userId === requestId);
      if (!requestToApprove) {
        Alert.alert("Request not found.");
        return;
      }

      const userSnapshot = await getDoc(doc(db, "users", requestId));
      if (!userSnapshot.exists()) {
        Alert.alert("User data not found.");
        return;
      }

      const userData = userSnapshot.data();
      const newMember = {
        userId: requestId,
        fullName: userData?.fullName || "",
        email: userData?.email || "",
        role: userData?.role || "member",
        phone: userData?.phone || "",
        courses: userData?.courses || [],
        profession: userData?.profession || "",
        upgradeSessionDone: userData?.upgradeSessionDone || false,
        userImage: userData?.userImage || "", // Added userImage
      };

      const teacherSnapshot = await getDoc(doc(db, "users", userId));
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

      const teacherDocRef = doc(db, "teacherNetworks", userId);
      await updateDoc(teacherDocRef, {
        members: arrayUnion(newMember),
        requests: arrayRemove(requestToApprove),
      });

      await updateDoc(doc(db, "users", requestId), {
        teacher: teacherObject,
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
      const requestToRemove = requests.find((req) => req.userId === requestId);
      if (!requestToRemove) {
        Alert.alert("Request not found.");
        return;
      }

      const teacherDocRef = doc(db, "teacherNetworks", userId);
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

  const renderRequestCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardImageContainer}>
        {item?.userImage ? (
          <Image
            source={{ uri: item.userImage }}
            style={styles.cardImage}
            resizeMode="cover"
          />
        ) : (
          <Ionicons
            name="person-circle-outline"
            size={40}
            color="gray"
            style={styles.cardImagePlaceholder}
          />
        )}
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardName}>{item?.fullName}</Text>
        <Text style={styles.cardEmail}>{item?.email}</Text>
      </View>
      <View style={styles.cardIcons}>
        <Ionicons
          name="checkmark-circle-outline"
          size={32}
          color="green"
          onPress={() => approveRequest(item?.userId)}
        />
        <Ionicons
          name="close-circle-outline"
          size={32}
          color="red"
          style={{ marginLeft: 10 }}
          onPress={() => rejectRequest(item?.userId)}
        />
      </View>
    </View>
  );

  if (userRole === "teacher") {
    return (
      <View style={styles.container}>
        {requests.length === 0 ? (
          <Text style={styles.noRequests}>No pending requests.</Text>
        ) : (
          <FlatList
            data={requests}
            keyExtractor={(item) => item.userId}
            renderItem={renderRequestCard}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>
    );
  }

  if (userRole === "member" || userRole === "volunteer") {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <Text style={styles.title}>Enter Teacher Code to Join</Text>
        <TextInput
          style={styles.input}
          placeholder="Teacher's unique code"
          value={teacherCode}
          onChangeText={setTeacherCode}
        />
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: teacherCode ? Colors.PRIMARY : "gray" },
          ]}
          onPress={handleJoinNetwork}
          disabled={!teacherCode}
        >
          <Text style={styles.buttonText}>Send Request</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
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
    backgroundColor: "#F9F9F9",
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  noRequests: {
    textAlign: "center",
    color: "gray",
    fontSize: 16,
    marginTop: 40,
  },
  noRole: {
    textAlign: "center",
    color: "gray",
    fontSize: 16,
  },
  card: {
    flexDirection: "row",
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 2,
    alignItems: "center",
  },
  cardImageContainer: {
    marginRight: 10,
  },
  cardImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  cardImagePlaceholder: {
    width: 40,
    height: 40,
  },
  cardContent: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardEmail: {
    fontSize: 13,
    color: "gray",
  },
  cardIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
});