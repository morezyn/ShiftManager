import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '../../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore'; // Changed from updateDoc to setDoc
import { Ionicons } from '@expo/vector-icons';

export default function AdminProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({ 
    fullName: '', 
    username: '', 
    email: '', 
    role: 'Administrator', 
    department: '', 
    phone: '' 
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        // Fetching from the 'admin' collection using the Auth UID
        const docRef = doc(db, "admin", user.uid);
        const docSnap = await getDoc(docRef);
        
        setUserData({
          fullName: docSnap.exists() ? docSnap.data().fullName || '' : '',
          username: docSnap.exists() ? docSnap.data().username || '' : '',
          email: user.email || 'No email provided',
          role: docSnap.exists() ? docSnap.data().role || 'Administrator' : 'Administrator',
          department: docSnap.exists() ? docSnap.data().department || '' : '',
          phone: docSnap.exists() ? docSnap.data().phone || '' : '',
        });
      }
    };
    fetchProfile();
  }, []);

  const handleUpdateProfile = async () => {
    const user = auth.currentUser;
    if (!user) return;
    
    setLoading(true);
    try {
      // Using setDoc with { merge: true } ensures it creates the doc if it doesn't exist
      const adminDocRef = doc(db, "admin", user.uid);
      
      await setDoc(adminDocRef, { 
        fullName: userData.fullName,
        username: userData.username,
        department: userData.department,
        phone: userData.phone,
        role: userData.role // Ensure role is preserved
      }, { merge: true });
      
      Alert.alert("Success", "Profile saved successfully.");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleUpdateProfile} disabled={loading}>
          <Text style={[styles.doneBtn, loading && { opacity: 0.5 }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroSection}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarLetter}>{userData.username.charAt(0).toUpperCase() || 'A'}</Text>
          </View>
          <Text style={styles.heroName}>{userData.username || 'Admin'}</Text>
          <Text style={styles.heroRole}>{userData.role}</Text>
        </View>

        <Text style={styles.sectionTitle}>Personal Information</Text>
        <View style={styles.card}>
          {[
            { label: 'Username', key: 'username' },
            { label: 'Full Name', key: 'fullName' },
            { label: 'Department', key: 'department' },
            { label: 'Phone', key: 'phone' }
          ].map((item, index) => (
            <View key={item.key} style={[styles.inputRow, index !== 0 && styles.borderTop]}>
              <Text style={styles.inputLabel}>{item.label}</Text>
              <TextInput 
                style={styles.inlineInput}
                value={userData[item.key as keyof typeof userData]}
                onChangeText={(t) => setUserData({...userData, [item.key]: t})}
                placeholder={`Enter ${item.label.toLowerCase()}`}
              />
            </View>
          ))}
          <View style={[styles.inputRow, styles.borderTop]}>
            <Text style={styles.inputLabel}>Email</Text>
            <Text style={styles.readOnlyText}>{userData.email}</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 20 },
  header: { backgroundColor: '#fff', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 40, height: 40, backgroundColor: '#F1F5F9', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  doneBtn: { color: '#2563EB', fontWeight: '800', fontSize: 16 },
  heroSection: { alignItems: 'center', marginVertical: 30 },
  avatarContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  avatarLetter: { fontSize: 32, fontWeight: '900', color: '#fff' },
  heroName: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  heroRole: { fontSize: 14, color: '#64748B', marginTop: 4, fontWeight: '600' },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 10, marginLeft: 5, letterSpacing: 0.5 },
  card: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', paddingHorizontal: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18 },
  borderTop: { borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#64748B', width: 100 },
  inlineInput: { flex: 1, fontSize: 14, fontWeight: '600', color: '#0F172A', textAlign: 'right' },
  readOnlyText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#94A3B8', textAlign: 'right' }
});