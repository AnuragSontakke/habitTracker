import { View, Text, FlatList, ActivityIndicator } from "react-native";
import React, { useEffect, useState } from "react";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../configs/FirebaseConfig";
import BusinessListCard from "../../pages/BusinessList/BusinessListCard";
import { Colors } from "../../constants/Colors";

export default function BusinessListByCategory() {
  const navigation = useNavigation();
  const { category } = useLocalSearchParams();
  const [businessList, setBusinessList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: category,
      headerStyle:{
        backgroundColor: Colors.PRIMARY,
     
      },
      headerTitleStyle: {
        color: '#fff',
      },
      headerTintColor: '#fff',
    });
    getBusinessList();
  }, [category]);

  const getBusinessList = async () => {
    try {
      const q = query(
        collection(db, "businessList"),
        where("category", "==", category)
      );
      const querySnapshot = await getDocs(q);
      const businesses = [];
      querySnapshot.forEach((doc) => {
        businesses.push({id: doc?.id, ...doc.data()});
      });
      setBusinessList(businesses);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching business list: ", error);
    }
  };
  return (
    <View>
      {businessList?.length > 0 && loading === false ? (
        <FlatList
          data={businessList}
          onRefresh={getBusinessList}
          refreshing={loading}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index }) => (
            <BusinessListCard business={item} key={index} />
          )}
        />
      ) : loading ? (
        <ActivityIndicator
          size={"large"}
          color={Colors.PRIMARY}
          style={{
            marginTop: "70%",
          }}
        />
      ) : (
        <Text
          style={{
            fontSize: 20,
            fontFamily: "outfit-bold",
            color: Colors.GRAY,
            textAlign: "center",
            marginTop: "20%",
          }}
        >
          No Business Found
        </Text>
      )}
    </View>
  );
}
