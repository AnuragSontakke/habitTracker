import { 
  View, 
  Text, 
  FlatList, 
  RefreshControl, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  TextInput 
} from "react-native";
import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../../configs/FirebaseConfig";
import { useNavigation } from "expo-router";
import { Colors } from "../../constants/Colors";
import Ionicons from '@expo/vector-icons/Ionicons'; 
import { useUserContext } from "../../contexts/UserContext";
import { updateRole } from "../../services/updateRole";
import { useAuth } from "@clerk/clerk-expo";

export default function ManageMembers() {
  const [memberList, setMemberList] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigation = useNavigation();
  const { getToken } = useAuth();
  // Access user role and logged-in user's ID from context
  const { userRole, userId } = useUserContext();

  useEffect(() => {
    navigation.setOptions({
      headerTitle: "Manage Members",
      headerShown: true,
      headerStyle: {
        backgroundColor: Colors.PRIMARY,
      },
      headerTitleStyle: {
        color: "#fff",
      },
      headerTintColor: "#fff",
    });

    getAllUsers();
  }, [userRole]);

  // Fetch all users excluding logged-in user and admins
  async function getAllUsers() {
    try {
      if (userRole === "admin") {
        // Admin: Fetch all users, excluding themselves and other admins
        const userRef = collection(db, "users");
        const snapshot = await getDocs(userRef);
        const usersList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
  
        // Exclude logged-in admin and other admin users
        const filteredList = usersList.filter(
          (user) => user.id !== userId && user.role !== "admin"
        );
  
        setMemberList(filteredList);
      } else if (userRole === "teacher") {
        // Teacher: Fetch only users in their network
        const teacherRef = doc(db, "teacherNetworks", userId); // userId is the teacherId here
        const teacherSnapshot = await getDoc(teacherRef);
  
        if (teacherSnapshot.exists()) {
          // Fetch the 'members' array from the teacher's document
          const teacherNetworkMembers = teacherSnapshot.data()?.members || [];
  
          // Extract the `userId` of each member in the teacher's network
          const memberIds = teacherNetworkMembers.map((member) => member.userId);
  
          // Fetch all users from the `users` collection
          const userRef = collection(db, "users");
          const snapshot = await getDocs(userRef);
          const usersList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
  
          // Filter users who are in the teacher's members list
          const filteredList = usersList.filter((user) => memberIds.includes(user.id));
  
          setMemberList(filteredList);
        } else {
          setMemberList([]);
        }
      } else {
        console.error("This function is only applicable for admin and teacher roles.");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }
  

  const onRefresh = async () => {
    setRefreshing(true);
    await getAllUsers();
    setRefreshing(false);
  };

  const handleConfirmation = async (clerkId, currentRole) => {
    Alert.alert(
      "Confirmation",
      currentRole === "member"
        ? "Are you sure you want to give Volunteer Access to this user?"
        : "Are you sure you want to revoke Volunteer Access from this user?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Yes",
          onPress: () => handleRoleChange(clerkId, currentRole === "member" ? "volunteer" : "member"),
        },
      ]
    );
  };

  async function handleRoleChange(clerkId, newRole) {
    try {
   // Use `useAuth` to fetch the token

   const token = await getToken();

   if (!token) {
     throw new Error("Something went wrong");
   }

      const userRef = doc(db, "users", clerkId);
      await updateDoc(userRef, { role: newRole });
      await updateRole(clerkId, token, newRole);
      alert("Role updated successfully");
      getAllUsers();
    } catch (error) {
      console.error("Error updating role:", error);
    }
  }

  const renderItem = ({ item }) => {
    let actionButtonLabel = "";
    let actionButtonStyle = null;
    if (userRole === "admin" || userRole === "teacher") {
      if (item.role === "member") {
        actionButtonLabel = "Give Volunteer Access";
        actionButtonStyle = styles.promoteButton;
      } else if (item.role === "volunteer") {
        actionButtonLabel = "Revoke Volunteer Access";
        actionButtonStyle = styles.demoteButton;
      }
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardContent}>
          <View>
            <Text style={styles.fullName}>{item.fullName}</Text>
            <Text style={styles.emailText}>{item.email}</Text>
          </View>
          <View style={[styles.roleTag, styles[`role${item.role}`]]}>
            <Text style={styles.roleText}>{item.role}</Text>
          </View>
        </View>
        {userRole === "admin" || userRole === "teacher" ? (
          item.role === "member" || item.role === "volunteer" ? (
            <TouchableOpacity
              style={[styles.actionButton, item.role === "member" ? styles.promoteButton : styles.demoteButton]}
              onPress={() => handleConfirmation(item.id, item.role)}
            >
              <Ionicons
                name={item.role === "member" ? "arrow-up-circle-outline" : "arrow-down-circle-outline"}
                size={18}
                color="#fff"
              />
              <Text style={styles.buttonText}>{actionButtonLabel}</Text>
            </TouchableOpacity>
          ) : null
        ) : null}
      </View>
    );
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
  };

  const filteredMembers = memberList.filter(
    (user) =>
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <TextInput
        style={styles.searchBar}
        placeholder="Search by name or email..."
        value={searchQuery}
        onChangeText={handleSearch}
      />

      <FlatList
        data={filteredMembers}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.BACKGROUND,
    padding: 16,
  },
  searchBar: {
    height: 40,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 10,
    fontFamily: "outfit-regular",
    borderWidth: 2,
    borderColor: Colors.PRIMARY,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  fullName: {
    fontFamily: "outfit-medium",
    fontSize: 16,
    color: Colors.PRIMARY_TEXT,
  },
  emailText: {
    fontFamily: "outfit-regular",
    fontSize: 14,
    color: Colors.SECONDARY_TEXT,
  },
  roleTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },
  roleadmin: { backgroundColor: Colors.ADMIN },
  roleteacher: { backgroundColor: Colors.TEACHER },
  rolemember: { backgroundColor: Colors.MEMBER },
  rolevolunteer: { backgroundColor: Colors.VOLUNTEER },
  roleText: {
    fontFamily: "outfit-medium",
    fontSize: 14,
    color: "#fff",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 5,
  },
  promoteButton: {
    backgroundColor: Colors.SUCCESS,
    marginRight: 10,
  },
  demoteButton: {
    backgroundColor: Colors.DANGER,
  },
  buttonText: {
    color: "#fff",
    fontFamily: "outfit-medium",
    marginLeft: 5,
  },
});
