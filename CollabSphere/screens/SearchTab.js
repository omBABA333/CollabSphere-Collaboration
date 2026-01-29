import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Feather, Ionicons } from "@expo/vector-icons";
import {collection, query, where, getDocs, or, addDoc, serverTimestamp, getDoc, doc } from "firebase/firestore";
import { db, auth } from "../services/firebase"; 
import UserProfileModal from './UserProfileModal';
import ProjectSelectionModal from "../components/ProjectSelectionModal";

export default function SearchTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isFiltering, setIsFiltering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null); // State for selected user
  const [isModalVisible, setIsModalVisible] = useState(false);

  const [isProjectModalVisible, setIsProjectModalVisible] = useState(false);
  const [userToInvite, setUserToInvite] = useState(null);
  const [filterOptions, setFilterOptions] = useState({
    school: "",
    course: "",
    stream: "",
    year: "",
    availabilityStatus: "",
  });

  const sendInvite = async (toUserId, projectId) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert("Error", "You must be logged in to send an invite.");
      return;
    }
    const senderDoc = await getDoc(doc(db, "users", currentUser.uid));
    const senderData = senderDoc.exists() ? senderDoc.data() : { name: "Anonymous" };
  try { 
      const invitesRef = collection(db, "invites");
      const existingInviteQuery = query(
        invitesRef,
        where("fromUserId", "==", currentUser.uid),
        where("toUserId", "==", toUserId)
      );
      const inviteSnapshot = await getDocs(existingInviteQuery);

      if (!inviteSnapshot.empty) {
        const existingInvite = inviteSnapshot.docs[0].data();
        if (existingInvite.status === "pending" || existingInvite.status === "accepted") {
          Alert.alert("Notice", "You have already sent an invitation to this user or they have accepted it.");
          return;
        }
      }
     
      await addDoc(invitesRef, {
        fromUserId: currentUser.uid,
        fromUserName: senderData.name, 
        toUserId,
        projectId,
        status: "pending",
        timestamp: serverTimestamp(),
      });
      Alert.alert("Success", "Invite sent successfully!");
  } catch (error) {
    console.error("Error sending invite:", error);
    Alert.alert("Error", "Failed to send invite. Please try again.");
  }
};



  const handleInvitePress = (userId) => {
    setUserToInvite(userId);
    setIsProjectModalVisible(true);
  };

  const handleSelectProjectAndSendInvite = (projectId, toUserId) => {
      sendInvite(toUserId, projectId);
      setIsProjectModalVisible(false); 
  };


  const handleJoinProject = async (projectId) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert("Error", "You must be logged in to send a join request.");
      return;
    }
    
    try {
        // Step 1: Get the project document to find the leader's ID
        const projectDocRef = doc(db, "projects", projectId);
        const projectDocSnap = await getDoc(projectDocRef);

        if (!projectDocSnap.exists()) {
            Alert.alert("Error", "Project not found.");
            return;
        }
        
        const projectData = projectDocSnap.data();
        const leaderId = projectData.leaderId; // This is the leader's UID

        if (!leaderId) {
            Alert.alert("Error", "This project has no leader assigned.");
            return;
        }

       
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userDoc.exists() ? userDoc.data() : { name: "Anonymous" };
    
      
        const joinRequestsRef = collection(db, "joinRequests");
        await addDoc(joinRequestsRef, {
            projectId: projectId,
            fromUserId: currentUser.uid,
            fromUserName: userData.name,
            toUserId: leaderId, 
            status: "pending",
            timestamp: serverTimestamp(),
        });
        Alert.alert("Request Sent", "Your request to join the project has been sent to the leader.");
    } catch (error) {
        console.error("Error sending join request:", error);
        Alert.alert("Error", "Failed to send join request. Please try again.");
    }
  };

  const searchProfiles = async () => {
     const currentUser = auth.currentUser;
     if (!currentUser) {
      Alert.alert("Error", "You must be logged in to search.");
      return;
    }
   
    setLoading(true);

    try {
      
      const usersRef = collection(db, "users");
      const projectsRef = collection(db, "projects");

       const [userSnapshot, projectSnapshot] = await Promise.all([
           getDocs(usersRef),
           getDocs(projectsRef)
       ]);

      let userResults = userSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        type: "user",
      }));

      let projectResults = projectSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        type: "project",
      }));

      userResults = userResults.filter((u) => u.id !== currentUser.uid);

       const lowerSearch = searchTerm.toLowerCase().trim();
      if (lowerSearch) {
        userResults = userResults.filter((u) =>
          (u.name || "").toLowerCase().includes(lowerSearch)
        );
        projectResults = projectResults.filter((p) =>
          (p.projectName || "").toLowerCase().includes(lowerSearch)
        );
      }


      const applyFilters = (item) => {
        return (
          (filterOptions.school ? item.school === filterOptions.school : true) &&
          (filterOptions.course ? item.course === filterOptions.course : true) &&
          (filterOptions.stream ? item.stream === filterOptions.stream : true) &&
          (filterOptions.year ? item.year === filterOptions.year : true) &&
          (filterOptions.availabilityStatus
            ? item.availabilityStatus === filterOptions.availabilityStatus
            : true)
        );
      };

      userResults = userResults.filter(applyFilters);
      projectResults = projectResults.filter(applyFilters);

      setSearchResults([...userResults, ...projectResults]);
    } catch (error) {
      console.error("Error searching profiles:", error);
      Alert.alert("Error", "Failed to search for profiles.");
    } finally {
      setLoading(false);
    }
  };


   const handleProfilePress = (user) => {
    setSelectedUser(user);
    setIsModalVisible(true);
  };
  const renderProfileItem = ({ item }) => {
    if (item.type === 'user') {
          return (
              <TouchableOpacity onPress={() => handleProfilePress(item)}>
                  <View style={styles.userCard}>
                      <Text style={styles.userTypeLabel}>User</Text>
                      <Ionicons name="person-circle-outline" size={50} color="#343131" />
                      <View style={styles.profileInfo}>
                          <Text style={styles.profileName}>{item.name}</Text>
                          <Text style={styles.profileDetail}>{item.school}</Text>
                          <Text style={styles.profileDetail}>{`${item.course} - ${item.stream}`}</Text>
                      </View>
                      <TouchableOpacity style={styles.inviteButton} onPress={() => handleInvitePress(item.id)}>
                          <Text style={styles.inviteButtonText}>Invite</Text>
                      </TouchableOpacity>
                  </View>
              </TouchableOpacity>
          );
      } else if (item.type === 'project') {
          return (
              <View style={styles.projectCard}>
                  <Text style={styles.projectTypeLabel}>Project</Text>
                  <Text style={styles.projectTitle}>{item.projectName}</Text>
                  <Text style={styles.projectDescription}>{item.description}</Text>
                  <View style={styles.projectDates}>
                      <Text style={styles.projectDateText}>Start: {item.startDate}</Text>
                      <Text style={styles.projectDateText}>End: {item.endDate}</Text>
                  </View>
                  <TouchableOpacity style={styles.joinButton} onPress={() => handleJoinProject(item.id)}>
                      <Text style={styles.joinButtonText}>Join</Text>
                  </TouchableOpacity>
              </View>
          );
      }
      return null;
    };

  return (
    <View style={styles.container}>
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          onSubmitEditing={searchProfiles}
        />
        <TouchableOpacity style={styles.searchButton} onPress={searchProfiles}>
          <Feather name="search" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.filterToggle} onPress={() => setIsFiltering(!isFiltering)}>
        <Text style={styles.filterToggleText}>
          {isFiltering ? "Hide Filters" : "Show Filters"}
        </Text>
        <Feather name={isFiltering ? "chevron-up" : "chevron-down"} size={20} color="#A04747" />
      </TouchableOpacity>

      {isFiltering && (
        <ScrollView style={styles.filterContainer}>
          <Text style={styles.filterTitle}>Filter Options</Text>
          <Text style={styles.filterLabel}>School</Text>
          <Picker
            selectedValue={filterOptions.school}
            onValueChange={(itemValue) => setFilterOptions({ ...filterOptions, school: itemValue })}
            style={styles.picker}
          >
            <Picker.Item label="All Schools" value="" />
            <Picker.Item label="MPSTME" value="mpstme" />
            <Picker.Item label="SBMP" value="sbmp" />
          </Picker>

          <Text style={styles.filterLabel}>Course</Text>
          <Picker
            selectedValue={filterOptions.course}
            onValueChange={(itemValue) => setFilterOptions({ ...filterOptions, course: itemValue })}
            style={styles.picker}
          >
            <Picker.Item label="All Courses" value="" />
            <Picker.Item label="B.Tech" value="btech" />
            <Picker.Item label="BTI" value="bti" />
          </Picker>

          <Text style={styles.filterLabel}>Stream</Text>
          <Picker
            selectedValue={filterOptions.stream}
            onValueChange={(itemValue) => setFilterOptions({ ...filterOptions, stream: itemValue })}
            style={styles.picker}
          >
            <Picker.Item label="All Streams" value="" />
            <Picker.Item label="Computer Science" value="cs" />
            <Picker.Item label="Information Technology" value="it" />
          </Picker>

          <Text style={styles.filterLabel}>Year</Text>
          <Picker
            selectedValue={filterOptions.year}
            onValueChange={(itemValue) => setFilterOptions({ ...filterOptions, year: itemValue })}
            style={styles.picker}
          >
            <Picker.Item label="All Years" value="" />
            <Picker.Item label="1st Year" value="1" />
            <Picker.Item label="2nd Year" value="2" />
          </Picker>
          
          <Text style={styles.filterLabel}>Availability Status</Text>
          <Picker
            selectedValue={filterOptions.availabilityStatus}
            onValueChange={(itemValue) => setFilterOptions({ ...filterOptions, availabilityStatus: itemValue })}
            style={styles.picker}
          >
            <Picker.Item label="Any Status" value="" />
            <Picker.Item label="Looking for a Group" value="looking" />
            <Picker.Item label="In a Group" value="in_group" />
          </Picker>
        </ScrollView>
      )}
      
      {loading ? (
        <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={searchResults}
          renderItem={renderProfileItem}
          keyExtractor={(item) => item.id}
          style={styles.resultsList}
        />
      )}
      {isModalVisible && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={isModalVisible}
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <UserProfileModal 
              user={selectedUser} 
              onClose={() => setIsModalVisible(false)}
            />
          </View>
        </Modal>
      )}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isProjectModalVisible}
        onRequestClose={() => setIsProjectModalVisible(false)}
      >
          <View style={styles.modalOverlay}>
              <ProjectSelectionModal
                  userToInvite={userToInvite}
                  onSelectProject={handleSelectProjectAndSendInvite} // HIGHLIGHTED CHANGE: onSelectProject prop
                  onClose={() => setIsProjectModalVisible(false)}
              />
          </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 20,
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginRight: 10,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: "#8E1616",
    borderRadius: 10,
    padding: 12,
  },
  filterToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  filterToggleText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#EB5A3C",
  },
  filterContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#343a40",
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#495057",
  },
  picker: {
    height: 50,
    backgroundColor: "#f8f9fa",
    borderColor: "#e9ecef",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
  },
  resultsList: {
    flex: 1,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 15,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#343a40",
  },
  profileDetail: {
    fontSize: 14,
    color: "#6c757d",
  },
  inviteButton: {
    backgroundColor: "#4A4947",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  inviteButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  projectCard: { // HIGHLIGHTED CHANGE: New style for projects
      backgroundColor: '#fff',
      borderRadius: 10,
      padding: 15,
      marginBottom: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
  },
  projectTypeLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6c757d',
    position: 'absolute',
    top: 5,
    left: 10,
  },
  projectTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#343a40',
      marginTop: 20,
  },
  projectDescription: {
      fontSize: 14,
      color: '#6c757d',
      marginTop: 5,
      marginBottom: 10,
  },
  projectDates: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
  },
  projectDateText: {
      fontSize: 12,
      color: '#6c757d',
  },
  joinButton: {
      backgroundColor: '#007bff',
      borderRadius: 20,
      paddingVertical: 8,
      alignSelf: 'flex-start',
      paddingHorizontal: 15,
  },
  joinButtonText: {
      color: '#fff',
      fontWeight: 'bold',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
});