import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Image } from "react-native";
import React, { useEffect, useState } from "react";
import { collection, query, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../../configs/FirebaseConfig";
import { Colors } from "../../constants/Colors";
import Ionicons from '@expo/vector-icons/Ionicons';
import YoutubePlayer from 'react-native-youtube-iframe'; // For embedding YouTube video

export default function Slider() {
  const [sliderList, setSliderList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [videoPlayed, setVideoPlayed] = useState({}); // To track completion of each video

  const getSliderList = async () => {
    try {
      const q = query(collection(db, "slider"));
      const querySnapshot = await getDocs(q);
      const sliders = [];
      querySnapshot.forEach((doc) => {
        sliders.push(doc.data());
      });
      setSliderList(sliders);
    } catch (err) {
      console.error("Error fetching slider data:", err);
      setError("Failed to load data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getSliderList();
  }, []);

  if (loading) {
    return <ActivityIndicator style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }} />;
  }

  if (error) {
    return <Text>{error}</Text>;
  }

  // Function to extract YouTube video ID from the URL
  const extractYouTubeVideoId = (url) => {
    const regExp = /(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/[^\/]+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=))([a-zA-Z0-9_-]{11})/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  // Function to get YouTube video thumbnail URL
  const getYouTubeThumbnail = (videoUrl) => {
    const videoId = extractYouTubeVideoId(videoUrl); // Extract video ID
    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
  };

  // Function to handle video completion
  const handleVideoComplete = async (videoId) => {
    // Update Firestore or Local state to mark as completed
    setVideoPlayed((prevState) => ({ ...prevState, [videoId]: true }));
    
    // You can also store this in Firebase if you want to track user progress
    // For example, using updateDoc to mark completion
    const userRef = doc(db, "users", "currentUserId"); // Replace with current user's ID
    await updateDoc(userRef, {
      completedVideos: [...(userRef.completedVideos || []), videoId],
    });
  };

  return (
    <View>
      <Text
        style={{
          fontFamily: "outfit-bold",
          fontSize: 20,
          paddingLeft: 20,
          paddingTop: 20,
          marginBottom: 5,
        }}
      >
        Trending Meditations
      </Text>

      <FlatList
        data={sliderList}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{
          paddingLeft: 20,
        }}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={{ marginRight: 20 }}>
            {/* Show YouTube Thumbnail with Play Button */}
            <TouchableOpacity onPress={() => handleVideoComplete(item.videoUrl)}>
              <View style={{ position: 'relative' }}>
                {/* YouTube Thumbnail */}
                <Image
                  source={{
                    uri: getYouTubeThumbnail(item.videoUrl) || "https://via.placeholder.com/250x145",
                  }}
                  style={{
                    width: 250,
                    height: 145,
                    borderRadius: 20,
                    borderWidth: 3,
                    borderColor: "#fff",
                  }}
                />
                {/* Play Button Icon */}
                <Ionicons 
                  name="play-circle-outline"
                  size={50} 
                  color="white"
                  style={{
                    position: 'absolute',
                    backgroundColor: Colors.PRIMARY_LIGHT,
                    borderRadius: 99,
                    top: '50%',
                    left: '50%',
                    transform: [{ translateX: -25 }, { translateY: -25 }],
                  }}
                />
              </View>
            </TouchableOpacity>

            {/* Embed the YouTube Player */}
            <YoutubePlayer
              height={200}
              width={300}
              videoId={extractYouTubeVideoId(item.videoUrl)}
              onStateChange={(e) => {
                if (e.state === "ended") {
                  handleVideoComplete(item.videoUrl);
                }
              }}
            />
          </View>
        )}
      />
    </View>
  );
}
