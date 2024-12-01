import { View, Text, FlatList, RefreshControl, StyleSheet } from "react-native";
import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-expo";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../configs/FirebaseConfig";
import BusinessListCard from "../../components/Explore/BusinessListCard";
import { useNavigation } from "expo-router";
import { Colors } from "../../constants/Colors";

export default function MyBusiness() {
  const [businessList, setBusinessList] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const { user } = useUser();

  useEffect(() => {
    navigation.setOptions({
      headerTitle: "My Business",
      headerShown: true,
      headerStyle:{
        backgroundColor: Colors.PRIMARY,
     
      },
      headerTitleStyle: {
        color: '#fff',
      },
      headerTintColor: '#fff',
    });
    if (user) {
      getUserBusiness();
    }
  }, [user]);

  const getUserBusiness = async () => {
    const q = query(
      collection(db, "businessList"),
      where("userEmail", "==", user?.primaryEmailAddress?.emailAddress)
    );
    const querySnapShot = await getDocs(q);

    const businesses = [];
    querySnapShot.forEach((doc) => {
      businesses.push({ id: doc.id, ...doc.data() });
    });
    setBusinessList(businesses);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await getUserBusiness();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>    

      <FlatList
        data={businessList}
        renderItem={({ item }) => <BusinessListCard business={item} />}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginBottom: 30,
  },
  title: {
    fontFamily: "outfit-bold",
    fontSize: 30,
  },
});
