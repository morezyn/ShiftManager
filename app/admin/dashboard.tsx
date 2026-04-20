import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { auth, db } from '../../config/firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

export default function AdminDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const [nurseCount, setNurseCount] = useState(0);
  const [openShifts, setOpenShifts] = useState(0);
  const [activeNow, setActiveNow] = useState(0);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Live Data Subscriptions
    const qNurses = query(collection(db, "users"), where("role", "==", "nurse"));
    const unsubNurses = onSnapshot(qNurses, (snap) => setNurseCount(snap.size));

    const qShifts = collection(db, "schedules");
    const unsubShifts = onSnapshot(qShifts, (snap) => setOpenShifts(snap.size));

    const qActive = query(collection(db, "attendance"), where("checkOut", "==", null));
    const unsubActive = onSnapshot(qActive, (snap) => setActiveNow(snap.size));

    const qActivity = query(collection(db, "schedules"), orderBy("createdAt", "desc"), limit(5));
    const unsubActivity = onSnapshot(qActivity, (snap) => {
      setRecentActivity(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => { 
      unsubNurses(); unsubShifts(); unsubActive(); unsubActivity(); 
    };
  }, []);

  const handleLogout = async () => {
    try { 
      await auth.signOut(); 
      router.replace('/'); 
    } catch (error) { console.error(error); }
  };

  return (
    <View style={styles.container}>
      {/* SIDEBAR - Unified with other Admin Screens */}
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

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
      
      {/* MAIN CONTENT AREA */}
      <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* TOP HEADER */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Hospital Overview</Text>
            <Text style={styles.headerSubtitle}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
          </View>

          <TouchableOpacity onPress={() => router.push('/admin/profile')} style={styles.profileBox}>
            <View style={styles.profileTextWrap}>
              <Text style={styles.adminName}>Administrator</Text>
              <Text style={styles.adminRole}>Super User</Text>
            </View>
            <View style={styles.profileCircle}><Text style={styles.profileInitial}>A</Text></View>
          </TouchableOpacity>
        </View>

        {/* TOP STATS CARDS */}
        <View style={styles.statsGrid}>
          <StatCard label="Total Nurses" value={nurseCount} icon="people" color="#1a73e8" />
          <StatCard label="Total Shifts" value={openShifts} icon="calendar" color="#8B5CF6" />
          <StatCard label="On Duty Now" value={activeNow} icon="pulse" color="#10B981" />
        </View>

        {/* ANALYTICS & ACTIVITY */}
        <View style={styles.contentGrid}>
          
          {/* STAFF DISTRIBUTION CHART */}
          <View style={styles.chartCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Weekly Staff Distribution</Text>
              <View style={styles.trendBadge}><Text style={styles.trendText}>+12% vs last week</Text></View>
            </View>
            
            <View style={styles.barChartRow}>
              {[60, 45, 80, 55, 95, 70, 40].map((h, i) => (
                <View key={i} style={styles.barContainer}>
                  <View style={[styles.bar, { height: h, backgroundColor: i === 4 ? '#1a73e8' : '#F1F5F9' }]} />
                  <Text style={styles.barLabel}>{['M','T','W','T','F','S','S'][i]}</Text>
                </View>
              ))}
            </View>
            <View style={styles.chartLegend}>
              <Text style={styles.legendText}>Occupancy Rate: <Text style={{fontWeight:'800', color: '#0F172A'}}>68.4%</Text></Text>
            </View>
          </View>

          {/* RECENT ACTIVITY LIST */}
          <View style={styles.activityCard}>
            <Text style={styles.cardTitle}>Recent Activity</Text>
            {loading ? (
              <ActivityIndicator color="#1a73e8" style={{ marginTop: 40 }} />
            ) : recentActivity.length === 0 ? (
              <Text style={styles.emptyText}>No recent assignments.</Text>
            ) : (
              recentActivity.map((act) => (
                <View key={act.id} style={styles.activityItem}>
                  <View style={styles.activityDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.activityText}>
                      New shift for <Text style={{ fontWeight: '800', color: '#1E293B' }}>{act.nurseName}</Text>
                    </Text>
                    <Text style={styles.activityTime}>{act.dayOfWeek || 'Scheduled'}</Text>
                  </View>
                </View>
              ))
            )}
            <TouchableOpacity style={styles.viewAllBtn} onPress={() => router.push('/admin/schedule')}>
              <Text style={styles.viewAllText}>View All Schedules</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

// Sub-Components
const NavItem = ({ icon, label, active, onPress }: any) => (
  <TouchableOpacity onPress={onPress} style={[styles.navItem, active && styles.navItemActive]}>
    <Ionicons name={icon} size={18} color={active ? '#1a73e8' : '#64748B'} />
    <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
  </TouchableOpacity>
);

const StatCard = ({ label, value, icon, color }: any) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconBox, { backgroundColor: color + '10' }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#F8FAFC' },
  
  // Sidebar (Exact match to Schedule/Nurse screens)
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
  
  profileBox: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  profileTextWrap: { alignItems: 'flex-end' },
  adminName: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  adminRole: { fontSize: 11, fontWeight: '600', color: '#94A3B8' },
  profileCircle: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' },
  profileInitial: { color: '#fff', fontWeight: '800', fontSize: 14 },

  // Stats
  statsGrid: { flexDirection: 'row', gap: 20, marginBottom: 30 },
  statCard: { flex: 1, backgroundColor: '#fff', padding: 20, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  statIconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  statLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 22, fontWeight: '900', color: '#0F172A' },

  // Content Grid
  contentGrid: { flexDirection: 'row', gap: 24 },
  chartCard: { flex: 1.8, backgroundColor: '#fff', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#F1F5F9' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  trendBadge: { backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  trendText: { color: '#16A34A', fontSize: 10, fontWeight: '800' },
  barChartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 140, marginBottom: 20 },
  barContainer: { alignItems: 'center', gap: 8 },
  bar: { width: 12, borderRadius: 6 },
  barLabel: { fontSize: 10, fontWeight: '700', color: '#CBD5E1' },
  chartLegend: { borderTopWidth: 1, borderTopColor: '#F8FAFC', paddingTop: 15 },
  legendText: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },

  activityCard: { flex: 1.2, backgroundColor: '#fff', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#F1F5F9' },
  activityItem: { flexDirection: 'row', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  activityDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#1a73e8', marginTop: 6 },
  activityText: { fontSize: 13, color: '#64748B', lineHeight: 18 },
  activityTime: { fontSize: 11, color: '#CBD5E1', marginTop: 2, fontWeight: '600' },
  viewAllBtn: { marginTop: 20, padding: 10, alignItems: 'center', borderRadius: 10, backgroundColor: '#F8FAFC' },
  viewAllText: { fontSize: 12, fontWeight: '700', color: '#1a73e8' },
  emptyText: { color: '#94A3B8', textAlign: 'center', marginTop: 40, fontSize: 13, fontWeight: '600' }
});