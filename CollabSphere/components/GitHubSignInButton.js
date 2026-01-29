// AddmeApp/components/GitHubSignInButton.js

import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert } from "react-native";
import * as AuthSession from "expo-auth-session";
import { useNavigation } from "@react-navigation/native";
import Constants from 'expo-constants';
import { StatusBar } from 'expo-status-bar';

// HIGHLIGHTED CHANGE: Import Firebase modules
import { auth, db } from "../services/firebase";
import { GithubAuthProvider, signInWithCredential } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

// GitHub OAuth endpoints
const discovery = {
  authorizationEndpoint: "https://github.com/login/oauth/authorize",
  tokenEndpoint: "https://github.com/login/oauth/access_token",
};

const githubLogo = require('../assets/giti2.webp'); 

// HIGHLIGHTED CHANGE: Add your backend URL (using the IP from your githubApi.js)
const BACKEND_IP_ADDRESS = "10.125.52.71"; //
const GET_TOKEN_URL = `http://${BACKEND_IP_ADDRESS}:5000/api/github/get-access-token`;

const SocialButton = ({ title, logoSource, onPress, disabled }) => {
  return (
    <TouchableOpacity
      style={styles.socialButton}
      onPress={onPress}
      disabled={disabled}
    >
      <Image source={logoSource} style={styles.socialLogo} />
      <Text style={styles.socialButtonText}>{title}</Text>
    </TouchableOpacity>
  );
};

const GitHubSignInButton = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false); // HIGHLIGHTED CHANGE: Add loading state

  const redirectUri = Constants.manifest2?.extra?.expoGo?.debuggerHost
    ? `exp://${Constants.manifest2.extra.expoGo.debuggerHost}`
    : AuthSession.makeRedirectUri({ useProxy: true });
  useEffect(() => {
    console.log("GitHub Sign-In/Registration Redirect URI is:", redirectUri);
  }, [redirectUri]);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: "Ov23liFoDCKHVXR2rI8D",
      scopes: ["read:user", "repo"],
      redirectUri,
    },
    discovery
  );

  // Handle OAuth response
  useEffect(() => {
    if (response?.type === "success" && response.params.code) {
      const code = response.params.code;
      console.log("✅ GitHub OAuth Code:", code);
      // HIGHLIGHTED CHANGE: Call new sign-in function and pass codeVerifier
      handleGitHubSignIn(code, request?.codeVerifier); 
    } else if (response?.type === "dismiss" || response?.type === "cancel" || response?.type === "error") {
      setIsLoading(false);
    }
  }, [response, request]); // HIGHLIGHTED CHANGE: Added request dependency

  // HIGHLIGHTED CHANGE: New function to handle the entire sign-in flow
  const handleGitHubSignIn = async (code, codeVerifier) => {
    setIsLoading(true);
    try {
      // Step 1: Call your NEW unsecured backend route to get an access token
      const tokenResponse = await fetch(GET_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code,
          redirectUri: redirectUri,
          codeVerifier: codeVerifier
        }),
      });

      const tokenData = await tokenResponse.json();
      if (!tokenResponse.ok || !tokenData.accessToken) {
        throw new Error(tokenData.error || "Failed to get access token from backend.");
      }
      
      const { accessToken } = tokenData;

      // Step 2: Create a Firebase credential with the access token
      const credential = GithubAuthProvider.credential(accessToken);

      // Step 3: Sign in to Firebase with the credential
      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;
      
      if (!userCredential.providerData || !userCredential.providerData[0]) {
        throw new Error("Failed to get GitHub profile data from Firebase. The token from GitHub might be invalid or missing scopes.");
      }

      // Step 4: Get GitHub username from Firebase (it's in the profile data)
      const githubUsername = userCredential.providerData[0].displayName || user.email;

      // Step 5: Save/Update user data in Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        // New user
        await setDoc(userDocRef, {
          email: user.email,
          name: user.displayName || 'GitHub User',
          githubUsername: githubUsername,
          githubAccessToken: accessToken, // Save the token
          isNewUser: true,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        });
        navigation.replace("UserDetails"); // Navigate to complete profile
      } else {
        // Returning user
        await setDoc(userDocRef, {
          githubUsername: githubUsername,
          githubAccessToken: accessToken, // Update the token
          lastLogin: serverTimestamp(),
          isNewUser: false, // Ensure this is set to false
        }, { merge: true });
        navigation.replace("MainTabs"); // Navigate to home
      }

    } catch (error) {
      console.error("GitHub Sign-In Error:", error);
      Alert.alert("Sign-In Failed", error.message);
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      {isLoading ? (
        <ActivityIndicator size="large" color="#333" />
      ) : (
        <SocialButton
          title="Sign in with GitHub"
          logoSource={githubLogo}
          onPress={() => {
            setIsLoading(true); // Start loading when pressed
            promptAsync();
          }}
          disabled={!request || isLoading}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  // SocialButton styles
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  socialLogo: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default GitHubSignInButton;