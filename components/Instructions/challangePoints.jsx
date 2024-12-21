import { View, Text, StyleSheet } from "react-native";
import React from "react";

export default function ChallangePoints() {
  return (
    <View>
      <View style={styles.instructions}>
        <Text style={styles.instructionsText}>
          🏆 <Text style={styles.bold}>Custom Challenge:</Text> Only one active
          at a time. Finish the current challenge before starting a new one.
          {"\n"}
          🔄 <Text style={styles.bold}>Predefined Challenges:</Text> Cannot be
          stopped once started.{"\n"}
        </Text>

        <View style={styles.table}>
          <View style={styles.row}>
            <Text style={styles.tableHeader}>Challenge</Text>
            <Text style={styles.tableHeader}>Reward</Text>
          </View>

          {/* Custom Challenge Reward */}
          <View style={styles.row}>
            <Text style={styles.tableCell}>Custom Challenge</Text>
            <Text style={styles.tableCell}>10 coins daily</Text>
          </View>

          {/* Kriya Challenge Rewards */}
          <View style={styles.row}>
            <Text style={styles.tableCell}>Kriya (10 days)</Text>
            <Text style={styles.tableCell}>5 coins daily</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.tableCell}>Kriya (15 days)</Text>
            <Text style={styles.tableCell}>7 coins daily</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.tableCell}>Kriya (21 days)</Text>
            <Text style={styles.tableCell}>9 coins daily</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.tableCell}>Kriya (streak continues)</Text>
            <Text style={styles.tableCell}>10 coins daily</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.tableCell}>Kriya (streak reset)</Text>
            <Text style={styles.tableCell}>Reset to 5 coins daily</Text>
          </View>

          {/* Meditation Challenge Rewards */}
          <View style={styles.row}>
            <Text style={styles.tableCell}>Meditation (10 days)</Text>
            <Text style={styles.tableCell}>4 coins daily</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.tableCell}>Meditation (15 days)</Text>
            <Text style={styles.tableCell}>5 coins daily</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.tableCell}>Meditation (21 days)</Text>
            <Text style={styles.tableCell}>6 coins daily</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.tableCell}>Meditation (streak continues)</Text>
            <Text style={styles.tableCell}>7 coins daily</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.tableCell}>Meditation (streak reset)</Text>
            <Text style={styles.tableCell}>Reset to 4 coins daily</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  instructions: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  instructionsText: {
    fontSize: 14,
    color: "#333",
  },
  bold: {
    fontFamily: "outfit-bold",
  },
  table: {
    marginTop: 15,
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    paddingTop: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tableHeader: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#555",
    flex: 1,
    padding: 5,
    textAlign: "center",
  },
  tableCell: {
    fontSize: 14,
    color: "#333",
    flex: 1,
    padding: 5,
    textAlign: "center",
  },
});
