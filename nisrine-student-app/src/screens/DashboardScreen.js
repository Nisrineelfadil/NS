import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function DashboardScreen({ navigation }) {
  const { theme } = useTheme();
  const [studentData, setStudentData] = useState(null);

  useEffect(() => {
    loadStudentData();
  }, []);

  const loadStudentData = async () => {
    try {
      const data = await AsyncStorage.getItem('studentData');
      if (data) {
        setStudentData(JSON.parse(data));
      }
    } catch (error) {
      console.error('Error loading student data:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      title: 'My Grades',
      icon: 'school',
      color: '#10b981',
      screen: 'Grades',
      description: 'View your exam results',
    },
    {
      title: 'Scan Attendance',
      icon: 'qr-code',
      color: '#3b82f6',
      screen: 'Attendance',
      description: 'Scan QR code for attendance',
    },
    {
      title: 'Payment Status',
      icon: 'card',
      color: '#f59e0b',
      screen: 'Payment',
      description: 'Check payment information',
    },
    {
      title: 'Messages',
      icon: 'mail',
      color: '#8b5cf6',
      screen: 'Messages',
      description: 'Announcements & notifications',
    },
    {
      title: 'Settings',
      icon: 'settings',
      color: '#6b7280',
      screen: 'Settings',
      description: 'Theme & language preferences',
    },
  ];

  const styles = getStyles(theme);
  
  return (
    <ScrollView style={styles.container}>
      {/* Welcome Card */}
      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.studentName}>{studentData?.fullName || 'Student'}</Text>
        <Text style={styles.studentEmail}>{studentData?.schoolEmail}</Text>
      </View>

      {/* Menu Grid */}
      <View style={styles.menuGrid}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.menuItem, { borderLeftColor: item.color }]}
            onPress={() => navigation.navigate(item.screen)}
          >
            <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
              <Ionicons name={item.icon} size={32} color={item.color} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuDescription}>{item.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="#ef4444" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Nisrine School Mobile App v1.0.1</Text>
      </View>
    </ScrollView>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  welcomeCard: {
    backgroundColor: theme.primary,
    padding: 25,
    margin: 15,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  welcomeText: {
    fontSize: 16,
    color: theme.text,
    marginBottom: 5,
    opacity: 0.8,
  },
  studentName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 5,
  },
  studentEmail: {
    fontSize: 14,
    color: theme.text,
    opacity: 0.7,
  },
  menuGrid: {
    padding: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.cardBg,
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 14,
    color: theme.textLight,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.cardBg,
    padding: 18,
    margin: 15,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#fee2e2',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ef4444',
    marginLeft: 10,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: theme.textLight,
  },
});
