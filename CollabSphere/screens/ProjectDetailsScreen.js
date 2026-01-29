// screens/ProjectDetailsScreen.js
import React, { useEffect, useState ,useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, ScrollView, TouchableOpacity, TextInput, Linking,FlatList,Modal,Platform,SafeAreaView,Dimensions   } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';

import { getFirestore, doc, getDoc, updateDoc, arrayRemove, collection, query, where, onSnapshot,arrayUnion, addDoc,serverTimestamp,} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Ionicons, Feather, MaterialCommunityIcons  } from '@expo/vector-icons';
import { addCollaboratorToRepo } from "../services/githubApi";
import { BarChart } from "react-native-chart-kit";

const db = getFirestore();
const auth = getAuth();

const TaskModal = ({ isVisible, onClose, projectId, members, selectedTask = null, onSave }) => {
    const [taskName, setTaskName] = useState(selectedTask?.taskName || '');
    const [description, setDescription] = useState(selectedTask?.description || '');
    const [dueDate, setDueDate] = useState(selectedTask?.dueDate || '');
    const [priority, setPriority] = useState(selectedTask?.priority || 'Medium'); 
    const [assignedToIds, setAssignedToIds] = useState(selectedTask?.assignedToIds || []);
    


    useEffect(() => {
    setTaskName(selectedTask?.taskName || '');
    setDescription(selectedTask?.description || '');
    setDueDate(selectedTask?.dueDate || '');
    setPriority(selectedTask?.priority || 'Medium');
    setAssignedToIds(selectedTask?.assignedToIds || []);
    }, [selectedTask, isVisible]);

    const toggleAssignee = (memberId) => {  
    setAssignedToIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };
 

    const handleSaveTask = async () => {
        if (!taskName || !dueDate) {
            Alert.alert('Error', 'Task name and due date are required.');
            return;
        }
        const taskData = {
            projectId,
            taskName,
            description,
            dueDate,
            priority,
            status: selectedTask ? selectedTask.status : 'Not Started',
            assignedToIds,
            createdBy: auth.currentUser.uid ? auth.currentUser.uid : null,
           
            completionReport: selectedTask?.completionReport || '',
            approved: selectedTask?.approved || false,
            createdAt: selectedTask?.createdAt || serverTimestamp(),
            updatedAt: serverTimestamp(),
        };
        onSave(taskData, selectedTask?.id);
        onClose();
    };
   
    return (
        <Modal visible={isVisible} animationType="fade" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalCardContent}> 
                    <ScrollView contentContainerStyle={styles.modalScrollContent}> 
                        <Text style={styles.modalTitle}>{selectedTask ? 'Edit Task' : 'Create New Task'}</Text>

                        <Text style={styles.modalLabel}>Task Name</Text>
                        <TextInput style={styles.modalInput} placeholder="e.g., Design homepage UI" value={taskName} onChangeText={setTaskName} />

                        <Text style={styles.modalLabel}>Description</Text>
                        <TextInput style={[styles.modalInput, styles.multilineInput]} placeholder="Briefly describe the task" value={description} onChangeText={setDescription} multiline />

                        <Text style={styles.modalLabel}>Due Date</Text>
                        <TextInput style={styles.modalInput} placeholder="YYYY-MM-DD" value={dueDate} onChangeText={setDueDate} />

                        
                        <Text style={styles.modalLabel}>Priority:</Text>
                        <View style={styles.prioritySelector}>
                            {['Low', 'Medium', 'High', 'Urgent'].map(p => (
                                <TouchableOpacity key={p} onPress={() => setPriority(p)} style={[styles.priorityButton, priority === p && styles.activePriorityButton]}>
                                    <Text style={styles.priorityButtonText}>{p}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>


                        <Text style={styles.modalLabel}>Assign To:</Text>
                        <Text style={styles.modalLabel}>Assign To:</Text>
                        <View style={styles.assigneeListContainer}>
                            {members.map((item) => (
                                <TouchableOpacity key={item.id} onPress={() => toggleAssignee(item.id)} style={styles.assigneeItem}>
                                    <Text>{item.name}</Text>
                                    {assignedToIds.includes(item.id) && <Ionicons name="checkmark" size={20} color="#007bff" />}
                                </TouchableOpacity>
                            ))}
                        </View>


                    </ScrollView>
                    <View style={styles.modalFooterButtons}> 
                        <TouchableOpacity style={[styles.modalActionBtn, styles.cancelButton]} onPress={onClose}>
                            <Text style={styles.modalButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.modalActionBtn, styles.saveButton]} onPress={handleSaveTask}>
                            <Text style={styles.modalButtonText}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};


const ReportModal = ({ visible, onClose, onSubmit }) => {
  const [reportText, setReportText] = useState('');
  const [verificationLink, setVerificationLink] = useState('');
  const [githubIssueUrl, setGithubIssueUrl] = useState('');

  useEffect(() => {
    if (!visible) setReportText('');
    setVerificationLink('');
    setGithubIssueUrl('');
  }, [visible]);



  
  return (
    <Modal visible={visible} animationType="fade" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalCardContent}> 
                    <ScrollView contentContainerStyle={styles.modalScrollContent}> 
                        <Text style={styles.modalTitle}>Completion Report</Text>
                        <Text style={styles.modalLabel}>Report Details</Text>
                        <TextInput
                            style={[styles.modalInput, styles.multilineInput, { minHeight: 120 }]}
                            placeholder="Describe what you did / attach proof (links)..."
                            multiline
                            value={reportText}
                            onChangeText={setReportText}
                        />
                        <Text style={styles.modalLabel}>Verification Link (Figma, Vercel, etc.)</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="e.g., https://figma.com/..."
                            value={verificationLink}
                            onChangeText={setVerificationLink}
                        />
                        <Text style={styles.modalLabel}>GitHub PR or Issue Link (optional)</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="e.g., https://github.com/..."
                            value={githubIssueUrl}
                            onChangeText={setGithubIssueUrl}
                        />
                    </ScrollView>
                    <View style={styles.modalFooterButtons}> 
                        <TouchableOpacity style={[styles.modalActionBtn, styles.cancelButton]} onPress={onClose}>
                            <Text style={styles.modalButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.modalActionBtn, styles.saveButton]} onPress={() => { onSubmit(reportText, verificationLink, githubIssueUrl); onClose(); }}>
                            <Text style={styles.modalButtonText}>Submit</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
  );
};


