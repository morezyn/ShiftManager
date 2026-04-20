import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { auth, db } from '../../config/firebase';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';

interface AttendanceRecord {
  id: string;
  nurseName: string;
  checkIn: Timestamp;
  checkOut: Timestamp | null;
  date: string;
}

export default function Reports() {
  const router = useRouter();
  const pathname = usePathname();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "attendance"), orderBy("checkIn", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AttendanceRecord[];
      setRecords(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace('/');
    } catch (error) {
      Alert.alert("Error", "Failed to sign out.");
    }
  };

  const formatTime = (timestamp: Timestamp | null) => {
    if (!timestamp) return '--:--';
    return timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <View style={styles.container}>
      {/* SIDEBAR - Unified with Dashboard/Nurses */}
      <View style={styles.sidebar}>
        <View>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}><Ionicons name="shield-checkmark" size={20} color="#fff" /></View>
            <Text style={styles.logoText}>ShiftManager</Text>
          </View>
          
          <NavItem icon="grid" label="Dashboard" active={pathname === '/admin/dashboard'} onPress={() => router.push('/admin/dashboard')} />
          <NavItem icon="people" label="Nurses" active={pathname === '/admin/manageNurse'} onPress={() => router.push('/admin/manageNurse')} />
          <NavItem icon="calendar" label="Schedules" active={pathname === '/admin/schedule'} onPress={() => router.push('/admin/schedule')} />
          <NavItem icon="bar-chart" label="Reports" active={pathname === '/admin/reports'} onPress={() => router.push('/admin/reports')} />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* MAIN CONTENT */}
      <View style={styles.mainContent}>
        {/* HEADER ROW - Unified with Profile Box */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Attendance Reports</Text>
            <Text style={styles.headerSubtitle}>Detailed logs of personnel activity</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
            <TouchableOpacity style={styles.exportBtn} onPress={() => Alert.alert("Export", "CSV generated.")}>
              <Ionicons name="download-outline" size={18} color="#fff" />
              <Text style={styles.exportBtnText}>Export CSV</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/admin/profile')} style={styles.profileBox}>
              <View style={styles.profileTextWrap}>
                <Text style={styles.adminName}>Administrator</Text>
                <Text style={styles.adminRole}>Super User</Text>
              </View>
              <View style={styles.profileCircle}><Text style={styles.profileInitial}>A</Text></View>
            </TouchableOpacity>
          </View>
        </View>

        {/* SUMMARY STRIP */}
        <View style={styles.summaryStrip}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryVal}>{records.length}</Text>
            <Text style={styles.summaryLab}>Total Logs</Text>
          </View>
          <View style={[styles.summaryItem, { borderLeftWidth: 1, borderColor: '#F1F5F9' }]}>
            <Text style={[styles.summaryVal, { color: '#10B981' }]}>
              {records.filter(r => !r.checkOut).length}
            </Text>
            <Text style={styles.summaryLab}>Active Now</Text>
          </View>
        </View>

        {/* TABLE BODY */}
        <View style={styles.tableBody}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colLabel, { flex: 2 }]}>Nurse / Date</Text>
            <Text style={[styles.colLabel, { flex: 1 }]}>Check In</Text>
            <Text style={[styles.colLabel, { flex: 1 }]}>Check Out</Text>
            <Text style={[styles.colLabel, { flex: 0.8, textAlign: 'right' }]}>Status</Text>
          </View>

          {loading ? (
            <ActivityIndicator color="#1a73e8" style={{ marginTop: 50 }} />
          ) : (
            <FlatList
              data={records}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.row}>
                  <View style={{ flex: 2 }}>
                    <Text style={styles.nurseText}>{item.nurseName}</Text>
                    <Text style={styles.dateText}>{item.date}</Text>
                  </View>
                  <Text style={[styles.timeText, { flex: 1 }]}>{formatTime(item.checkIn)}</Text>
                  <Text style={[styles.timeText, { flex: 1 }]}>{formatTime(item.checkOut)}</Text>
                  <View style={{ flex: 0.8, alignItems: 'flex-end' }}>
                    <View style={[styles.statusBadge, { backgroundColor: item.checkOut ? '#F1F5F9' : '#DCFCE7' }]}>
                      <View style={[styles.dot, { backgroundColor: item.checkOut ? '#94A3B8' : '#10B981' }]} />
                      <Text style={[styles.statusText, { color: item.checkOut ? '#64748B' : '#16A34A' }]}>
                        {item.checkOut ? 'Completed' : 'Active'}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const NavItem = ({ icon, label, active, onPress }: any) => (
  <TouchableOpacity onPress={onPress} style={[styles.navItem, active && styles.navItemActive]}>
    <Ionicons name={icon} size={18} color={active ? '#1a73e8' : '#64748B'} />
    <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#F8FAFC' },
  
  // Sidebar (Unified)
  sidebar: { width: 220, backgroundColor: '#fff', padding: 20, borderRightWidth: 1, borderRightColor: '#E2E8F0', justifyContent: 'space-between' },
  logoContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, gap: 8 },
  logoIcon: { backgroundColor: '#1a73e8', width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  logoText: { fontSize: 16, fontWeight: '900', color: '#0F172A' },
  navItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, marginBottom: 4, gap: 10 },
  navItemActive: { backgroundColor: '#EFF6FF' },
  navLabel: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  navLabelActive: { color: '#1a73e8', fontWeight: '800' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10 },
  logoutText: { color: '#EF4444', fontWeight: '700', fontSize: 13 },

  // Main Content
  mainContent: { flex: 1, padding: 32 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#0F172A' },
  headerSubtitle: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },
  
  exportBtn: { backgroundColor: '#1e293b', flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, gap: 8 },
  exportBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  profileBox: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  profileTextWrap: { alignItems: 'flex-end' },
  adminName: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  adminRole: { fontSize: 11, fontWeight: '600', color: '#94A3B8' },
  profileCircle: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' },
  profileInitial: { color: '#fff', fontWeight: '800', fontSize: 14 },

  // Summary Strip
  summaryStrip: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 30, borderWidth: 1, borderColor: '#F1F5F9' },
  summaryItem: { flex: 1, paddingLeft: 24 },
  summaryVal: { fontSize: 24, fontWeight: '900', color: '#0F172A' },
  summaryLab: { fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Table Styling
  tableBody: { flex: 1, backgroundColor: '#fff', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#F1F5F9' },
  tableHeader: { flexDirection: 'row', paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  colLabel: { fontSize: 11, fontWeight: '800', color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  nurseText: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  dateText: { fontSize: 12, color: '#94A3B8', fontWeight: '600', marginTop: 2 },
  timeText: { fontSize: 14, fontWeight: '600', color: '#475569' },
  
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '800' },
  dot: { width: 6, height: 6, borderRadius: 3 }
});