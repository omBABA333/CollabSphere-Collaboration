import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Image } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';

// This is a placeholder icon for a student's profile image
const PROFILE_PLACEHOLDER = require('../assets/profile-placeholder.jpg');

export default function UserProfileModal({ user, onClose }) {
  if (!user) {
    return null; // Don't render if no user data is passed
  }

  return (
    <View style={styles.modalContainer}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>{user.name}'s Profile</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#343a40" />
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card Section */}
        <View style={styles.profileCard}>
          <Image source={PROFILE_PLACEHOLDER} style={styles.profileImage} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user.name}</Text>
            <Text style={styles.profileDetail}>{user.school}</Text>
            <Text style={styles.profileDetail}>{`${user.course} - ${user.stream}`}</Text>
            {user.year && <Text style={styles.profileDetail}>{`Year: ${user.year}`}</Text>}
          </View>
        </View>

        {/* Bio/About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.detailValue}>{user.bio || "No bio provided."}</Text>
        </View>

        {/* Tags Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills & Interests</Text>
          <View style={styles.tagsContainer}>
            {user.customTags && user.customTags.length > 0 ? (
              user.customTags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{`#${tag}`}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>No tags added.</Text>
            )}
          </View>
        </View>

        {/* GitHub & Social Links Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact & Links</Text>
          {user.email && (
            <View style={styles.linkItem}>
              <Feather name="mail" size={18} color="#6c757d" />
              <Text style={styles.linkText}>{user.email}</Text>
            </View>
          )}
          {user.githubUsername ? (
            <TouchableOpacity onPress={() => Linking.openURL(`https://github.com/${user.githubUsername}`)} style={styles.linkItem}>
              <Feather name="github" size={18} color="#007bff" />
              <Text style={styles.linkText}>{user.githubUsername}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.linkItem}>
              <Feather name="github" size={18} color="#6c757d" />
              <Text style={styles.linkText}>No GitHub profile linked.</Text>
            </View>
          )}
          {user.socialLinks ? (
            <TouchableOpacity onPress={() => Linking.openURL(user.socialLinks)} style={styles.linkItem}>
              <Feather name="link" size={18} color="#007bff" />
              <Text style={styles.linkText}>{user.socialLinks}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.linkItem}>
              <Feather name="link" size={18} color="#6c757d" />
              <Text style={styles.linkText}>No social links.</Text>
            </View>
          )}
        </View>
        
        {/* Collaboration Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Collaboration Preferences</Text>
          <Text style={styles.preferenceText}>
            <Text style={styles.preferenceLabel}>Status:</Text> {user.availabilityStatus || 'Not specified'}
          </Text>
          <Text style={styles.preferenceText}>
            <Text style={styles.preferenceLabel}>Project Type:</Text> {user.desiredProjects || 'Not specified'}
          </Text>
          <Text style={styles.preferenceText}>
            <Text style={styles.preferenceLabel}>Style:</Text> {user.collaborationStyle || 'Not specified'}
          </Text>
        </View>
      </ScrollView>

      {/* <View style={styles.footer}>
        <TouchableOpacity style={styles.inviteButton}>
            <Text style={styles.inviteButtonText}>Send Invitation</Text>
        </TouchableOpacity>
      </View> */}
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '90%', // Occupy most of the screen
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  modalHeader: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#343a40',
  },
  closeButton: {
    position: 'absolute',
    right: 5,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8E1616',
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileInfo: {
    marginLeft: 20,
    flexShrink: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileDetail: {
    fontSize: 14,
    color: '#e9ecef',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#343a40',
    marginBottom: 10,
  },
  detailValue: {
    fontSize: 16,
    color: '#495057',
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
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  linkText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#007bff',
  },
  noDataText: {
    fontStyle: 'italic',
    color: '#6c757d',
  },
  preferenceText: {
    fontSize: 16,
    color: '#495057',
    marginBottom: 5,
  },
  preferenceLabel: {
    fontWeight: 'bold',
  },
  footer: {
    paddingTop: 10,
    paddingBottom: 30,
  },
  inviteButton: {
    backgroundColor: '#4A4947',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
  },
  inviteButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});