export default function ProjectDetailsScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const { projectId } = route.params;
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isLeader, setIsLeader] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editedProject, setEditedProject] = useState({});
    const [members, setMembers] = useState([]);

    const [activeTab, setActiveTab] = useState('details'); 
    const [tasks, setTasks] = useState([]); 
    const [isTaskModalVisible, setIsTaskModalVisible] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [taskFilter, setTaskFilter] = useState('All');
    // report modal state
    const [isReportModalVisible, setIsReportModalVisible] = useState(false);
    const [reportForTaskId, setReportForTaskId] = useState(null);
    const [progress, setProgress] = useState(0);

     const handleOpenLink = async (url) => {
    if (!url) return;
    let fullUrl = url.trim();

    // Check if the URL already starts with a protocol
    if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
        fullUrl = `https://${fullUrl}`;
    }
    
    try {
        const supported = await Linking.canOpenURL(fullUrl);
        if (supported) {
            await Linking.openURL(fullUrl);
        } else {
            Alert.alert("Error", `Cannot open this link. Please check the URL format.`);
        }
    } catch (error) {
        console.error("Failed to open link:", error);
        Alert.alert("Error", "An error occurred while trying to open the link.");
    }
};

    const filteredTasks = useMemo(() => {
        if (taskFilter === 'All') {
            return tasks;
        }
        const statusMap = {
            'To Do': ['Not Started'],
            'In Progress': ['In Progress', 'Blocked'],
            'In Review': ['Pending Approval'],
            'Completed': ['Done'],
        };
        return tasks.filter(task => statusMap[taskFilter]?.includes(task.status));
    }, [tasks, taskFilter]);

    const taskStats = useMemo(() => {
        const stats = { inProgress: 0, inReview: 0, onHold: 0, completed: 0 };
        tasks.forEach(task => {
            if (task.status === 'In Progress') stats.inProgress++;
            else if (task.status === 'Pending Approval') stats.inReview++;
            else if (task.status === 'Blocked') stats.onHold++;
            else if (task.status === 'Done' && task.approved) stats.completed++;
        });
        return stats;
    }, [tasks]);

    const weeklyChartData = useMemo(() => {
        const labels = [];
        const dataPoints = [];
        const today = new Date();
        const dayMap = {};

        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2);
            labels.push(dayName);
            dataPoints.push(0);
           
            const dateString = date.toISOString().split('T')[0];
            dayMap[dateString] = 6 - i;
        }

        
        tasks.forEach(task => {
            if (task.status === 'Done' && task.approved && task.updatedAt) {
                const completedDate = task.updatedAt.toDate();
                const completedDateString = completedDate.toISOString().split('T')[0];
                
                if (dayMap.hasOwnProperty(completedDateString)) {
                    const index = dayMap[completedDateString];
                    dataPoints[index]++;
                }
            }
        });

        return {
            labels,
            datasets: [{ data: dataPoints }]
        };
    }, [tasks]);

    const fetchMemberDetails = async (memberIds) => {
        const memberDetails = await Promise.all(
            memberIds.map(async (memberId) => {
                const memberDoc = await getDoc(doc(db, 'users', memberId));
                const data = memberDoc.exists() ? memberDoc.data() : {};
                return memberDoc.exists() ? { 
                    id: memberId, 
                    name: data.name,
                    githubUsername: data.githubUsername,
                } : null;
            })
        );
        return memberDetails.filter(m => m !== null);
    };

    useEffect(() => {
        const fetchProjectDetails = async () => {
            try {
                const user = auth.currentUser;
                if (!user) throw new Error('No authenticated user');
                const projectDocRef = doc(db, 'projects', projectId);
                const projectDocSnap = await getDoc(projectDocRef);

                if (projectDocSnap.exists()) {
                    const projectData = { id: projectDocSnap.id, ...projectDocSnap.data() };
                    setProject(projectData);
                    setEditedProject(projectData); // Initialize edited state
                    if (user && user.uid === projectData.leaderId) {
                        setIsLeader(true);
                    }
                    const memberIds = projectData.members || [];
                    const initialMembers = await fetchMemberDetails(memberIds);
                    setMembers(initialMembers);
                } else {
                    Alert.alert('Error', 'Project not found.');
                    navigation.goBack();
                }
            } catch (error) {
                console.error('Error fetching project details:', error);
                Alert.alert('Error', 'Failed to load project details.');
                navigation.goBack();
            } finally {
                setLoading(false);
            }
        };

        fetchProjectDetails();
    }, [projectId]);

     useEffect(() => {
        const user = auth.currentUser;
        if (!user || !projectId) return;

        const tasksRef = collection(db, 'tasks');
        const q = isLeader
            ? query(tasksRef, where('projectId', '==', projectId))// Leader sees all tasks
            : query(tasksRef, where('projectId', '==', projectId), where('assignedToIds', 'array-contains', user.uid)); // Member sees only assigned tasks

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTasks(fetchedTasks);
            const totalTasks = fetchedTasks.length;
            const doneApprovedTasks = fetchedTasks.filter(t => t.status === 'Done' && t.approved).length;
            
            // Set progress as a number between 0 and 1
           setProgress(totalTasks > 0 ? (doneApprovedTasks / totalTasks) : 0);
        }, (error) => {
            console.error('Error in tasks snapshot:', error);
            Alert.alert('Error', 'Failed to load tasks.');
        });

        return () => unsubscribe();
    }, [projectId, isLeader]);

