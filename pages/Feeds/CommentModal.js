// components/CommentModal.js
import React from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function CommentModal({
  visible,
  onClose,
  comments,
  onAddComment,
  newComment,
  setNewComment,
}) {
  return (
    <Modal animationType="slide" transparent visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Comments</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={comments}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item }) => (
              <Text style={styles.comment}>
                <Text style={styles.commentUser}>{item.userName}:</Text>{" "}
                {item.comment}
              </Text>
            )}
            style={{ flex: 1 }}
          />

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View style={styles.inputRow}>
              <TextInput
                value={newComment}
                onChangeText={setNewComment}
                placeholder="Write a comment..."
                style={styles.input}
              />
              <TouchableOpacity onPress={onAddComment}>
                <Ionicons name="send" size={24} color="#555" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#00000088",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    height: "60%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  comment: {
    paddingVertical: 6,
    fontSize: 14,
    color: "#444",
  },
  commentUser: {
    fontWeight: "bold",
    color: "#222",
  },
  inputRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  input: {
    flex: 1,
    marginRight: 10,
    fontSize: 14,
  },
});
