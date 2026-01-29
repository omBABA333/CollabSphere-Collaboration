import React,{ useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, FlatList, ActivityIndicator} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AntDesign } from '@expo/vector-icons'; // Using AntDesign for the plus icon
//import Svg, { Path, Defs, RadialGradient, Stop } from 'react-native-svg';
//import Svg, { Path, Defs, RadialGradient, LinearGradient, Stop } from 'react-native-svg';
import Svg, { Path } from 'react-native-svg';
import { getFirestore, collection, query, where, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import ProjectStatusDropdown from '../components/ProjectStatusDropdown';

const db = getFirestore();
const auth = getAuth();

export default function HomeTab() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const [currentUser, setCurrentUser] = useState(null);

   useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
    });

    return () => unsubscribeAuth();
  }, []);

  const handleCreateProjectPress  = () => {
    //alert("Create Group button pressed!");
    navigation.navigate('CreateProject');

  };
     useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      setProjects([]);
      return;
    }

    const projectsRef = collection(db, 'projects');
    const q = query(projectsRef, where('members', 'array-contains', currentUser.uid));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userProjects = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(userProjects);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching projects:', error);
      setLoading(false);
    });

    return () => unsubscribe(); // Clean up the listener
  }, [currentUser]);

  const renderProjectItem = ({ item }) => (
    <TouchableOpacity
      style={styles.projectCard}
      onPress={() => navigation.navigate('ProjectDetails', { projectId: item.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.projectName}>{item.projectName}</Text>
        {/* <Text style={styles.projectStatus}>In Progress</Text> */}
        {currentUser && currentUser.uid === item.leaderId ? (
          <ProjectStatusDropdown projectId={item.id} initialStatus={item.status || "In Progress"} />
        ) : (
          <Text style={[styles.projectStatus, { color: getStatusColor(item.status || "In Progress") }]}>
            {item.status || "In Progress"}
          </Text>
        )}
      </View>
      <Text style={styles.projectDescription}>{item.description}</Text>
    </TouchableOpacity>
  );
  const getStatusColor = (status) => {
    switch (status) {
      case "In Progress":
        return "#43436F";
      case "On Hold":
        return "#D46130";
      case "Completed":
        return "#32CD32";
      default:
        return "#6c757d";
    }
  };
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D46130" />
      </View>
    );
  }
  if (projects.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyMessage}>
          Get started with{"\n"}creating project groups
        </Text>
        {/* <Svg height="150" width="180" style={styles.arrow}>
          <Path
            d="M 20 100 Q 20 20, 100 20 L 150 20"
            stroke="#4F200D"
            strokeWidth="2"
            fill="none"
          />
          <Path
            d="M 150 20 L 140 15 M 150 20 L 140 25"
            stroke="#4F200D"
            strokeWidth="2"
            fill="none"
          />
        </Svg> */}
        <TouchableOpacity style={styles.fab} onPress={handleCreateProjectPress}>
          <AntDesign name="plus" size={30} color="#4F200D" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Projects</Text>
      <FlatList
        data={projects}
        keyExtractor={item => item.id}
        renderItem={renderProjectItem}
        style={styles.projectList}
      />
      <TouchableOpacity style={styles.fab} onPress={handleCreateProjectPress}>
        <AntDesign name="plus" size={30} color="#4F200D" />
      </TouchableOpacity>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#343a40',
  },
  projectList: {
    flex: 1,
  },
  projectCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  projectName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#343a40',
  },
  projectStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  projectDescription: {
    fontSize: 14,
    color: '#6c757d',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#fff',
  },
  emptyMessage: {
    fontSize: 22,
    fontWeight: '500',
    textAlign: 'center',
    position: 'absolute',
    top: '30%',
    left: 20,
    right: 20,
    marginTop: -100,
  },
  arrow: {
    position: "absolute",
    bottom: 100,
    right: 50,
    transform: [{ rotate: "-20deg" }],
  },
  fab: {
    position: 'absolute',
    backgroundColor: '#F4B942',
    width: 60,
    height: 60,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    bottom: 20,
    right: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});