//     const handleMarkDone = (taskId) => {
//     setReportForTaskId(taskId);
//     setIsReportModalVisible(true);
//   };

  
    const handleSaveTask = async (taskData, taskId) => {
        try {
            if (taskId) {
              ;
                await updateDoc(doc(db, 'tasks', taskId), {
                ...taskData,
                updatedAt: serverTimestamp(),   
                });
            } else {
                
                const docRef = await addDoc(collection(db, 'tasks'), {
                    ...taskData,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
              
                const assigned = taskData.assignedToIds || [];
                const senderUid = auth.currentUser ? auth.currentUser.uid : null;
                for (const toUid of assigned) {
                if (!toUid) continue;
                await addDoc(collection(db, 'notifications'), {
            type: 'taskAssigned',
            fromUserId: senderUid,
            toUserId: toUid,
            projectId,
            projectName: project?.projectName || '',
            taskId: docRef.id,
            taskName: taskData.taskName,
            status: 'pending',
            timestamp: serverTimestamp(),
          });
        }

                
            }
            Alert.alert('Success', 'Task saved.');
        } catch (error) {
            console.error('Error saving task:', error);
            Alert.alert('Error', 'Failed to save task.');
        }
    };
     
    const openReportModalForTask = (taskId) => {
        setReportForTaskId(taskId);
        setIsReportModalVisible(true);
    };

     
    const submitCompletionReport = async (reportText, verificationLink, githubIssueUrl) => {
    const taskId = reportForTaskId;
    if (!taskId) return;
    if (!reportText) {
            Alert.alert("Error", "Report details are required to submit.");
            return;
        }

    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        status: 'Pending Approval',
        completionReport: reportText,
        verificationLink: verificationLink || "", // Save the link
        githubIssueUrl: githubIssueUrl || "",
        updatedAt: serverTimestamp(),
      });

      
      const leaderId = project?.leaderId;
      if (leaderId) {
        await addDoc(collection(db, 'notifications'), {
          type: 'taskCompletedForApproval',
          fromUserId: auth.currentUser?.uid || null,
          toUserId: leaderId,
          projectId,
          taskId,
          taskName: tasks.find((t) => t.id === taskId)?.taskName || '',
          status: 'pending',
          timestamp: serverTimestamp(),
        });
      }

      Alert.alert('Success', 'Task submitted for approval.');
    } catch (error) {
      console.error('Error submitting completion report:', error);
      Alert.alert('Error', 'Failed to submit report.');
    } finally {
      setIsReportModalVisible(false);
      setReportForTaskId(null);
    }
  };

   
    const handleMarkTaskDone =  (taskId) => {
        
        openReportModalForTask(taskId);
    };

    const handleApproveTask = async (taskId) => {
        
        try {
      await updateDoc(doc(db, 'tasks', taskId), { status: 'Done', approved: true, updatedAt: serverTimestamp() });

     
      const t = tasks.find((x) => x.id === taskId);
      const assignees = t?.assignedToIds || [];
      for (const uid of assignees) {
        await addDoc(collection(db, 'notifications'), {
          type: 'taskApproved',
          fromUserId: auth.currentUser?.uid || null,
          toUserId: uid,
          projectId,
          taskId,
          taskName: t?.taskName || '',
          status: 'done',
          timestamp: serverTimestamp(),
        });
      }

      Alert.alert('Success', 'Task approved.');
    } catch (error) {
      console.error('Error approving task:', error);
      Alert.alert('Error', 'Could not approve task.');
    }
  
    };

    const handleRejectTask = async (taskId) => {
        
        Alert.prompt
      ? // iOS-only fallback (if available)
        Alert.prompt('Rejection Reason', 'Provide feedback:', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Submit',
            onPress: async (reason) => {
              if (!reason) return;
              try {
                await updateDoc(doc(db, 'tasks', taskId), {
                  status: 'Blocked',
                  approved: false,
                  completionReport: `Rejected: ${reason}\nPrevious Report: ${tasks.find((t) => t.id === taskId)?.completionReport || ''}`,
                  updatedAt: serverTimestamp(),
                });

                // notify assignees of rejection
                const t = tasks.find((x) => x.id === taskId);
                const assignees = t?.assignedToIds || [];
                for (const uid of assignees) {
                  await addDoc(collection(db, 'notifications'), {
                    type: 'taskRejected',
                    fromUserId: auth.currentUser?.uid || null,
                    toUserId: uid,
                    projectId,
                    taskId,
                    taskName: t?.taskName || '',
                    reason,
                    timestamp: serverTimestamp(),
                  });
                }

                Alert.alert('Success', 'Task rejected and feedback sent.');
              } catch (error) {
                console.error('Error rejecting task:', error);
                Alert.alert('Error', 'Could not reject task.');
              }
            },
          },
        ])
      : // Android / fallback: use simple prompt modal
        (async () => {
          const reason = await new Promise((resolve) => {
            
            Alert.alert('Rejection', 'Please provide feedback in the task edit form.');
            resolve(null);
          })();
        })();
    };
    const handleUpdateStatus = async (taskId, newStatus) => {
        try {
            await updateDoc(doc(db, 'tasks', taskId), { status: newStatus, updatedAt: serverTimestamp()  });
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleEditTask = (task) => {
        setSelectedTask(task);
        setIsTaskModalVisible(true);
    };
    
    


    const handleSave = async () => {
        try {
            await updateDoc(doc(db, 'projects', projectId), {
                projectName: editedProject.projectName || '',
                description: editedProject.description || '',
                startDate: editedProject.startDate || '',
                endDate: editedProject.endDate || '',
            });
            setProject(editedProject); // Update local state
            setEditMode(false);
            Alert.alert("Success", "Project details saved.");
        } catch (error) {
            console.error('Error saving project details:', error);
            Alert.alert('Error', 'Failed to save changes.');
        }
    };
    const handleAddMember = () => {
    Alert.alert('Add Member', 'This will open the invite/search screen (not implemented here).');
    };

  const handleRemoveMember = async (memberId) => {
    try {
      await updateDoc(doc(db, 'projects', projectId), {
        members: arrayRemove(memberId),
      });
      setMembers((m) => m.filter((x) => x.id !== memberId));

      // remove member from existing tasks that had them
      for (const t of tasks) {
        if (t.assignedToIds?.includes(memberId)) {
          await updateDoc(doc(db, 'tasks', t.id), { assignedToIds: arrayRemove(memberId), updatedAt: serverTimestamp() });
        }
      }
      Alert.alert('Success', 'Member removed from project.');
    } catch (error) {
      console.error('Error removing member:', error);
      Alert.alert('Error', 'Failed to remove member.');
    }
  };

    
    const handleAddMemberToRepo = async (memberId) => {
        const user = auth.currentUser;
        
       
        if (!user || !user.uid) { // Basic auth check
             Alert.alert("Error", "You must be logged in to manage GitHub access.");
             return;
        }

        // 2. Check if the project has a GitHub repo linked
        if (!project.githubRepo || !project.githubRepo.fullName) {
            Alert.alert("Action Required", "The project leader must first create a GitHub repository for this project.");
            return;
        }

        try {
           
            await addCollaboratorToRepo(project.id, memberId); 
            Alert.alert("Success", "Collaborator invitation sent successfully!");
        } catch (error) {
            console.error('Error adding collaborator:', error);
            Alert.alert("Error", "Failed to add collaborator. Check leader's GitHub link status.");
        }
    };


   

    const getPriorityTagColor = (priority) => {
        switch (priority) {
            case 'Urgent': return '#f44336';
            case 'High': return '#ff9800';
            case 'Medium': return '#42a5f5';
            case 'Low': return '#4caf50';
            default: return '#6c757d';
        }
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'Done': return 'green';
            case 'In Progress': return 'orange';
            case 'Blocked': return 'red';
            case 'Not Started': return 'gray';
            case 'Pending': return 'blue';
            case 'Pending Approval': return 'purple';
            default: return 'black';
        }
    };
     const getPriorityColor = (priority) => {
        switch (priority) {
            case 'Urgent': return '#f44336';
            case 'High': return '#ff9800';
            case 'Medium': return '#42a5f5';
            case 'Low': return '#4caf50';
            default: return '#6c757d';
        }
    };
    const getPriorityBackgroundColor = (priority) => {
        switch (priority) {
            case 'Urgent': return '#E0AED0'; // Light Red
            case 'High': return '#FEF9E1'; // Light Orange 
            case 'Medium': return '#e3f2fd'; // Light Blue
            case 'Low': return '#e8f5e9'; // Light Green
            default: return '#f8f9fa'; // Default light grey
        }
    };

 
    const renderTaskItem = ({ item }) => {
        const assignedMembers = item.assignedToIds.map(id => members.find(m => m.id === id)).filter(m => m !== undefined);
        const priorityColor = getPriorityTagColor(item.priority);
        const isAssignedToCurrentUser = item.assignedToIds.includes(auth.currentUser.uid);
        const cardBackgroundColor = getPriorityBackgroundColor(item.priority);

        return (
            <View style={[styles.taskCardV2, { backgroundColor: cardBackgroundColor }]}>
                {/* Header: Title and Edit Button */}
                <View style={styles.taskHeaderV2}>
                    <Text style={styles.taskTitleV2}>{item.taskName}</Text>
                    {isLeader && (
                        <TouchableOpacity onPress={() => handleEditTask(item)}>
                            <Feather name="more-horizontal" size={24} color="#6c757d" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Description */}
                {item.description ? (
                    <Text style={styles.taskDescriptionV2} numberOfLines={2}>
                        {item.description}
                    </Text>
                ) : null}

               
                {isLeader && (
                    <>
                    {item.verificationLink && (
                        <View style={styles.verificationLinkContainer}>
                        <Ionicons name="link-outline" size={16} color="#007bff" />
                        <TouchableOpacity onPress={() => handleOpenLink(item.verificationLink)}>
                        <Text style={styles.verificationLinkText} numberOfLines={1}>Verification Link</Text>
                        </TouchableOpacity>
                        </View>
)}
                    {item.githubIssueUrl && (
    <View style={styles.verificationLinkContainer}>
        <Ionicons name="logo-github" size={16} color="#333" />
        <TouchableOpacity onPress={() => handleOpenLink(item.githubIssueUrl)}>
            <Text style={styles.verificationLinkText} numberOfLines={1}>GitHub Link</Text>
        </TouchableOpacity>
    </View>
)}
                    </>
                )}
                {/* --- End of Change --- */}

                {/* Tags: Priority and Status */}
                <View style={styles.tagsContainer}>
                    <View style={[styles.taskTag, { backgroundColor: priorityColor }]}>
                        <Text style={styles.taskTagText}>{item.priority || 'Medium'}</Text>
                    </View>
                    <View style={[styles.taskTag, { backgroundColor: '#6c757d' }]}>
                        <Text style={styles.taskTagText}>{item.status}</Text>
                    </View>
                </View>

                {/* Footer: Date and Members */}
                <View style={styles.taskFooterV2}>
                    <View style={styles.taskDateContainer}>
                        <Ionicons name="calendar-outline" size={16} color="#495057" style={{ marginRight: 6 }} />
                        <Text style={styles.taskDateText}>{item.dueDate}</Text>
                    </View>
                    <View style={styles.memberIconsContainer}>
                        {assignedMembers.slice(0, 3).map((member) => (
                            <View key={member.id} style={[styles.memberIcon, { borderColor: cardBackgroundColor }]}>
                                <Text style={styles.memberIconText}>{member.name ? member.name[0] : '?'}</Text>
                            </View>
                        ))}
                        {assignedMembers.length > 3 && (
                            <View style={[styles.memberIcon, styles.plusPeople, { borderColor: cardBackgroundColor }]}>
                                <Text style={styles.memberIconText}>+{assignedMembers.length - 3}</Text>
                            </View>
                        )}
                    </View>
                </View>

                 {/* Action Buttons: Compacted and conditional */}
                {(isLeader || isAssignedToCurrentUser) && (
                    <View style={styles.taskActionsContainer}>
                        {!isLeader && ['Not Started', 'In Progress', 'Blocked'].includes(item.status) && (
                            <TouchableOpacity style={[styles.actionButton, styles.doneButton]} onPress={() => openReportModalForTask(item.id)}>
                                <Text style={styles.actionButtonText}>Submit For Approval</Text>
                            </TouchableOpacity>
                        )}
                        
                        {isLeader && item.status === 'Pending Approval' && (
                            <View style={styles.leaderActionGroup}>
                                <TouchableOpacity style={[styles.actionButton, styles.approveButton]} onPress={() => handleApproveTask(item.id)}>
                                    <Text style={styles.actionButtonText}>Approve</Text>
                                </TouchableOpacity>
                                {/* <TouchableOpacity style={[styles.actionButton, styles.rejectButton]} onPress={() => handleRejectTask(item.id)}>
                                    <Text style={styles.actionButtonText}>Reject</Text>
                                </TouchableOpacity> */}
                            </View>
                        )}
                    </View>
                )}
            </View>
        );
    };

    
    const renderTabContent = () => {
        switch (activeTab) {
            case 'details':
                return (
                    // Details tab content is wrapped in a ScrollView
                    <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
                        <View style={styles.headerContainer}>
                            <Text style={styles.headerTitle}>{project.projectName}</Text>
                            {isLeader && (
                                <TouchableOpacity onPress={() => setEditMode(!editMode)}>
                                    <Feather name={editMode ? 'x' : 'edit'} size={24} color="#343a40" />
                                </TouchableOpacity>
                            )}
                        </View>
                        {project.githubRepositoryUrl && (
                            <View style={styles.githubCard}>
                                <Text style={styles.githubText}>GitHub Repository</Text>
                                <TouchableOpacity onPress={() => Linking.openURL(project.githubRepositoryUrl)}>
                                    <Text style={styles.githubLink} numberOfLines={1}>{project.githubRepositoryUrl}</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <View style={styles.datesContainer}>
                            <View style={styles.dateCard}>
                                <Ionicons name="calendar-outline" size={24} color="#D46130" />
                                <Text style={styles.dateLabel}>Start Date</Text>
                                {editMode ? (
                                    <TextInput style={styles.dateInput} value={editedProject.startDate || ''} onChangeText={(text) => setEditedProject({ ...editedProject, startDate: text })} />
                                ) : (
                                    <Text style={styles.dateValue}>{project.startDate}</Text>
                                )}
                            </View>
                            <View style={styles.dateCard}>
                                <Ionicons name="calendar-outline" size={24} color="#D46130" />
                                <Text style={styles.dateLabel}>End Date</Text>
                                {editMode ? (
                                    <TextInput style={styles.dateInput} value={editedProject.endDate || ''} onChangeText={(text) => setEditedProject({ ...editedProject, endDate: text })} />
                                ) : (
                                    <Text style={styles.dateValue}>{project.endDate}</Text>
                                )}
                            </View>
                        </View>

                        <View style={styles.descriptionCard}>
                            <Text style={styles.label}>Description</Text>
                            {editMode ? (
                                <TextInput style={styles.descriptionInput} value={editedProject.description || ''} onChangeText={(text) => setEditedProject({ ...editedProject, description: text })} multiline />
                            ) : (
                                <Text style={styles.value}>{project.description}</Text>
                            )}
                        </View>

                        {editMode && (
                            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                );
            case 'members':
                return (
                    // Members tab content is a FlatList inside a View
                    <View style={{ flex: 1 }}> 
                        <View style={styles.membersCard}>
                            <Text style={styles.membersTitle}>Project Members</Text>
                            <FlatList
                                data={members}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => (
                                    <View style={styles.memberItem}>
                                        <Text style={styles.memberName}>{item.name} {item.id === project.leaderId ? '(Leader)' : ''}</Text>
                                        <View style={styles.memberActions}>
                                            {item.githubUsername ? (
                                                <TouchableOpacity onPress={() => handleAddMemberToRepo(item.id)} style={{ marginRight: 15 }}>
                                                    <Ionicons name="logo-github" size={20} color="#007bff" />
                                                </TouchableOpacity>
                                            ) : (
                                                item.id !== auth.currentUser.uid && <Text style={styles.linkRequiredText}>Link Required</Text>
                                            )}
                                            {isLeader && item.id !== auth.currentUser.uid && (
                                                <TouchableOpacity onPress={() => handleRemoveMember(item.id)}>
                                                    <Feather name="trash-2" size={20} color="red" />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                )}
                                contentContainerStyle={{ paddingBottom: 70 }} // Add padding for add member button
                            />
                        </View>
                                            
                    </View>
                );
            case 'tasks':
                const filterOptions = ['All', 'To Do', 'In Progress', 'In Review', 'Completed'];
                return (
                    // Tasks tab content is a FlatList inside a View
                    <View style={{ flex: 1 }}>
                        {isLeader && (
                            <TouchableOpacity style={styles.addTaskButton} onPress={() => { setSelectedTask(null); setIsTaskModalVisible(true); }}>
                                <Ionicons name="add" size={22} color="#fff" />
                                <Text style={styles.addTaskText}>Create New Task</Text>
                            </TouchableOpacity>
                        )}
                        <View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.taskFilterContainer}>
                                {filterOptions.map(option => (
                                    <TouchableOpacity 
                                        key={option} 
                                        style={[styles.filterButton, taskFilter === option && styles.activeFilterButton]} 
                                        onPress={() => setTaskFilter(option)}
                                    >
                                        <Text style={[styles.filterButtonText, taskFilter === option && styles.activeFilterButtonText]}>{option}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                        <FlatList
                            data={filteredTasks}
                            keyExtractor={item => item.id}
                            renderItem={renderTaskItem}
                            ListEmptyComponent={<Text style={styles.emptyText}>No tasks found for this filter.</Text>}
                            contentContainerStyle={{ paddingTop: 10, paddingBottom: 50 }}
                        />
                    </View>
                );
            case 'progress':
                return (
                    // Progress tab content is wrapped in a ScrollView
                    <ScrollView style={styles.progressContainer}>
                        <Text style={styles.statsHeader}>Project Summary</Text>
                        <View style={styles.summaryContainer}>
                            <View style={[styles.summaryCard, styles.inProgressCard]}>
                                <Text style={styles.summaryCardCount}>{taskStats.inProgress}</Text>
                                <Text style={styles.summaryCardLabel}>In Progress</Text>
                            </View>
                            <View style={[styles.summaryCard, styles.inReviewCard]}>
                                <Text style={styles.summaryCardCount}>{taskStats.inReview}</Text>
                                <Text style={styles.summaryCardLabel}>In Review</Text>
                            </View>
                            <View style={[styles.summaryCard, styles.onHoldCard]}>
                                <Text style={styles.summaryCardCount}>{taskStats.onHold}</Text>
                                <Text style={styles.summaryCardLabel}>On Hold</Text>
                            </View>
                            <View style={[styles.summaryCard, styles.completedCard]}>
                                <Text style={styles.summaryCardCount}>{taskStats.completed}</Text>
                                <Text style={styles.summaryCardLabel}>Completed</Text>
                            </View>
                        </View>

                        <Text style={styles.statsHeader}>Weekly Activity (Approved Tasks)</Text>
                        <View style={styles.chartContainer}>
                            <BarChart
                                data={weeklyChartData}
                                width={Dimensions.get('window').width - 44} // Adjust for padding
                                height={220}
                                yAxisLabel=""
                                yAxisSuffix=""
                                fromZero={true}
                                showValuesOnTopOfBars={true}
                                chartConfig={{
                                    backgroundColor: '#ffffff',
                                    backgroundGradientFrom: '#ffffff',
                                    backgroundGradientTo: '#ffffff',
                                    decimalPlaces: 0,
                                    color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`, // Blue color
                                    labelColor: (opacity = 1) => `rgba(108, 117, 125, ${opacity})`,
                                    style: { borderRadius: 16 },
                                    barPercentage: 0.7,
                                }}
                                style={{ marginVertical: 8, borderRadius: 16 }}
                            />
                        </View>

                        <Text style={styles.statsHeader}>Overall Progress</Text>
                        <View style={styles.overallProgressContainer}>


                            <View style={styles.progressBarBackground}>
                                <View style={[styles.progressBarFill, { width: `${Math.round(progress)}%` }]} />
                            </View>

                            <Text style={styles.progressPercentText}>{Math.round(progress)}%</Text>
                        </View>
                    </ScrollView>
                );
            default:
                return null;
        }
    };
    

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#D46130" />
            </View>
        );
    }

    if (!project) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Project details could not be loaded.</Text>
            </View>
        );
    }

    return (
        
        <SafeAreaView style={styles.container}>
            {/* Tab Selector */}
            <View style={styles.tabBar}>
                <TouchableOpacity onPress={() => setActiveTab('details')} style={[styles.tabButton, activeTab === 'details' && styles.activeTab]}>
                    <Ionicons name={activeTab === 'details' ? 'information-circle' : 'information-circle-outline'} size={24} color={activeTab === 'details' ? '#D46130' : '#6c757d'} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setActiveTab('members')} style={[styles.tabButton, activeTab === 'members' && styles.activeTab]}>
                    <Ionicons name={activeTab === 'members' ? 'people' : 'people-outline'} size={24} color={activeTab === 'members' ? '#D46130' : '#6c757d'} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setActiveTab('tasks')} style={[styles.tabButton, activeTab === 'tasks' && styles.activeTab]}>
                    <Ionicons name={activeTab === 'tasks' ? 'list' : 'list-outline'} size={24} color={activeTab === 'tasks' ? '#D46130' : '#6c757d'} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setActiveTab('progress')} style={[styles.tabButton, activeTab === 'progress' && styles.activeTab]}>
                    <Ionicons name={activeTab === 'progress' ? 'stats-chart' : 'stats-chart-outline'} size={24} color={activeTab === 'progress' ? '#D46130' : '#6c757d'} />
                </TouchableOpacity>
            </View>
            
            {/* HIGHLIGHTED FIX: This View wrapper solves the nested list error */}
            <View style={styles.contentArea}>
                {renderTabContent()}
            </View>

            {/* Modals */}
            <TaskModal
                isVisible={isTaskModalVisible}
                onClose={() => {setIsTaskModalVisible(false); setSelectedTask(null); }}
                projectId={projectId}
                members={members}
                selectedTask={selectedTask}
                onSave={handleSaveTask}
            />
            <ReportModal 
                visible={isReportModalVisible} 
                onClose={() => setIsReportModalVisible(false)} 
                onSubmit={submitCompletionReport} 
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        padding: 22,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    contentArea: {
        flex: 1,
    },
    githubCard: {
        backgroundColor: '#e0f7fa',
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
        borderLeftWidth: 5,
        borderLeftColor: '#F8CE63',
    },
    githubText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#343a40',
        marginBottom: 5,
    },
    githubLink: {
        color: '#007bff',
        textDecorationLine: 'underline',
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
        paddingTop: 32,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#343a40',
        flex: 1,
    },
    datesContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    dateCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        alignItems: 'center',
        width: '48%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
    },
    dateLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#6c757d',
        marginTop: 5,
    },
    dateValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#343a40',
        marginTop: 5,
    },
    dateInput: {
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
        textAlign: 'center',
        width: '100%',
        fontSize: 16,
        fontWeight: 'bold',
    },
    descriptionCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 18,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#495057',
        marginBottom: 5,
    },
    value: {
        fontSize: 16,
        color: '#6c757d',
        lineHeight: 22,
    },
    descriptionInput: {
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
        fontSize: 16,
        paddingTop: 5,
        minHeight: 100,
    },
    saveButton: {
        backgroundColor: '#F4B942',
        borderRadius: 10,
        paddingVertical: 15,
        alignItems: 'center',
        marginBottom: 20,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    membersCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
        flex: 1,
    },
    membersTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#343a40',
        marginBottom: 10,
    },
    addMemberButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007bff',
        borderRadius: 8,
        padding: 12, // Make it a bit larger
        marginTop: 15,
        justifyContent: 'center',
        position: 'absolute', // Stick to bottom
        bottom: 10,
        left: 18,
        right: 18,
    },
    addMemberText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 10,
    },
     memberItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    memberName: {
        fontSize: 16,
        color: '#343a40',
    },
    memberActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    linkRequiredText: {
        fontSize: 12,
        color: '#D46130',
        fontWeight: '500',
        marginRight: 10,
    },
    errorText: {
        fontSize: 18,
        color: 'red',
        textAlign: 'center',
        marginTop: 50,

    },tabBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
        marginBottom: 2,
        marginTop: 16,
    },
    tabButton: {
        padding: 10,
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#D46130',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        width: '80%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    input: {
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
        marginBottom: 10,
        padding: 5,
    },
    assigneeItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 20,
    },
    modalButton: {
        backgroundColor: '#F8CE63',
        padding: 10,
        borderRadius: 5,
        paddingLeft: 40,
        paddingRight: 40,

    },
    modalButtonText: {
        color: '#434343',
    },
    taskCardNew: {
        backgroundColor: '#e6f4f1', 
        borderRadius: 15,
        padding: 15,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    taskHeaderNew: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    taskNameNew: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#343a40',
        maxWidth: '90%',
    },
    taskDetail: {
        fontSize: 14,
        color: '#495057',
        marginBottom: 10,
    },
    infoBarNew: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    infoPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    infoText: {
        fontSize: 14,
        marginLeft: 4,
        color: '#495057',
    },
     priorityPill: {
        borderWidth: 1,
        backgroundColor: 'transparent',
    },
    memberStatusNew: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    memberIcon: {
        width: 35,
        height: 35,
        borderRadius: 17.5,
        backgroundColor: '#D46130', // Placeholder color
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#e6f4f1',
        marginLeft: -10, // Overlap effect
        
        ...Platform.select({
            ios: { marginLeft: 0 },
            android: { marginLeft: 0 },
        }),
    },
    memberIconText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    plusPeople: {
        backgroundColor: '#6c757d',
    },
    statusPill: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
        minWidth: 100,
        alignItems: 'center',
    },
    statusPillText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },

    
    taskActionsContainer: {
        borderTopWidth: 1,
        borderTopColor: '#d1e0dd',
        paddingTop: 10,
        marginTop: 5,
    },
    memberActionGroup: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    leaderActionGroup: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    doneButton: {
        backgroundColor: '#4caf50',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 5,
    },
    doneButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    statusButtonsContainer: {
        flexDirection: 'row',
    },
    statusButton: {
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#007bff',
        marginLeft: 5,
    },
    activeStatusButton: {
        backgroundColor: '#007bff',
    },
    activeStatusButtonText: {
        color: '#fff',
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    approveButton: {
        backgroundColor: '#4caf50',
        padding: 10,
        borderRadius: 5,
        flex: 1,
        marginRight: 5,
        alignItems: 'center',
    },
    rejectButton: {
        backgroundColor: '#f44336',
        padding: 10,
        borderRadius: 5,
        flex: 1,
        marginLeft: 5,
        alignItems: 'center',
    },
    memberIconsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    taskStatus: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    doneButton: {
        backgroundColor: '#4caf50',
        padding: 10,
        borderRadius: 5,
        marginTop: 10,
    },
    doneButtonText: {
        color: '#fff',
        textAlign: 'center',
    },
    approvalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10,
    },
    approveButton: {
        backgroundColor: '#4caf50',
        padding: 10,
        borderRadius: 5,
    },
    rejectButton: {
        backgroundColor: '#f44336',
        padding: 10,
        borderRadius: 5,
    },
    statusButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10,
    },
    addTaskButton: {
        backgroundColor: '#F8CE63',
        padding: 10,
        borderRadius: 5,
        marginBottom: 12,
        marginTop: 14,
    },
    addTaskText: {
        color: '#434343',
        textAlign: 'center',
        marginTop: -20,
    },
    progressCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
    },
    progressTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    progressText: {
        fontSize: 16,
        marginTop: 10,
    },
    progressDetail: {
        fontSize: 12,
        color: '#6c757d',
        marginTop: 5,
    },
    reportText: {
        fontSize: 14,
        color: '#333',
        marginTop: 5,
    },
    prioritySelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    priorityButton: {
        padding: 8,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#e9ecef',
        flex: 1,
        marginHorizontal: 2,
        alignItems: 'center',
    },
    activePriorityButton: {
        backgroundColor: '#D46130',
        borderColor: '#B10F2E',
    
        
    },
    priorityButtonText: {
        fontSize: 12,
        color: '#434343',
    },
    emptyText:{
        fontSize: 16,
        justifyContent: "center",
        textAlign:"center",
        paddingTop: 10,
    },progressContainer: {
        flex: 1,
        paddingTop: 16,
    },
    statsHeader: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#343a40',
        marginBottom: 15,
    },
    summaryContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    summaryCard: {
        width: '48%',
        borderRadius: 12,
        padding: 20,
        marginBottom: 15,
        minHeight: 100,
        justifyContent: 'center',
    },
    summaryCardCount: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#212529',
    },
    summaryCardLabel: {
        fontSize: 16,
        color: '#495057',
        marginTop: 4,
    },
    inProgressCard: {
        backgroundColor: '#d6d8ff',
    },
    inReviewCard: {
        backgroundColor: '#ffdaec',
    },
    onHoldCard: {
        backgroundColor: '#ffeed9',
    },
    completedCard: {
        backgroundColor: '#d1f7e8',
    },
    chartContainer: {
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        paddingVertical: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    taskFilterContainer: {
        paddingBottom: 10,
        paddingHorizontal: 5
    },
    filterButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#e9ecef',
        marginRight: 10,
    },
    activeFilterButton: {
        backgroundColor: '#343a40',
    },
    filterButtonText: {
        color: '#495057',
        fontWeight: '600',
    },
    activeFilterButtonText: {
        color: '#fff',
    },

    taskCardV2: {
        borderRadius: 15,
        padding: 15,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 5,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#dee2e6'
    },
    taskHeaderV2: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    taskTitleV2: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#212529',
        flex: 1,
    },
    taskDescriptionV2: {
        fontSize: 14,
        color: '#6c757d',
        marginBottom: 12,
    },
    tagsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: 15,
    },
    taskTag: {
        borderRadius: 8,
        paddingVertical: 4,
        paddingHorizontal: 10,
        marginRight: 8,
        marginBottom: 5,
    },
    taskTagText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    taskFooterV2: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        paddingTop: 12,
        marginTop: 5,
    },
    taskDateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    taskDateText: {
        fontSize: 14,
        color: '#495057',
        fontWeight: '600',
    },
    memberIconsContainer: {
        flexDirection: 'row',
    },
    memberIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#D46130',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
       // borderColor: '#fff',
        marginLeft: -12,
    },
    memberIconText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    plusPeople: {
        backgroundColor: '#6c757d',
    },
    taskActionsContainer: {
        marginTop: 10,
    },
    leaderActionGroup: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionButton: {
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        flex: 1,
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    doneButton: {
        backgroundColor: '#28a745'
    },
    approveButton: {
        backgroundColor: '#4caf50',
        marginRight: 5,
    },
    rejectButton: {
        backgroundColor: '#dc3545',
        marginLeft: 5,
    },
    overallProgressContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        marginBottom: 30, // Add space at the bottom
    },
    progressBarBackground: {
        flex: 1,
        height: 10,
        backgroundColor: '#e9ecef',
        borderRadius: 5,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#007bff', // A nice blue color
        borderRadius: 5,
    },
    progressPercentText: {
        marginLeft: 15,
        fontSize: 16,
        fontWeight: '600',
        color: '#495057',
    },
    statsHeader: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#343a40',
        marginBottom: 15,
        marginTop: 10, // Add some space between sections
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)', 
    },
    modalCardContent: { 
        backgroundColor: '#fff',
        borderRadius: 15,
        width: '90%', // Occupy 90% of screen width
        maxHeight: '85%', // Occupy 85% of screen height
        paddingVertical: 20, // Padding within the card
        elevation: 10, // Android shadow
        shadowColor: '#000', // iOS shadow
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
    },
    modalScrollContent: { 
        paddingHorizontal: 20,
        paddingBottom: 10, 
    },
    modalTitle: {
        fontSize: 24, // Larger title
        fontWeight: '700', // Bolder
        color: '#333',
        marginBottom: 20,
        textAlign: 'center',
    },
    modalLabel: { 
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
        marginBottom: 5,
        marginTop: 15,
    },
    modalInput: { 
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#333',
        marginBottom: 10,
        backgroundColor: '#f9f9f9',
    },
    multilineInput: {
        minHeight: 80,
        textAlignVertical: 'top', 
    },
    prioritySelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        marginTop: 5,
    },
    priorityButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20, 
        borderWidth: 1,
        borderColor: '#e0e0e0',
        flex: 1,
        marginHorizontal: 4, // Spacing between buttons
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
    },
    activePriorityButton: {
        backgroundColor: '#007bff', 
        borderColor: '#007bff',
    },
    priorityButtonText: {
        fontSize: 13,
        color: '#555',
        fontWeight: '500',
    },
    assigneeItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    assigneeListContent: { 
        paddingBottom: 10,
    },
    modalFooterButtons: { 
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingHorizontal: 20, 
    },
    modalActionBtn: { 
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    cancelButton: {
        backgroundColor: '#ccc',
    },
    saveButton: {
        backgroundColor: '#007bff', 
    },
    modalButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },

   
    verificationLinkContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        backgroundColor: '#e3f2fd', 
        padding: 8,
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#2196f3',
    },
    verificationLinkText: {
        marginLeft: 8,
        color: '#2196f3',
        textDecorationLine: 'underline',
        flexShrink: 1, // Allow text to wrap/shrink
    },
    activePriorityButtonText: { // --- HIGHLIGHT: NEW --- For active priority
        color: '#fff',
    },
});