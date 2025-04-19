// import React, { useState, useRef } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
// } from "react-native";
// import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
// import { PhoneAuthProvider, signInWithCredential } from "firebase/auth";
// import { app, auth } from "../../configs/FirebaseConfig"; // your existing config
// import { Colors } from "../../constants/Colors";

// const PhoneVerification = ({ onVerified }) => {
//   const [phone, setPhone] = useState("");
//   const [otp, setOtp] = useState("");
//   const [verificationId, setVerificationId] = useState(null);
//   const recaptchaVerifier = useRef(null);

//   const sendOTP = async () => {
//     const fullPhone = "+91" + phone;
//     try {
//       const phoneProvider = new PhoneAuthProvider(auth);
//       const id = await phoneProvider.verifyPhoneNumber(
//         fullPhone,
//         recaptchaVerifier.current
//       );
//       setVerificationId(id);
//     } catch (err) {
//       alert("Failed to send OTP");
//       console.error(err);
//     }
//   };

//   const verifyOTP = async () => {
//     try {
//       const credential = PhoneAuthProvider.credential(verificationId, otp);
//       await signInWithCredential(auth, credential);
//       onVerified("+91" + phone); // you can mark phone as verified
//     } catch (err) {
//       alert("Invalid OTP");
//       console.error(err);
//     }
//   };
//   return (
//     <View style={styles.container}>
//       <FirebaseRecaptchaVerifierModal
//         ref={recaptchaVerifier}
//         firebaseConfig={auth.app.options}
//       />

//       <Text style={styles.title}>Phone Verification</Text>

//       {!verificationId ? (
//         <>
//           <Text style={styles.label}>Enter your phone number</Text>
//           <View style={styles.inputContainer}>
//             <Text style={styles.prefix}>+91</Text>
//             <TextInput
//               placeholder="10-digit mobile number"
//               keyboardType="number-pad"
//               value={phone}
//               onChangeText={(text) => {
//                 const cleaned = text.replace(/\D/g, "").slice(0, 10);
//                 setPhone(cleaned);
//               }}
//               style={styles.phoneInput}
//               maxLength={10}
//             />
//           </View>

//           <TouchableOpacity style={styles.button} onPress={sendOTP}>
//             <Text style={styles.buttonText}>Send OTP</Text>
//           </TouchableOpacity>
//         </>
//       ) : (
//         <>
//           <Text style={styles.label}>Enter OTP</Text>
//           <TextInput
//             placeholder="6-digit code"
//             keyboardType="number-pad"
//             value={otp}
//             onChangeText={setOtp}
//             style={styles.input}
//             maxLength={6}
//           />
//           <TouchableOpacity style={styles.button} onPress={verifyOTP}>
//             <Text style={styles.buttonText}>Verify OTP</Text>
//           </TouchableOpacity>
//         </>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     padding: 10,
//     backgroundColor: "#fff",
//     borderRadius: 12,
//   },
//   title: {
//     fontSize: 22,
//     marginBottom: 16,
//     fontFamily: "outfit-medium",
//     color: Colors.PRIMARY_DARK,
//     textAlign: "center",
//   },
//   label: {
//     fontSize: 16,
//     marginBottom: 8,
//     fontFamily: "outfit-medium",
//     color: Colors.PRIMARY_DARK,
//   },
//   inputContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     borderWidth: 1.5,
//     borderColor: Colors.PRIMARY,
//     borderRadius: 8,
//     paddingHorizontal: 12,
//     marginBottom: 20,
//     backgroundColor: Colors.PRIMARY_LIGHT + "20",
//   },
//   prefix: {
//     fontSize: 16,
//     marginRight: 8,
//     fontFamily: "outfit-medium",
//     color: Colors.PRIMARY_DARK,
//   },
//   phoneInput: {
//     flex: 1,
//     fontSize: 16,
//     fontFamily: "outfit-medium",
//     color: "#000",
//   },
//   input: {
//     borderWidth: 1.5,
//     borderColor: Colors.PRIMARY,
//     borderRadius: 8,
//     paddingHorizontal: 12,
//     paddingVertical: 10,
//     fontSize: 16,
//     fontFamily: "outfit-medium",
//     color: "#000",
//     backgroundColor: Colors.PRIMARY_LIGHT + "20",
//     marginBottom: 20,
//   },
//   button: {
//     backgroundColor: Colors.PRIMARY,
//     paddingVertical: 12,
//     borderRadius: 8,
//     alignItems: "center",
//     marginTop: 10,
//   },
//   buttonText: {
//     color: "#fff",
//     fontFamily: "outfit-medium",
//     fontSize: 16,
//   },
// });

// export default PhoneVerification;



import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Colors } from "../../constants/Colors";

const PhoneVerification = ({ onVerified }) => {
  const [phone, setPhone] = useState("");

  const isValidIndianNumber = (number) => {
    const regex = /^[6-9]\d{9}$/;
    return regex.test(number);
  };

  const handleVerify = () => {
    if (!isValidIndianNumber(phone)) {
      alert("Please enter a valid 10-digit Indian mobile number starting with 6-9.");
      return;
    }

    // Simulate success without OTP
    onVerified("+91" + phone);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Phone Verification</Text>

      <Text style={styles.label}>Enter your phone number</Text>
      <View style={styles.inputContainer}>
        <Text style={styles.prefix}>+91</Text>
        <TextInput
          placeholder="10-digit mobile number"
          keyboardType="number-pad"
          value={phone}
          onChangeText={(text) => {
            const cleaned = text.replace(/\D/g, "").slice(0, 10);
            setPhone(cleaned);
          }}
          style={styles.phoneInput}
          maxLength={10}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleVerify}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>

      {/* OTP CODE COMMENTED BELOW */}

      {/*
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={auth.app.options}
      />

      const sendOTP = async () => {
        const fullPhone = "+91" + phone;
        try {
          const phoneProvider = new PhoneAuthProvider(auth);
          const id = await phoneProvider.verifyPhoneNumber(
            fullPhone,
            recaptchaVerifier.current
          );
          setVerificationId(id);
        } catch (err) {
          alert("Failed to send OTP");
          console.error(err);
        }
      };

      const verifyOTP = async () => {
        try {
          const credential = PhoneAuthProvider.credential(verificationId, otp);
          await signInWithCredential(auth, credential);
          onVerified("+91" + phone);
        } catch (err) {
          alert("Invalid OTP");
          console.error(err);
        }
      };
      */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  title: {
    fontSize: 22,
    marginBottom: 16,
    fontFamily: "outfit-medium",
    color: Colors.PRIMARY_DARK,
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontFamily: "outfit-medium",
    color: Colors.PRIMARY_DARK,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.PRIMARY,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 20,
    backgroundColor: Colors.PRIMARY_LIGHT + "20",
  },
  prefix: {
    fontSize: 16,
    marginRight: 8,
    fontFamily: "outfit-medium",
    color: Colors.PRIMARY_DARK,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: "outfit-medium",
    color: "#000",
  },
  button: {
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontFamily: "outfit-medium",
    fontSize: 16,
  },
});

export default PhoneVerification;
