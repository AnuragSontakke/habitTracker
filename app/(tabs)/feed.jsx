import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
} from "react-native";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  arrayUnion,
  query,
  orderBy,
} from "firebase/firestore";
import { useUserContext } from "../../contexts/UserContext";
import { db } from "../../configs/FirebaseConfig";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";
import { Modal } from "../../components";
import CreateEventForm from "../../pages/Feeds/EventForm";

export default function EventsFeed() {
  const { userId, userName, userRole, userTeacher } = useUserContext();
  const [events, setEvents] = useState([]);
  const [comments, setComments] = useState({});
  const [teacherId, setTeacherId] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newEvent, setNewEvent] = useState({
    eventName: "",
    eventType: "",
    price: "",
    eventImage: "",
  });

  const teacherName =
    userRole === "teacher" ? userName : userTeacher?.teacherName || "";

  useEffect(() => {
    if (userRole === "teacher") {
      setTeacherId(userId);
    } else if (userRole === "volunteer" || userRole === "member") {
      setTeacherId(userTeacher?.teacherId);
    }
  }, [userRole, userId, userTeacher]);

  useEffect(() => {
    if (!teacherId) return;

    const q = query(
      collection(db, "teacherNetworks", teacherId, "events"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEvents(data);
    });

    return () => unsub();
  }, [teacherId]);

  const reactToEvent = async (eventId, field) => {
    const ref = doc(db, "teacherNetworks", teacherId, "events", eventId);
    await updateDoc(ref, {
      [field]: arrayUnion({ userId, userName }),
    });
  };

  const commentEvent = async (eventId) => {
    const ref = doc(db, "teacherNetworks", teacherId, "events", eventId);
    const commentText = comments[eventId]?.trim();
    if (!commentText) return;

    await updateDoc(ref, {
      comments: arrayUnion({
        userId,
        userName,
        userPic: "",
        comment: commentText,
      }),
    });
    setComments((prev) => ({ ...prev, [eventId]: "" }));
  };

  const handleAddEvent = () => {
    setIsModalVisible(true);
  };

  const handleModalClose =()=>{
    setIsModalVisible(false);
  }

  return (
    <>
      <Modal visible={isModalVisible} animationType="slide" position="center" onClose={handleModalClose} transparent={true}>
      <CreateEventForm />
      </Modal>

      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Feeds</Text>
      </View>

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.container}
        renderItem={({ item }) => {
          const liked = item.likes?.some((r) => r.userId === userId);
          const interested = item.interested?.some((r) => r.userId === userId);
          const volunteered = item.volunteers?.some((r) => r.userId === userId);

          return (
            <View style={styles.card}>
              <View style={styles.topBar}>
                <Ionicons name="person-circle-outline" size={32} color="#555" />
                <Text style={styles.userName}>{teacherName}</Text>
              </View>

              {item.eventImage && (
                <Image source={{ uri: item.eventImage }} style={styles.image} />
              )}

              <View style={styles.actionsRow}>
                <View style={{ flexDirection: "row" }}>
                  <ReactionButton
                    onPress={() => reactToEvent(item.id, "likes")}
                    icon={
                      <Ionicons
                        name={liked ? "heart" : "heart-outline"}
                        size={22}
                        color={liked ? "red" : "black"}
                        style={styles.icon}
                      />
                    }
                  />
                  <ReactionButton
                    onPress={() => reactToEvent(item.id, "interested")}
                    icon={
                      <MaterialIcons
                        name={interested ? "bookmark" : "bookmark-outline"}
                        size={22}
                        color={interested ? "gold" : "black"}
                        style={styles.icon}
                      />
                    }
                  />
                </View>

                {userRole === "member" &&
                  (volunteered ? (
                    <View style={styles.requestedButton}>
                      <Text style={styles.requestedText}>Requested</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => reactToEvent(item.id, "volunteers")}
                      style={styles.joinButton}
                    >
                      <Text style={styles.joinText}>Join as Volunteer</Text>
                    </TouchableOpacity>
                  ))}
              </View>

              <Text style={styles.reactions}>
                ❤️ {item.likes?.length || 0} Likes ‧ 🔖{" "}
                {item.interested?.length || 0} Interested ‧ 🤝{" "}
                {item.volunteers?.length || 0} Volunteers
              </Text>

              <Text style={styles.caption}>
                <Text style={styles.bold}>{item.eventName} </Text>•{" "}
                {item.eventType} • ₹{item.price}
              </Text>

              {(item.comments || []).slice(0, 10).map((c, index) => (
                <Text key={index} style={styles.comment}>
                  <Text style={styles.bold}>{c.userName}</Text> {c.comment}
                </Text>
              ))}

              <View style={styles.commentRow}>
                <Ionicons
                  name="happy-outline"
                  size={20}
                  color="gray"
                  style={{ marginRight: 6 }}
                />
                <TextInput
                  placeholder="Add a comment..."
                  value={comments[item.id] || ""}
                  onChangeText={(text) =>
                    setComments((prev) => ({ ...prev, [item.id]: text }))
                  }
                  onSubmitEditing={() => commentEvent(item.id)}
                  style={styles.commentInput}
                />
              </View>
            </View>
          );
        }}
      />

      {userRole === "teacher" && (
        <TouchableOpacity style={styles.fab} onPress={handleAddEvent}>
          <Ionicons name="add" size={32} color="#fff" />
        </TouchableOpacity>
      )}
    </>
  );
}

