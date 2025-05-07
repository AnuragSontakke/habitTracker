import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ToastAndroid,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../../configs/FirebaseConfig";
import * as ImagePicker from "expo-image-picker";
import { useUserContext } from "../../contexts/UserContext";
import { Ionicons } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";

export default function CreateEventForm({onSubmit}) {
  const { userId } = useUserContext();
  const [event, setEvent] = useState({
    eventName: "",
    registrationLink: "",
    eventImage: "",
    price: "",
    content: "",
  });

  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [eventType, setEventType] = useState("");
  const [expiryOption, setExpiryOption] = useState("1 Week");

  const handleChange = (field, value) => {
    setEvent((prev) => ({ ...prev, [field]: value }));
  };

  const getExpiryDate = () => {
    const now = new Date();
    const durations = {
      "1 Day": 1,
      "1 Week": 7,
      "2 Weeks": 14,
      "3 Weeks": 21,
      "4 Weeks": 28,
    };
    return new Date(now.getTime() + durations[expiryOption] * 24 * 60 * 60 * 1000);
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        const { uri } = result.assets[0];
        setImageUri(uri);
        uploadImageToCloudinary(uri);
      }
    } catch (error) {
      ToastAndroid.show("Image selection failed", ToastAndroid.LONG);
    }
  };

  // const uploadImageToFirebase = async (uri) => {
  //   try {
  //     setLoading(true);
  //     const res = await fetch(uri);
  //     const blob = await res.blob();
  //     const fileName = Date.now().toString() + ".jpg";
  //     const imageRef = ref(storage, "eventImages/" + fileName);
  //     await uploadBytes(imageRef, blob);
  //     const downloadUrl = await getDownloadURL(imageRef);
  //     setEvent((prev) => ({ ...prev, eventImage: downloadUrl }));
  //     ToastAndroid.show("Image uploaded successfully!", ToastAndroid.SHORT);
  //   } catch (error) {
  //     ToastAndroid.show("Upload failed", ToastAndroid.LONG);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const uploadImageToCloudinary = async (uri) => {
    try {
      setLoading(true);
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }],
        { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
      );

      const formData = new FormData();
      formData.append("file", {
        uri: manipulatedImage.uri,
        type: "image/jpeg",
        name: "upload.jpg",
      });
      formData.append("upload_preset", "habitTracker");

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.EXPO_PUBLIC_CLOUDINARY_CLOUDNAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      if (data.secure_url) {
        setEvent((prev) => ({ ...prev, eventImage: data.secure_url }));
        ToastAndroid.show("Image uploaded successfully!", ToastAndroid.SHORT);
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      ToastAndroid.show("Cloudinary upload failed", ToastAndroid.LONG);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    let eventData = {
      eventType,
      createdAt: Timestamp.now(),
      comments: [],
      likes: [],
      volunteer: [],
      interested: [],
    };

    if (eventType === "Course/Tour") {
      eventData = {
        ...eventData,
        eventName: event.eventName,
        registrationLink: event.registrationLink,
        eventImage: event.eventImage,
        price: Number(event.price),
        expiryAt: Timestamp.fromDate(getExpiryDate()),
      };
    } else {
      eventData = {
        ...eventData,
        content: event.content,
        eventImage: eventType === "Normal Post with Image" ? event.eventImage : "",
        expiryAt: Timestamp.fromDate(getExpiryDate()),
      };
    }

    try {
      await addDoc(collection(db, "teacherNetworks", userId, "events"), eventData);
      ToastAndroid.show("Event Created!", ToastAndroid.SHORT);
      setEvent({
        eventName: "",
        registrationLink: "",
        eventImage: "",
        price: "",
        content: "",
      });
      setEventType("");
      setExpiryOption("1 Week");
      setImageUri(null);
    } catch (err) {
      console.error("Error creating event:", err);
      ToastAndroid.show("Something went wrong!", ToastAndroid.LONG);
    }
    onSubmit();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Event Type</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={eventType}
          onValueChange={(value) => setEventType(value)}
          style={styles.picker}
        >
          <Picker.Item label="Select Event Type" value="" />
          <Picker.Item label="Course/Tour" value="Course/Tour" />
          <Picker.Item label="Normal Post with Image" value="Normal Post with Image" />
          <Picker.Item label="Normal Post" value="Normal Post" />
        </Picker>
      </View>

      {eventType === "Course/Tour" && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Event Name"
            value={event.eventName}
            onChangeText={(text) => handleChange("eventName", text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Registration Link"
            value={event.registrationLink}
            onChangeText={(text) => handleChange("registrationLink", text)}
          />
          <Text style={styles.label}>Upload Event Image</Text>
          <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
            {loading ? (
              <ActivityIndicator color="gray" />
            ) : imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            ) : (
              <Ionicons name="cloud-upload-outline" size={40} color="#bbb" />
            )}
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Price"
            value={event.price}
            onChangeText={(text) => handleChange("price", text)}
            keyboardType="numeric"
          />
          <Text style={styles.label}>Expiry Duration</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={expiryOption}
              onValueChange={(value) => setExpiryOption(value)}
              style={styles.picker}
            >
              <Picker.Item label="1 Day" value="1 Day" />
              <Picker.Item label="1 Week" value="1 Week" />
              <Picker.Item label="2 Weeks" value="2 Weeks" />
              <Picker.Item label="3 Weeks" value="3 Weeks" />
              <Picker.Item label="4 Weeks" value="4 Weeks" />
            </Picker>
          </View>
        </>
      )}

      {(eventType === "Normal Post with Image" || eventType === "Normal Post") && (
        <TextInput
          style={[styles.input, { height: 100 }]}
          placeholder="Post Content"
          value={event.content}
          onChangeText={(text) => handleChange("content", text)}
          multiline
        />
      )}

      {eventType === "Normal Post with Image" && (
        <>
          <Text style={styles.label}>Upload Post Image</Text>
          <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
            {loading ? (
              <ActivityIndicator color="gray" />
            ) : imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            ) : (
              <Ionicons name="cloud-upload-outline" size={40} color="#bbb" />
            )}
          </TouchableOpacity>
        </>
      )}

      {eventType && (
        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Create Event</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 50,
    backgroundColor: "#f9f9f9",
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    color: "#333",
    fontSize: 16,
  },
  pickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  uploadBox: {
    backgroundColor: "#fff",
    height: 180,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 16,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});