import { View, Text, FlatList } from "react-native";
import React, { useEffect, useState } from "react";
import { Colors } from "../../constants/Colors";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "../../configs/FirebaseConfig";
import BusinessItem from "./BusinessItem";

export default function BusinessList() {
    const [businessList, setBusinessList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
  
    useEffect(() => {
        getBusinessList();
    }, []);
    const getBusinessList = async () => {
        try {
          setLoading(true); // Set loading state to true
          const q = query(collection(db, "businessList"));
          const querySnapshot = await getDocs(q);
            console.log("querySnapshot",querySnapshot)
          const categories = [];
          querySnapshot.forEach((doc) => {
            categories.push({id: doc.id, ...doc.data()}); // Collect data in a local array
          });
          setBusinessList(categories); // Update the state once
        } catch (err) {
          console.error("Error fetching business List:", err);
          setError("Failed to load business List. Please try again later.");
        } finally {
          setLoading(false); // Reset loading state
        }
      };


  return (
    <View>
      <View
        style={{
          padding: 20,
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 10,
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontFamily: "outfit-bold",
          }}
        >
          Popular Items
        </Text>
      </View>
      <FlatList
        data={businessList}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => index.toString()} // Add a unique key for each item
        renderItem={({ item }) => (
          <BusinessItem
            business={item}
          />
        )}
      />
    </View>
  );
}
