import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '../../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

export default function NurseProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [userData, setUserData] = useState({ 
    fullName: '', 
    email: '', 
    department: 'General', 
    rfidTag: '---', 
    uid: '' 
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserData({
              fullName: data.fullName || 'Nurse User',
              email: user.email || '',
              department: data.department || 'General',
              rfidTag: data.rfidTag || 'Not Assigned',
              uid: user.uid,
            });
          }
        } catch (error) {
          console.error("Fetch error:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchProfile();
  }, []);

  const handleUpdateProfile = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setUpdating(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { fullName: userData.fullName });
      Alert.alert("Success", "Profile updated.");
    } catch (error) {
      Alert.alert("Error", "Update failed.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator color="#1a73e8" /></View>;
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account Settings</Text>
        <TouchableOpacity onPress={handleUpdateProfile} disabled={updating} style={styles.saveActionBtn}>
          {updating ? <ActivityIndicator size="small" color="#1a73e8" /> : <Text style={styles.doneBtn}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileHeader}>
          <View style={styles.miniAvatar}>
            <Text style={styles.avatarLetter}>{userData.fullName.charAt(0)}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userData.fullName}</Text>
            <Text style={styles.profileEmail}>{userData.email}</Text>
          </View>
        </View>

        <View style={styles.compactStats}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Unit</Text>
            <Text style={styles.statValue}>{userData.department}</Text>
          </View>
          <View style={[styles.statBox, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#F1F5F9' }]}>
            <Text style={styles.statLabel}>Role</Text>
            <Text style={styles.statValue}>Nurse</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>RFID</Text>
            <Text style={styles.statValue}>{userData.rfidTag !== 'Not Assigned' ? 'Active' : 'None'}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Personal Details</Text>
        <View style={styles.card}>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput 
              style={styles.inlineInput}
              value={userData.fullName}
              onChangeText={(t) => setUserData({...userData, fullName: t})}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Email</Text>
            <Text style={styles.readOnlyText}>{userData.email}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>System Access</Text>
        <View style={styles.card}>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>RFID Identifier</Text>
            <Text style={styles.readOnlyText}>{userData.rfidTag}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>System UID</Text>
            <Text style={[styles.readOnlyText, { fontSize: 10 }]}>{userData.uid}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.logoutBtn}
          onPress={async () => {
            await auth.signOut();
            router.replace('/');
          }}
        >
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingHorizontal: 20, paddingBottom: 10, backgroundColor: '#F8FAFC' },
  backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  saveActionBtn: { width: 40, alignItems: 'flex-end' },
  doneBtn: { color: '#1a73e8', fontWeight: '800', fontSize: 14 },
  profileHeader: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
  miniAvatar: { width: 80, height: 80, borderRadius: 28, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { fontSize: 32, fontWeight: '900', color: '#fff' },
  profileInfo: { alignItems: 'center', marginTop: 15 },
  profileName: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
  profileEmail: { fontSize: 13, color: '#64748B', fontWeight: '500', marginTop: 2 },
  compactStats: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 20, paddingVertical: 15, marginBottom: 30, borderWidth: 1, borderColor: '#F1F5F9' },
  statBox: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' },
  statValue: { fontSize: 14, fontWeight: '700', color: '#334155', marginTop: 4 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 10, marginLeft: 4 },
  card: { backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 25 },
  divider: { height: 1, backgroundColor: '#F8FAFC', marginHorizontal: 16 },
  inputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  inlineInput: { flex: 1, textAlign: 'right', fontSize: 14, fontWeight: '700', color: '#0F172A' },
  readOnlyText: { fontSize: 14, fontWeight: '600', color: '#94A3B8' },
  logoutBtn: { marginTop: 10, padding: 20, alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: '#FEE2E2', marginBottom: 40 },
  logoutText: { color: '#EF4444', fontWeight: '800', fontSize: 15 }
});