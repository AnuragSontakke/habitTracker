import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  Dimensions,
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
import CommentModal from "../../pages/Feeds/CommentModal";

export default function EventsFeed() {
  const { userId, userName, userRole, userTeacher } = useUserContext();
  const [events, setEvents] = useState([]);
  const [comments, setComments] = useState({});
  const [teacherId, setTeacherId] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCommentsModalVisible, setIsCommentsModalVisible] = useState(false);
  const [selectedEventComments, setSelectedEventComments] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [showAllCommentsByEvent, setShowAllCommentsByEvent] = useState({});

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
    }, (error) => {
      console.error("Error fetching events:", error);
      Alert.alert("Error", "Failed to load events.");
    });

    return () => unsub();
  }, [teacherId]);

  const reactToEvent = async (eventId, field) => {
    try {
      const ref = doc(db, "teacherNetworks", teacherId, "events", eventId);
      await updateDoc(ref, {
        [field]: arrayUnion({ userId, userName }),
      });
    } catch (error) {
      console.error(`Error reacting to event (${field}):`, error);
      Alert.alert("Error", `Failed to ${field === "likes" ? "like" : field === "interested" ? "mark interested" : "volunteer for"} the event.`);
    }
  };

  const commentEvent = async (eventId) => {
    const commentText = comments[eventId]?.trim();
    if (!commentText) return;

    try {
      const ref = doc(db, "teacherNetworks", teacherId, "events", eventId);
      await updateDoc(ref, {
        comments: arrayUnion({
          userId,
          userName,
          userPic: "",
          comment: commentText,
        }),
      });
      setComments((prev) => ({ ...prev, [eventId]: "" }));
    } catch (error) {
      console.error("Error adding comment:", error);
      Alert.alert("Error", "Failed to add comment.");
    }
  };

  const handleAddEvent = () => {
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    const commentData = {
      userId,
      userName,
      userPic: "",
      comment: newComment.trim(),
    };

    try {
      const eventRef = doc(
        db,
        "teacherNetworks",
        teacherId,
        "events",
        selectedEventId
      );
      await updateDoc(eventRef, {
        comments: arrayUnion(commentData),
      });
      setSelectedEventComments((prev) => [...prev, commentData]);
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment via modal:", error);
      Alert.alert("Error", "Failed to add comment.");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Modal
        visible={isModalVisible}
        animationType="slide"
        position="center"
        onClose={handleModalClose}
        transparent={true}
        title="Create New Event"
        style={styles.meditationModal}
      >
        <CreateEventForm />
      </Modal>

      <CommentModal
        visible={isCommentsModalVisible}
        onClose={() => {
          setIsCommentsModalVisible(false);
          setSelectedEventId(null);
          setNewComment("");
        }}
        comments={selectedEventComments}
        onAddComment={handleAddComment}
        newComment={newComment}
        setNewComment={setNewComment}
      />

      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Feeds</Text>
      </View>

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.container}
        renderItem={({ item }) => {
          const liked = item.likes?.some((r) => r.userId === userId) || false;
          const interested = item.interested?.some((r) => r.userId === userId) || false;
          const volunteered = item.volunteers?.some((r) => r.userId === userId) || false;
          const showAllComments = showAllCommentsByEvent[item.id] || false;

          const commentsToDisplay = showAllComments
            ? item.comments || []
            : (item.comments || []).slice(0, 10);

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
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <ReactionButton
                    onPress={() => reactToEvent(item.id, "likes")}
                    icon={
                      <Ionicons
                        name={liked ? "heart" : "heart-outline"}
                        size={30}
                        color={liked ? "red" : "black"}
                        style={styles.reactionIcon}
                      />
                    }
                  />
                  <Text style={styles.reactionCount}>{item.likes?.length || 0}</Text>

                  <ReactionButton
                    onPress={() => reactToEvent(item.id, "interested")}
                    icon={
                      <MaterialIcons
                        name={interested ? "bookmark" : "bookmark-outline"}
                        size={30}
                        color={interested ? "gold" : "black"}
                        style={styles.reactionIcon}
                      />
                    }
                  />
                  <Text style={styles.reactionCount}>{item.interested?.length || 0}</Text>
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

              <Text style={styles.caption}>
                <Text style={styles.bold}>{item.eventName} </Text> 
                {item.eventType}  ₹{item.price}
              </Text>

              <Text style={styles.comment2}>
                <Text style={styles.bold}>Comments</Text>
              </Text>

              {commentsToDisplay.map((c, index) => (
                <Text key={index} style={styles.comment}>
                  <Text style={styles.bold}>{c.userName}</Text> {c.comment}
                </Text>
              ))}

              {item.comments?.length > 10 && !showAllComments && (
                <TouchableOpacity
                  onPress={() =>
                    setShowAllCommentsByEvent((prev) => ({
                      ...prev,
                      [item.id]: true,
                    }))
                  }
                >
                  <Text style={styles.showMore}>Show More</Text>
                </TouchableOpacity>
              )}

              {showAllComments && (
                <TouchableOpacity
                  onPress={() =>
                    setShowAllCommentsByEvent((prev) => ({
                      ...prev,
                      [item.id]: false,
                    }))
                  }
                >
                  <Text style={styles.showMore}>Show Less</Text>
                </TouchableOpacity>
              )}

              <View style={styles.commentRow}>
                <Ionicons
                  name="happy-outline"
                  size={20}
                  color="gray"
                  style={{ marginRight: 6 }}
                />
                <TouchableOpacity
                  onPress={() => {
                    setSelectedEventComments(item.comments || []);
                    setSelectedEventId(item.id);
                    setIsCommentsModalVisible(true);
                  }}
                  style={[styles.commentInput, { justifyContent: "center" }]}
                >
                  <Text style={{ color: "gray" }}>Add a comment...</Text>
                </TouchableOpacity>
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
    </View>
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
    fontSize: 16,
    fontFamily: "outfit-bold",
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
  reactionIcon: {
    marginRight: 5,
  },
  caption: {
    paddingHorizontal: 12,
    marginTop: 6,
    fontSize: 16,
    fontFamily: "outfit-bold",
    color: Colors.PRIMARY_DARK,
  },
  comment2: {
    paddingHorizontal: 12,
    marginTop: 6,
    fontSize: 14,
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
  meditationModal: {
    height: Dimensions.get("window").height * 0.8,
    justifyContent: "space-between",
  },
  reactionCount: {
    fontFamily: "outfit-medium",
    fontSize: 16,
    color: "black",
    marginLeft: 0,
    alignSelf: "center",
  },
  showMore: {
    color: "blue",
    fontSize: 14,
    marginVertical: 8,
    paddingHorizontal: 12,
  },
});