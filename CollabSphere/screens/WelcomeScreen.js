import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, StatusBar } from 'react-native';

const BACKGROUND_IMAGE = require('../assets/wel6.jpg');

export default function WelcomeScreen({ navigation }) {
  return (
    <ImageBackground source={BACKGROUND_IMAGE} style={styles.background}>
      <StatusBar barStyle="light-content" /> 
      <View style={styles.overlay} /> 

      <View style={styles.contentContainer}>
        <Text style={styles.appTitle}>CollabSphere</Text> 
        <Text style={styles.mainHeadline}>Find Your Next Collaboration</Text>
        <Text style={styles.subHeadline}>
          Discover skilled individuals, connect, and form powerful project groups.
        </Text>

        <TouchableOpacity
          style={styles.getStartedButton}
          onPress={() => navigation.navigate('SignUp')} 
        >
          <Text style={styles.getStartedButtonText}>Get Started</Text>
        </TouchableOpacity>

        <View style={styles.loginRegisterContainer}>
          <Text style={styles.loginRegisterText}>Already registered?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginRegisterLink}> Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}
const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover', 
    justifyContent: 'center',
    
  },
  overlay: {
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-end', 
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 50, 
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f2e4d8',
    position: 'absolute', 
    top: 70, 
    alignSelf: 'center',
    fontFamily: 'courier',
  },
  mainHeadline: {
    fontSize: 38, 
    fontWeight: 'bold',
    color: '#E1ECF7',
    textAlign: 'left',
    marginBottom: 15,
    lineHeight: 45, 
  },
  subHeadline: {
    fontSize: 18,
    color: '#E1ECF7', 
    textAlign: 'left',
    marginBottom: 50,
    lineHeight: 24,
    
  },
  getStartedButton: {
    backgroundColor: '#F4B942', // Primary blue color
    paddingVertical: 15,
    paddingHorizontal: 40,//40
    borderRadius: 30, 
    width: '100%', 
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    //fontFamily:'', 
  },
  getStartedButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginRegisterContainer: {
    flexDirection: 'row', 
    marginTop: 10,
    alignItems: 'center',
  },
  loginRegisterText: {
    color: '#e0e0e0',
    fontSize: 16,
  },
  loginRegisterLink: {
    color: '#D46130', 
    fontSize: 16,
    fontWeight: 'bold',
    textDecorationLine: 'underline', 
  },
});

//export default WelcomeScreen;