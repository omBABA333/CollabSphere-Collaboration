import React, {useState} from "react";
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity, ScrollView, Image } from "react-native";
import { Feather, Ionicons } from '@expo/vector-icons'; // You'll need to install these
import GitHubSignInButton from '../components/GitHubSignInButton'; 
import { auth, db } from "../services/firebase";

import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

// const auth = getAuth();
// const db = getFirestore();

export default function SignUpScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);


  // const handleSignUp = () => {
  //   console.log("User details:", { name, email, password });
  //   // Later: save to Firestore after Firebase auth
  //   navigation.replace("UserDetails"); // go to dashboard
  // };

   const handleSignUp = async () => {
    try {
      // Step 1: Create user with email and password using Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Step 2: Save initial user details to Firestore
      await setDoc(doc(db, "users", user.uid), {
        email: email,
        name: name,
        isNewUser: true,
        createdAt: new Date(),
        lastLogin: new Date(),
      });
      
      console.log("User signed up and data saved to Firestore:", user.uid);
      // Navigate to the UserDetails screen to complete the profile
      navigation.replace("UserDetails"); 
    } catch (error) {
      console.error("Sign up failed:", error);
      alert("Sign up failed: " + error.message);
    }
  };

  const handleGitHubSignIn = () => {
    // Later: hook into GitHub OAuth
    console.log("GitHub OAuth (Sign Up)");
    navigation.replace("MainTabs");
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create an account</Text>
        <Text style={styles.headerSubtitle}>Set up your profile and join our community.</Text>
      </View>

      <View style={styles.formContainer}>
        {/* Name Input */}
        <Text style={styles.label}>Name</Text>
        <View style={styles.inputContainer}>
          <Feather name="user" size={20} color="#666" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#999"
          />
        </View>

        {/* Email Input */}
        <Text style={styles.label}>Email</Text>
        <View style={styles.inputContainer}>
          <Feather name="mail" size={20} color="#666" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#999"
          />
        </View>

        {/* Password Input */}
        <Text style={styles.label}>Password</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholderTextColor="#999"
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#666"
              style={styles.icon}
            />
          </TouchableOpacity>
        </View>

        {/* Sign Up Button */}
        <TouchableOpacity style={styles.button} onPress={handleSignUp}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>

        {/* Social Sign Up Section */}
        <Text style={styles.socialText}>Or Sign up with</Text>

        <View style={styles.socialButtonsContainer}>
          {/* GitHub Sign Up Button */}
          {/* <TouchableOpacity style={styles.socialButton} onPress={handleGitHubSignIn}>
            <Image source={require('../assets/giti2.webp')} style={styles.socialIcon} />
            <Text style={styles.socialButtonText}>GitHub</Text>
          </TouchableOpacity> */}
          <GitHubSignInButton />
        </View>
      </View>

      {/* Login Link */}
      <View style={styles.loginLinkContainer}>
        <Text style={styles.loginText}>Already have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.loginLink}>Log in</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    backgroundColor: '#fdfdfd',
    padding: 20,
  },
  header: {
    marginBottom: 30,
    alignSelf: 'flex-start',
    width: '100%',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  formContainer: {
    width: '100%',
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    height: 50,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#F4B942',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  socialText: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
   socialButtonsContainer: {
     flexDirection: 'row',
     justifyContent: 'center',
     marginBottom: 30,
   },
//   socialButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: '#ddd',
//     borderRadius: 10,
//     paddingHorizontal: 20,
//     paddingVertical: 10,
//   },
//   socialIcon: {
//     width: 20,
//     height: 20,
//     marginRight: 10,
//   },
//   socialButtonText: {
//     fontSize: 16,
//     color: '#333',
//     fontWeight: 'bold',
//   },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  loginText: {
    color: '#666',
  },
  loginLink: {
    color: '#D46130',
    fontWeight: 'bold',
  },
});
