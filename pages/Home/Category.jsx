import { View, Text, FlatList, ActivityIndicator } from "react-native";
import React, { useEffect, useState } from "react";
import { Colors } from "../../constants/Colors";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "../../configs/FirebaseConfig";
import CategoryItem from "./CategoryItem";
import { useRouter } from "expo-router";

export default function Category() {
  const [categoryList, setCategoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    getCategoryList();
  }, []);

  const getCategoryList = async () => {
    try {
      setLoading(true); // Set loading state to true
      const q = query(collection(db, "category"));
      const querySnapshot = await getDocs(q);
      const categories = [];
      querySnapshot.forEach((doc) => {
        categories.push(doc.data()); // Collect data in a local array
      });
      setCategoryList(categories); // Update the state once
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError("Failed to load categories. Please try again later.");
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  if (loading) {
    return <ActivityIndicator style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}} />;
  }

  if (error) {
    return <Text>{error}</Text>;
  }

  return (
    <View>
      <View
        style={{
          padding: 20,
          flexDirection: "row", // "display: 'flex'" is unnecessary in React Native
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
          Category
        </Text>
        <Text style={{ color: Colors.PRIMARY }}>View All</Text>
      </View>
      <FlatList
        data={categoryList}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => index.toString()} // Add a unique key for each item
        renderItem={({ item }) => (
          <CategoryItem
            category={item}
            onCategoryPress={(category) => router.push('/businesslist/'+ item.name)}
          />
        )}
      />
    </View>
  );
}
