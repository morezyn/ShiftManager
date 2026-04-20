import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { auth, db } from '../../config/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

interface Nurse {
  id: string;
  fullName: string;
  email: string;
  department: string;
  rfidTag: string;
}

export default function ManageNurses() {
  const router = useRouter();
  const pathname = usePathname();
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedNurse, setSelectedNurse] = useState<Nurse | null>(null);
  const [isEditModalVisible, setEditModalVisible] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "nurse"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const nurseList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Nurse[];
      setNurses(nurseList);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredNurses = nurses.filter(n => 
    n.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpdate = async () => {
    if (selectedNurse) {
      try {
        const nurseRef = doc(db, "users", selectedNurse.id);
        await updateDoc(nurseRef, {
          fullName: selectedNurse.fullName,
          department: selectedNurse.department,
          rfidTag: selectedNurse.rfidTag
        });
        setEditModalVisible(false);
        Alert.alert("Success", "Profile updated.");
      } catch (error) {
        Alert.alert("Error", "Update failed.");
      }
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Remove Nurse", "Delete this account permanently?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => await deleteDoc(doc(db, "users", id)) }
    ]);
  };

  const handleLogout = async () => {
    try { 
      await auth.signOut(); 
      router.replace('/'); 
    } catch (error) { console.error(error); }
  };

  return (
    <View style={styles.container}>
      {/* SIDEBAR - Unified */}
      <View style={styles.sidebar}>
        <View>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}><Ionicons name="shield-checkmark" size={20} color="#fff" /></View>
            <Text style={styles.logoText}>ShiftManager</Text>
          </View>
          
          <NavItem icon="grid" label="Dashboard" active={pathname === '/admin/dashboard'} onPress={() => router.push('/admin/dashboard')} />
          <NavItem icon="people" label="Nurses" active={pathname === '/admin/manageNurse'} onPress={() => router.push('/admin/manageNurse')} />
          <NavItem icon="calendar" label="Schedules" active={pathname === '/admin/schedule'} onPress={() => router.push('/admin/schedule')} />
          <NavItem icon="bar-chart" label="Reports" active={pathname === '/admin/reports'} onPress={() => router.push('/admin/reports')} />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* MAIN CONTENT */}
      <View style={styles.mainContent}>
        {/* TOP HEADER - Unified */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Nurse Directory</Text>
            <Text style={styles.headerSubtitle}>Manage staff credentials and RFID tags</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={16} color="#94A3B8" />
              <TextInput 
                placeholder="Search staff..." 
                style={styles.searchIn}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <TouchableOpacity onPress={() => router.push('/admin/profile')} style={styles.profileBox}>
              <View style={styles.profileTextWrap}>
                <Text style={styles.adminName}>Administrator</Text>
                <Text style={styles.adminRole}>Super User</Text>
              </View>
              <View style={styles.profileCircle}><Text style={styles.profileInitial}>A</Text></View>
            </TouchableOpacity>
          </View>
        </View>

        {/* LIST CONTAINER */}
        <View style={styles.listCard}>
          <View style={styles.tableHead}>
            <Text style={[styles.headLabel, { flex: 2 }]}>Staff Member</Text>
            <Text style={[styles.headLabel, { flex: 1.5 }]}>Department</Text>
            <Text style={[styles.headLabel, { flex: 1.5 }]}>RFID Tag</Text>
            <Text style={[styles.headLabel, { width: 80, textAlign: 'right' }]}>Actions</Text>
          </View>

          {loading ? (
            <ActivityIndicator color="#1a73e8" style={{ marginTop: 50 }} />
          ) : (
            <FlatList
              data={filteredNurses}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.nurseRow}>
                  <View style={[styles.rowCell, { flex: 2 }]}>
                    <View style={styles.miniAvatar}><Text style={styles.avatarLetter}>{item.fullName.charAt(0)}</Text></View>
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.nurseName}>{item.fullName}</Text>
                      <Text style={styles.nurseEmail}>{item.email}</Text>
                    </View>
                  </View>
                  
                  <View style={[styles.rowCell, { flex: 1.5 }]}>
                    <Text style={styles.deptText}>{item.department}</Text>
                  </View>

                  <View style={[styles.rowCell, { flex: 1.5 }]}>
                    <View style={[styles.tagBadge, !item.rfidTag && styles.tagBadgeEmpty]}>
                      <Text style={[styles.tagText, !item.rfidTag && { color: '#EF4444' }]}>
                        {item.rfidTag || "Unassigned"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.actionCell}>
                    <TouchableOpacity onPress={() => { setSelectedNurse(item); setEditModalVisible(true); }} style={styles.editBtn}>
                      <Ionicons name="pencil" size={14} color="#1a73e8" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                      <Ionicons name="trash-outline" size={14} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </View>

      {/* COMPACT EDIT MODAL */}
      <Modal visible={isEditModalVisible} animationType="fade" transparent>
        <BlurView intensity={20} tint="dark" style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalCard}>
            <Text style={styles.modalTitle}>Update Staff Info</Text>
            
            <View style={styles.inputStack}>
              <Text style={styles.fieldLabel}>FULL NAME</Text>
              <TextInput 
                style={styles.modalIn}
                value={selectedNurse?.fullName}
                onChangeText={(t) => setSelectedNurse(p => p ? {...p, fullName: t} : null)}
              />
              
              <Text style={styles.fieldLabel}>DEPARTMENT</Text>
              <TextInput 
                style={styles.modalIn}
                value={selectedNurse?.department}
                onChangeText={(t) => setSelectedNurse(p => p ? {...p, department: t} : null)}
              />

              <Text style={styles.fieldLabel}>RFID TAG ID</Text>
              <View style={styles.tagInputWrap}>
                <Ionicons name="card-outline" size={18} color="#94A3B8" />
                <TextInput 
                  style={styles.tagIn}
                  value={selectedNurse?.rfidTag}
                  placeholder="Scan or type ID"
                  onChangeText={(t) => setSelectedNurse(p => p ? {...p, rfidTag: t} : null)}
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Discard</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleUpdate} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </BlurView>
      </Modal>
    </View>
  );
}

