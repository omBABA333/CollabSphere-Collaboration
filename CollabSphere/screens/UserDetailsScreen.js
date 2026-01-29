import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Button,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView
} from "react-native";
import { Picker } from "@react-native-picker/picker"; // expo install @react-native-picker/picker
import { RadioButton } from "react-native-paper"; // expo install react-native-paper
import { doc, updateDoc, getDoc } from "firebase/firestore"; // Added getDoc
import { auth, db } from "../services/firebase";

export default function UserDetailsScreen({ navigation }) {
  //const [username, setUsername] = useState("");
  const [loadedName, setLoadedName] = useState("");
  const [school, setSchool] = useState("");
  const [course, setCourse] = useState("");
  const [stream, setStream] = useState("");
  const [year, setYear] = useState("");
  const [bio, setBio] = useState("");
  const [customTagInput, setCustomTagInput] = useState(""); 
  const [displayedTags, setDisplayedTags] = useState([]);
  const [proficiency, setProficiency] = useState("");
  const [socialLinks, setSocialLinks] = useState("");

  useEffect(() => {
    const fetchUserName = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          setLoadedName(docSnap.data().name);
        }
      }
    };
    fetchUserName();
  }, []);

  const handleAddTags = () => {
    if (customTagInput.trim()) {
      // Split the input string by commas, trim whitespace, and filter out any empty strings
      const newTags = customTagInput.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
      setDisplayedTags([...displayedTags, ...newTags]); // Add new tags to the existing array
      setCustomTagInput(""); // Clear the input field
    }
  };
   const handleRemoveTag = (tagToRemove) => {
    // Filter out the tag to be removed
    const updatedTags = displayedTags.filter(tag => tag !== tagToRemove);
    setDisplayedTags(updatedTags);
  };



  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("Error: No user is logged in.");
      return;
    }
    if (!school || !course || !stream || !year) {
      alert("Please fill all required fields (School, Course, Stream, Year).");
      return;
    }

    try {
      const linksArray = socialLinks.split(',') 
                                    .map(link => link.trim()) 
                                    .filter(link => link.length > 0); 
      const profileData = {
        school: school,
        course: course,
        stream: stream,
        year: year,
        bio: bio,
        customTags: displayedTags,
        proficiency: proficiency,
        socialLinks: linksArray,
        isNewUser: false,
      };

      await updateDoc(doc(db, "users", user.uid), profileData);
      
      console.log("User details saved successfully!");
      alert("Profile saved successfully!");
      navigation.replace('MainTabs');

    } catch (error) {
      console.error("Failed to save user details:", error);
      alert("Error saving details. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoiding}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.container}>
            <Text style={styles.header}>Complete Your Profile</Text>
            <Text style={styles.subHeader}>Tell us more about yourself to connect with the right people.</Text>

            {/* Username */}
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={loadedName}
              editable={false} 
            />

            {/* School */}
            <Text style={styles.label}>School / College</Text>
            <Picker selectedValue={school} onValueChange={setSchool} style={styles.picker}>
              <Picker.Item label="Select School/College" value="" />
              <Picker.Item label="MPSTME" value="mpstme" />
              <Picker.Item label="SBMP" value="sbmp" />
              <Picker.Item label="DJSCE" value="djsce" />
            </Picker>

            {/* Course */}
            <Text style={styles.label}>Course</Text>
            <Picker selectedValue={course} onValueChange={setCourse} style={styles.picker}>
              <Picker.Item label="Select Course" value="" />
              <Picker.Item label="M.Tech" value="mtech" />
              <Picker.Item label="B.Tech" value="btech" />
              <Picker.Item label="MBA.Tech" value="mbatech" />
              <Picker.Item label="BTI" value="bti" />
              <Picker.Item label="MCA" value="mca" />
            </Picker>

            {/* Stream */}
            <Text style={styles.label}>Stream</Text>
            <Picker selectedValue={stream} onValueChange={setStream} style={styles.picker}>
              <Picker.Item label="Select Stream" value="" />
              <Picker.Item label="Computer Engineering" value="ce" />
              <Picker.Item label="Information Technology" value="it" />
              <Picker.Item label="Electronics and Telecommunication" value="extc" />
              <Picker.Item label="Mechanical Engineering" value="me" />
              <Picker.Item label="Computer Science and Engineering" value="cse" />
            </Picker>

            {/* Year */}
            <Text style={styles.label}>Year</Text>
            <Picker selectedValue={year} onValueChange={setYear} style={styles.picker}>
              <Picker.Item label="Select Year" value="" />
              <Picker.Item label="1st Year" value="1" />
              <Picker.Item label="2nd Year" value="2" />
              <Picker.Item label="3rd Year" value="3" />
              <Picker.Item label="4th Year" value="4" />
              <Picker.Item label="5th Year" value="5" />
              <Picker.Item label="6th Year" value="6" />
            </Picker>

            {/* Bio */}
            <Text style={styles.label}>About / Bio / Headline</Text>
            <TextInput
              style={[styles.input, { height: 100, textAlignVertical: "top" }]}
              multiline
              numberOfLines={5}
              value={bio}
              onChangeText={setBio}
              placeholder="Write a short bio or headline"
            />

            {/* Custom Tags Section */}
            <Text style={styles.label}>Skill Tags</Text>
            <View style={styles.tagInputContainer}>
              <TextInput
                style={[styles.input, styles.tagInput]}
                value={customTagInput}
                onChangeText={setCustomTagInput}
                placeholder="e.g., language, sports, arts"
              />
              <TouchableOpacity style={styles.tagButton} onPress={handleAddTags}>
                <Text style={styles.tagButtonText}>Add</Text>
              </TouchableOpacity>
            </View>

            {/* Displayed Tags */}
            <View style={styles.tagsContainer}>
              {displayedTags.map((tag, index) => (
                <TouchableOpacity key={index} style={styles.tag} onPress={() => handleRemoveTag(tag)}>
                  <Text style={styles.tagText}>{`#${tag}`}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Skill Proficiency */}
            <Text style={styles.label}>Skill Proficiency</Text>
            <View style={styles.radioGroup}>
              {["Beginner", "Intermediate", "Advanced"].map((level) => (
                <View key={level} style={styles.radioOption}>
                  <RadioButton
                    value={level}
                    status={proficiency === level ? "checked" : "unchecked"}
                    onPress={() => setProficiency(level)}
                  />
                  <Text>{level}</Text>
                </View>
              ))}
            </View>

            {/* Social Links */}
            <Text style={styles.label}>Social Media / Portfolio Links</Text>
            <TextInput
              style={styles.input}
              value={socialLinks}
              onChangeText={setSocialLinks}
              placeholder="Enter links (comma-separated)"
            />

            {/* Save Button */}
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save Details</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#fdfdfd',
  },
  container: {
    padding: 20,
    paddingTop: 40,
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#343a40',
    marginBottom: 6,
    marginTop:12,
    textAlign: 'left',
  },
  subHeader: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 32,
    textAlign: 'left',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#495057',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  disabledInput: {
    backgroundColor: '#e9e9e9', // Lighter background for read-only fields
    color: '#6c757d',
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
  },
  radioGroup: {
    marginBottom: 20,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  saveButton: {
    backgroundColor: '#F4B942',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
   tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  tagInput: {
    flex: 1,
    marginBottom: 0, // Override the default marginBottom
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  tagButton: {
    backgroundColor: '#D46130',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    alignItems: 'center',
  },
  tagButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
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
});