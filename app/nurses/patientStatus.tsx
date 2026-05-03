import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  StatusBar, 
  Platform, 
  Modal, 
  TextInput, 
  Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '../../config/firebase';
import { doc, onSnapshot, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

interface Observation {
  text: string;
  nurseName: string;
  timestamp: string;
}

interface PatientData {
  id: string;
  name: string;
  age: number;
  condition: string;
  gender: string;
  heartRate?: string;
  bloodOxygen?: string;
  bloodPressure?: string;
  temperature?: string;
  observations?: Observation[];
}

export default function PatientStatus() {
  const router = useRouter();
  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Modal Visibility States
  const [isVitalsModalVisible, setVitalsModalVisible] = useState(false);
  const [isObsModalVisible, setObsModalVisible] = useState(false);
  const [isHistoryVisible, setHistoryVisible] = useState(false);

  // Form Input States
  const [hr, setHr] = useState('');
  const [spo2, setSpo2] = useState('');
  const [bp, setBp] = useState('');
  const [temp, setTemp] = useState('');
  const [observation, setObservation] = useState('');

  useEffect(() => {
    if (!user) return;

    // 1. Get the assigned patient ID from the nurse user document
    const nurseRef = doc(db, "users", user.uid);
    const unsubNurse = onSnapshot(nurseRef, (nurseSnap) => {
      const patientId = nurseSnap.data()?.assignedPatientId;

      if (patientId) {
        // 2. Listen to changes on the specific patient document
        const unsubPatient = onSnapshot(doc(db, "patients", patientId), (patientSnap) => {
          if (patientSnap.exists()) {
            const data = patientSnap.data();
            setPatient({ id: patientSnap.id, ...data } as PatientData);
            
            // Sync local input state with DB values
            setHr(data.heartRate || '');
            setSpo2(data.bloodOxygen || '');
            setBp(data.bloodPressure || '');
            setTemp(data.temperature || '');
            setError(null);
          } else {
            setError("Patient record not found.");
          }
          setLoading(false);
        });

        return () => unsubPatient();
      } else {
        setError("No patient is currently linked to your profile.");
        setLoading(false);
      }
    });

    return () => unsubNurse();
  }, [user]);

  const handleUpdateVitals = async () => {
    if (!patient) return;
    try {
      await updateDoc(doc(db, "patients", patient.id), {
        heartRate: hr,
        bloodOxygen: spo2,
        bloodPressure: bp,
        temperature: temp,
        lastUpdated: serverTimestamp()
      });
      setVitalsModalVisible(false);
      Alert.alert("Success", "Vitals updated successfully.");
    } catch (e) {
      Alert.alert("Error", "Could not save vitals.");
    }
  };

  const handleSaveObservation = async () => {
    if (!patient || !observation.trim()) return;
    try {
      const nurseName = user?.email?.split('@')[0] || "Nurse";
      await updateDoc(doc(db, "patients", patient.id), {
        observations: arrayUnion({
          text: observation,
          nurseName: nurseName.charAt(0).toUpperCase() + nurseName.slice(1),
          timestamp: new Date().toLocaleString([], { 
            dateStyle: 'medium', 
            timeStyle: 'short' 
          })
        })
      });
      setObservation('');
      setObsModalVisible(false);
      Alert.alert("Logged", "Observation added to history.");
    } catch (e) {
      Alert.alert("Error", "Could not save observation.");
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Patient Monitor</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* PATIENT SUMMARY CARD */}
        <View style={styles.patientCard}>
          <View style={styles.patientHeader}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarText}>{patient?.name?.charAt(0)}</Text>
            </View>
            <View style={styles.patientMeta}>
              <Text style={styles.patientName}>{patient?.name}</Text>
              <Text style={styles.patientSub}>{patient?.gender}, {patient?.age} yrs</Text>
            </View>
          </View>
          <View style={styles.conditionBox}>
            <Text style={styles.label}>PRIMARY DIAGNOSIS</Text>
            <Text style={styles.conditionText}>{patient?.condition || "General Monitoring"}</Text>
          </View>
        </View>

        {/* VITALS SECTION */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Real-time Vitals</Text>
          <TouchableOpacity onPress={() => setVitalsModalVisible(true)}>
            <Text style={styles.editLink}>Edit Vitals</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.vitalsGrid}>
          <VitalCard label="Heart Rate" value={patient?.heartRate || '--'} unit="BPM" icon="heart" color="#EF4444" />
          <VitalCard label="SpO2" value={patient?.bloodOxygen || '--'} unit="%" icon="water" color="#3B82F6" />
          <VitalCard label="Blood Pressure" value={patient?.bloodPressure || '--'} unit="mmHg" icon="speedometer" color="#10B981" />
          <VitalCard label="Temp" value={patient?.temperature || '--'} unit="°C" icon="thermometer" color="#F59E0B" />
        </View>

        {/* OBSERVATION ACTIONS */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, { flex: 1 }]} onPress={() => setObsModalVisible(true)}>
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Add Log</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionBtn, { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0' }]} 
            onPress={() => setHistoryVisible(true)}
          >
            <Ionicons name="journal" size={20} color="#1a73e8" />
            <Text style={[styles.actionBtnText, { color: '#1a73e8' }]}>View History</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* MODAL: ADD OBSERVATION (With Blur) */}
      <Modal visible={isObsModalVisible} animationType="slide" transparent>
        <BlurView intensity={30} tint="dark" style={styles.modalOverlay}>
          <View style={[styles.modalCard, { height: 450 }]}>
            <Text style={styles.modalTitle}>New Observation</Text>
            <TextInput 
              style={styles.textArea} 
              multiline 
              numberOfLines={10} 
              placeholder="Enter detailed status updates, symptoms, or nurse observations..."
              value={observation}
              onChangeText={setObservation}
              textAlignVertical="top"
              placeholderTextColor="#94A3B8"
            />
            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={() => setObsModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Discard</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveObservation} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>Save Entry</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>

      {/* MODAL: UPDATE VITALS (With Blur) */}
      <Modal visible={isVitalsModalVisible} animationType="fade" transparent>
        <BlurView intensity={30} tint="dark" style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Update Vitals</Text>
            <View style={styles.inputGrid}>
              <View style={styles.inputWrap}>
                <Text style={styles.inLabel}>Heart Rate</Text>
                <TextInput style={styles.input} value={hr} onChangeText={setHr} keyboardType="numeric" placeholder="e.g. 72" />
              </View>
              <View style={styles.inputWrap}>
                <Text style={styles.inLabel}>SpO2 %</Text>
                <TextInput style={styles.input} value={spo2} onChangeText={setSpo2} keyboardType="numeric" placeholder="e.g. 98" />
              </View>
              <View style={styles.inputWrap}>
                <Text style={styles.inLabel}>BP (mmHg)</Text>
                <TextInput style={styles.input} value={bp} onChangeText={setBp} placeholder="e.g. 120/80" />
              </View>
              <View style={styles.inputWrap}>
                <Text style={styles.inLabel}>Temp (°C)</Text>
                <TextInput style={styles.input} value={temp} onChangeText={setTemp} keyboardType="numeric" placeholder="e.g. 36.5" />
              </View>
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={() => setVitalsModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleUpdateVitals} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>

      {/* MODAL: HISTORY VIEW */}
      <Modal visible={isHistoryVisible} animationType="slide">
        <View style={styles.historyContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Observation Logs</Text>
            <TouchableOpacity onPress={() => setHistoryVisible(false)}>
              <Ionicons name="close" size={28} color="#0F172A" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {(!patient?.observations || patient.observations.length === 0) ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={50} color="#E2E8F0" />
                <Text style={styles.emptyText}>No observation logs found.</Text>
              </View>
            ) : (
              [...patient.observations].reverse().map((obs, index) => (
                <View key={index} style={styles.historyCard}>
                  <View style={styles.historyMeta}>
                    <Text style={styles.obsNurse}>RN. {obs.nurseName}</Text>
                    <Text style={styles.obsDate}>{obs.timestamp}</Text>
                  </View>
                  <Text style={styles.obsText}>{obs.text}</Text>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const VitalCard = ({ label, value, unit, icon, color }: any) => (
  <View style={styles.vCard}>
    <View style={[styles.iconCircle, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon} size={18} color={color} />
    </View>
    <Text style={styles.vLabel}>{label}</Text>
    <View style={styles.vValueRow}>
      <Text style={styles.vValue}>{value}</Text>
      <Text style={styles.vUnit}>{unit}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingTop: Platform.OS === 'ios' ? 60 : 40, 
    paddingHorizontal: 20, 
    paddingBottom: 20, 
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  scrollContent: { padding: 20 },
  patientCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 25 },
  patientHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  avatarLarge: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#1a73e8', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  patientMeta: { marginLeft: 15 },
  patientName: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  patientSub: { fontSize: 12, color: '#64748B', fontWeight: '600', marginTop: 2 },
  conditionBox: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12 },
  label: { fontSize: 9, fontWeight: '800', color: '#94A3B8', marginBottom: 4, letterSpacing: 0.5 },
  conditionText: { fontSize: 14, color: '#1E293B', fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  editLink: { color: '#1a73e8', fontWeight: '800', fontSize: 13 },
  vitalsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginBottom: 30 },
  vCard: { backgroundColor: '#fff', width: '48%', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  iconCircle: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  vLabel: { fontSize: 11, color: '#64748B', fontWeight: '700', marginTop: 10 },
  vValueRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
  vValue: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
  vUnit: { fontSize: 10, color: '#94A3B8', marginLeft: 3, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { flexDirection: 'row', backgroundColor: '#1a73e8', padding: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: '#fff', width: '90%', borderRadius: 28, padding: 25, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A', marginBottom: 20, textAlign: 'center' },
  textArea: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', padding: 15, borderRadius: 15, fontSize: 14, flex: 1, marginBottom: 20, color: '#1E293B', lineHeight: 20 },
  modalFooter: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, padding: 15, alignItems: 'center' },
  cancelBtnText: { color: '#64748B', fontWeight: '700' },
  saveBtn: { flex: 2, backgroundColor: '#1a73e8', padding: 15, borderRadius: 14, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '800' },
  inputGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  inputWrap: { width: '48%', marginBottom: 15 },
  inLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8', marginBottom: 5 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', padding: 12, borderRadius: 10, fontSize: 14, fontWeight: '700', color: '#1E293B' },
  historyContainer: { flex: 1, backgroundColor: '#fff' },
  historyCard: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  historyMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' },
  obsNurse: { fontSize: 11, fontWeight: '800', color: '#1a73e8', textTransform: 'uppercase' },
  obsDate: { fontSize: 10, color: '#94A3B8', fontWeight: '600' },
  obsText: { fontSize: 14, color: '#334155', lineHeight: 22, fontWeight: '500' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { textAlign: 'center', color: '#94A3B8', marginTop: 15, fontWeight: '600' },
  errorContainer: { padding: 40, alignItems: 'center' },
  errorText: { color: '#94A3B8', fontWeight: '600', textAlign: 'center' }
});