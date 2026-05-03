import React, { useEffect, useState } from 'react';
<<<<<<< HEAD
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  ScrollView, 
  Dimensions,
  Platform
} from 'react-native';
=======
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
>>>>>>> 77244535c225289db5386e3d02e7e3733474121d
import { useRouter, usePathname } from 'expo-router';
import { auth, db } from '../../config/firebase';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
<<<<<<< HEAD
import { LineChart } from "react-native-chart-kit";

// Updated Imports
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import * as XLSX_STYLE from 'xlsx-style';

// --- WEB COMPATIBILITY FIX ---
if (Platform.OS === 'web') {
  const ignoredWarnings = [
    'Unknown event handler property',
    'Invalid DOM property',
    'shadow* style props are deprecated',
    'transform-origin'
  ];

  const originalWarn = console.warn;
  const originalError = console.error;

  console.warn = (...args) => {
    if (typeof args[0] === 'string' && ignoredWarnings.some(w => args[0].includes(w))) return;
    originalWarn(...args);
  };

  console.error = (...args) => {
    if (typeof args[0] === 'string' && ignoredWarnings.some(w => args[0].includes(w))) return;
    originalError(...args);
  };
}
=======
>>>>>>> 77244535c225289db5386e3d02e7e3733474121d

interface AttendanceRecord {
  id: string;
  nurseName: string;
  checkIn: Timestamp;
  checkOut: Timestamp | null;
  date: string;
}

<<<<<<< HEAD
const { width: screenWidth } = Dimensions.get("window");
const SIDEBAR_WIDTH = 220;
const CHART_WIDTH = screenWidth > SIDEBAR_WIDTH ? screenWidth - SIDEBAR_WIDTH - 100 : 400;

=======
>>>>>>> 77244535c225289db5386e3d02e7e3733474121d
export default function Reports() {
  const router = useRouter();
  const pathname = usePathname();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

<<<<<<< HEAD
const handleExportExcel = async () => {
    try {
      // 1. Prepare Data
      const worksheetData = records.map(r => ({
        "Nurse Name": r.nurseName,
        "Date": r.date,
        "Check In": r.checkIn ? r.checkIn.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A",
        "Check Out": r.checkOut ? r.checkOut.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Ongoing",
        "Status": r.checkOut ? "Done" : "Active"
      }));

      // 2. Import style library dynamically to avoid "Module Not Found" errors
      let XLSX_STYLE: any;
      try {
        XLSX_STYLE = require('xlsx-style');
      } catch (e) {
        XLSX_STYLE = XLSX; // Fallback to standard XLSX if styling lib isn't installed
      }

      const worksheet = XLSX_STYLE.utils.json_to_sheet(worksheetData);

      // 3. Apply Professional Styling
      const headerStyle = {
        fill: { fgColor: { rgb: "1A73E8" } }, // Deep Blue
        font: { color: { rgb: "FFFFFF" }, bold: true }, // White Bold
        alignment: { horizontal: "center", vertical: "center" }
      };

      const range = XLSX_STYLE.utils.decode_range(worksheet['!ref'] || 'A1:E1');
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX_STYLE.utils.encode_cell({ r: 0, c: C });
        if (worksheet[address]) {
          worksheet[address].s = headerStyle;
        }
      }

      const workbook = XLSX_STYLE.utils.book_new();
      XLSX_STYLE.utils.book_append_sheet(workbook, worksheet, "Attendance");

      const wbout = XLSX_STYLE.write(workbook, { type: 'base64', bookType: 'xlsx' });

      // 4. Export Logic
      if (Platform.OS === 'web') {
        const byteCharacters = atob(wbout);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
        const blob = new Blob([new Uint8Array(byteNumbers)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'Attendance_Report.xlsx';
        link.click();
      } else {
        const fs = FileSystem as any;
        const fileUri = fs.documentDirectory + 'Attendance_Report.xlsx';
        await fs.writeAsStringAsync(fileUri, wbout, { encoding: fs.EncodingType.Base64 });
        await Sharing.shareAsync(fileUri);
      }
    } catch (error) {
      console.error("Export Error:", error);
      Alert.alert("Export Error", "Failed to generate styled Excel file.");
    }
  };

=======
>>>>>>> 77244535c225289db5386e3d02e7e3733474121d
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

<<<<<<< HEAD
  const getWeeklyData = () => {
    const dayCounts: { [key: string]: number } = {
      "Mon": 0, "Tue": 0, "Wed": 0, "Thu": 0, "Fri": 0, "Sat": 0, "Sun": 0
    };
    records.forEach(record => {
      if (record.checkIn) {
        const date = record.checkIn.toDate();
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        if (dayCounts[dayName] !== undefined) dayCounts[dayName] += 1;
      }
    });
    return Object.values(dayCounts);
  };

=======
>>>>>>> 77244535c225289db5386e3d02e7e3733474121d
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
<<<<<<< HEAD
      <View style={styles.sidebar}>
        <View>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}><Ionicons name="shield-checkmark" size={18} color="#fff" /></View>
=======
      {/* SIDEBAR - Unified with Dashboard/Nurses */}
      <View style={styles.sidebar}>
        <View>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}><Ionicons name="shield-checkmark" size={20} color="#fff" /></View>
