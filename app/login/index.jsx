import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import React from "react";
import { Colors } from "@/constants/Colors";
import * as WebBrowser from "expo-web-browser";
import { useOAuth } from "@clerk/clerk-expo";
import * as Linking from 'expo-linking'
import { useWarmUpBrowser } from "../../hooks/useWarmUpBrowser";


WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  useWarmUpBrowser();

  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' })

  const onPress = React.useCallback(async () => {
    try {
      const { createdSessionId, signIn, signUp, setActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL('/dashboard', { scheme: 'myapp' }),
      })

      if (createdSessionId) {
        setActive({ session: createdSessionId })
      } else {
        // Use signIn or signUp for next steps such as MFA
      }
    } catch (err) {
      console.error('OAuth error', err)
    }
  }, [])

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/habit.png")}
        style={styles.image}
      />
      <View style={styles.textContainer}>
        <TouchableOpacity onPress={onPress}>          
          <Text style={styles.title}>Start a Habit</Text>
        </TouchableOpacity>
      </View>
      {/* <Link
        href="https://www.flaticon.com/free-stickers/planner"
        style={styles.link}
        title="planner stickers"
      >
        Flaticon
      </Link> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff", // Set your background color
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  image: {
    width: "80%",
    height: 250,
  },
  textContainer: {
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontFamily: "outfit-bold",
    fontSize: 25,
    color: "#fff",
    borderRadius: 30,
    padding: 10,
    backgroundColor: Colors.PRIMARY,
  },
  link: {
    position: "absolute",
    bottom: 20,
    right: 20,
    color: "grey",
    fontSize: 10,
  },
});
