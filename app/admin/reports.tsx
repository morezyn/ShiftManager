import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { db } from '../../config/firebase';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';

interface AttendanceRecord {
  id: string;
  nurseName: string;
  checkIn: Timestamp;
  checkOut: Timestamp | null;
  date: string;
  status: 'On Duty' | 'Completed';
}

export default function Reports() {
  const router = useRouter();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    // Query attendance records ordered by latest check-in
    const q = query(collection(db, "attendance"), orderBy("checkIn", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AttendanceRecord[];
      setRecords(data);
    });

    return () => unsubscribe();
  }, []);

  const formatTime = (timestamp: Timestamp | null) => {
    if (!timestamp) return '--:--';
    return timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleExport = () => {
    Alert.alert("Export", "Attendance log has been prepared for export (CSV).");
    // Logic for expo-sharing or file-system writing goes here
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Attendance Reports</Text>
        </View>
        <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
          <Text style={styles.exportBtnText}>Export CSV</Text>
        </TouchableOpacity>
      </View>

      {/* Table Header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.columnLabel, { flex: 2 }]}>Nurse Name</Text>
        <Text style={[styles.columnLabel, { flex: 1 }]}>Check In</Text>
        <Text style={[styles.columnLabel, { flex: 1 }]}>Check Out</Text>
        <Text style={[styles.columnLabel, { flex: 1, textAlign: 'right' }]}>Status</Text>
      </View>

      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.recordRow}>
            <View style={{ flex: 2 }}>
              <Text style={styles.nurseName}>{item.nurseName}</Text>
              <Text style={styles.dateLabel}>{item.date}</Text>
            </View>
            
            <Text style={[styles.timeText, { flex: 1 }]}>{formatTime(item.checkIn)}</Text>
            
            <Text style={[styles.timeText, { flex: 1 }]}>{formatTime(item.checkOut)}</Text>
            
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <View style={[
                styles.statusBadge, 
                { backgroundColor: item.checkOut ? '#e8f0fe' : '#e6f4ea' }
              ]}>
                <Text style={[
                  styles.statusText, 
                  { color: item.checkOut ? '#1a73e8' : '#1e8e3e' }
                ]}>
                  {item.checkOut ? 'Finished' : 'Active'}
                </Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No attendance records found.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  headerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 30,
    marginTop: 10 
  },
  backButton: { padding: 10, marginRight: 10, backgroundColor: '#f1f3f4', borderRadius: 8 },
  backBtnText: { fontSize: 20, fontWeight: 'bold' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#202124' },
  exportBtn: { backgroundColor: '#1a73e8', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  exportBtnText: { color: '#fff', fontWeight: 'bold' },

  tableHeader: { 
    flexDirection: 'row', 
    paddingBottom: 10, 
    borderBottomWidth: 2, 
    borderBottomColor: '#f1f3f4',
    marginBottom: 10
  },
  columnLabel: { color: '#5f6368', fontWeight: 'bold', fontSize: 13, textTransform: 'uppercase' },

  recordRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f1f3f4' 
  },
  nurseName: { fontSize: 16, fontWeight: '600', color: '#202124' },
  dateLabel: { fontSize: 12, color: '#70757a', marginTop: 2 },
  timeText: { fontSize: 15, color: '#3c4043' },
  
  statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: '#9aa0a6', marginTop: 50, fontSize: 16 }
});