>>>>>>> 77244535c225289db5386e3d02e7e3733474121d
            <Text style={styles.logoText}>ShiftManager</Text>
          </View>
          
          <NavItem icon="grid" label="Dashboard" active={pathname === '/admin/dashboard'} onPress={() => router.push('/admin/dashboard')} />
          <NavItem icon="people" label="Nurses" active={pathname === '/admin/manageNurse'} onPress={() => router.push('/admin/manageNurse')} />
          <NavItem icon="calendar" label="Schedules" active={pathname === '/admin/schedule'} onPress={() => router.push('/admin/schedule')} />
<<<<<<< HEAD
          <NavItem icon="bar-chart" label="Reports" active={true} />
=======
          <NavItem icon="bar-chart" label="Reports" active={pathname === '/admin/reports'} onPress={() => router.push('/admin/reports')} />
>>>>>>> 77244535c225289db5386e3d02e7e3733474121d
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

<<<<<<< HEAD
      <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Attendance Reports</Text>
            <Text style={styles.headerSubtitle}>Real-time activity & visual trends</Text>
          </View>

          <TouchableOpacity onPress={() => router.push('/admin/profile')} style={styles.profileBox}>
            <View style={styles.profileTextWrap}>
              <Text style={styles.adminName}>Administrator</Text>
              <Text style={styles.adminRole}>Super User</Text>
            </View>
            <View style={styles.profileCircle}>
              <Text style={styles.profileInitial}>A</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.trendsCard}>
          <View style={styles.tableTopHeader}>
            <View>
              <Text style={styles.sectionTitle}>Weekly Attendance Trend</Text>
              <Text style={styles.headerSubtitle}>Total check-ins per day</Text>
            </View>
            <View style={styles.totalBadge}>
              <Text style={styles.totalBadgeText}>{records.length} Total Logs</Text>
            </View>
          </View>
          
          <LineChart
            data={{
              labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
              datasets: [{ 
                data: getWeeklyData(),
                color: (opacity = 1) => `rgba(26, 115, 232, ${opacity})`,
                strokeWidth: 3
              }]
            }}
            width={CHART_WIDTH}
            height={220}
            chartConfig={chartConfig}
            bezier
            fromZero={true}
            style={styles.chart}
          />
        </View>

        <View style={styles.moduleGrid}>
          <TouchableOpacity style={styles.moduleCard} onPress={() => router.push('/admin/payroll')}>
            <View style={[styles.moduleIcon, { backgroundColor: '#10B981' }]}>
              <Ionicons name="calculator" size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.moduleTitle}>Payroll & Hours</Text>
              <Text style={styles.moduleSub}>Calculate total worked hours</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.moduleCard} onPress={() => router.push('/admin/performance')}>
            <View style={[styles.moduleIcon, { backgroundColor: '#F59E0B' }]}>
              <Ionicons name="ribbon" size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.moduleTitle}>Nurse Performance</Text>
              <Text style={styles.moduleSub}>Ratings & Punctuality scores</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </TouchableOpacity>
        </View>

        <View style={styles.tableBody}>
          <View style={styles.tableTopHeader}>
            <Text style={styles.sectionTitle}>Recent Logs</Text>
            <TouchableOpacity style={styles.exportBtn} onPress={handleExportExcel}>
              <Ionicons name="download-outline" size={16} color="#fff" />
              <Text style={styles.exportBtnText}>Export Excel</Text>
            </TouchableOpacity>
          </View>

