import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Image } from "react-native";
import React, { useEffect, useState } from "react";
import { collection, query, getDocs } from "firebase/firestore";
import { db } from "../../configs/FirebaseConfig";
import { Colors } from "../../constants/Colors";
import { Linking } from 'react-native'; // For opening the video link
import Ionicons from '@expo/vector-icons/Ionicons'; // Import Ionicons for play button

export default function Slider() {
  const [sliderList, setSliderList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
            <TouchableOpacity onPress={() => Linking.openURL(item.videoUrl)}>
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
                  size={50} // Size of the play button
                  color="white"
                  style={{
                    position: 'absolute',
                    backgroundColor: Colors.PRIMARY_LIGHT,
                    borderRadius: 99,
                    top: '50%', // Position it vertically centered
                    left: '50%', // Position it horizontally centered
                    transform: [{ translateX: -25 }, { translateY: -25 }], // Adjust for icon size (half the size)
                  }}
                />
              </View>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}