const ReactionButton = ({ onPress, icon }) => {
  const scale = new Animated.Value(1);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.4,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      <Animated.View style={{ transform: [{ scale }] }}>{icon}</Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 100,
    paddingBottom: 100,
    paddingHorizontal: 15,
    backgroundColor: "#8B8BFC33",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 30,
    backgroundColor: Colors.PRIMARY,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    zIndex: 100,
  },
  card: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    marginBottom: 18,
    borderTopWidth: 0.5,
    borderColor: "#ddd",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  userName: {
    marginLeft: 8,
    fontWeight: "600",
    fontSize: 14,
    fontFamily: "outfit-medium",
  },
  image: {
    width: "100%",
    height: 300,
    resizeMode: "cover",
  },
  actionsRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingTop: 10,
    justifyContent: "space-between",
    alignItems: "center",
  },
  icon: {
    marginRight: 16,
  },
  reactions: {
    fontWeight: "600",
    fontSize: 13,
    paddingHorizontal: 12,
    marginTop: 6,
    color: "#444",
    fontFamily: "outfit-medium",
  },
  caption: {
    paddingHorizontal: 12,
    marginTop: 6,
    fontSize: 13,
    fontFamily: "outfit",
  },
  bold: {
    fontWeight: "600",
    fontFamily: "outfit-bold",
  },
  comment: {
    paddingHorizontal: 12,
    marginTop: 4,
    fontSize: 13,
    color: "#333",
    fontFamily: "outfit",
  },
  commentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginTop: 10,
    marginBottom: 6,
  },
  commentInput: {
    flex: 1,
    borderBottomWidth: 0.5,
    borderColor: "#ccc",
    paddingVertical: 4,
    fontSize: 14,
    fontFamily: "outfit",
  },
  headerContainer: {
    position: "absolute",
    top: 40,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    backgroundColor: Colors.PRIMARY,
    borderBottomWidth: 0.5,
    borderColor: "#ccc",
    zIndex: 10,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "outfit-bold",
  },
  requestedButton: {
    backgroundColor: "#ddd",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  requestedText: {
    color: "#555",
    fontWeight: "600",
    fontSize: 13,
    fontFamily: "outfit-medium",
  },
  joinButton: {
    backgroundColor: "#FFA500",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  joinText: {
    color: "white",
    fontWeight: "600",
    fontSize: 13,
    fontFamily: "outfit-medium",
  },
  overlay: {
    flex: 1,
    backgroundColor: "#000000aa",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    fontFamily: "outfit-bold",
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    marginBottom: 10,
    fontSize: 14,
    paddingVertical: 4,
    fontFamily: "outfit",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
  },
  cancelButton: {
    marginRight: 12,
  },
  submitButton: {
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontFamily: "outfit-medium",
  },
});
