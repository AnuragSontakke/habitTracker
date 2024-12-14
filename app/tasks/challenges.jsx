import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useUserContext } from '../../contexts/UserContext';
import { db } from "../../configs/FirebaseConfig";
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'; // Firestore methods
import { Ionicons } from '@expo/vector-icons'; // For circular checkbox icon

export default function Challenges() {
  const { userTeacher, userId } = useUserContext(); // Assuming userTeacher contains teacherId and userId
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChallenges = async () => {
        // Check if userTeacher is available and has teacherId
        if (!userTeacher || !userTeacher.teacherId) {
          setLoading(false);
          Alert.alert("Error", "Teacher ID is not available.");
          return;
        }
  
        try {
          // Fetch challenges for the teacher from the Firestore collection
          const challengesRef = doc(db, "challenge", userTeacher.teacherId);
          const docSnap = await getDoc(challengesRef);
  
          if (docSnap.exists()) {
            setChallenges(docSnap.data().challenges || []);
          } else {
            Alert.alert("No Challenges", "This teacher has no challenges.");
          }
        } catch (error) {
          console.error("Error fetching challenges:", error);
          Alert.alert("Error", "Failed to load challenges.");
        } finally {
          setLoading(false);
        }
      };
  
      // Fetch challenges if userTeacher is available
      if (userTeacher?.teacherId) {
        fetchChallenges();
      }
  }, [userTeacher]);

  // Update the user's challenge completion status and streak
  const handleChallengeCompletion = async (challengeId) => {
    try {
      const userChallengeRef = doc(db, "userChallenge", userId);

      // Get the current user challenge data
      const userChallengeDoc = await getDoc(userChallengeRef);
      let userChallenges = userChallengeDoc.exists() ? userChallengeDoc.data().challenges : [];

      // Find if the challenge already exists in the user's challenge list
      const existingChallengeIndex = userChallenges.findIndex(challenge => challenge.challengeId === challengeId);
      const today = new Date().toISOString().split('T')[0]; // Use YYYY-MM-DD format for the date
      let newStreak = 0;

      if (existingChallengeIndex !== -1) {
        const existingChallenge = userChallenges[existingChallengeIndex];
        // Check if today is already marked as completed or not
        const challengeCompletedToday = existingChallenge.completed.find(item => item.date === today);

        if (challengeCompletedToday) {
          Alert.alert("Already marked", "This challenge is already marked as completed for today.");
          return;
        }

        // Add today's completion status
        existingChallenge.completed.push({ date: today, status: true });

        // Check if streak should be updated or reset
        const lastCompletion = existingChallenge.completed[existingChallenge.completed.length - 2]; // Last completion
        newStreak = lastCompletion && new Date(lastCompletion.date).toISOString().split('T')[0] === new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0]
          ? existingChallenge.streak + 1
          : 1; // If the last completion was yesterday, increment streak, else reset to 1.

        // Update the streak
        existingChallenge.streak = newStreak;
      } else {
        // If the challenge does not exist in the user's challenge list, create a new entry
        userChallenges.push({
          challengeId,
          completed: [{ date: today, status: true }],
          streak: 1, // Streak starts at 1
        });
        newStreak = 1;
      }

      // Update the user's challenge data with the new challenge list
      await setDoc(userChallengeRef, { challenges: userChallenges }, { merge: true });

      Alert.alert("Challenge Completed!", `Your streak is now: ${newStreak} day(s)`);
    } catch (error) {
      console.error("Error updating challenge completion:", error);
      Alert.alert("Error", "Failed to update challenge completion.");
    }
  };

  const renderChallengeItem = ({ item }) => {
    return (
      <View style={styles.challengeItem}>
        <View style={styles.challengeTextContainer}>
          <Text style={styles.challengeName}>{item.challengeName}</Text>
          <Text style={styles.challengeDuration}>{item.challengeDuration}</Text>
          <Text style={styles.challengeDate}>
            Created on: {new Date(item.createdDate.seconds * 1000).toLocaleDateString()}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => handleChallengeCompletion(item.challengeId)}
        >
          <Ionicons
            name="checkbox-outline"
            size={36}
            color="green"
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <>
          <Text style={styles.title}>Teacher's Challenges</Text>
          <FlatList
            data={challenges}
            renderItem={renderChallengeItem}
            keyExtractor={(item, index) => index.toString()}
            ListEmptyComponent={<Text style={styles.emptyListText}>No challenges available.</Text>}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  challengeItem: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#f9f9f9',
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    alignItems: 'center',
  },
  challengeTextContainer: {
    flex: 1,
  },
  challengeName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  challengeDuration: {
    fontSize: 16,
    color: '#555',
  },
  challengeDate: {
    fontSize: 14,
    color: '#888',
  },
  checkboxContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  emptyListText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
});