=======
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
>>>>>>> 77244535c225289db5386e3d02e7e3733474121d
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
<<<<<<< HEAD
              scrollEnabled={false}
              keyExtractor={(item) => item.id}
=======
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
>>>>>>> 77244535c225289db5386e3d02e7e3733474121d
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
<<<<<<< HEAD
                        {item.checkOut ? 'Done' : 'Active'}
=======
                        {item.checkOut ? 'Completed' : 'Active'}
>>>>>>> 77244535c225289db5386e3d02e7e3733474121d
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            />
          )}
        </View>
<<<<<<< HEAD
      </ScrollView>
=======
      </View>
>>>>>>> 77244535c225289db5386e3d02e7e3733474121d
    </View>
  );
}

const NavItem = ({ icon, label, active, onPress }: any) => (
  <TouchableOpacity onPress={onPress} style={[styles.navItem, active && styles.navItemActive]}>
    <Ionicons name={icon} size={18} color={active ? '#1a73e8' : '#64748B'} />
    <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
  </TouchableOpacity>
);

<<<<<<< HEAD
const chartConfig = {
  backgroundGradientFrom: "#fff",
  backgroundGradientTo: "#fff",
  color: (opacity = 1) => `rgba(26, 115, 232, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
  strokeWidth: 2,
  propsForDots: { r: "4", strokeWidth: "2", stroke: "#1a73e8" },
  decimalPlaces: 0,
};

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#F8FAFC' },
=======
const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#F8FAFC' },
  
  // Sidebar (Unified)
>>>>>>> 77244535c225289db5386e3d02e7e3733474121d
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
<<<<<<< HEAD
  mainContent: { flex: 1, padding: 32 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#0F172A' },
  headerSubtitle: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },
=======

  // Main Content
  mainContent: { flex: 1, padding: 32 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#0F172A' },
  headerSubtitle: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },
  
  exportBtn: { backgroundColor: '#1e293b', flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, gap: 8 },
  exportBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

>>>>>>> 77244535c225289db5386e3d02e7e3733474121d
  profileBox: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  profileTextWrap: { alignItems: 'flex-end' },
  adminName: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  adminRole: { fontSize: 11, fontWeight: '600', color: '#94A3B8' },
  profileCircle: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' },
  profileInitial: { color: '#fff', fontWeight: '800', fontSize: 14 },
<<<<<<< HEAD
  trendsCard: { 
    backgroundColor: '#fff', 
    padding: 24, 
    borderRadius: 24, 
    marginBottom: 25, 
    borderWidth: 1, 
    borderColor: '#F1F5F9',
    ...Platform.select({
      web: { boxShadow: '0px 2px 15px rgba(0,0,0,0.05)' },
      default: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 2 }
    })
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginBottom: 5 },
  chart: { borderRadius: 16, marginVertical: 8, paddingRight: 40 },
  totalBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  totalBadgeText: { color: '#1a73e8', fontSize: 12, fontWeight: '800' },
  moduleGrid: { flexDirection: 'row', gap: 20, marginBottom: 30 },
  moduleCard: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 15, borderWidth: 1, borderColor: '#F1F5F9' },
  moduleIcon: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  moduleTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  moduleSub: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  tableBody: { backgroundColor: '#fff', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 40 },
  tableTopHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  exportBtn: { backgroundColor: '#1e293b', flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, gap: 8 },
  exportBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
=======

  // Summary Strip
  summaryStrip: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 30, borderWidth: 1, borderColor: '#F1F5F9' },
  summaryItem: { flex: 1, paddingLeft: 24 },
  summaryVal: { fontSize: 24, fontWeight: '900', color: '#0F172A' },
  summaryLab: { fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Table Styling
  tableBody: { flex: 1, backgroundColor: '#fff', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#F1F5F9' },
>>>>>>> 77244535c225289db5386e3d02e7e3733474121d
  tableHeader: { flexDirection: 'row', paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  colLabel: { fontSize: 11, fontWeight: '800', color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  nurseText: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  dateText: { fontSize: 12, color: '#94A3B8', fontWeight: '600', marginTop: 2 },
  timeText: { fontSize: 14, fontWeight: '600', color: '#475569' },
<<<<<<< HEAD
=======
  
>>>>>>> 77244535c225289db5386e3d02e7e3733474121d
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '800' },
  dot: { width: 6, height: 6, borderRadius: 3 }
});