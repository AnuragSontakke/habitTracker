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
  Image,
  Animated,
  Easing,
} from "react-native";
import { db } from "../../configs/FirebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useUserContext } from "../../contexts/UserContext";
import { getWeekNumber } from "../../services/weekNumber";
import { Colors } from "../../constants/Colors";
import LottieView from "lottie-react-native";

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState("Weekly");
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekKey, setCurrentWeekKey] = useState("");
  const { userTeacher, userRole, userId } = useUserContext();
  const screenWidth = Dimensions.get("window").width;
  const [isContentVisible, setIsContentVisible] = useState(false);
  const animationValue = useState(new Animated.Value(0))[0];

  // Calculate the current week key
  useEffect(() => {
    const today = new Date();
    const weekNumber = getWeekNumber(today);
    const year = today.getFullYear();
    setCurrentWeekKey(`week${weekNumber}year${year}`);
  }, []);

  const toggleVisibility = () => {
    const toValue = isContentVisible ? 0 : 1;
    Animated.timing(animationValue, {
      toValue,
      duration: 300,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false,
    }).start();
    setIsContentVisible(!isContentVisible);
  };

  const interpolatedHeight = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 260],
    extrapolate: "clamp",
  });

  const interpolatedOpacity = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  useEffect(() => {
    fetchLeaderboardData();
  }, [activeTab, currentWeekKey]);

  const fetchLeaderboardData = async () => {
    setLoading(true);
    try {
      const teacherId = userRole === "teacher" ? userId : userTeacher.teacherId;
      const coinsRef = doc(db, "coin", teacherId);
      const coinsSnap = await getDoc(coinsRef);

      if (!coinsSnap.exists()) {
        Alert.alert("No Data", "No leaderboard data available.");
        setLeaderboardData([]);
        return;
      }

      const coins = coinsSnap.data().coins || [];
      let data = [];
      if (activeTab === "Weekly") {
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
          .sort((a, b) => b.coins - a.coins);
      } else {
        data = coins
          .map((coin) => ({
            userName: coin.userName,
            userId: coin.userId,
            userImage: coin.userImage,
            coins: coin.allTime.coins || 0,
            streak: coin.allTime.streak || 0,
          }))
          .sort((a, b) => b.coins - a.coins);
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
    let medalImage = null;
    if (index === 0) {
      medalImage = require("../../assets/images/gold-medal.png");
    } else if (index === 1) {
      medalImage = require("../../assets/images/silver-medal.png");
    } else if (index === 2) {
      medalImage = require("../../assets/images/bronze-medal.png");
    }

    return (
      <View style={styles.leaderboardItem}>
        <View style={styles.userDetails}>
          <View style={styles.userInfo}>
            <Image
              source={{
                uri: item.userImage || "https://via.placeholder.com/150",
              }}
              style={styles.userImage}
            />
            <View style={{ display: "flex", flexDirection: "column" }}>
              <Text style={styles.userName}>{item.userName}</Text>
              <Text style={styles.userStats}>
                Coins: {item.coins}
                {item.streak > 0 && (
                  <Text style={styles.streakText}>
                    {" "}
                    | Streak: {item.streak}
                  </Text>
                )}
              </Text>
            </View>
          </View>
        </View>
        {medalImage && <Image source={medalImage} style={styles.medalImage} />}
      </View>
    );
  };

  const renderTopUsers = () => {
    const topUsers = leaderboardData.slice(0, 3);
    return (
      <View style={styles.topUsersContainer}>
        <View style={styles.podiumWrapper}>
          <Image
            source={require("../../assets/images/rank.png")}
            style={styles.podiumImage}
          />
          <LottieView
            source={require("../../assets/lottie/winner.json")}
            autoPlay
            loop={true}
            style={styles.confettiAnimation}
          />
        </View>
        {topUsers[0] && (
          <View style={styles.topUserItemCenter}>
            <View style={styles.profileContainer}>
              <Image
                source={require("../../assets/images/crown.png")} // Replace with your actual crown image path
                style={styles.crownImage}
              />
              <Image
                source={{
                  uri:
                    topUsers[0].userImage || "https://via.placeholder.com/150",
                }}
                style={styles.topUserImageCenter}
              />
            </View>
            <Text style={styles.topUserName}> {topUsers[0].userName.split(" ")[0]}</Text>
          </View>
        )}
        {topUsers[1] && (
          <View style={styles.topUserItemLeft}>
            <Image
              source={{
                uri: topUsers[1].userImage || "https://via.placeholder.com/150",
              }}
              style={styles.topUserImageLeft}
            />
            <Text style={styles.topUserName}> {topUsers[1].userName.split(" ")[0]}</Text>
          </View>
        )}
        {topUsers[2] && (
          <View style={styles.topUserItemRight}>
            <Image
              source={{
                uri: topUsers[2].userImage || "https://via.placeholder.com/150",
              }}
              style={styles.topUserImageRight}
            />
            <Text style={styles.topUserName}> {topUsers[2].userName.split(" ")[0]}</Text>
          </View>
        )}
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
      <Animated.View
        style={{
          height: interpolatedHeight,
          opacity: interpolatedOpacity,
          overflow: "hidden",
          backgroundColor: Colors.PRIMARY,
          marginTop: -10,
        }}
      >
        {renderTopUsers()}
      </Animated.View>
      <View
        style={{
          flex: 1,
          backgroundColor: "#f0f0f0",
          paddingHorizontal: 10,
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
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
      <TouchableOpacity
        onPress={toggleVisibility}
        style={{
          position: "absolute",
          bottom: 30,
          right: 20,
          backgroundColor: Colors.PRIMARY_DARK,
          padding: 15,
          borderRadius: 30,
          elevation: 5,
          zIndex: 999,
        }}
      >
        <Text style={{ color: "white", fontFamily: "outfit-bold" }}>
          {isContentVisible ? "Hide" : "Winners"}
        </Text>
      </TouchableOpacity>
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
    height: 50,
    backgroundColor: Colors.PRIMARY_DARK,
    borderRadius: 25,
    padding: 5,
    marginBottom: 20,
    alignItems: "center",
  },
  tab: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 25,
    height: 40,
  },
  activeTab: {
    backgroundColor: Colors.PRIMARY_LIGHT,
    elevation: 3,
  },
  inactiveTab: {
    backgroundColor: "transparent",
  },
  activeTabText: {
    color: "#ffffff",
    fontFamily: "outfit-bold",
  },
  inactiveTabText: {
    color: "#888888",
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
    marginLeft: 15,
    alignSelf: "center",
  },
  streakText: {
    fontSize: 14,
    color: "#666",
    fontFamily: "outfit",
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
  topUsersContainer: {
    position: "relative",
    alignItems: "center",
    marginBottom: 0,
  },
  podiumImage: {
    width: 250,
    height: 130,
    marginTop: 0,
  },
  topUserItemCenter: {
    position: "absolute",
    top: 40,
    alignItems: "center",
    zIndex: 2,
  },
  topUserItemLeft: {
    position: "absolute",
    top: 70,
    left: 85,
    alignItems: "center",
    zIndex: 1,
  },
  topUserItemRight: {
    position: "absolute",
    top: 100,
    right: 90,
    alignItems: "center",
    zIndex: 1,
  },
  topUserImageCenter: {
    width: 60,
    height: 60,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "#FFD700",
    marginBottom: 5,
  },
  topUserImageLeft: {
    width: 50,
    height: 50,
    borderRadius: 32.5,
    borderWidth: 2,
    borderColor: "#C0C0C0",
    marginBottom: 5,
  },
  topUserImageRight: {
    width: 44,
    height: 44,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#CD7F32",
    marginBottom: 5,
  },
  topUserName: {
    color: "#fff",
    fontFamily: "outfit-bold",
    fontSize: 10,
    textAlign: "center",
  },
  podiumWrapper: {
    width: 250,
    height: 130,
    marginTop: 130,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  confettiAnimation: {
    position: "absolute",
    top: -120,
    left: -100,
    width: 500,
    height: 500,
    zIndex: 3,
    pointerEvents: "none",
  },
  profileContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },

  crownImage: {
    width: 70,
    height: 60,
    position: "absolute",
    top: -40,
    zIndex: 10,
  },
});
