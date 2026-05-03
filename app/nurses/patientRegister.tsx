import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  StatusBar,
  Modal,
  FlatList
} from 'react-native';
import { useRouter } from 'expo-router';
import { db } from '../../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const RELATIONSHIPS = ['Spouse', 'Parent', 'Sibling', 'Child', 'Relative', 'Friend', 'Guardian'];

export default function PatientRegister() {
  const router = useRouter();
  
  // State for all 13 form fields
  const [form, setForm] = useState({
    name: '',
    age: '',
    ethnicity: '',
    religion: '',
    currentAddress: '',
    permanentAddress: '',
    gender: '', 
    otherGender: '',
    condition: '',
    patientPhone: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelationship: ''
  });

  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showRelModal, setShowRelModal] = useState(false);

  const handleRegister = async () => {
    // Validation: Ensure core data is present
    if (!form.name || !form.gender || !form.currentAddress || !form.emergencyName || !form.emergencyRelationship) {
      Alert.alert("Missing Details", "Please complete Identity, Address, and Emergency Contact fields.");
      return;
    }

    setLoading(true);
    try {
      const finalGender = form.gender === 'Other' ? form.otherGender : form.gender;
      
      await addDoc(collection(db, "patients"), {
        ...form,
        gender: finalGender,
        age: parseInt(form.age) || 0,
        registeredAt: serverTimestamp(),
        status: 'Active'
      });
      
      setIsSuccess(true);
    } catch (error) {
      console.error("Firestore Error:", error);
      Alert.alert("Error", "Could not save patient data. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const renderGenderOption = (label: string) => {
    const isActive = form.gender === label;
    return (
      <TouchableOpacity 
        activeOpacity={0.8}
        style={[styles.genderTab, isActive && styles.genderTabActive]}
        onPress={() => setForm({ ...form, gender: label })}
      >
        <Text style={[styles.genderTabText, isActive && styles.genderTabTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* HEADER SECTION */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Patient Registration</Text>
          <Text style={styles.headerSubtitle}>Medical Profile & Demographics</Text>
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formCard}>
            
            {/* SECTION: PERSONAL IDENTITY */}
            <Text style={styles.sectionLabel}>PERSONAL IDENTITY</Text>
            
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="Full Name" 
                value={form.name}
                onChangeText={(val) => setForm({...form, name: val})}
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.genderContainer}>
              <View style={styles.segmentedControl}>
                {renderGenderOption('Male')}
                {renderGenderOption('Female')}
                {renderGenderOption('Other')}
              </View>
              {form.gender === 'Other' && (
                <View style={styles.compactOtherInput}>
                   <TextInput 
                    style={styles.input} 
                    placeholder="Specify other gender..." 
                    value={form.otherGender}
                    onChangeText={(val) => setForm({...form, otherGender: val})}
                  />
                </View>
              )}
            </View>

            <View style={styles.row}>
              <View style={[styles.inputWrapper, { flex: 0.4, marginRight: 12 }]}>
                <TextInput 
                  style={styles.input} 
                  placeholder="Age" 
                  keyboardType="numeric"
                  value={form.age}
                  onChangeText={(val) => setForm({...form, age: val})}
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <View style={[styles.inputWrapper, { flex: 1 }]}>
                <TextInput 
                  style={styles.input} 
                  placeholder="Ethnicity" 
                  value={form.ethnicity}
                  onChangeText={(val) => setForm({...form, ethnicity: val})}
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="book-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="Religion" 
                value={form.religion}
                onChangeText={(val) => setForm({...form, religion: val})}
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* SECTION: ADDRESS DETAILS */}
            <Text style={styles.sectionLabel}>ADDRESS DETAILS</Text>
            
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
              <Ionicons name="location-outline" size={18} color="#94A3B8" style={styles.inputIconTop} />
              <TextInput 
                style={[styles.input, styles.textArea]} 
                placeholder="Current Address" 
                multiline
                numberOfLines={2}
                value={form.currentAddress}
                onChangeText={(val) => setForm({...form, currentAddress: val})}
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
              <Ionicons name="home-outline" size={18} color="#94A3B8" style={styles.inputIconTop} />
              <TextInput 
                style={[styles.input, styles.textArea]} 
                placeholder="Permanent Address" 
                multiline
                numberOfLines={2}
                value={form.permanentAddress}
                onChangeText={(val) => setForm({...form, permanentAddress: val})}
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* SECTION: CONTACT INFO */}
            <Text style={styles.sectionLabel}>CONTACT INFO</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="phone-portrait-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="Patient's Phone Number" 
                keyboardType="phone-pad"
                value={form.patientPhone}
                onChangeText={(val) => setForm({...form, patientPhone: val})}
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* SECTION: EMERGENCY CONTACT */}
            <Text style={styles.sectionLabel}>EMERGENCY CONTACT</Text>
            
            <View style={styles.inputWrapper}>
              <Ionicons name="person-circle-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="Contact Person Name" 
                value={form.emergencyName}
                onChangeText={(val) => setForm({...form, emergencyName: val})}
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="Contact Person Number" 
                keyboardType="phone-pad"
                value={form.emergencyPhone}
                onChangeText={(val) => setForm({...form, emergencyPhone: val})}
                placeholderTextColor="#94A3B8"
              />
            </View>

            <TouchableOpacity 
              style={styles.inputWrapper} 
              activeOpacity={0.7}
              onPress={() => setShowRelModal(true)}
            >
              <Ionicons name="people-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
              <Text style={[styles.input, { color: form.emergencyRelationship ? '#1E293B' : '#94A3B8', paddingTop: 15 }]}>
                {form.emergencyRelationship || "Relationship to Patient"}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#94A3B8" />
            </TouchableOpacity>

            {/* SECTION: CLINICAL DETAILS */}
            <Text style={styles.sectionLabel}>CLINICAL DETAILS</Text>
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
              <Ionicons name="medkit-outline" size={18} color="#94A3B8" style={styles.inputIconTop} />
              <TextInput 
                style={[styles.input, styles.textArea]} 
                placeholder="Condition / Diagnosis" 
                multiline
                value={form.condition}
                onChangeText={(val) => setForm({...form, condition: val})}
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.submitBtn, loading && { opacity: 0.7 }]} 
            onPress={handleRegister} 
            disabled={loading}
          >
            <Text style={styles.submitBtnText}>{loading ? "Saving Record..." : "Register Patient"}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* RELATIONSHIP SELECTION MODAL (WITH BLUR) */}
      <Modal visible={showRelModal} transparent animationType="fade">
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill}>
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={() => setShowRelModal(false)}
          >
            <View style={styles.bottomSheet} onStartShouldSetResponder={() => true}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Relationship</Text>
                <TouchableOpacity onPress={() => setShowRelModal(false)}>
                  <Ionicons name="close-circle" size={28} color="#CBD5E1" />
                </TouchableOpacity>
              </View>
              
              <FlatList 
                data={RELATIONSHIPS}
                keyExtractor={(item) => item}
                showsVerticalScrollIndicator={false}
                renderItem={({item}) => (
                  <TouchableOpacity 
                    style={styles.relOption} 
                    onPress={() => {
                      setForm({...form, emergencyRelationship: item});
                      setShowRelModal(false);
                    }}
                  >
                    <Text style={[styles.relText, form.emergencyRelationship === item && styles.relTextActive]}>
                      {item}
                    </Text>
                    {form.emergencyRelationship === item && <Ionicons name="checkmark-circle" size={22} color="#1a73e8" />}
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </BlurView>
      </Modal>

      {/* SUCCESS POPUP */}
      <Modal visible={isSuccess} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark" size={40} color="#fff" />
            </View>
            <Text style={styles.successTitle}>Successfully Saved</Text>
            <Text style={styles.successMessage}>{form.name}'s profile is now active.</Text>
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={() => { setIsSuccess(false); router.back(); }}
            >
              <Text style={styles.modalButtonText}>Return to Dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBFDFF' },
  header: { 
    paddingTop: Platform.OS === 'ios' ? 50 : 30, 
    paddingHorizontal: 20, 
    paddingBottom: 20, 
    backgroundColor: '#fff', 
    flexDirection: 'row', 
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  backBtn: { width: 44, height: 44, backgroundColor: '#F8FAFC', borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  headerTextContainer: { marginLeft: 16 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
  headerSubtitle: { fontSize: 13, color: '#94A3B8', fontWeight: '600' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  formCard: { backgroundColor: '#fff', borderRadius: 28, padding: 20, borderWidth: 1, borderColor: '#F1F5F9' },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: '#CBD5E1', marginBottom: 12, marginTop: 18, letterSpacing: 1 },
  
  // INPUTS
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 18, borderWidth: 1.5, borderColor: '#F1F5F9', marginBottom: 12, paddingHorizontal: 16 },
  inputIcon: { marginRight: 12 },
  inputIconTop: { marginRight: 12, marginTop: 15 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, fontWeight: '600', color: '#1E293B' },
  row: { flexDirection: 'row' },
  textAreaWrapper: { alignItems: 'flex-start' },
  textArea: { height: 90, textAlignVertical: 'top' },
  
  // GENDER TABS
  genderContainer: { marginBottom: 12 },
  segmentedControl: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 14, padding: 4, height: 50 },
  genderTab: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
  genderTabActive: { backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  genderTabText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  genderTabTextActive: { color: '#1a73e8' },
  compactOtherInput: { marginTop: 8, paddingHorizontal: 4 },

  // BUTTONS
  submitBtn: { backgroundColor: '#1a73e8', padding: 20, borderRadius: 22, alignItems: 'center', marginTop: 25, elevation: 5 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  
  // MODAL & BLUR
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: '#fff', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25, maxHeight: '60%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  sheetTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
  relOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  relText: { fontSize: 16, fontWeight: '600', color: '#64748B' },
  relTextActive: { color: '#1a73e8', fontWeight: '800' },

  // SUCCESS OVERLAY
  successOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center' },
  successCard: { backgroundColor: '#fff', borderRadius: 32, padding: 30, alignItems: 'center', width: '85%' },
  successIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  successTitle: { fontSize: 22, fontWeight: '900', color: '#1E293B' },
  successMessage: { color: '#64748B', marginVertical: 10, textAlign: 'center' },
  modalButton: { backgroundColor: '#1E293B', paddingVertical: 16, borderRadius: 16, width: '100%', alignItems: 'center', marginTop: 15 },
  modalButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' }
});