import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from "react-native";
import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../configs/FirebaseConfig";
import { useNavigation } from "expo-router";
import { Colors } from "../../constants/Colors";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useUserContext } from "../../contexts/UserContext";
import { updateRole } from "../../services/updateRole";
import { useAuth } from "@clerk/clerk-expo";
import CustomModal from "../../components/Modal";

export default function ManageMembers() {
  const [memberList, setMemberList] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const navigation = useNavigation();
  const { getToken } = useAuth();
  const { userRole, userId } = useUserContext();

  useEffect(() => {
    navigation.setOptions({
      headerTitle: "Manage Members",
      headerShown: true,
      headerStyle: { backgroundColor: Colors.PRIMARY },
      headerTitleStyle: { color: "#fff" },
      headerTintColor: "#fff",
    });
    getAllUsers();
  }, [userRole]);

  async function getAllUsers() {
    try {
      const userRef = collection(db, "users");
      const snapshot = await getDocs(userRef);
      const usersList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      let filteredList = [];
      if (userRole === "admin") {
        filteredList = usersList.filter(
          (user) => user.id !== userId && user.role !== "admin"
        );
      } else if (userRole === "teacher") {
        const teacherSnapshot = await getDoc(doc(db, "teacherNetworks", userId));
        const memberIds = teacherSnapshot.exists()
          ? teacherSnapshot.data()?.members.map((m) => m.userId)
          : [];
        filteredList = usersList.filter((user) => memberIds.includes(user.id));
      }
      setMemberList(filteredList);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await getAllUsers();
    setRefreshing(false);
  };

  const handleRoleChange = async (clerkId, newRole) => {
    try {
      const token = await getToken();
      if (!token) throw new Error("No auth token");
      await updateDoc(doc(db, "users", clerkId), { role: newRole });
      await updateRole(clerkId, token, newRole);
      alert("Role updated successfully");
      getAllUsers();
      setModalVisible(false);
    } catch (err) {
      console.error("Error updating role:", err);
    }
  };

  const openUserModal = (user) => {
    setSelectedUser(user);
    setModalVisible(true);
  };

  const filteredMembers = memberList.filter((user) => {
    const matchesSearch =
      user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    if (filter === "all") return matchesSearch;
    if (filter === "courses" && user.upgradeSessionDone) return matchesSearch;
    return matchesSearch && user.role === filter;
  });

  const FilterButton = ({ label, value }) => (
    <TouchableOpacity
      style={[styles.filterButton, filter === value && styles.filterButtonActive]}
      onPress={() => setFilter(value)}
    >
      <Text style={styles.filterText}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchBar}
        placeholder="Search by name or email..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <View style={styles.filterRow}>
        <FilterButton label="All" value="all" />
        <FilterButton label="Members" value="member" />
        <FilterButton label="Volunteers" value="volunteer" />
        <FilterButton label="Courses Done" value="courses" />
      </View>

      <FlatList
        data={filteredMembers}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => openUserModal(item)}>
            <Text style={styles.fullName}>{item.fullName}</Text>
            <View style={[styles.roleTag, styles[`role${item.role}`]]}>
              <Text style={styles.roleText}>{item.role}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      <CustomModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={selectedUser?.fullName}
        position="center"
      >
        <Text>Email: {selectedUser?.email}</Text>
        <Text>Phone: {selectedUser?.phone || "-"}</Text>
        <Text>Profession: {selectedUser?.profession || "-"}</Text>
        <Text>Course Completed: {selectedUser?.upgradeSessionDone ? "Yes" : "No"}</Text>

        <TouchableOpacity
          style={[
            styles.actionButton,
            selectedUser?.role === "member" ? styles.promoteButton : styles.demoteButton,
          ]}
          onPress={() =>
            handleRoleChange(
              selectedUser?.id,
              selectedUser?.role === "member" ? "volunteer" : "member"
            )
          }
        >
          <Ionicons
            name={selectedUser?.role === "member"
              ? "arrow-up-circle-outline"
              : "arrow-down-circle-outline"}
            size={20}
            color="#fff"
          />
          <Text style={styles.buttonText}>
            {selectedUser?.role === "member"
              ? "Give Volunteer Access"
              : "Revoke Volunteer Access"}
          </Text>
        </TouchableOpacity>
      </CustomModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.BACKGROUND, padding: 16 },
  searchBar: {
    height: 40,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    fontFamily: "outfit-regular",
    borderWidth: 2,
    borderColor: Colors.PRIMARY,
  },
  filterRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  filterButton: {
    flex: 1,
    marginHorizontal: 5,
    padding: 8,
    backgroundColor: "#eee",
    borderRadius: 5,
    alignItems: "center",
  },
  filterButtonActive: { backgroundColor: Colors.PRIMARY },
  filterText: { fontFamily: "outfit-medium" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 3,
  },
  fullName: { fontFamily: "outfit-medium", fontSize: 16 },
  roleTag: { padding: 6, borderRadius: 5 },
  roleadmin: { backgroundColor: Colors.ADMIN },
  roleteacher: { backgroundColor: Colors.TEACHER },
  rolemember: { backgroundColor: Colors.MEMBER },
  rolevolunteer: { backgroundColor: Colors.VOLUNTEER },
  roleText: { color: "#fff", fontFamily: "outfit-medium" },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  promoteButton: { backgroundColor: Colors.SUCCESS },
  demoteButton: { backgroundColor: Colors.DANGER },
  buttonText: { color: "#fff", fontFamily: "outfit-medium", marginLeft: 5 },
});
