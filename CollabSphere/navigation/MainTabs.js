import React, { useState, useEffect }from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { auth, db } from "../services/firebase";



import HomeTab from "../screens/HomeTab";
import SearchTab from "../screens/SearchTab";
import ProfileTab from "../screens/ProfileTab";
import NotificationTab from "../screens/NotificationTab";

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      if (user) {
        // HIGHLIGHTED CHANGE: Listen for pending invites for the current user
        const q = query(
          collection(db, "invites"),
          where("toUserId", "==", user.uid),
          where("status", "==", "pending")
        );
        
        const unsubscribeInvites = onSnapshot(q, (snapshot) => {
          // Check if there are any pending invites
          setHasUnreadNotifications(snapshot.docs.length > 0);
        });
        return () => unsubscribeInvites();
      } else {
        setHasUnreadNotifications(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);


  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Notifications') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          // Return the icon component
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#B10F2E', // Active icon and text color
        tabBarInactiveTintColor: 'gray', // Inactive icon and text color
      })}
    >
      <Tab.Screen name="Home" component={HomeTab} options={{ title: 'Home' }} />
      <Tab.Screen name="Search" component={SearchTab} options={{ title: 'Search' }} />
      <Tab.Screen 
      name="Notifications" 
      component={NotificationTab} 
      options={{ 
        title: 'Notifications' ,
        tabBarBadge: hasUnreadNotifications ? ' ' : null,
        tabBarBadgeStyle: { backgroundColor: '#B10F2E' },
      }} 
      listeners={{
            tabPress: e => {
                // HIGHLIGHTED CHANGE: Reset badge when user clicks on tab
                if (hasUnreadNotifications) {
                  setHasUnreadNotifications(false);
                }
            },
        }}
      />
      <Tab.Screen name="Profile" component={ProfileTab} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}