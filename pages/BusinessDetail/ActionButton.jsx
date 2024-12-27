import { View, Text, FlatList, Linking, Share, StyleSheet } from "react-native";
import React from "react";
import Feather from "@expo/vector-icons/Feather";
import { TouchableOpacity } from "react-native";

export default function ActionButton({ business }) {
  const actionButtonMenu = [
    {
      id: 1,
      name: "Call",
      icon: <Feather name="phone-call" size={40} color="white"
      backgroundColor={'#e68384'}
      style={{
        padding: 10,
        borderRadius: 99,
      }}/>,
      url: "tel:" + business?.contact,
    },
    {
      id: 2,
      name: "Location",
      icon: <Feather name="map-pin" size={40} color="white" backgroundColor={'#83c5e6'}
      style={{
        padding: 10,
        borderRadius: 99,
      }}/>,
      url:
        "https://www.google.com/maps/search/?api=1&query=" + business?.address,
    },
    {
      id: 3,
      name: "Web",
      icon: <Feather name="globe" size={40} color="white" backgroundColor={'#83e684'}
      style={{
        padding: 10,
        borderRadius: 99,
      }}/>,
      url: business?.website,
    },
    {
      id: 4,
      name: "Share",
      icon: <Feather name="share-2" size={40} color="white" backgroundColor={'#f5e616'}
      style={{
        padding: 10,
        borderRadius: 99,
      }}/>,
      url: business?.website,
    },
  ];

  const onPressHandler = async (item) => {
    if (item.name === "Share") {
      try {
        await Share.share({
          message: item?.name + "\n Custom Message" || "No website available to share",
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else if (item.url) {
      Linking.openURL(item.url).catch((err) =>
        console.error("Error opening URL:", err)
      );
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={actionButtonMenu}
        keyExtractor={(item) => item.id.toString()} // Use unique keys
        numColumns={4}
        columnWrapperStyle={styles.columnWrapper}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => onPressHandler(item)}
            style={styles.button}
          >
            <View>
            {item.icon}
            </View>
            <Text style={styles.buttonText}>{item?.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    padding: 20,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  button: {
    alignItems: "center",
  },
  buttonText: {
    fontFamily: "outfit-medium",
    textAlign: "center",
    marginTop: 3,
  },
});
