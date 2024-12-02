import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  TextInput, 
  ToastAndroid, 
  ActivityIndicator, 
  ScrollView, 
  KeyboardAvoidingView, 
  FlatList, 
  Platform 
} from "react-native";
import React, { useEffect, useState } from "react";
import { useNavigation } from "expo-router";
import { Colors } from "../../constants/Colors";
import * as ImagePicker from "expo-image-picker";
import { collection, doc, getDocs, query, setDoc } from "firebase/firestore";
import { db, storage } from "../../configs/FirebaseConfig";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useUser } from "@clerk/clerk-expo";

export default function AddBusiness() {
  const navigation = useNavigation();
  const [image, setImage] = useState(null);
  const [categoryList, setCategoryList] = useState([]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [contact, setContact] = useState("");
  const [website, setWebsite] = useState("");
  const [about, setAbout] = useState("");
  const [category, setCategory] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const { user } = useUser();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: "Add New Business",
      headerShown: true,
      headerStyle: {
        backgroundColor: Colors.PRIMARY,
      },
      headerTitleStyle: {
        color: '#fff',
      },
      headerTintColor: '#fff',
    });
    getCategoryList();
  }, []);

  const validateInputs = () => {
    if (!name.trim()) {
      ToastAndroid.show("Name is required", ToastAndroid.LONG);
      return false;
    }
    if (name.length > 50) {
      ToastAndroid.show("Name cannot exceed 50 characters", ToastAndroid.LONG);
      return false;
    }
    if (!address.trim()) {
      ToastAndroid.show("Address is required", ToastAndroid.LONG);
      return false;
    }
    if (!/^\d+$/.test(contact)) {
      ToastAndroid.show("Contact must be a valid phone number", ToastAndroid.LONG);
      return false;
    }
    if (contact.length < 10 || contact.length > 15) {
      ToastAndroid.show("Contact must be between 10 and 15 digits", ToastAndroid.LONG);
      return false;
    }
    if (!/^https?:\/\/[^\s$.?#].[^\s]*$/gm.test(website)) {
      ToastAndroid.show("Invalid website URL", ToastAndroid.LONG);
      return false;
    }
    if (!about.trim()) {
      ToastAndroid.show("About section is required", ToastAndroid.LONG);
      return false;
    }
    if (about.length > 300) {
      ToastAndroid.show("About section cannot exceed 300 characters", ToastAndroid.LONG);
      return false;
    }
    if (!category) {
      ToastAndroid.show("Please select a category", ToastAndroid.LONG);
      return false;
    }
    if (!image) {
      ToastAndroid.show("Please upload an image", ToastAndroid.LONG);
      return false;
    }
    return true;
  };

  const onImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        const { uri } = result.assets[0];
        const imageSize = (await fetch(uri)).headers.get('Content-Length');
        if (imageSize > 2 * 1024 * 1024) {
          ToastAndroid.show("Image size should be less than 2 MB", ToastAndroid.LONG);
          return;
        }
        setImage(uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      ToastAndroid.show("Image selection failed", ToastAndroid.LONG);
    }
  };

  const getCategoryList = async () => {
    try {
      const q = query(collection(db, "category"));
      const snapShot = await getDocs(q);
      const categories = snapShot.docs.map((doc) => ({
        label: doc.data().name,
        value: doc.data().name,
      }));
      setCategoryList(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const onAddNewBusiness = async () => {
    if (!validateInputs()) return;

    if (!user) {
      ToastAndroid.show("User is not authenticated", ToastAndroid.LONG);
      return;
    }

    setLoading(true);
    try {
      const fileName = Date.now().toString() + ".jpg"; // Generate unique file name using current timestamp
      const res = await fetch(image);
      const blob = await res.blob();
      const imageRef = ref(storage, "habitTracker/" + fileName);

      await uploadBytes(imageRef, blob);
      const downloadUrl = await getDownloadURL(imageRef);
      await saveBusinessDetail(downloadUrl);
      resetForm();
      console.log("File uploaded successfully");
    } catch (error) {
      console.error("File upload failed:", error);
      ToastAndroid.show("File upload failed", ToastAndroid.LONG);
    } finally {
      setLoading(false);
    }
  };

  const saveBusinessDetail = async (imageUrl) => {
    try {
      await setDoc(doc(db, "businessList", Date.now().toString()), {
        name: name.trim(),
        address: address.trim(),
        contact,
        website: website.trim(),
        category,
        userName: user?.fullName,
        userEmail: user?.primaryEmailAddress?.emailAddress,
        userImage: user?.imageUrl,
        about: about.trim(),
        image: imageUrl,
        createdAt: new Date().toISOString(),
      });
      ToastAndroid.show("New Business added successfully", ToastAndroid.LONG);
    } catch (error) {
      console.error("Error saving business details:", error);
      ToastAndroid.show("Failed to save business details", ToastAndroid.LONG);
    }
  };

  const resetForm = () => {
    setName("");
    setAddress("");
    setContact("");
    setWebsite("");
    setAbout("");
    setCategory("");
    setImage(null);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontFamily: "outfit-bold", fontSize: 25 }}>
          Add New Business
        </Text>
        <Text style={{ fontFamily: "outfit", fontSize: 16, color: Colors.GRAY }}>
          Fill all details
        </Text>

        <TouchableOpacity style={{ marginTop: 20 }} onPress={onImagePick}>
          {!image ? (
            <Image
              source={require("../../assets/images/camera-img.png")}
              style={{ width: 100, height: 100 }}
            />
          ) : (
            <Image
              source={{ uri: image }}
              style={{ width: 100, height: 100, borderRadius: 15 }}
            />
          )}
        </TouchableOpacity>

        <View>
          <TextInput
            placeholder="Name"
            value={name}
            onChangeText={setName}
            style={inputStyle}
          />
          <TextInput
            placeholder="Address"
            value={address}
            onChangeText={setAddress}
            style={inputStyle}
          />
          <TextInput
            placeholder="Contact"
            value={contact}
            onChangeText={setContact}
            keyboardType="phone-pad"
            style={inputStyle}
          />
          <TextInput
            placeholder="Website"
            value={website}
            onChangeText={setWebsite}
            style={inputStyle}
          />
          <TextInput
            placeholder="About"
            value={about}
            onChangeText={setAbout}
            multiline
            numberOfLines={5}
            style={[inputStyle, { height: 100 }]}
          />
        </View>

        {/* Custom Dropdown */}
        <View>
          <TouchableOpacity
            onPress={() => setShowDropdown(!showDropdown)}
            style={[inputStyle, { flexDirection: "row", justifyContent: "space-between" }]}
          >
            <Text style={{ fontSize: 16 }}>
              {category || "Select a category"}
            </Text>
            <Text style={{ fontSize: 16 }}>▼</Text>
          </TouchableOpacity>

          {showDropdown && (
            <View
              style={{
                borderWidth: 1,
                borderColor: Colors.PRIMARY,
                borderRadius: 5,
                backgroundColor: "#fff",
                marginTop: 5,
                maxHeight: 150, // Limit the height of the dropdown
              }}
            >
              <FlatList
                data={categoryList}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setCategory(item.value);
                      setShowDropdown(false);
                    }}
                    style={{
                      padding: 10,
                      borderBottomWidth: 1,
                      borderBottomColor: "#ddd",
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>{item.label}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </View>

        <TouchableOpacity
          style={{
            backgroundColor: Colors.PRIMARY,
            padding: 15,
            borderRadius: 10,
            alignItems: "center",
            marginTop: 20,
          }}
          onPress={onAddNewBusiness}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontSize: 18 }}>Submit</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const inputStyle = {
  padding: 10,
  borderWidth: 1,
  borderRadius: 5,
  fontSize: 17,
  backgroundColor: "#fff",
  marginTop: 10,
  borderColor: Colors.PRIMARY,
  fontFamily: "outfit",
};
