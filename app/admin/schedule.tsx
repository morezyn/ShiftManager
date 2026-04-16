import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, TextInput, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { db } from '../../config/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, where } from 'firebase/firestore';
import { Calendar } from 'react-native-calendars'; // New Import

interface Nurse {
  id: string;
  fullName: string;
}

interface Shift {
  id: string;
  nurseId: string;
  nurseName: string;
  date: string;
  shiftType: string;
}

export default function ScheduleManager() {
  const router = useRouter();
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  
  // State for Calendar marking
  const [markedDates, setMarkedDates] = useState({});

  // Form State
  const [selectedNurse, setSelectedNurse] = useState<Nurse | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [shiftType, setShiftType] = useState('Morning');

  useEffect(() => {
    const nurseQuery = query(collection(db, "users"), where("role", "==", "nurse"));
    const unsubNurses = onSnapshot(nurseQuery, (snap) => {
      setNurses(snap.docs.map(d => ({ id: d.id, fullName: d.data().fullName })));
    });

    const shiftQuery = query(collection(db, "schedules"), orderBy("date", "asc"));
    const unsubShifts = onSnapshot(shiftQuery, (snap) => {
      const shiftData = snap.docs.map(d => ({ id: d.id, ...d.data() } as Shift));
      setShifts(shiftData);
      
      // Update calendar dots based on shifts
      let marks: any = {};
      shiftData.forEach(shift => {
        marks[shift.date] = { marked: true, dotColor: '#1a73e8' };
      });
      setMarkedDates(marks);
    });

    return () => { unsubNurses(); unsubShifts(); };
  }, []);

  const handleAddShift = async () => {
    if (!selectedNurse || !date) {
      Alert.alert("Error", "Please select a nurse and a date.");
      return;
    }

    try {
      await addDoc(collection(db, "schedules"), {
        nurseId: selectedNurse.id,
        nurseName: selectedNurse.fullName,
        date: date,
        shiftType: shiftType,
        createdAt: new Date().toISOString()
      });
      setModalVisible(false);
      setSelectedNurse(null);
    } catch (error) {
      Alert.alert("Error", "Failed to save shift.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Shift Scheduler</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ New Shift</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.calendarContainer}>
        <Calendar
          onDayPress={(day: any) => setDate(day.dateString)}
          markedDates={{
            ...markedDates,
            [date]: { selected: true, disableTouchEvent: true, selectedColor: '#1a73e8' }
          }}
          theme={{
            todayTextColor: '#1a73e8',
            arrowColor: '#1a73e8',
            indicatorColor: '#1a73e8',
            textDayFontWeight: '500',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: 'bold',
          }}
        />
      </View>

      <Text style={styles.sectionTitle}>Shifts for {date}</Text>

      <FlatList
        data={shifts.filter(s => s.date === date)}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>No shifts scheduled for this day.</Text>}
        renderItem={({ item }) => (
          <View style={styles.shiftCard}>
            <View style={styles.shiftMain}>
              <Text style={styles.nurseName}>{item.nurseName}</Text>
              <Text style={styles.shiftDetail}>{item.shiftType} Shift</Text>
            </View>
            <TouchableOpacity onPress={async () => await deleteDoc(doc(db, "schedules", item.id))}>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Modal - I've removed the Date TextInput since date is now picked via Calendar */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Assign Shift for {date}</Text>
            
            <Text style={styles.label}>Select Nurse</Text>
            <ScrollView style={styles.nurseSelector}>
              {nurses.map((nurse) => (
                <TouchableOpacity 
                  key={nurse.id} 
                  style={[styles.nurseOption, selectedNurse?.id === nurse.id && styles.nurseSelected]}
                  onPress={() => setSelectedNurse(nurse)}
                >
                  <Text style={selectedNurse?.id === nurse.id ? {color: '#fff'} : {}}>{nurse.fullName}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Shift Type</Text>
            <View style={styles.typeRow}>
              {['Morning', 'Afternoon', 'Night'].map((type) => (
                <TouchableOpacity 
                  key={type} 
                  style={[styles.typeBtn, shiftType === type && styles.typeBtnActive]} 
                  onPress={() => setShiftType(type)}
                >
                  <Text style={shiftType === type ? {color: '#fff'} : {}}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddShift}>
                <Text style={styles.saveText}>Save Shift</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backButton: { padding: 8, backgroundColor: '#eee', borderRadius: 8 },
  backBtnText: { fontWeight: 'bold' },
  title: { fontSize: 24, fontWeight: 'bold' },
  addBtn: { backgroundColor: '#1a73e8', padding: 10, borderRadius: 8 },
  addBtnText: { color: '#fff', fontWeight: 'bold' },
  
  calendarContainer: { backgroundColor: '#fff', borderRadius: 15, padding: 10, marginBottom: 20, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#5f6368' },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 20, fontStyle: 'italic' },

  shiftCard: { backgroundColor: '#fff', padding: 18, borderRadius: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
  shiftMain: { flex: 1 },
  nurseName: { fontSize: 17, fontWeight: 'bold' },
  shiftDetail: { color: '#5f6368', marginTop: 4 },
  deleteText: { color: '#d93025', fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', padding: 25, borderRadius: 20, width: '90%', maxWidth: 450 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#5f6368', marginBottom: 5, marginTop: 10 },
  nurseSelector: { maxHeight: 150, borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 5, marginBottom: 10 },
  nurseOption: { padding: 12, borderRadius: 5, marginBottom: 5 },
  nurseSelected: { backgroundColor: '#1a73e8' },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  typeBtnActive: { backgroundColor: '#34a853', borderColor: '#34a853' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 25 },
  saveBtn: { flex: 2, backgroundColor: '#1a73e8', padding: 15, borderRadius: 8, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: 'bold' },
  cancelBtn: { flex: 1, backgroundColor: '#eee', padding: 15, borderRadius: 8, alignItems: 'center' },
});