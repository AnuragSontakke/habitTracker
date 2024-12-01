import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import React from "react";
import { Colors } from "@/constants/Colors";
import * as WebBrowser from "expo-web-browser";
import { useWarmUpBrowser } from "./../hooks/useWarmUpBrowser";
import { useOAuth } from "@clerk/clerk-expo";
import * as Linking from 'expo-linking'

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
    <View>
      <View
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 100,
        }}
      >
        <Image
          source={require("../assets/images/react-logo.png")}
          style={{
            width: 250,
            height: 250,
          }}
        />
      </View>
      <View style={styles.subContainer}>
        <Text style={{ fontSize: 30, fontFamily: "outfit-bold" }}>
          Your Own <Text style={{ color: Colors.PRIMARY }}>Cummunity</Text>
        </Text>
        <Text style={{ color: Colors.GRAY }}>
          Keep your habits on track with the community
        </Text>
      </View>
      <TouchableOpacity style={styles.btn} onPress={onPress}>
        <Text
          style={{
            textAlign: "center",
            color: "#fff",
            fontFamily: "outfit",
          }}
        >
          Lets get Started
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  subContainer: {
    backgroundColor: "#fff",
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  btn: {
    backgroundColor: Colors.PRIMARY,
    padding: 10,
    borderRadius: 99,
    margin: 20,
  },
});
