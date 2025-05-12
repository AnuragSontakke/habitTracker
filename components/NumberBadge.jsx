import React from "react";
import { View, Text, StyleSheet } from "react-native";

const NumberBadge = ({
  number=0,
  backgroundColor = "orange",
  top,
  right,
  paddingVertical,
  fontSize,
  minWidth,
  borderWidth,
  height,
  opacity
}) => {
  // if (!number) return null;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor,
          top,
          right,
          paddingVertical,
          minWidth,
          borderWidth,
          height,
          opacity
        },
      ]}
    >
      <Text style={[styles.text, { fontSize: fontSize }]}>{number}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    paddingHorizontal: 3,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
    borderColor: "#fff",
  },
  text: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default NumberBadge;
