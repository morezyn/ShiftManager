import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { auth, db } from '../../config/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function AdminDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const [nurseCount, setNurseCount] = useState(0);
  const [openShifts, setOpenShifts] = useState(0);

  useEffect(() => {
    // 1. Fetch real-time nurse count
    const qNurses = query(collection(db, "users"), where("role", "==", "nurse"));
    const unsubNurses = onSnapshot(qNurses, (snapshot) => {
      setNurseCount(snapshot.size);
    });

    // 2. Fetch real-time schedule/open shifts count
    const qShifts = collection(db, "schedules");
    const unsubShifts = onSnapshot(qShifts, (snapshot) => {
      setOpenShifts(snapshot.size);
    });

    return () => {
      unsubNurses();
      unsubShifts();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.replace('/');
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Sidebar */}
      <View style={styles.sidebar}>
        <View>
          <Text style={styles.logo}>ShiftManager</Text>
          
          <TouchableOpacity 
            onPress={() => router.push('/admin/dashboard')}
            style={[styles.navButton, pathname === '/admin/dashboard' && styles.navActive]}
          >
            <Text style={[styles.navText, pathname === '/admin/dashboard' && styles.navTextActive]}>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => router.push('/admin/manageNurse')}
            style={[styles.navButton, pathname === '/admin/manageNurse' && styles.navActive]}
          >
            <Text style={[styles.navText, pathname === '/admin/manageNurse' && styles.navTextActive]}>Manage Nurses</Text>
          </TouchableOpacity>

          {/* Linked to your new schedule.tsx */}
          <TouchableOpacity 
            onPress={() => router.push('/admin/schedule')}
            style={[styles.navButton, pathname === '/admin/schedule' && styles.navActive]}
          >
            <Text style={[styles.navText, pathname === '/admin/schedule' && styles.navTextActive]}>Shift Schedule</Text>
          </TouchableOpacity>

          {/* Placeholder for future Reports file */}
          <TouchableOpacity 
            onPress={() => router.push('/admin/reports')}
            style={[styles.navButton, pathname === '/admin/reports' && styles.navActive]}
          >
            <Text style={[styles.navText, pathname === '/admin/reports' && styles.navTextActive]}>Reports</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      
      {/* Main Content */}
      <ScrollView style={styles.mainContent}>
        <View style={styles.headerRow}>
          <Text style={styles.header}>Hospital Overview</Text>
          <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.iconPlaceholder}><Text>👩‍⚕️</Text></View>
            <Text style={styles.statTitle}>Registered Nurses</Text>
            <Text style={styles.statValue}>{nurseCount}</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.iconPlaceholder, {backgroundColor: '#e6f4ea'}]}><Text>📅</Text></View>
            <Text style={styles.statTitle}>Total Scheduled</Text>
            <Text style={styles.statValue}>{openShifts}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.iconPlaceholder, {backgroundColor: '#fef7e0'}]}><Text>⚡</Text></View>
            <Text style={styles.statTitle}>Active Now</Text>
            <Text style={styles.statValue}>0</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#f8f9fa' },
  sidebar: { width: 260, backgroundColor: '#202124', padding: 20, justifyContent: 'space-between' },
  logo: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 40, letterSpacing: 1 },
  navButton: { paddingVertical: 12, paddingHorizontal: 15, borderRadius: 8, marginBottom: 10 },
  navActive: { backgroundColor: 'rgba(26, 115, 232, 0.2)' },
  navText: { color: '#bdc1c6', fontSize: 16, fontWeight: '500' },
  navTextActive: { color: '#8ab4f8', fontWeight: 'bold' },
  logoutButton: { borderTopWidth: 1, borderTopColor: '#3c4043', paddingTop: 20, marginBottom: 10 },
  logoutText: { color: '#f28b82', fontSize: 16, fontWeight: 'bold' },
  mainContent: { flex: 1, padding: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  header: { fontSize: 28, fontWeight: 'bold', color: '#202124' },
  dateText: { color: '#5f6368', fontSize: 16 },
  statsRow: { flexDirection: 'row', gap: 20 },
  statCard: { backgroundColor: '#fff', padding: 25, borderRadius: 16, flex: 1, borderWidth: 1, borderColor: '#e0e0e0', elevation: 2 },
  iconPlaceholder: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#e8f0fe', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  statTitle: { color: '#5f6368', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  statValue: { color: '#202124', fontSize: 32, fontWeight: 'bold' }
});