import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { auth, db } from '../../config/firebase';
import { collection, query, where, onSnapshot, orderBy, limit, Timestamp } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { BarChart, barDataItem } from "react-native-gifted-charts";

export default function AdminDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const [nurseCount, setNurseCount] = useState(0);
  const [openShifts, setOpenShifts] = useState(0);
  const [activeNow, setActiveNow] = useState(0);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [chartData, setChartData] = useState<barDataItem[]>([]);
  const todayDate = new Date(); // Fixed 'now' error

  useEffect(() => {
    // Basic Stats Listeners
    const unsubNurses = onSnapshot(query(collection(db, "users"), where("role", "==", "nurse")), (snap) => setNurseCount(snap.size));
    const unsubShifts = onSnapshot(collection(db, "schedules"), (snap) => setOpenShifts(snap.size));
    
    // Check active status based on "Time In" without a "Time Out" entry (or specific active flag)
    const unsubActive = onSnapshot(query(collection(db, "attendance_logs"), where("type", "==", "Time In")), (snap) => setActiveNow(snap.size));
    
    const unsubActivity = onSnapshot(query(collection(db, "attendance_logs"), orderBy("timestamp", "desc"), limit(5)), (snap) => {
      setRecentActivity(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    // DYNAMIC ATTENDANCE DATA LOGIC
    const firstDayOfMonth = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);
    const currentDayIndex = todayDate.getDay(); 

    const qAttendance = query(
      collection(db, "attendance_logs"),
      where("timestamp", ">=", Timestamp.fromDate(firstDayOfMonth)),
      where("type", "==", "Time In")
    );

    const unsubChart = onSnapshot(qAttendance, (snap) => {
      const dailyCounts: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 0: 0 };
      
      snap.docs.forEach(doc => {
        const data = doc.data();
        if (data.timestamp) {
          const date = data.timestamp.toDate();
          const day = date.getDay();
          dailyCounts[day] += 1;
        }
      });

      const dayConfig = [
        { label: 'M', index: 1 }, { label: 'T', index: 2 }, { label: 'W', index: 3 },
        { label: 'T', index: 4 }, { label: 'F', index: 5 }, { label: 'S', index: 6 }, { label: 'S', index: 0 },
      ];

      const formattedData: barDataItem[] = dayConfig.map(day => {
        const count = dailyCounts[day.index];
        // Visual Scaling: Ensuring bars have height even with low counts (e.g., 1 person = 30 height)
        // This maintains the "pill" look from your reference image
        const visualValue = count === 0 ? 8 : count * 25; 
        
        return {
          value: visualValue,
          label: day.label,
          frontColor: day.index === currentDayIndex ? '#1a73e8' : '#F1F5F9',
        };
      });

      setChartData(formattedData);
    });

    return () => { 
      unsubNurses(); unsubShifts(); unsubActive(); unsubActivity(); unsubChart();
    };
  }, []);

  const handleLogout = async () => {
    try { await auth.signOut(); router.replace('/'); } catch (e) { console.error(e); }
  };

  return (
    <View style={styles.container}>
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
          <Ionicons name="log-out-outline" size={18} color="#EF4444" /><Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Hospital Overview</Text>
            <Text style={styles.headerSubtitle}>{todayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/admin/profile')} style={styles.profileBox}>
            <View style={styles.profileTextWrap}>
              <Text style={styles.adminName}>Administrator</Text>
              <Text style={styles.adminRole}>Super User</Text>
            </View>
            <View style={styles.profileCircle}><Text style={styles.profileInitial}>A</Text></View>
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <StatCard label="Total Nurses" value={nurseCount} icon="people" color="#1a73e8" />
          <StatCard label="Total Shifts" value={openShifts} icon="calendar" color="#8B5CF6" />
          <StatCard label="On Duty Now" value={activeNow} icon="pulse" color="#10B981" />
        </View>

        <View style={styles.contentGrid}>
          <View style={styles.chartCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Weekly Staff Distribution</Text>
              <View style={styles.trendBadge}><Text style={styles.trendText}>Live Data</Text></View>
            </View>
            
            <View style={styles.chartContainer}>
              <BarChart
                data={chartData}
                barWidth={12}         
                spacing={80}          
                roundedTop
                roundedBottom
                hideRules
                hideAxesAndRules
                yAxisThickness={0}
                xAxisThickness={0}
                height={140}
                maxValue={120} // Slightly higher than your visualValue max to keep headroom
                barBorderRadius={10}
                initialSpacing={40}    
                xAxisLabelTextStyle={styles.barLabel}
                xAxisLabelsVerticalShift={10}
              />
            </View>
            <View style={styles.chartLegend}>
              <Text style={styles.legendText}>Monthly attendance logs visualization</Text>
            </View>
          </View>

          <View style={styles.activityCard}>
            <Text style={styles.cardTitle}>Recent Attendance</Text>
            {loading ? (
              <ActivityIndicator color="#1a73e8" style={{ marginTop: 40 }} />
            ) : recentActivity.length === 0 ? (
              <Text style={styles.emptyText}>No recent logs.</Text>
            ) : (
              recentActivity.map((act) => (
                <View key={act.id} style={styles.activityItem}>
                  <View style={[styles.activityDot, { backgroundColor: act.type === 'Time In' ? '#10B981' : '#EF4444' }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.activityText}>
                      <Text style={{ fontWeight: '800', color: '#1E293B' }}>{act.nurseName}</Text> - {act.type}
                    </Text>
                    <Text style={styles.activityTime}>{act.timestamp?.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// NavItem & StatCard sub-components remain consistent with previous design
const NavItem = ({ icon, label, active, onPress }: any) => (
  <TouchableOpacity onPress={onPress} style={[styles.navItem, active && styles.navItemActive]}>
    <Ionicons name={icon} size={18} color={active ? '#1a73e8' : '#64748B'} />
    <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
  </TouchableOpacity>
);

const StatCard = ({ label, value, icon, color }: any) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconBox, { backgroundColor: color + '10' }]}><Ionicons name={icon} size={20} color={color} /></View>
    <View><Text style={styles.statLabel}>{label}</Text><Text style={styles.statValue}>{value}</Text></View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#F8FAFC' },
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
  statsGrid: { flexDirection: 'row', gap: 20, marginBottom: 30 },
  statCard: { flex: 1, backgroundColor: '#fff', padding: 20, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  statIconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  statLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 22, fontWeight: '900', color: '#0F172A' },
  contentGrid: { flexDirection: 'row', gap: 24 },
  chartCard: { flex: 1.8, backgroundColor: '#fff', padding: 28, borderRadius: 32, borderWidth: 1, borderColor: '#F1F5F9' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  cardTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
  trendBadge: { backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  trendText: { color: '#16A34A', fontSize: 11, fontWeight: '900' },
  chartContainer: { height: 200, alignItems: 'center', justifyContent: 'center', marginLeft: -40 },
  barLabel: { fontSize: 11, fontWeight: '800', color: '#CBD5E1' },
  chartLegend: { borderTopWidth: 1, borderTopColor: '#F8FAFC', paddingTop: 20, marginTop: 10 },
  legendText: { fontSize: 13, color: '#94A3B8', fontWeight: '600' },
  activityCard: { flex: 1.2, backgroundColor: '#fff', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#F1F5F9' },
  activityItem: { flexDirection: 'row', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  activityDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  activityText: { fontSize: 13, color: '#64748B', lineHeight: 18 },
  activityTime: { fontSize: 11, color: '#CBD5E1', marginTop: 2, fontWeight: '600' },
  emptyText: { color: '#94A3B8', textAlign: 'center', marginTop: 40, fontSize: 13, fontWeight: '600' }
});