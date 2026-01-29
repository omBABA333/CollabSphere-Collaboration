import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View , Button} from 'react-native';
import AppNavigator from "./navigation/AppNavigator";


export default function App() {
  
  return (
    <AppNavigator/>  
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { 
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});

  