import { View, Text, Image, TouchableOpacity, Alert, ToastAndroid } from "react-native";
import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Colors } from "../../constants/Colors";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../../configs/FirebaseConfig";
import { useUser } from "@clerk/clerk-expo";

export default function Intro({ businessDetail }) {
  const router = useRouter();
const {user} = useUser()
  const onDelete = () => {
    Alert.alert(
      "So you want to delete?",
      "Do you really want to delete this business?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteBusiness(),
        },
      ]
    );
  };

  const deleteBusiness = async () => {
    await deleteDoc(doc(db, "businessList", businessDetail?.id));
    router.back();
    ToastAndroid.show('Business deleted', ToastAndroid.LONG);
  };

  return (
    <View>
      <View
        style={{
          position: "absolute",
          zIndex: 10,
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          width: "100%",
          padding: 20,
          marginTop: 30,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons
            name="arrow-back-circle-outline"
            size={40}
            color="white"
            backgroundColor={Colors.PRIMARY}
            style={{
              borderRadius: 99,
            }}
          />
        </TouchableOpacity>
        <Ionicons name="heart-outline" size={40} color="white" />
      </View>
      <Image
        source={{ uri: businessDetail.image }}
        style={{
          width: "100%",
          height: 340,
          marginTop: 30,
        }}
      />
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          padding: 20,
          marginTop: -20,
          backgroundColor: "#fff",
          borderTopLeftRadius: 25,
          borderTopRightRadius: 25,
        }}
      >
        <View
          style={{
            paddingTop: 20,
            marginTop: -20,
            backgroundColor: "#fff",
            borderTopLeftRadius: 25,
            borderTopRightRadius: 25,
          }}
        >
          <Text
            style={{
              fontSize: 26,
              fontFamily: "outfit-bold",
            }}
          >
            {businessDetail.name}
          </Text>

          <Text
            style={{
              fontSize: 18,
              fontFamily: "outfit",
            }}
          >
            {businessDetail.address}
          </Text>
          <Text
            style={{
              fontSize: 16,
              fontFamily: "outfit",
              color: Colors.GRAY,
            }}
          >
            {businessDetail.contact}
          </Text>
          <Text
            style={{
              fontFamily: "outfit",
            }}
          >
            {businessDetail.about}
          </Text>
        </View>
        {user?.primaryEmailAddress?.emailAddress === businessDetail?.userEmail && <TouchableOpacity onPress={() => onDelete()}>
          <Ionicons name="trash" size={24} color="red" />
        </TouchableOpacity>}
      </View>
    </View>
  );
}
