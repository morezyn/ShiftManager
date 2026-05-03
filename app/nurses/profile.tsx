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
      
      {/* "NON-EXISTENT" TRANSPARENT HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Account Settings</Text>
        
        <TouchableOpacity onPress={handleUpdateProfile} disabled={updating} style={styles.saveActionBtn}>
          {updating ? (
            <ActivityIndicator size="small" color="#1a73e8" />
          ) : (
            <Text style={styles.doneBtn}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Profile Identity Section */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrapper}>
            <View style={styles.miniAvatar}>
              <Text style={styles.avatarLetter}>{userData.fullName.charAt(0)}</Text>
            </View>
            <TouchableOpacity style={styles.editAvatarBadge}>
              <Ionicons name="camera" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userData.fullName}</Text>
            <Text style={styles.profileEmail}>{userData.email}</Text>
          </View>
        </View>

        {/* Info Grid */}
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

        {/* Input Groups */}
        <Text style={styles.sectionTitle}>Profile Information</Text>
        <View style={styles.card}>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput 
              style={styles.inlineInput}
              value={userData.fullName}
              onChangeText={(t) => setUserData({...userData, fullName: t})}
              placeholder="Enter name"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Department</Text>
            <Text style={styles.readOnlyText}>{userData.department}</Text>
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

        <Text style={styles.sectionTitle}>Preferences & Security</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.actionRow} onPress={() => Alert.alert("Password", "Reset link sent.")}>
            <View style={[styles.iconBox, { backgroundColor: '#F0F9FF' }]}><Ionicons name="key" size={18} color="#0EA5E9" /></View>
            <Text style={styles.actionText}>Change Password</Text>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.actionRow}>
            <View style={[styles.iconBox, { backgroundColor: '#FDF2F8' }]}><Ionicons name="notifications" size={18} color="#DB2777" /></View>
            <Text style={styles.actionText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </TouchableOpacity>
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
  
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingTop: Platform.OS === 'ios' ? 60 : 40, 
    paddingHorizontal: 20, 
    paddingBottom: 10, 
    backgroundColor: '#F8FAFC', // Same as container to "vanish"
  },
  backBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 14, 
    backgroundColor: '#fff', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  headerTitle: { 
    fontSize: 16, 
    fontWeight: '800', 
    color: '#0F172A',
    letterSpacing: -0.3
  },
  saveActionBtn: {
    width: 40,
    alignItems: 'flex-end'
  },
  doneBtn: { 
    color: '#1a73e8', 
    fontWeight: '800', 
    fontSize: 14 
  },

  // Profile Header
  profileHeader: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
  avatarWrapper: { position: 'relative' },
  miniAvatar: { 
    width: 80, 
    height: 80, 
    borderRadius: 28, 
    backgroundColor: '#0F172A', 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4
  },
  avatarLetter: { fontSize: 32, fontWeight: '900', color: '#fff' },
  editAvatarBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#1a73e8',
    width: 28,
    height: 28,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#F8FAFC'
  },
  profileInfo: { alignItems: 'center', marginTop: 15 },
  profileName: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
  profileEmail: { fontSize: 13, color: '#64748B', fontWeight: '500', marginTop: 2 },

  // Stats Grid
  compactStats: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    paddingVertical: 15, 
    marginBottom: 30, 
    borderWidth: 1, 
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOpacity: 0.03,
    shadowRadius: 10
  },
  statBox: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 14, fontWeight: '700', color: '#334155', marginTop: 4 },

  // Form & Cards
  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 10, marginLeft: 4 },
  card: { backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 25 },
  divider: { height: 1, backgroundColor: '#F8FAFC', marginHorizontal: 16 },
  inputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  inlineInput: { flex: 1, textAlign: 'right', fontSize: 14, fontWeight: '700', color: '#0F172A' },
  readOnlyText: { fontSize: 14, fontWeight: '600', color: '#94A3B8' },

  actionRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  actionText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#334155' },

  logoutBtn: { marginTop: 10, padding: 20, alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: '#FEE2E2', marginBottom: 40 },
  logoutText: { color: '#EF4444', fontWeight: '800', fontSize: 15 }
});