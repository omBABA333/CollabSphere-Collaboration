import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "../services/firebase";

// Helper function to get status colors
const getStatusColor = (status) => {
  switch (status) {
    case "In Progress":
      return "#FFD700"; // Yellow
    case "On Hold":
      return "#FF8C00"; // Orange
    case "Completed":
      return "#32CD32"; // Green
    default:
      return "#6c757d";
  }
};

export default function ProjectStatusDropdown({ projectId, initialStatus }) {
  const [status, setStatus] = useState(initialStatus);
  const [isEditing, setIsEditing] = useState(false);

  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus);
    setIsEditing(false); // Close the dropdown after selection
    try {
      await updateDoc(doc(db, "projects", projectId), {
        status: newStatus,
      });
    } catch (error) {
      console.error("Error updating project status:", error);
    }
  };

  if (isEditing) {
    return (
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={status}
          onValueChange={handleStatusChange}
          style={styles.picker}
        >
          <Picker.Item label="In Progress" value="In Progress" />
          <Picker.Item label="On Hold" value="On Hold" />
          <Picker.Item label="Completed" value="Completed" />
        </Picker>
      </View>
    );
  }

  return (
    <TouchableOpacity onPress={() => setIsEditing(true)}>
      <Text style={[styles.projectStatus, { color: getStatusColor(status) }]}>
        {status}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  projectStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  pickerContainer: {
    width: 120, // Adjust width as needed
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  picker: {
    height: 30,
    width: '100%',
  },
});