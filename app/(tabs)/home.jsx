import { View, ScrollView } from "react-native";
import React from "react";
import Header from "../../components/Home/Header";
import Slider from "../../components/Home/Slider";
import Category from "../../components/Home/Category";
import BusinessList from "../../components/Home/BusinessList";

export default function Home() {
  return (
    <View style={{ flex: 1 }}>
      {/* Fixed Header */}
      <Header />

      {/* Scrollable Content */}
      <ScrollView 
        contentContainerStyle={{ paddingTop: 120 }} // Offset for the fixed header
        showsVerticalScrollIndicator={false}
      >
        <Slider />
        <Category />
        <BusinessList />
        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}
