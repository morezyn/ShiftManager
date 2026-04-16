import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router'; // Import useRouter
import { db } from '../../config/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';

interface Nurse {
  id: string;
  fullName: string;
  email: string;
  department: string;
  rfidTag: string;
}

export default function ManageNurses() {
  const router = useRouter(); // Initialize router
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [selectedNurse, setSelectedNurse] = useState<Nurse | null>(null);
  const [isEditModalVisible, setEditModalVisible] = useState(false);

  // READ: Fetch nurses in real-time
  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "nurse"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const nurseList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Nurse[];
      setNurses(nurseList);
    });
    return () => unsubscribe();
  }, []);

  // UPDATE: Save changes to Firestore
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
        Alert.alert("Success", "Nurse profile updated.");
      } catch (error) {
        Alert.alert("Error", "Could not update nurse.");
      }
    }
  };

  // DELETE: Remove from Firestore
  const handleDelete = (id: string) => {
    Alert.alert("Delete Nurse", "Are you sure? This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          await deleteDoc(doc(db, "users", id));
      }}
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.header}>Manage Nurses</Text>
      </View>

      <FlatList
        data={nurses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={styles.nurseCard}>
            <View>
              <Text style={styles.nurseName}>{item.fullName}</Text>
              <Text style={styles.nurseDept}>{item.department} | {item.email}</Text>
              {item.rfidTag ? (
                <Text style={styles.tagLabel}>Tag: {item.rfidTag}</Text>
              ) : (
                <Text style={[styles.tagLabel, {color: '#d93025'}]}>No Tag Linked</Text>
              )}
            </View>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => { setSelectedNurse(item); setEditModalVisible(true); }}>
                <Text style={styles.editBtn}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Text style={styles.deleteBtn}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Edit Modal remains the same */}
      <Modal visible={isEditModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Nurse Profile</Text>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput 
              style={styles.input} 
              value={selectedNurse?.fullName} 
              onChangeText={(txt) => setSelectedNurse(prev => prev ? {...prev, fullName: txt} : null)}
            />
            <Text style={styles.inputLabel}>Department</Text>
            <TextInput 
              style={styles.input} 
              value={selectedNurse?.department} 
              onChangeText={(txt) => setSelectedNurse(prev => prev ? {...prev, department: txt} : null)}
            />
            <Text style={styles.inputLabel}>RFID Tag ID</Text>
            <TextInput 
              style={styles.input} 
              value={selectedNurse?.rfidTag} 
              onChangeText={(txt) => setSelectedNurse(prev => prev ? {...prev, rfidTag: txt} : null)}
              placeholder="Scan or type Tag ID"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate}>
                <Text style={{color: '#fff', fontWeight: 'bold'}}>Save Changes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModalVisible(false)}>
                <Text style={{color: '#5f6368'}}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8f9fa' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 25, marginTop: 10 },
  backButton: { marginRight: 15, padding: 8, borderRadius: 8, backgroundColor: '#eee' },
  backButtonText: { fontWeight: 'bold', color: '#202124' },
  header: { fontSize: 24, fontWeight: 'bold', color: '#202124' },
  
  nurseCard: { 
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 12, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 2
  },
  nurseName: { fontSize: 18, fontWeight: 'bold', color: '#202124' },
  nurseDept: { color: '#5f6368', marginTop: 2 },
  tagLabel: { fontSize: 12, marginTop: 5, color: '#1a73e8', fontWeight: '600' },

  actions: { flexDirection: 'row', gap: 20, alignItems: 'center' },
  editBtn: { color: '#1a73e8', fontWeight: 'bold' },
  deleteBtn: { color: '#d93025', fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', padding: 30, borderRadius: 20, width: '90%', maxWidth: 450 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#202124' },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#5f6368', marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#dadce0', padding: 12, borderRadius: 8, marginBottom: 15, fontSize: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  saveBtn: { backgroundColor: '#1a73e8', padding: 15, borderRadius: 8, flex: 1, alignItems: 'center', marginRight: 10 },
  cancelBtn: { backgroundColor: '#f1f3f4', padding: 15, borderRadius: 8, flex: 1, alignItems: 'center' }
});