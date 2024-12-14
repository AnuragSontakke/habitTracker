import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator, 
  FlatList 
} from "react-native";
import { useNavigation } from "expo-router";
import { useUserContext } from "../../contexts/UserContext";
import { Colors } from "../../constants/Colors";
import { doc, setDoc, arrayUnion, serverTimestamp, getDoc } from "firebase/firestore"; // Firestore methods
import { db } from "../../configs/FirebaseConfig";

export default function NewTask() {
  const { userRole, userId } = useUserContext();
  const navigation = useNavigation();
  const [taskName, setTaskName] = useState("");
  const [challengeDuration, setChallengeDuration] = useState(""); // For dropdown value
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [challenges, setChallenges] = useState([]); // State to store challenges
  const [refreshing, setRefreshing] = useState(false); // State for pull to refresh

  // Options for dropdown and their associated colors
  const challengeOptions = [
    { label: "21 Days", value: "21 Days", color: "#FFEBE8" }, // Light peach
    { label: "1 Week", value: "1 Week", color: "#E6F7FF" }, // Light blue
    { label: "Regular", value: "regular", color: "#F7FFE6" }, // Light green
  ];

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

    // Fetch challenges when the component mounts
    fetchChallenges();
  }, [navigation]);

  const fetchChallenges = async () => {
    try {
      const userChallengesRef = doc(db, "challenge", userId);
      const docSnap = await getDoc(userChallengesRef);
      if (docSnap.exists()) {
        setChallenges(docSnap.data().challenges || []);
      } else {
        console.log("No challenges found.");
      }
    } catch (error) {
      console.error("Error fetching challenges:", error);
    } finally {
      setRefreshing(false); // Stop refreshing after data is fetched
    }
  };

  const handleCreateTask = async () => {
    if (!taskName.trim()) {
      Alert.alert("Validation Error", "Please enter a valid task name.");
      return;
    }
  
    if (!challengeDuration) {
      Alert.alert("Validation Error", "Please select a challenge duration.");
      return;
    }
  
    setLoading(true);
  
    try {
      const newChallenge = {
        challengeId: Date.now().toString(), // Generate unique ID based on timestamp
        challengeName: taskName,
        challengeDuration,
        createdDate: new Date(), // Use the current date instead of serverTimestamp
      };
  
      // Reference to the user's challenges document (this will create the document if it doesn't exist)
      const userChallengesRef = doc(db, "challenge", userId);
  
      // Add the new challenge to the challenges array
      await setDoc(
        userChallengesRef,
        {
          challenges: arrayUnion(newChallenge), // Add new challenge to array
        },
        { merge: true } // Merge with existing data
      );
  
      Alert.alert(
        "Success",
        `Task "${taskName}" created with a duration of ${challengeOptions.find(
          (opt) => opt.value === challengeDuration
        ).label}.`
      );
      setTaskName("");
      setChallengeDuration("");
      fetchChallenges(); // Fetch the updated challenges after creating a new one
    } catch (error) {
      console.error("Error creating task:", error); // Log the error
      Alert.alert("Error", "Failed to create the task. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderChallengeItem = ({ item }) => {
    const createdDate = item.createdDate ? item.createdDate.toDate() : new Date(); // Convert Timestamp to Date
    
    // Calculate the total duration in days (based on challengeDuration)
    const totalDuration = item.challengeDuration === "21 Days" ? 21 : item.challengeDuration === "1 Week" ? 7 : 0;
    
    // Calculate the end date of the challenge
    const challengeEndDate = new Date(createdDate);
    challengeEndDate.setDate(challengeEndDate.getDate() + totalDuration);
    
    // Calculate the number of days passed since the challenge started
    const currentDate = new Date();
    const daysPassed = Math.max((currentDate - createdDate) / (1000 * 3600 * 24), 0); // Ensure no negative days
    
    // Calculate progress (completed days)
    const progress = Math.min((daysPassed / totalDuration) * 100, 100); // Ensure it doesn't exceed 100%
    
    return (
      <View style={styles.challengeItem}>
        <Text style={styles.challengeText}>
          {item.challengeName} - {item.challengeDuration}
        </Text>
        <Text style={styles.dateText}>
          Created on: {createdDate.toLocaleDateString()} {/* Format the date */}
        </Text>
        
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View 
            style={[
              styles.progressBar,
              { width: `${progress}%`, backgroundColor: Colors.PRIMARY }
            ]}
          />
        </View>
        
        <Text style={styles.completedDaysText}>
          {Math.floor(daysPassed)} Days Completed
        </Text>
      </View>
    );
  };

  // Handle pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchChallenges(); // Refetch challenges when refreshing
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

          <Text style={styles.label}>Challenge Duration</Text>
          {/* Custom Dropdown */}
          <TouchableOpacity
            onPress={() => setShowDropdown(!showDropdown)}
            style={[
              styles.input,
              {
                backgroundColor:
                  challengeOptions.find((opt) => opt.value === challengeDuration)?.color || "#F5F5F5",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              },
            ]}
          >
            <Text style={{ fontSize: 16 }}>
              {challengeDuration
                ? challengeOptions.find((opt) => opt.value === challengeDuration).label
                : "Select Duration"}
            </Text>
            <Text style={{ fontSize: 16 }}>▼</Text>
          </TouchableOpacity>

          {/* Dropdown Options */}
          {showDropdown && (
            <View
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: 5,
                backgroundColor: "#fff",
                marginTop: 5,
                maxHeight: 150, // Limit height for scrollable view
                overflow: "hidden",
              }}
            >
              {challengeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => {
                    setChallengeDuration(option.value);
                    setShowDropdown(false); // Close dropdown after selection
                  }}
                  style={{
                    padding: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: "#ddd",
                    backgroundColor:
                      challengeDuration === option.value ? Colors.LIGHT_PRIMARY : "#fff",
                  }}
                >
                  <Text style={{ fontSize: 16, color: Colors.TEXT }}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

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

          <View style={styles.challengeList}>
            <Text style={styles.listHeader}>Created Challenges</Text>
            <FlatList
              data={challenges}
              renderItem={renderChallengeItem}
              keyExtractor={(item) => item.challengeId}
              refreshing={refreshing}
              onRefresh={onRefresh} // Attach the pull-to-refresh handler
            />
          </View>
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
  challengeList: {
    marginTop: 20,
  },
  listHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  challengeItem: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  challengeText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  dateText: {
    fontSize: 14,
    color: "#555",
    marginVertical: 5,
  },
  progressContainer: {
    height: 10,
    backgroundColor: "#e0e0e0",
    borderRadius: 5,
    overflow: "hidden",
    marginVertical: 10,
  },
  progressBar: {
    height: "100%",
    borderRadius: 5,
  },
  completedDaysText: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.TEXT,
  },
  remainingDaysText: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.TEXT,
  },
});
