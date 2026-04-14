import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { auth } from '../../config/firebase';

export default function NurseDashboard() {
  const router = useRouter();
  const user = auth.currentUser;

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.replace('/');
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Hello, Nurse</Text>
          <Text style={styles.emailText}>{user?.email}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <Text style={styles.cardTitle}>Current Status</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>OFF DUTY</Text>
          </View>
          <Text style={styles.infoText}>Next Shift: Tomorrow, 7:00 AM</Text>
        </View>

        {/* Schedule Preview */}
        <Text style={styles.sectionHeader}>Upcoming Shifts</Text>
        
        <View style={styles.shiftItem}>
          <View style={styles.shiftDate}>
            <Text style={styles.dateDay}>15</Text>
            <Text style={styles.dateMonth}>APR</Text>
          </View>
          <View style={styles.shiftInfo}>
            <Text style={styles.shiftName}>Morning Shift</Text>
            <Text style={styles.shiftTime}>07:00 AM - 03:00 PM</Text>
          </View>
        </View>

        <View style={styles.shiftItem}>
          <View style={styles.shiftDate}>
            <Text style={styles.dateDay}>16</Text>
            <Text style={styles.dateMonth}>APR</Text>
          </View>
          <View style={styles.shiftInfo}>
            <Text style={styles.shiftName}>Morning Shift</Text>
            <Text style={styles.shiftTime}>07:00 AM - 03:00 PM</Text>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { 
    backgroundColor: '#fff', 
    paddingTop: 60, 
    paddingHorizontal: 25, 
    paddingBottom: 20, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  welcomeText: { fontSize: 24, fontWeight: 'bold', color: '#202124' },
  emailText: { fontSize: 14, color: '#5f6368' },
  logoutBtn: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8, backgroundColor: '#feeef0' },
  logoutBtnText: { color: '#d93025', fontWeight: '600' },
  scrollContent: { padding: 25 },
  statusCard: { 
    backgroundColor: '#1a73e8', 
    padding: 25, 
    borderRadius: 20, 
    marginBottom: 30,
    elevation: 4,
    shadowColor: '#1a73e8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  cardTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600', marginBottom: 10 },
  statusBadge: { 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    alignSelf: 'flex-start', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 10,
    marginBottom: 15
  },
  statusText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  infoText: { color: '#fff', fontSize: 14 },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', color: '#202124', marginBottom: 15 },
  shiftItem: { 
    backgroundColor: '#fff', 
    flexDirection: 'row', 
    padding: 15, 
    borderRadius: 15, 
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee'
  },
  shiftDate: { 
    backgroundColor: '#f1f3f4', 
    padding: 10, 
    borderRadius: 10, 
    alignItems: 'center', 
    width: 60 
  },
  dateDay: { fontSize: 18, fontWeight: 'bold', color: '#202124' },
  dateMonth: { fontSize: 12, color: '#5f6368', fontWeight: 'bold' },
  shiftInfo: { marginLeft: 15 },
  shiftName: { fontSize: 16, fontWeight: '600', color: '#202124' },
  shiftTime: { fontSize: 14, color: '#5f6368', marginTop: 2 }
});