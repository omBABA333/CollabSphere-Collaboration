import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import GitHubSignInButton from '../components/GitHubSignInButton'; // Make sure this path is correct
import * as AuthSession from "expo-auth-session";
import Constants from 'expo-constants';
// import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
// import { getFirestore, doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";

// const auth = getAuth();
// const db = getFirestore();

export default function SignUpScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // const handleLogin = () => {
  //   // You would add your login logic here
  //   console.log(`Logging with Email: ${email} and Password: ${password}`);
  //   navigation.replace('MainTabs'); // Navigate to the home screen on successful login
  // };

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update the user's lastLogin timestamp in Firestore
      await updateDoc(doc(db, "users", user.uid), {
        lastLogin: new Date(),
      });
      
      console.log("User logged in and lastLogin updated:", user.uid);
      // In the next step, we'll check if the user is new before navigating
      navigation.replace("MainTabs"); 
    } catch (error) {
      console.error("Login failed:", error);
      alert("Login failed: " + error.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <StatusBar style="auto" />
      <View style={styles.container}>
        {/* Header Section */}
        <Text style={styles.headerTitle}>Log In</Text>
        <Text style={styles.headerSubtitle}>Log in to continue your adventure.</Text>
        
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
            secureTextEntry={true}
          />
          <TouchableOpacity onPress={() => console.log('Toggle password visibility')}>
            <Ionicons name="eye-outline" size={20} color="#666" style={styles.icon} />
          </TouchableOpacity>
          {/* <TouchableOpacity onPress={() => console.log('Toggle password visibility')}>
                      <Ionicons
                        name={password ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color="#666"
                        style={styles.icon}
                      />
                    </TouchableOpacity> */}
        </View>

        {/* Login Button */}
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.buttonText}>Log In</Text>
        </TouchableOpacity>
        
        {/* Social Login Section */}
        <Text style={styles.socialText}>Or log in with</Text>
        <View style={styles.socialButtonsContainer}>
          {/* GitHub Sign In Button */}
          <GitHubSignInButton style={styles.socialButton} />
        </View>

        {/* Sign Up Link */}
        <View style={styles.signUpLinkContainer}>
          <Text style={styles.signUpText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.signUpLink}>Sign up</Text>
          </TouchableOpacity>
        </View>

      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    backgroundColor: '#fdfdfd',
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 50,
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
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
  loginButton: {
    backgroundColor: '#F4B942',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  socialText: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 20,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  signUpLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginTop: 20,
  },
  signUpText: {
    color: '#666',
    fontSize: 16,
  },
  signUpLink: {
    color: '#D46130',
    fontWeight: 'bold',
    fontSize: 16,
  },
});



// GitHub OAuth endpoints
// const discovery = {
//   authorizationEndpoint: "https://github.com/login/oauth/authorize",
//   tokenEndpoint: "https://github.com/login/oauth/access_token",
// };

// export default function LoginScreen({ navigation }) {
//   const [authCode, setAuthCode] = useState(null);

//   // Build redirect URI (Expo Go dev uses proxy)r
//   const redirectUri = AuthSession.makeRedirectUri({
//       useProxy: __DEV__, // ✅ use proxy in Expo Go
//     });
  //   const proxyRedirectUri = AuthSession.makeRedirectUri({ useProxy: true});
  //   //const proxyRedirectUri = `https://auth.expo.io/@omaher/collabsphere`;
  // const schemeRedirectUri = AuthSession.makeRedirectUri({ useProxy: false});
//const redirectUri = "https://auth.expo.dev/@omaher/CollabSphere";


  // // Configure Auth Request
  // const [request, response, promptAsync] = AuthSession.useAuthRequest(
  //   {
  //     clientId: "Ov23liFoDCKHVXR2rI8D", // 🔹 your GitHub OAuth App Client ID
  //     scopes: ["read:user", "repo"],
  //     //redirectUri,
  //     //proxyRedirectUri,
  //      redirectUri,
  //   },
  //   discovery
  // );

  // Log the redirect URI so you can copy it to GitHub settings
//   useEffect(() => {
//     console.log("Redirect URI being used:", redirectUri);
//    // console.log("🔹 Expo Proxy Redirect URI (Dev):", proxyRedirectUri);
//     //console.log("🔹 Custom Scheme Redirect URI (Prod):", schemeRedirectUri);
//   }, []);

//   // Handle OAuth response
//   useEffect(() => {
//     if (response?.type === "success" && response.params.code) {
//       const code = response.params.code;
//       console.log("✅ GitHub OAuth Code:", code);
//       setAuthCode(code);

//       // 👉 NEXT STEP:
//       // Send `code` to backend (Firebase Function) to exchange for an access_token
//       // Then sign in with Firebase: signInWithCredential(auth, GithubAuthProvider.credential(token))
//     }
//   }, [response]);

//   return (
//     <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//       <Button
//         title="Login with GitHub"
//         disabled={!request}
//         onPress={() => promptAsync()}
//       />

//       {authCode && (
//           <>
//           <Text style={{ marginTop: 20, textAlign: "center" }}>
//             Logged in with GitHub ✅{"\n"}
//             Code: {authCode}
//           </Text>

//           {/* Temporary navigation until backend is ready */}
//           <Button
//             title="Continue to App"
//             onPress={() => navigation.replace("MainTabs")}
//           />
//         </>
//       )}
//     </View>
//   );
// }

//  <Text style={{ marginTop: 20, textAlign: "center" }}>
          //Logged in with GitHub ✅{"\n"}
          //Code: {authCode}
        //</Text>
