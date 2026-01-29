import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, } from "react-native";
import { collection, query, where, onSnapshot, updateDoc, doc, deleteDoc,getDoc,serverTimestamp, arrayUnion,addDoc ,} from "firebase/firestore";
import { auth, db } from "../services/firebase";

export default function NotificationTab() {
  const [notifications, setNotifications] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

   useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
        setNotifications([]); // Clear invites if no user is logged in
      }
    });
    return () => unsubscribeAuth();
  }, []);

   const fetchUserName = async (userId) => {
    try {
      const snap = await getDoc(doc(db, "users", userId));
      if (snap.exists()) {
        return snap.data().name || "Unknown User";
      }
    } catch (error) {
      console.error("Error fetching username:", error);
    }
    return "Unknown User";
  };

  const fetchProjectDetails = async (projectId) => {
    if (!projectId) return { projectName: "Unknown Project", projectDescription: "" };
    try {
      // HIGHLIGHTED CHANGE: This function is now correctly used with a valid projectId
      const snap = await getDoc(doc(db, "projects", projectId));
      if (snap.exists()) {
        const data = snap.data();
        return {
          projectName: data.projectName || "Unnamed Project",
          projectDescription: data.description || "No description",
        };
      }
    } catch (error) {
      console.error("Error fetching project details:", error);
    }
    return { projectName: "Unknown Project", projectDescription: "" };
  };
  
  useEffect(() => {
    if (!currentUser) return;
    // const invitesQuery = query(collection(db, "invites"), where("toUserId", "==", currentUser.uid), where("status", "==", "pending"));
    // const joinRequestsQuery = query(collection(db, "joinRequests"), where("toUserId", "==", currentUser.uid), where("status", "==", "pending"));
    // //const q = query(collection(db, "invites"), where("toUserId", "==", auth.currentUser.uid));
   // const q = query(collection(db, "invites"), where("toUserId", "==", currentUser.uid));
    const invitesQuery = query(
      collection(db, "invites"), 
      where("toUserId", "==", currentUser.uid), 
      where("status", "==", "pending")
    );

    const unsubscribeInvites = onSnapshot(invitesQuery, async (snapshot) => {
      const results = await Promise.all(snapshot.docs.map(async (d) => {
        const data = d.data();
        const name = data.fromUserName || await fetchUserName(data.fromUserId);
        const project = await fetchProjectDetails(data.projectId);
        return { id: d.id, type: "invite", fromUserName: name, ...project, ...data };
      }));
      setNotifications(prev => [...prev.filter(n => n.type !== "invite"), ...results]);
    });

    const joinRequestsQuery = query(
      collection(db, "joinRequests"),
      where("toUserId", "==", currentUser.uid), 
      //where("projectId", "!=", ""), 
      where("status", "==", "pending")
    );

    const unsubscribeJoinRequests = onSnapshot(joinRequestsQuery, async (snapshot) => {
      const results = await Promise.all(snapshot.docs.map(async (d) => {
        const data = d.data();
        const name = data.fromUserName || await fetchUserName(data.fromUserId);
        const project = await fetchProjectDetails(data.projectId);
        return { id: d.id, type: "joinRequest", fromUserName: name, ...project, ...data };
      }));
      setNotifications(prev => [...prev.filter(n => n.type !== "joinRequest"), ...results]);
    });

    const tasksQuery = query(
      collection(db, "tasks"),
      where("assignedToIds", "array-contains", currentUser.uid)
    );

    const unsubscribeTasks = onSnapshot(tasksQuery, async (snapshot) => {
      const results = await Promise.all(snapshot.docs.map(async (d) => {
        const data = d.data();
        const project = await fetchProjectDetails(data.projectId);
        //return { id: d.id, type: "task", ...project, ...data };
        if (data.status !== 'Done' && data.status !== 'Pending Approval') {
            return { id: d.id, type: "task", taskName: data.taskName, ...project, ...data };
        }
        return null; 
      }));
      //setNotifications(prev => [...prev.filter(n => n.type !== "task"), ...results]);
      setNotifications(prev => [...prev.filter(n => n.type !== "task"), ...results.filter(n => n !== null)]);
    }, (error) => {
        console.error("Error listening to tasks:", error);
    });
    // const unsubscribeInvites = onSnapshot(invitesQuery, async (snapshot) => {
    //   const results = await Promise.all(
    //     snapshot.docs.map(async (d) => {
    //       const data = d.data();
    //       const name = data.fromUserName || await fetchUserName(data.fromUserId);
    //       const project = await fetchProjectDetails(data.projectId); // HIGHLIGHTED CHANGE: Correctly call fetchProjectDetails
    //       return { id: d.id,type: "invite", fromUserName: name, ...project, ...data };
    //     })
    //   );
    //   setInvites(results);
    // });
    // const unsubscribeInvites = onSnapshot(invitesQuery, async (snapshot) => {
    //   const results = await Promise.all(
    //     snapshot.docs.map(async (d) => {
    //       const data = d.data();
    //       const name = data.fromUserName || (await fetchUserName(data.fromUserId));
    //       const project = await fetchProjectDetails(data.projectId);
    //       return { id: d.id, type: "invite", fromUserName: name, ...project, ...data };
    //     })
    //   );
    //   setNotifications(prev => [
    //     ...prev.filter(n => n.type !== "invite"), 
    //     ...results,
    //   ]);
    // });

    //  const unsubscribeJoinRequests = onSnapshot(joinRequestsQuery, async (snapshot) => {
    //   const results = await Promise.all(
    //     snapshot.docs.map(async (d) => {
    //       const data = d.data();
    //       if (!data.projectId) return null;
    //       const name = data.fromUserName || (await fetchUserName(data.fromUserId));
    //       const project = await fetchProjectDetails(data.projectId);
    //       return { id: d.id, type: "joinRequest", fromUserName: name, ...project, ...data };
    //     })
    //   );
    //   setNotifications(prev => [
    //     ...prev.filter(n => n.type !== "joinRequest"),
    //     ...results]);
    // });

    // 🔹 CHANGE: Task snapshot listener
    // const unsubscribeTasks = onSnapshot(tasksQuery, async (snapshot) => {
    //   const results = await Promise.all(
    //     snapshot.docs.map(async (d) => {
    //       const data = d.data();
    //       const project = await fetchProjectDetails(data.projectId);
    //       return { id: d.id, type: "task", ...project, ...data };
    //     })
    //   );
    //   setNotifications((prev) => [
    //     ...prev.filter((n) => n.type !== "task"),
    //     ...results,
    //   ]);
    // });

    return () => {
      unsubscribeInvites();
      unsubscribeJoinRequests();
      unsubscribeTasks();
    };
  }, [currentUser]);



  const handleResponse = async (notificationId, action, notificationType) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      if (notificationType === "invite") {
        await updateDoc(doc(db, "invites", notificationId), { status: action });
        if (action === "accepted") {
          const inviteDocSnap = await getDoc(doc(db, "invites", notificationId));
          const projectId = inviteDocSnap.data().projectId;
          await updateDoc(doc(db, "projects", projectId), {
            members: arrayUnion(user.uid)
          });
          Alert.alert("Accepted", "You have joined the project!");
        }
        await deleteDoc(doc(db, "invites", notificationId));
      } else if (notificationType === "joinRequest") {
        await updateDoc(doc(db, "joinRequests", notificationId), { status: action });
        if (action === "accepted") {
          const requestDocSnap = await getDoc(doc(db, "joinRequests", notificationId));
          const { projectId, fromUserId } = requestDocSnap.data();
          await updateDoc(doc(db, "projects", projectId), {
            members: arrayUnion(fromUserId)
          });
          Alert.alert("Accepted", "You have added the member to the project!");
        }
      } else if (notificationType === "task") {
        await updateDoc(doc(db, "tasks", notificationId), { status: action });
        Alert.alert("Task Updated", `Task marked as ${action}`);
        // 🔹 Optional: report to leader
        //const taskSnap = await getDoc(doc(db, "tasks", notificationId));
        //const taskData = taskSnap.data();
        // await addDoc(collection(db, "notifications"), {
        //   type: "taskReport",
        //   taskId: notificationId,
        //   projectId: taskData.projectId,
        //   fromUserId: user.uid,
        //   toUserId: taskData.leaderId,
        //   status: action,
        //   timestamp: new Date()
        // });
      }
    } catch (error) {
      console.error("Error updating notification:", error);
      Alert.alert("Error", "Failed to update notification.");
    }
  };
   const handleDelete = async (item) => {
    // try {
    //   if (notificationType === "invite") {
    //     await deleteDoc(doc(db, "invites", notificationId));
    //   } else if (notificationType === "joinRequest") {
    //     await deleteDoc(doc(db, "joinRequests", notificationId));
    //   }
    //   Alert.alert("Deleted", "Notification deleted successfully!");
    // } catch (error) {
    //   console.error("Error deleting notification:", error);
    //   Alert.alert("Error", "Failed to delete notification.");
    // }
    try {
   // let collectionName = "";

    // if (item.type === "invite") {
    //   collectionName = "invites";
    // } else if (item.type === "joinRequest") {
    //   collectionName = "joinRequests";
    // } else if (item.type === "task") collectionName = "tasks"; // 🔹 CHANGE

    // if (!collectionName) {
    //   throw new Error("Unknown notification type");
    // }
    const collectionName =
        item.type === "invite"
          ? "invites"
          : item.type === "joinRequest"
          ? "joinRequests"
          //: "tasks";
          :null;
        if (!collectionName) {
            Alert.alert("Error", "Cannot delete the task itself from this screen. Use the Project Details screen to manage tasks.");
            return;
        }
      await deleteDoc(doc(db, collectionName, item.id));
      Alert.alert("Deleted", "Notification deleted successfully!");
  } catch (error) {
    console.error("Error deleting notification:", error);
    Alert.alert("Error", "Failed to delete notification.");
  }
  };

  const getStatusColor = (status) => {
    switch (status) {
      // case "accepted":
      //   return "green";
      // case "declined":
      //   return "red";
      // case "pending":
      //   return "orange";
      // default:
      //   return "gray";
      case "accepted":
      case "done":
        return "green";
      case "declined":
      case "blocked":
        return "red";
      case "pending":
      case "in progress":
        return "orange";
      default:
        return "gray";
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      {item.type === "invite" ? (
        <Text style={styles.text}>📩 Invite from {item.fromUserName} for {item.projectName}</Text>
      ) : item.type === "joinRequest" ? (
        <Text style={styles.text}>🙋‍♂️ Join request from {item.fromUserName} for {item.projectName}</Text>
      ) : (
        
        <Text style={styles.text}>📝 Task: {item.taskName} (Project: {item.projectName})</Text>
      )}
      <Text style={styles.description}>{item.projectDescription}</Text>

      {item.type === "task" && (
        //<Text style={styles.description}>Due: {item.dueDate || "No due date"}</Text>
        <View>
            <Text style={styles.description}>Due: {item.dueDate || "No due date"}</Text>
            <Text style={styles.description}>Priority: {item.priority || "Medium"}</Text> 
            <Text style={styles.description}>Description: {item.description || "No description"}</Text> 
        </View>
      )}
      <Text>Status: {item.status}</Text>

      {/* 🔹 Removed 'Mark Done' action here. Tasks are best managed in ProjectDetailsScreen.js */}
      {/* {item.type === "task" && item.status === "in progress" && (
        <TouchableOpacity style={styles.accept} onPress={() => handleResponse(item.id, "done", item.type)}>
          <Text style={styles.btnText}>Mark Done</Text>
        </TouchableOpacity>
      )} */}

      {/* 🔴 ISSUE 1 & 2 FIX: Conditional logic for Invite/JoinRequest vs. Task status update */}
      {item.status === "pending" && (item.type === "invite" || item.type === "joinRequest") && (
        <View style={styles.actions}>
          {/* 🟢 Action: Change 'in progress' to 'accepted' for invite/request */}
          <TouchableOpacity style={styles.accept} onPress={() => handleResponse(item.id, "accepted", item.type)}>
            <Text style={styles.btnText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.decline} onPress={() => handleResponse(item.id, "declined", item.type)}>
            <Text style={styles.btnText}>Decline</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* 🔹 New: Actions for Tasks that are 'Not Started' or 'Blocked' (simplified start button) */}
      {item.type === "task" && (item.status === "Not Started" || item.status === "Blocked") && (
        <TouchableOpacity style={styles.accept} onPress={() => handleResponse(item.id, "In Progress", item.type)}>
            <Text style={styles.btnText}>Start Work / Set In Progress</Text>
        </TouchableOpacity>
      )}
      
      {/* This delete button is now for general cleanup of resolved items */}
      <TouchableOpacity style={styles.delete} onPress={() => handleDelete(item)}>
        <Text style={styles.btnText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <FlatList
      data={notifications}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={{ padding: 20 }}
      ListEmptyComponent={
        <Text style={{ textAlign: "center", marginTop: 20 }}>No notifications yet 🥲</Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  text: { fontSize: 16, marginBottom: 10 },
  description: { fontSize: 13, marginBottom: 10, color: "#555" },
  actions: { flexDirection: "row", justifyContent: "space-between" },
  accept: { backgroundColor: "#FF6000", padding: 10, borderRadius: 5 },
  decline: { backgroundColor: "#4F200D", padding: 10, borderRadius: 5 },
  delete: { backgroundColor: "#DBC8AC", padding: 10, borderRadius: 5, marginTop: 10, alignItems: "center" },
  btnText: { color: "#FDF6F0", fontWeight: "bold" },
});
