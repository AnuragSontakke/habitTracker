import { useNavigation } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, TextInput, StyleSheet, Text, TouchableOpacity, ActivityIndicator, View, Alert } from "react-native";
import { Colors } from "../../constants/Colors";
import { generatePDF } from "./generatePDF";

const PrintIcard = () => {
  const navigation = useNavigation();

  const [inputs, setInputs] = useState([{ name: "", gender: "Male" }]);
  const [loading, setLoading] = useState(false); // Loading state

  useEffect(() => {
    navigation.setOptions({
      headerTitle: "Print Icard",
      headerShown: true,
      headerStyle: {
        backgroundColor: Colors.PRIMARY,
      },
      headerTitleStyle: {
        color: "#fff",
        fontFamily: "outfit-bold",
        fontSize: 18,
      },
      headerTintColor: "#fff",
    });
  }, []);

  const addInput = () => {
    if (inputs.length >= 10) {
      Alert.alert("Limit Reached", "You can only add up to 8 names.");
      return;
    }
    setInputs([...inputs, { name: "", gender: "Male" }]);
  };

  const clearInputs = () => {
    setInputs([{ name: "", gender: "Male" }]); // Reset to the initial state
  };

  const handleInputChange = (text, index) => {
    const updatedInputs = [...inputs];
    updatedInputs[index].name = text.slice(0, 10); // Limit to 10 characters
    setInputs(updatedInputs);
  };

  const handleGenderChange = (index, gender) => {
    const updatedInputs = [...inputs];
    updatedInputs[index].gender = gender;
    setInputs(updatedInputs);
  };

  const handleGeneratePDF = async () => {
    setLoading(true); // Show loading indicator
    try {
      await generatePDF(inputs); // Pass the inputs array to the PDF generator
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setLoading(false); // Hide loading indicator
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
        <Text style={styles.loadingText}>Generating PDF...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Generate ICards</Text>
      {inputs.map((input, index) => (
        <View key={index} style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={`Name ${index + 1}`}
            placeholderTextColor={Colors.SECONDARY}
            value={input.name}
            onChangeText={(text) => handleInputChange(text, index)}
            maxLength={10} // Extra safeguard for character limit
          />
          <View style={styles.dropdown}>
            <TouchableOpacity
              style={[
                styles.dropdownItem,
                input.gender === "Male" ? styles.selected : null,
              ]}
              onPress={() => handleGenderChange(index, "Male")}
            >
              <Text style={styles.dropdownText}>Male</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.dropdownItem,
                input.gender === "Female" ? styles.selected : null,
              ]}
              onPress={() => handleGenderChange(index, "Female")}
            >
              <Text style={styles.dropdownText}>Female</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
      <TouchableOpacity style={styles.addButton} onPress={addInput}>
        <Text style={styles.addButtonText}>+ Add More</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.addButton} onPress={handleGeneratePDF}>
        <Text style={styles.addButtonText}>Print ICards</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.clearButton} onPress={clearInputs}>
        <Text style={styles.clearButtonText}>Clear All</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: Colors.BACKGROUND,
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontFamily: "outfit-bold",
    color: Colors.PRIMARY,
    textAlign: "center",
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.PRIMARY_DARK,
    padding: 10,
    borderRadius: 5,
    fontFamily: "outfit",
    fontSize: 16,
    color: Colors.TEXT,
    marginRight: 10,
  },
  dropdown: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: Colors.PRIMARY_DARK,
    borderRadius: 5,
  },
  dropdownItem: {
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    width: 80,
  },
  selected: {
    backgroundColor: Colors.PRIMARY,
  },
  dropdownText: {
    fontFamily: "outfit",
    fontSize: 14,
    color: Colors.TEXT,
  },
  addButton: {
    backgroundColor: Colors.PRIMARY,
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 15,
  },
  addButtonText: {
    color: "#fff",
    fontFamily: "outfit-medium",
    fontSize: 16,
  },
  clearButton: {
    backgroundColor: Colors.PRIMARY_DARK,
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 15,
  },
  clearButtonText: {
    color: "#fff",
    fontFamily: "outfit-medium",
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.BACKGROUND,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: "outfit-medium",
    color: Colors.PRIMARY,
  },
});

export default PrintIcard;
