import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '../../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

export default function AdminProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({ fullName: 'Admin User', email: '', role: 'Administrator' });

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData({
            fullName: docSnap.data().fullName || 'Admin User',
            email: user.email || '',
            role: docSnap.data().role || 'Administrator',
          });
        }
      }
    };
    fetchProfile();
  }, []);

  const handleUpdateProfile = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { fullName: userData.fullName });
      Alert.alert("Success", "Profile updated.");
    } catch (error) {
      Alert.alert("Error", "Update failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      {/* Tight Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile Settings</Text>
        <TouchableOpacity onPress={handleUpdateProfile} disabled={loading}>
          <Text style={[styles.doneBtn, loading && { opacity: 0.5 }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Compact Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.miniAvatar}>
            <Text style={styles.avatarLetter}>{userData.fullName.charAt(0)}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userData.fullName}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{userData.role}</Text>
            </View>
          </View>
        </View>

        {/* Compact Stats Grid */}
        <View style={styles.compactStats}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Status</Text>
            <Text style={styles.statValue}>Verified</Text>
          </View>
          <View style={[styles.statBox, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#F1F5F9' }]}>
            <Text style={styles.statLabel}>Level</Text>
            <Text style={styles.statValue}>Full Access</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>ID</Text>
            <Text style={styles.statValue}>#001</Text>
          </View>
        </View>

        {/* Input Card */}
        <View style={styles.card}>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput 
              style={styles.inlineInput}
              value={userData.fullName}
              onChangeText={(t) => setUserData({...userData, fullName: t})}
            />
          </View>
          <View style={[styles.inputRow, { borderTopWidth: 1, borderTopColor: '#F8FAFC' }]}>
            <Text style={styles.inputLabel}>Email</Text>
            <Text style={styles.readOnlyText}>{userData.email}</Text>
          </View>
        </View>

        {/* Security Section */}
        <Text style={styles.sectionTitle}>Security</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.actionRow}>
            <View style={styles.iconBox}><Ionicons name="key-outline" size={18} color="#64748B" /></View>
            <Text style={styles.actionText}>Change Password</Text>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionRow, { borderTopWidth: 1, borderTopColor: '#F8FAFC' }]}>
            <View style={styles.iconBox}><Ionicons name="shield-checkmark-outline" size={18} color="#64748B" /></View>
            <Text style={styles.actionText}>Two-Factor Auth</Text>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 16 },
  
  header: { 
    backgroundColor: '#fff', 
    paddingTop: 50, 
    paddingHorizontal: 20, 
    paddingBottom: 15, 
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  backBtn: { width: 32, height: 32, backgroundColor: '#F8FAFC', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  doneBtn: { color: '#1a73e8', fontWeight: '800', fontSize: 15 },

  // Profile Header
  profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: 5 },
  miniAvatar: { width: 60, height: 60, borderRadius: 20, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { fontSize: 24, fontWeight: '900', color: '#fff' },
  profileInfo: { marginLeft: 15 },
  profileName: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  badge: { backgroundColor: '#EFF6FF', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  badgeText: { color: '#1a73e8', fontWeight: '800', fontSize: 10, textTransform: 'uppercase' },

  // Stats Grid
  compactStats: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, paddingVertical: 12, marginBottom: 20, borderWidth: 1, borderColor: '#F1F5F9' },
  statBox: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 9, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' },
  statValue: { fontSize: 13, fontWeight: '700', color: '#334155', marginTop: 2 },

  // Form & Cards
  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
  card: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 20 },
  inputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  inlineInput: { flex: 1, textAlign: 'right', fontSize: 14, fontWeight: '700', color: '#0F172A' },
  readOnlyText: { fontSize: 14, fontWeight: '600', color: '#94A3B8' },

  actionRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  iconBox: { width: 30, height: 30, backgroundColor: '#F8FAFC', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  actionText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#334155' }
});