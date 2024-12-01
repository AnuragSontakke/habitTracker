import { View, Text, TextInput, TouchableOpacity, ToastAndroid, Image } from "react-native";
import React, { useState, useEffect } from "react";
import { Rating } from "react-native-ratings";
import { Colors } from "../../constants/Colors";
import { arrayUnion, doc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../configs/FirebaseConfig";
import { useUser } from "@clerk/clerk-expo";
import { Timestamp } from "firebase/firestore";
import { formatDistanceToNow } from 'date-fns'; // Import the function from date-fns

export default function Reviews({ business }) {
  const [rating, setRating] = useState(4);
  const [userInput, setUserInput] = useState("");
  const [reviews, setReviews] = useState(business?.reviews || []);
  const { user } = useUser();

  useEffect(() => {
    const docRef = doc(db, "businessList", business?.id);

    // Listen to real-time updates for the reviews field in the document
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setReviews(docSnap.data()?.reviews || []);
      }
    });

    // Cleanup the listener when the component unmounts
    return () => unsubscribe();
  }, [business?.id]);

  const onSubmit = async () => {
    try {
      const docRef = doc(db, "businessList", business?.id);
      await updateDoc(docRef, {
        reviews: arrayUnion({
          rating: rating,
          comment: userInput,
          userName: user?.fullName,
          userImage: user?.imageUrl || 'default_image_url',
          userEmail: user?.primaryEmailAddress?.emailAddress,
          timestamp: Timestamp.now(), // Add the current timestamp
        }),
      });
      setUserInput(""); // Clear the input after submission
      ToastAndroid.show("Comment Added Successfully", ToastAndroid.TOP);
      
    } catch (error) {
      ToastAndroid.show("Error adding comment", ToastAndroid.TOP);
    }
  };

  // Format timestamp into relative time (e.g., "5 minutes ago", "1 hour ago")
  const formatDate = (timestamp) => {
    if (timestamp) {
      const date = timestamp.toDate(); // Convert Firestore timestamp to JavaScript Date
      return formatDistanceToNow(date) + " ago"; // Use date-fns to get relative time
    } else {
      return "Date not available"; // Return a default message if no timestamp
    }
  };

  return (
    <View style={{ padding: 20, backgroundColor: "#fff" }}>
      <Text style={{ fontFamily: "outfit-bold", fontSize: 20 }}>
        Reviews
      </Text>
      <View>
        <Rating
          showRating={false}
          imageSize={25}
          onFinishRating={(rating) => setRating(rating)}
          style={{ paddingVertical: 10 }}
        />
        <TextInput
          placeholder="Write Your comments"
          numberOfLines={4}
          multiline={true}
          keyboardType="default"
          value={userInput} // Ensure the TextInput value is controlled by state
          onChangeText={(value) => setUserInput(value)}
          maxLength={260}
          style={{
            height: 100,
            borderWidth: 1,
            padding: 10,
            borderRadius: 10,
            borderColor: Colors.GRAY,
            textAlignVertical: "top",
          }}
        />
        <TouchableOpacity
          disabled={!userInput || rating === 0}
          onPress={onSubmit}
          style={{
            marginTop: 10,
            padding: 10,
            backgroundColor: Colors.PRIMARY,
            borderRadius: 6,
            alignItems: "center",
          }}
        >
          <Text style={{ fontFamily: "outfit", color: "#fff", fontWeight: "bold" }}>
            Submit
          </Text>
        </TouchableOpacity>
      </View>
      <View style={{ marginTop: 20 }}>
        {reviews?.length > 0 && 
          reviews
            .sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds) // Sort reviews by timestamp in descending order
            .map((item, index) => (
              <View key={index} style={{ marginBottom: 15 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Image
                      source={{ uri: item.userImage || 'default_image_url' }}
                      style={{ width: 30, height: 30, borderRadius: 15, marginRight: 10 }}
                    />
                    <Text style={{ fontFamily: "outfit-bold", fontSize: 16 }}>
                      {item.userName || "Anonymous"}
                    </Text>
                  </View>
                  <Rating
                    imageSize={20}
                    readonly
                    startingValue={item.rating}
                    style={{ paddingVertical: 5 }}
                  />
                </View>
                <Text style={{ marginTop: 5, marginLeft: 40, fontFamily: "outfit", fontSize: 14 }}>
                  {item.comment}
                </Text>
                <Text style={{ marginTop: 5, marginLeft: 40, fontFamily: "outfit", fontSize: 12, color: Colors.GRAY }}>
                  {formatDate(item.timestamp)} {/* Display relative time */}
                </Text>
              </View>
            ))
        }
      </View>
    </View>
  );
}
