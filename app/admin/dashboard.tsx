import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function AdminDashboard() {
  const router = useRouter();

  const handleLogout = () => {
    // Later, you'll add auth.signOut() here
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      {/* Sidebar */}
      <View style={styles.sidebar}>
        <View>
          <Text style={styles.logo}>Admin Panel</Text>
          <TouchableOpacity onPress={() => {}}><Text style={styles.navItem}>Dashboard</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => {}}><Text style={styles.navItem}>Manage Nurses</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => {}}><Text style={styles.navItem}>Shift Schedule</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => {}}><Text style={styles.navItem}>Reports</Text></TouchableOpacity>
        </View>

        {/* Logout Button at the bottom */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      
      {/* Main Content */}
      <ScrollView style={styles.mainContent}>
        <Text style={styles.header}>Hospital Overview</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Active Nurses</Text>
            <Text style={styles.statValue}>12</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Open Shifts</Text>
            <Text style={styles.statValue}>4</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#f8f9fa' },
  
  // Sidebar Styles
  sidebar: { 
    width: 250, 
    backgroundColor: '#202124', 
    padding: 20, 
    justifyContent: 'space-between' // Pushes logout to bottom
  },
  logo: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 40, letterSpacing: 1 },
  navItem: { color: '#bdc1c6', fontSize: 16, marginBottom: 25, fontWeight: '500' },
  
  logoutButton: { 
    borderTopWidth: 1, 
    borderTopColor: '#3c4043', 
    paddingTop: 20,
    marginBottom: 10 
  },
  logoutText: { color: '#f28b82', fontSize: 16, fontWeight: 'bold' },

  // Main Content Styles
  mainContent: { flex: 1, padding: 40 },
  header: { fontSize: 28, fontWeight: 'bold', color: '#202124', marginBottom: 30 },
  statsRow: { flexDirection: 'row', gap: 20 },
  statCard: { 
    backgroundColor: '#fff', 
    padding: 25, 
    borderRadius: 12, 
    flex: 1, 
    borderWidth: 1, 
    borderColor: '#e0e0e0',
    // Soft shadow for web
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  statTitle: { color: '#5f6368', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  statValue: { color: '#1a73e8', fontSize: 32, fontWeight: 'bold' }
});