import React, { useState } from 'react';
import { 
    View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, 
    Alert, ActivityIndicator, Platform 
} from 'react-native';
// Import the date picker component
import DateTimePicker from '@react-native-community/datetimepicker'; 
import { getFirestore, collection, addDoc, serverTimestamp,doc, updateDoc, getDoc, deleteDoc, } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { createGitHubRepo } from "../services/githubApi"; 

const db = getFirestore();
const auth = getAuth();

export default function CreateProjectScreen() {
    const navigation = useNavigation();
    const [projectName, setProjectName] = useState('');
    const [description, setDescription] = useState('');
    
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [startDateObj, setStartDateObj] = useState(new Date());
    const [endDateObj, setEndDateObj] = useState(new Date());
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    
    const [isCreatingRepo, setIsCreatingRepo] = useState(false);

    const sanitizeRepoName = (name) => {
        return name.trim().toLowerCase()
                   .replace(/[\s_]+/g, '-')
                   .replace(/[^a-z0-9-]/g, '');
    };

    // --- HIGHLIGHTED FIX: New Platform-Agnostic Date Handlers ---
    const onChangeStartDate = (event, selectedDate) => {
        // 1. Always hide the picker after selection/cancellation
        setShowStartDatePicker(false); 

        // 2. Only update the date if a valid date was selected
        // This handles "OK" on Android (which passes selectedDate)
        // and any change on iOS (which passes selectedDate)
        // It ignores "Cancel" on Android (which passes undefined)
        if (selectedDate) {
            setStartDateObj(selectedDate);
            setStartDate(selectedDate.toISOString().split('T')[0]);
        }
    };

    const onChangeEndDate = (event, selectedDate) => {
        // 1. Always hide the picker
        setShowEndDatePicker(false); 

        // 2. Only update if a date was selected
        if (selectedDate) {
            setEndDateObj(selectedDate);
            setEndDate(selectedDate.toISOString().split('T')[0]);
        }
    };
    // --- End of Fix ---

    const handleCreateProject = async () => {
        const user = auth.currentUser;
        if (!user || !projectName.trim() || !description.trim()) {
            Alert.alert('Error', 'Project name and description are required.');
            return;
        }
        if (!startDate || !endDate) {
            Alert.alert('Error', 'Start date and end date are required.');
            return;
        }

        setIsCreatingRepo(true);
        let projectDocRef = null;
        let finalStatus = 'In Progress';
        
        try {
            projectDocRef = await addDoc(collection(db, 'projects'), {
                projectName: projectName,
                description: description,
                startDate: startDate, // Save the formatted string
                endDate: endDate,     // Save the formatted string
                leaderId: user.uid,
                members: [user.uid],
                createdAt: serverTimestamp(),
                status: 'Setting Up',
            });
            const projectId = projectDocRef.id;
            const repoName = sanitizeRepoName(projectName);

            const userDocSnap = await getDoc(doc(db, 'users', user.uid));
            const githubAccessToken = userDocSnap.data()?.githubAccessToken;
            
             if (githubAccessToken) {
                const repoData = await createGitHubRepo(projectId, repoName, description);
                if (!repoData || !repoData.githubRepositoryUrl) {
                    throw new Error("GitHub creation failed: No repository URL returned.");
                }
                
                await updateDoc(projectDocRef, {
                    githubRepositoryUrl: repoData.githubRepositoryUrl,
                    status: finalStatus,
                });
                
                Alert.alert('Success', 'Project and GitHub repository created!');
            }else {
                finalStatus = 'In Progress';
                await updateDoc(projectDocRef, { status: finalStatus });
                Alert.alert('Warning', 'Project created, but GitHub not linked. Link your account to enable repo creation.');
            }

            navigation.goBack(); 

        } catch (error) {
            console.error('Error creating project:', error);
            if (projectDocRef) {
                 await deleteDoc(projectDocRef);
            }
            Alert.alert('Error', 'Failed to create project. ' + (error.message || 'Check network.'));
             navigation.goBack();
        } finally{
            setIsCreatingRepo(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.headerTitle}>Create a New Project</Text>
            <Text style={styles.label}>Project Name</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter project name"
                value={projectName}
                onChangeText={setProjectName}
            />

            <Text style={styles.label}>Description / Goals</Text>
            <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your project's goals and key features"
                multiline
                value={description}
                onChangeText={setDescription}
            />

            <Text style={styles.label}>Start Date</Text>
            <TouchableOpacity onPress={() => setShowStartDatePicker(true)} style={styles.dateInput}>
                <Text style={startDate ? styles.datePickerText : styles.datePickerPlaceholder}>
                    {startDate || "Select start date"}
                </Text>
            </TouchableOpacity>
            
            {showStartDatePicker && (
                <DateTimePicker
                    testID="startDatePicker"
                    value={startDateObj}
                    mode={'date'}
                    is24Hour={true}
                    display="default"
                    onChange={onChangeStartDate} // Correct handler
                />
            )}

            <Text style={styles.label}>End Date</Text>
            <TouchableOpacity onPress={() => setShowEndDatePicker(true)} style={styles.dateInput}>
                 <Text style={endDate ? styles.datePickerText : styles.datePickerPlaceholder}>
                    {endDate || "Select end date"}
                 </Text>
            </TouchableOpacity>

            {showEndDatePicker && (
                <DateTimePicker
                    testID="endDatePicker"
                    value={endDateObj}
                    mode={'date'}
                    is24Hour={true}
                    display="default"
                    onChange={onChangeEndDate} // Correct handler
                />
            )}

             <TouchableOpacity style={styles.button} onPress={handleCreateProject} disabled={isCreatingRepo}>
                {isCreatingRepo ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Create Project</Text>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 20,
        backgroundColor: '#f8f9fa',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#343a40',
        textAlign: 'center',
        paddingTop: 32,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 15,
        marginBottom: 5,
        color: '#495057',
    },
    input: {
        borderWidth: 1,
        borderColor: '#e9ecef',
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    dateInput: {
        borderWidth: 1,
        borderColor: '#e9ecef',
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 15,
        backgroundColor: '#fff',
        marginBottom: 20, 
    },
    datePickerText: {
        fontSize: 16,
        color: '#333', 
    },
    datePickerPlaceholder: {
        fontSize: 16,
        color: '#999',
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
    },
    button: {
        backgroundColor: '#D46130',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 30,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});