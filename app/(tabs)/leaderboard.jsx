import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Image, // Import Image component
} from "react-native";
import { db } from "../../configs/FirebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useUserContext } from "../../contexts/UserContext";
import { getWeekNumber } from "../../services/weekNumber";
import { Colors } from "../../constants/Colors";

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState("Weekly");
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekKey, setCurrentWeekKey] = useState("");
  const { userTeacher } = useUserContext();
  const screenWidth = Dimensions.get("window").width; // Get screen width

  // Calculate the current week key
  useEffect(() => {
    const today = new Date();
    const weekNumber = getWeekNumber(today);
    const year = today.getFullYear();
    setCurrentWeekKey(`week${weekNumber}year${year}`);
  }, []);

  useEffect(() => {
    fetchLeaderboardData();
  }, [activeTab, currentWeekKey]);

  const fetchLeaderboardData = async () => {
    setLoading(true);
    try {
      const coinsRef = doc(db, "coin", userTeacher.teacherId); // Replace with dynamic teacherId
      const coinsSnap = await getDoc(coinsRef);

      if (!coinsSnap.exists()) {
        Alert.alert("No Data", "No leaderboard data available.");
        setLeaderboardData([]);
        return;
      }

      const coins = coinsSnap.data().coins || [];

      let data = [];
      if (activeTab === "Weekly") {
        // Filter weekly data
        data = coins
          .map((coin) => {
            const weeklyData = coin.weekly[currentWeekKey] || {};
            return {
              userName: coin.userName,
              userId: coin.userId,
              userImage: coin.userImage,
              coins: weeklyData.coins || 0,
              streak: weeklyData.streak || 0,
            };
          })
          .sort((a, b) => b.coins - a.coins); // Sort by coins
      } else {
        // All-Time data
        data = coins
          .map((coin) => ({
            userName: coin.userName,
            userId: coin.userId,
            userImage: coin.userImage,
            coins: coin.allTime.coins || 0,
            streak: coin.allTime.streak || 0,
          }))
          .sort((a, b) => b.coins - a.coins); // Sort by coins
      }

      setLeaderboardData(data);
    } catch (error) {
      console.error("Error fetching leaderboard data:", error);
      Alert.alert("Error", "Failed to load leaderboard data.");
    } finally {
      setLoading(false);
    }
  };

  const renderLeaderboardItem = ({ item, index }) => {
    // Determine the medal image based on rank
    let medalImage = null;
    if (index === 0) {
      medalImage = require("../../assets/images/gold-medal.png"); // Gold medal for rank 1
    } else if (index === 1) {
      medalImage = require("../../assets/images/silver-medal.png"); // Silver medal for rank 2
    } else if (index === 2) {
      medalImage = require("../../assets/images/bronze-medal.png"); // Bronze medal for rank 3
    }
  
    return (
      <View style={styles.leaderboardItem}>
        <View style={styles.userDetails}>
          <View style={styles.userInfo}>
            {/* User Image */}
            <Image
              source={{
                uri: item.userImage || "https://via.placeholder.com/150",
              }} // Fallback image if no image is available
              style={styles.userImage}
            />
            <View style={{ display: "flex", flexDirection: "column" }}>
              <Text style={styles.userName}>{item.userName}</Text>
              <Text style={styles.userStats}>
                Coins: {item.coins}
                {item.streak > 0 && (
                  <Text style={styles.streakText}> | Streak: {item.streak}</Text>
                )}
                {/* {item.streak > 0 && (
                  <Image
                    source={require("../../assets/images/fire.png")} // Fire icon if streak exists
                    style={styles.fireImage}
                  />
                )} */}
              </Text>
            </View>
          </View>
        </View>
  
        {/* Show medal for top 3 */}
        {medalImage && <Image source={medalImage} style={styles.medalImage} />}
      </View>
    );
  };
  
  

  return (
    <View style={styles.container}>
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "Weekly" ? styles.activeTab : styles.inactiveTab,
          ]}
          onPress={() => setActiveTab("Weekly")}
        >
          <Text
            style={
              activeTab === "Weekly"
                ? styles.activeTabText
                : styles.inactiveTabText
            }
          >
            Weekly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "All-Time" ? styles.activeTab : styles.inactiveTab,
          ]}
          onPress={() => setActiveTab("All-Time")}
        >
          <Text
            style={
              activeTab === "All-Time"
                ? styles.activeTabText
                : styles.inactiveTabText
            }
          >
            All Time
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Section */}
      <View
        style={{
          flex: 1, // Ensure the content fills the remaining space
          backgroundColor: "#f0f0f0",
          paddingHorizontal: 10,
          borderTopLeftRadius: 30, // Top-left border radius
          borderTopRightRadius: 30, // Top-right border radius
          height: "100%", // Ensures full screen height
        }}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : leaderboardData.length > 0 ? (
          <FlatList
            data={leaderboardData}
            renderItem={renderLeaderboardItem}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        ) : (
          <Text style={styles.noDataText}>No data available.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.PRIMARY,
    zIndex: 10,
    paddingTop: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.9,
    shadowRadius: 2,
    elevation: 10,
  },
  tabsContainer: {
    flexDirection: "row",
    margin: 20,
    height: 50, // Set height for the tab container
    backgroundColor: Colors.PRIMARY_DARK, // Background color for the tab container
    borderRadius: 25, // Make the container rounded
    padding: 5, // Add padding for spacing around the capsule
    marginBottom: 20, // Space below the tabs
    alignItems: "center",
  },
  tab: {
    flex: 1, // Equal space for each tab
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 25, // Rounded edges for the capsule
    height: 40,
  },
  activeTab: {
    backgroundColor: Colors.PRIMARY_LIGHT, // Active tab background color
    elevation: 3, // Slight shadow for the active tab
  },
  inactiveTab: {
    backgroundColor: "transparent", // Transparent for inactive tabs
  },
  activeTabText: {
    color: "#ffffff", // White text for the active tab
    fontFamily: "outfit-bold",
  },
  inactiveTabText: {
    color: "#888888", // Grey text for inactive tabs
    fontFamily: "outfit-bold",
  },
  leaderboardItem: {
    flexDirection: "row",
    padding: 15,
    backgroundColor: "#fff",
    marginTop: 17,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  userDetails: {
    flex: 1,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  fireImage: {
    width: 15,
    height: 15,
    marginLeft: 15, // Adjusted to add some space between the streak text and fire icon
    alignSelf: "center", // Centers the fire icon vertically with the text
  },
  streakText: {
    fontSize: 14,
    color: "#666",
    fontFamily: "outfit", // Ensure the streak text matches the overall font style
  },

  userName: {
    fontSize: 16,
    fontFamily: "outfit-bold",
  },
  userStats: {
    fontSize: 14,
    color: "#666",
    fontFamily: "outfit",
  },
  medalImage: {
    width: 40,
    height: 40,
    marginLeft: 10,
    marginRight: 15,
  },
  noDataText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginTop: 20,
    fontFamily: "outfit-bold",
  },
});
