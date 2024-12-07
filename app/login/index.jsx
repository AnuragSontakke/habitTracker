import { View, Text, Image, StyleSheet, TouchableOpacity, TouchableWithoutFeedback } from "react-native";
import React, { useRef, useState } from "react";
import { Colors } from "@/constants/Colors";
import * as WebBrowser from "expo-web-browser";
import { useOAuth } from "@clerk/clerk-expo";
import * as Linking from 'expo-linking'
import { useWarmUpBrowser } from "../../hooks/useWarmUpBrowser";


WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  useWarmUpBrowser();

  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' })
  const [showButtons, setShowButtons] = useState(false); 
  const lastTapRef = useRef(null); 

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

  const handleLogoDoubleTap = () => {
    const now = Date.now();
    if (lastTapRef.current && now - lastTapRef.current < 300) {
      // Double-tap detected
      setShowButtons((prev) => !prev);
    }
    lastTapRef.current = now;
  };

  

  return (
    <View style={styles.container}>
       <TouchableWithoutFeedback onPress={handleLogoDoubleTap}>
        <Image
          source={require("../../assets/images/habit.png")}
          style={styles.image}
        />
      </TouchableWithoutFeedback>
       <View style={styles.textContainer}>
        <TouchableOpacity onPress={onPress}>          
          <Text style={styles.title}>Start a Habit</Text>
        </TouchableOpacity>
      </View>
      {showButtons && (
        <View style={styles.rowContainer}>
          <TouchableOpacity onPress={onPress} style={styles.smallButton}>
            <Text style={styles.smallButtonText}>Teacher Login</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onPress} style={styles.smallButton}>
            <Text style={styles.smallButtonText}>Admin Login</Text>
          </TouchableOpacity>
        </View>
      )}
     
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
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
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
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "80%",
    marginTop: 20,
  },
  smallButton: {
    backgroundColor: Colors.GRAY,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: "center",
  },
  smallButtonText: {
    color: "#fff",
    fontFamily: "outfit-bold",
    fontSize: 16,
  },
});