import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  ScrollView, 
  Dimensions,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '../../config/firebase';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from "react-native-chart-kit";

// Import File/Export tools
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';

// --- WEB COMPATIBILITY FIX ---
if (Platform.OS === 'web') {
  const ignoredWarnings = ['Unknown event handler property', 'Invalid DOM property', 'shadow* style props are deprecated', 'transform-origin'];
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (typeof args[0] === 'string' && ignoredWarnings.some(w => args[0].includes(w))) return;
    originalWarn(...args);
  };
}

interface AttendanceRecord {
  id: string;
  nurseName: string;
  checkIn: Timestamp;
  checkOut: Timestamp | null;
  date: string;
}

const { width: screenWidth } = Dimensions.get("window");
const SIDEBAR_WIDTH = 220;
const CHART_WIDTH = screenWidth > SIDEBAR_WIDTH ? screenWidth - SIDEBAR_WIDTH - 100 : 400;

export default function Reports() {
  const router = useRouter();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const handleExportExcel = async () => {
    try {
      const worksheetData = records.map(r => ({
        "Nurse Name": r.nurseName,
        "Date": r.date,
        "Check In": r.checkIn ? r.checkIn.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A",
        "Check Out": r.checkOut ? r.checkOut.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Ongoing",
        "Status": r.checkOut ? "Done" : "Active"
      }));

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
      const wbout = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });

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
      Alert.alert("Export Error", "Failed to generate Excel file.");
    }
  };

  useEffect(() => {
    const q = query(collection(db, "attendance"), orderBy("checkIn", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AttendanceRecord[];
      setRecords(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const getWeeklyData = () => {
    const dayCounts: { [key: string]: number } = { "Mon": 0, "Tue": 0, "Wed": 0, "Thu": 0, "Fri": 0, "Sat": 0, "Sun": 0 };
    records.forEach(record => {
      if (record.checkIn) {
        const dayName = record.checkIn.toDate().toLocaleDateString('en-US', { weekday: 'short' });
        if (dayCounts[dayName] !== undefined) dayCounts[dayName] += 1;
      }
    });
    return Object.values(dayCounts);
  };

  const formatTime = (ts: Timestamp | null) => ts ? ts.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '--:--';

  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <View>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}><Ionicons name="shield-checkmark" size={18} color="#fff" /></View>
            <Text style={styles.logoText}>ShiftManager</Text>
          </View>
          
          <NavItem icon="grid" label="Dashboard" onPress={() => router.push('/admin/dashboard')} />
          <NavItem icon="people" label="Nurses" onPress={() => router.push('/admin/manageNurse')} />
          <NavItem icon="calendar" label="Schedules" onPress={() => router.push('/admin/schedule')} />
          <NavItem icon="bar-chart" label="Reports" active={true} />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={() => signOut(auth).then(() => router.replace('/'))}>
          <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
      

      <ScrollView style={styles.mainContent}>
        <Text style={styles.headerTitle}>Attendance Reports</Text>
        
        <View style={styles.trendsCard}>
          <Text style={styles.sectionTitle}>Weekly Attendance Trend</Text>
          <LineChart
            data={{ labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], datasets: [{ data: getWeeklyData() }] }}
            width={CHART_WIDTH}
            height={220}
            chartConfig={chartConfig}
            bezier
          />
        </View>

        <View style={styles.tableBody}>
          <View style={styles.tableTopHeader}>
            <Text style={styles.sectionTitle}>Recent Logs</Text>
            
            {/* Added Payroll and Performance buttons here */}
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.mgmtBtn} onPress={() => router.push('/admin/payroll')}>
                <Ionicons name="calculator" size={16} color="#475569" />
                <Text style={styles.mgmtBtnText}>Payroll</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.mgmtBtn} onPress={() => router.push('/admin/performance')}>
                <Ionicons name="ribbon" size={16} color="#475569" />
                <Text style={styles.mgmtBtnText}>Performance</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.exportBtn} onPress={handleExportExcel}>
                <Ionicons name="download-outline" size={16} color="#fff" />
                <Text style={styles.exportBtnText}>Export Excel</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <FlatList
            data={records}
            scrollEnabled={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <View style={{ flex: 2 }}>
                  <Text style={styles.nurseText}>{item.nurseName}</Text>
                  <Text style={styles.dateText}>{item.date}</Text>
                </View>
                <Text style={[styles.timeText, { flex: 1 }]}>{formatTime(item.checkIn)}</Text>
                <Text style={[styles.timeText, { flex: 1 }]}>{formatTime(item.checkOut)}</Text>
              </View>
            )}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const NavItem = ({ icon, label, active, onPress }: any) => (
  <TouchableOpacity onPress={onPress} style={[styles.navItem, active && styles.navItemActive]}>
    <Ionicons name={icon} size={18} color={active ? '#1a73e8' : '#64748B'} />
    <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
  </TouchableOpacity>
);

const chartConfig = {
  backgroundGradientFrom: "#fff", backgroundGradientTo: "#fff",
  color: (opacity = 1) => `rgba(26, 115, 232, ${opacity})`,
  decimalPlaces: 0,
};

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
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#0F172A', marginBottom: 25 },
  trendsCard: { backgroundColor: '#fff', padding: 24, borderRadius: 24, marginBottom: 25, borderWidth: 1, borderColor: '#F1F5F9' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginBottom: 15 },
  tableBody: { backgroundColor: '#fff', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#F1F5F9' },
  tableTopHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  buttonRow: { flexDirection: 'row', gap: 10 },
  exportBtn: { backgroundColor: '#1e293b', flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, gap: 8 },
  exportBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  mgmtBtn: { backgroundColor: '#F1F5F9', flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, gap: 8 },
  mgmtBtnText: { color: '#475569', fontWeight: '700', fontSize: 12 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  nurseText: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  dateText: { fontSize: 12, color: '#94A3B8', fontWeight: '600', marginTop: 2 },
  timeText: { fontSize: 14, fontWeight: '600', color: '#475569' },
});