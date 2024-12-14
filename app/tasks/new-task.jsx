import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useNavigation } from "expo-router";
import { useUserContext } from "../../contexts/UserContext";
import { Colors } from "../../constants/Colors";

export default function NewTask() {
  const { userRole, userId, userTeacher } = useUserContext();
  const navigation = useNavigation();
  const [taskName, setTaskName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: "Create New Challenge",
      headerShown: true,
      headerStyle: {
        backgroundColor: Colors.PRIMARY,
      },
      headerTitleStyle: {
        color: "#fff",
      },
      headerTintColor: "#fff",
    });
  }, [navigation]);

  const handleCreateTask = async () => {
    if (!taskName.trim()) {
      Alert.alert("Validation Error", "Please enter a valid task name.");
      return;
    }

   
  };

  return (
    <View style={styles.container}>
      {userRole !== "teacher" ? (
        <Text style={styles.noPermissionText}>
          You don't have permission to create a task.
        </Text>
      ) : (
        <>
          <Text style={styles.label}>Task Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter the name of the challenge"
            value={taskName}
            onChangeText={setTaskName}
            editable={!loading} // Disable input while loading
          />
          <TouchableOpacity
            style={[styles.button, loading && { backgroundColor: Colors.GRAY }]}
            onPress={handleCreateTask}
            disabled={loading} // Disable button while loading
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Task</Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    backgroundColor: Colors.PRIMARY,
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  noPermissionText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
  },
});
