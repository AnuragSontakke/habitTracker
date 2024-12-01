import { ScrollView, View, Text, ActivityIndicator, RefreshControl } from "react-native";
import React, { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../configs/FirebaseConfig";
import { Colors } from "../../constants/Colors";
import Intro from "../../components/BusinessDetail/Intro";
import ActionButton from "../../components/BusinessDetail/ActionButton";
import Reviews from "../../components/BusinessDetail/Reviews";

export default function BusinessDetail() {
  const { businessid } = useLocalSearchParams();
  const [businessDetail, setBusinessDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (businessid) {
      getBusinessDetailById();
    }
  }, [businessid]);

  const getBusinessDetailById = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, "businessList", businessid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setBusinessDetail({id: docSnap.id , ...docSnap.data()});
      } else {
        console.log("No Such Document");
      }
    } catch (error) {
      console.error("Error fetching business detail:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await getBusinessDetailById();  // Refresh business details
    setRefreshing(false);
  };

  return (
    <View style={{ flex: 1 }}>
      {loading ? (
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
      ) : businessDetail ? (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.PRIMARY]} // Customize the color of the refresh indicator
            />
          }
        >
          <Intro businessDetail={businessDetail} />
          <ActionButton business={businessDetail} />
          <Reviews business={businessDetail} />
        </ScrollView>
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
          No Business Details Available
        </Text>
      )}
    </View>
  );
}
