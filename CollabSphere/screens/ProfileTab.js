import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Linking, Alert } from "react-native";
import { doc, getDoc, updateDoc } from "firebase/firestore";

import { linkGitHub } from "../services/githubApi";
import { auth, db } from "../services/firebase";
import { Picker } from '@react-native-picker/picker';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as AuthSession from "expo-auth-session";
import Constants from 'expo-constants';

// GitHub OAuth configuration and discovery
const discovery = {
  authorizationEndpoint: "https://github.com/login/oauth/authorize",
  tokenEndpoint: "https://github.com/login/oauth/access_token",
};

const GITHUB_CLIENT_ID = "Ov23liFoDCKHVXR2rI8D";

const BACKEND_IP_ADDRESS = "10.125.52.71";
const GITHUB_AUTH_FUNCTION_URL = `http://${BACKEND_IP_ADDRESS}:5000/api/github/exchange-github-code`;
export default function ProfileTab() {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState('');
  const [desiredProjects, setDesiredProjects] = useState('');
  const [collaborationStyle, setCollaborationStyle] = useState('');
  const [isLinkingGitHub, setIsLinkingGitHub] = useState(false);
  const [codeVerifier, setCodeVerifier] = useState(null); 

  const redirectUri = Constants.manifest2?.extra?.expoGo?.debuggerHost
    ? `exp://${Constants.manifest2.extra.expoGo.debuggerHost}`
    : AuthSession.makeRedirectUri({ useProxy: true });

useEffect(() => {
    console.log("Your Auth Redirect URI is:", redirectUri);
  }, [redirectUri]);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GITHUB_CLIENT_ID,
      scopes: ["read:user", "repo"],
      redirectUri,
    },
    discovery
  );
   useEffect(() => {
    if (request?.codeVerifier) {
      setCodeVerifier(request.codeVerifier);
    }
  }, [request]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        fetchUserData(user.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (response?.type === "success" && response.params.code) {
     
      handleGitHubResponse(response.params.code, request.codeVerifier);
    } else if (response?.type === "dismiss" || response?.type === "cancel") {
        setIsLinkingGitHub(false);
        Alert.alert("GitHub Link Cancelled", "You cancelled the GitHub linking process.");
    }else if (response?.type === "error") {
        setIsLinkingGitHub(false);
        console.error("GitHub OAuth error:", response.error);
        Alert.alert("GitHub Link Error", "An error occurred during GitHub linking.");
    }
  }, [response, request]);

  const fetchUserData = async (uid) => {
    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData(data);
   
        setAvailabilityStatus(data.availabilityStatus || 'looking');
        setDesiredProjects(data.desiredProjects || '');
        setCollaborationStyle(data.collaborationStyle || 'remote');
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubResponse = async (code) => {
    const user = auth.currentUser;
    if (!user) {
        Alert.alert("Error", "You must be logged into Firebase to link GitHub.");
        setIsLinkingGitHub(false);
        return;
    }
    try {
        //const { githubUsername } = await linkGitHub(code, redirectUri, request.codeVerifier);
        
        // const user = auth.currentUser;
        const idToken = user ? await user.getIdToken() : null;
        if (!idToken) {
          Alert.alert("Error", "You must be logged into Firebase to link GitHub.");
          return;
        }
        const response = await fetch(GITHUB_AUTH_FUNCTION_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}` // Sending the token!
          },
          body: JSON.stringify({ code: code, redirectUri: redirectUri, codeVerifier: codeVerifier }),
        });
        const data = await response.json();

        if (user && response.ok && data.githubUsername) {
            // await updateDoc(doc(db, "users", user.uid), {
            //     githubUsername: githubUsername,
            // });

            const updatedUserData = { ...userData, githubUsername: data.githubUsername };
            setUserData(updatedUserData);
            Alert.alert("Success", "GitHub account linked successfully!");
          }else {
            console.error("Backend error response:", data);
            Alert.alert("Error", data.error || "Failed to link GitHub account.");
        }
      // const response = await fetch(GITHUB_AUTH_FUNCTION_URL, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ 
      //     code: code, 
      //     redirectUri: redirectUri,
      //     codeVerifier: codeVerifier
      //   }),
      // });
      // const data = await response.json();

      // if (response.ok && data.githubUsername) {
      //   const user = auth.currentUser;
      //   if (user) {
      //     await updateDoc(doc(db, "users", user.uid), {
      //       githubUsername: data.githubUsername,
      //     });
      //     const updatedUserData = { ...userData, githubUsername: data.githubUsername };
      //     setUserData(updatedUserData);
      //     Alert.alert("Success", "GitHub account linked successfully!");
      //   }
      // } else {
      //   console.error("Backend error response:", data);
      //   Alert.alert("Error", data.error || "Failed to link GitHub account.");
      // }
    } catch (error) {
      console.error("Error linking GitHub from frontend:", error);
      Alert.alert("Error linking GitHub", error.message);
    } finally {
        //setIsLinkingGitHub(false);
        setIsLinkingGitHub(false);
    }
  };

  const handleLinkGitHub = async () => {
    setIsLinkingGitHub(true);
    if (!auth.currentUser) {
        Alert.alert("Error", "Please log in to link your GitHub account.");
        setIsLinkingGitHub(false);
        return;
    }
    await promptAsync();
  };

    const handleSaveProfile = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    try {
     
      await updateDoc(doc(db, "users", user.uid), {
        availabilityStatus: availabilityStatus,
        desiredProjects: desiredProjects,
        collaborationStyle: collaborationStyle,
      });
     
      setUserData({ ...userData, availabilityStatus, desiredProjects, collaborationStyle });
      setEditMode(false); // Exit edit mode
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  

  // const fetchUserData = async (uid) => {
  //   try {
  //     const docRef = doc(db, "users", uid);
  //     const docSnap = await getDoc(docRef);

  //     if (docSnap.exists()) {
  //       const data = docSnap.data();
  //       setUserData(data);
  //       setAvailabilityStatus(data.availabilityStatus || '');
  //       setDesiredProjects(data.desiredProjects || '');
  //       setCollaborationStyle(data.collaborationStyle || '');
  //     }
  //   } catch (error) {
  //     console.error("Error fetching user data:", error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const handleSaveProfile = async () => {
  //   const user = auth.currentUser;
  //   if (!user) return;

  //   setLoading(true);  
  //   try {
  //     await updateDoc(doc(db, "users", user.uid), {
  //       availabilityStatus: availabilityStatus,
  //       desiredProjects: desiredProjects,
  //       collaborationStyle: collaborationStyle,
  //     });
  //     setUserData({ ...userData, availabilityStatus, desiredProjects, collaborationStyle });
  //     setEditMode(false);
  //   } catch (error) {
  //     console.error("Error updating profile:", error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const openLink = (url) => {
    let fullUrl = url.trim();
    // Add http/https prefix if it's missing
    if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
        fullUrl = 'https://' + fullUrl;
    }
    Linking.openURL(fullUrl).catch(err => Alert.alert("Error", "Could not open link."));
  };
  const renderSocialLinks = () => {
    const links = userData.socialLinks;
    if (!links || links.length === 0) {
      return <Text style={styles.noLinkText}>No links provided.</Text>;
    }

    let linkArray = [];

    // This handles both old (string) and new (array) data formats
    if (typeof links === 'string') {
        linkArray = links.split(',').map(s => s.trim()).filter(Boolean);
    } else if (Array.isArray(links)) {
        linkArray = links.filter(Boolean);
    }

    if (linkArray.length === 0) {
        return <Text style={styles.noLinkText}>No links provided.</Text>;
    }

    // Render a separate clickable link for each item
    return linkArray.map((link, index) => (
        <TouchableOpacity key={index} onPress={() => openLink(link)} style={styles.linkItem}>
            <Feather name="link" size={16} color="#4059AD" style={{marginRight: 8}} />
            <Text style={styles.socialLink}>{link}</Text>
        </TouchableOpacity>
    ));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>User data not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
       
        {/* ... (Profile Card, About, GitHub sections remain the same) ... */}
        <View style={styles.profileCard}>
            <Ionicons name="person-circle-outline" size={80} color="#fff" />
            <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{userData.name}</Text>
                {userData.school && <Text style={styles.profileDetail}>{userData.school}</Text>}
                {userData.course && userData.stream && (
                    <Text style={styles.profileDetail}>{`${userData.course} - ${userData.stream}`}</Text>
                )}
                {userData.year && <Text style={styles.profileDetail}>{`Year: ${userData.year}`}</Text>}
            </View>
            <TouchableOpacity onPress={() => setEditMode(!editMode)} style={styles.editButton}>
                <Feather name={editMode ? "x" : "edit"} size={24} color="#fff" />
            </TouchableOpacity>
        </View>

       
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.detailValue}>{userData.bio || "No bio provided."}</Text>
        </View>

       
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>GitHub Profile</Text>
            {userData.githubUsername ? (
                <TouchableOpacity onPress={() => Linking.openURL(`https://github.com/${userData.githubUsername}`)}>
                    <Text style={styles.githubLink}>
                        <Feather name="github" size={18} color="#007bff" /> {userData.githubUsername}
                    </Text>
                </TouchableOpacity>
            ) : (
                <View style={styles.noGitHubContainer}>
                    <Text style={styles.noLinkText}>No GitHub profile linked.</Text>
                    <TouchableOpacity 
                        style={styles.linkButton} 
                        onPress={handleLinkGitHub}
                        disabled={isLinkingGitHub}
                    >
                         {isLinkingGitHub ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.linkButtonText}>Link GitHub</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </View>

       
        {/* --- HIGHLIGHTED CHANGE: Updated Social Links Section --- */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Social & Portfolio Links</Text>
            {renderSocialLinks()}
        </View>

       
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Collaboration Preferences</Text>
            {editMode ? (
                // ... (Edit mode UI remains the same)
                <View>
                    <Text style={styles.label}>Availability Status</Text>
                    <Picker
                        selectedValue={availabilityStatus}
                        onValueChange={(itemValue) => setAvailabilityStatus(itemValue)}
                        style={styles.picker}
                    >
                        <Picker.Item label="Looking for a Group" value="looking" />
                        <Picker.Item label="In a Group" value="in_group" />
                        <Picker.Item label="Not Available" value="not_available" />
                    </Picker>
                    <Text style={styles.label}>Desired Projects</Text>
                    <TextInput
                        style={styles.input}
                        value={desiredProjects}
                        onChangeText={setDesiredProjects}
                        placeholder="e.g., AI/ML, Mobile App Dev"
                    />
                    <Text style={styles.label}>Collaboration Style</Text>
                    <Picker
                        selectedValue={collaborationStyle}
                        onValueChange={(itemValue) => setCollaborationStyle(itemValue)}
                        style={styles.picker}
                    >
                        <Picker.Item label="Remote" value="remote" />
                        <Picker.Item label="In-person" value="in_person" />
                    </Picker>
                    <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                // ... (View mode UI remains the same)
                <View>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Availability:</Text>
                        <Text style={styles.detailValue}>{availabilityStatus || 'Not specified'}</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Desired Projects:</Text>
                        <Text style={styles.detailValue}>{desiredProjects || 'Not specified'}</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Style:</Text>
                        <Text style={styles.detailValue}>{collaborationStyle || 'Not specified'}</Text>
                    </View>
                </View>
            )}
        </View>

       
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skill Tags</Text>
          <View style={styles.tagsContainer}>
            {userData.customTags && userData.customTags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{`#${tag}`}</Text>
              </View>
            ))}
          </View>
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6c757d',
  },
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  profileCard: {
    backgroundColor: '#8E1616',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  profileInfo: {
    marginLeft: 20,
    flexShrink: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  profileDetail: {
    fontSize: 14,
    color: '#e9ecef',
    marginBottom: 3,
  },
  editButton: {
    position: 'absolute',
    right: 20,
    top: 20,
    zIndex: 1,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#343a40',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    paddingBottom: 10,
  },
  detailValue: {
    fontSize: 16,
    color: '#495057',
    flexShrink: 1,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#e9ecef',
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 10,
    marginBottom: 10,
  },
  tagText: {
    fontSize: 14,
    color: '#495057',
  },
  noLinkText: {
    color: '#6c757d',
    fontSize: 16,
  },
  githubLink: {
    color: '#4059AD',
    textDecorationLine: 'underline',
    fontSize: 16,
    marginTop: 5,
  },
  socialLink: {
    color: '#4059AD',
    textDecorationLine: 'underline',
    fontSize: 16,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10, // Add spacing between links
  },
  socialLink: {
    color: '#4059AD',
    textDecorationLine: 'underline',
    fontSize: 16,
    flexShrink: 1, // Allow text to wrap if needed
  },
  // Existing styles...
  detailItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#495057',
    marginRight: 10,
  },
  picker: {
    height: 50,
    backgroundColor: '#f8f9fa',
    borderColor: '#e9ecef',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    marginBottom: 15,
  },
  saveButton: {
    backgroundColor: '#1B1833',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  saveButtonText: {
    color: '#E1ECF7',
    fontSize: 18,
    fontWeight: 'bold',
  },
  noGitHubContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  linkButton: {
    backgroundColor: '#D46130',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  linkButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6c757d',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    marginTop: 50,
  },
});