const NavItem = ({ icon, label, active, onPress }: any) => (
  <TouchableOpacity onPress={onPress} style={[styles.navItem, active && styles.navItemActive]}>
    <Ionicons name={icon} size={18} color={active ? '#1a73e8' : '#64748B'} />
    <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#F8FAFC' },
  
  // Sidebar
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

  // Main
  mainContent: { flex: 1, padding: 32 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#0F172A' },
  headerSubtitle: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },
  
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', width: 260, paddingHorizontal: 15, height: 42, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  searchIn: { flex: 1, marginLeft: 10, fontSize: 13, color: '#0F172A' },

  profileBox: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  profileTextWrap: { alignItems: 'flex-end' },
  adminName: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  adminRole: { fontSize: 11, fontWeight: '600', color: '#94A3B8' },
  profileCircle: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' },
  profileInitial: { color: '#fff', fontWeight: '800', fontSize: 14 },

  // List Card
  listCard: { flex: 1, backgroundColor: '#fff', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#F1F5F9' },
  tableHead: { flexDirection: 'row', paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  headLabel: { fontSize: 11, fontWeight: '800', color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: 0.5 },
  nurseRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  rowCell: { flexDirection: 'row', alignItems: 'center' },
  miniAvatar: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { color: '#1a73e8', fontWeight: '800', fontSize: 15 },
  nurseName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  nurseEmail: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  deptText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  tagBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tagBadgeEmpty: { backgroundColor: '#FEF2F2' },
  tagText: { fontSize: 11, fontWeight: '800', color: '#1a73e8' },
  actionCell: { width: 80, flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  editBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  deleteBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: '#fff', width: 360, padding: 28, borderRadius: 28 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A', marginBottom: 24, textAlign: 'center' },
  inputStack: { gap: 18 },
  fieldLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 1 },
  modalIn: { backgroundColor: '#F8FAFC', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', fontWeight: '600', color: '#1E293B' },
  tagInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  tagIn: { flex: 1, padding: 14, fontWeight: '700', color: '#1a73e8' },
  modalFooter: { flexDirection: 'row', gap: 12, marginTop: 32 },
  cancelBtn: { flex: 1, padding: 16, borderRadius: 14, alignItems: 'center', backgroundColor: '#F1F5F9' },
  cancelBtnText: { color: '#64748B', fontWeight: '700' },
  saveBtn: { flex: 1.5, padding: 16, borderRadius: 14, alignItems: 'center', backgroundColor: '#1a73e8' },
  saveBtnText: { color: '#fff', fontWeight: '800' }
});