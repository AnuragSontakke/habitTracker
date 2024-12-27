import { View, Text, Image } from "react-native";
import React from "react";
import { TouchableOpacity } from "react-native";

export default function CategoryItem({ category, onCategoryPress }) {
  return (
    <TouchableOpacity onPress={(category)=> onCategoryPress(category) }>
      <View style={{ padding: 10 }}>
        <Image
          source={{ uri: category.icon }}
          style={{ width: 100, height: 100 }}
        />
      </View>
    </TouchableOpacity>
  );
}
