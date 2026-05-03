import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, Alert, TextInput, Switch, ActivityIndicator } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { db, auth } from '../../config/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Calendar } from 'react-native-calendars';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

const FULL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function ScheduleManager() {
  const router = useRouter();
  const pathname = usePathname();
  const [nurses, setNurses] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [isModalVisible, setModalVisible] = useState(false);
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedNurse, setSelectedNurse] = useState<any>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState({ hr: '08', min: '00', period: 'AM' });
  const [endTime, setEndTime] = useState({ hr: '04', min: '00', period: 'PM' });

  useEffect(() => {
    const nurseQuery = query(collection(db, "users"), where("role", "==", "nurse"));
    const unsubNurses = onSnapshot(nurseQuery, (snap) => {
      setNurses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const shiftQuery = query(collection(db, "schedules"), orderBy("createdAt", "desc"));
    const unsubShifts = onSnapshot(shiftQuery, (snap) => {
      setShifts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => { unsubNurses(); unsubShifts(); };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace('/');
    } catch (error) {
      Alert.alert("Error", "Failed to sign out.");
    }
  };

  const selectedDayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
  const filteredShifts = shifts.filter(shift => 
    shift.isRecurring ? shift.dayOfWeek === selectedDayName : shift.date === date
  );

  const formatTimeStr = (t: any) => `${t.hr.padStart(2, '0')}:${t.min.padStart(2, '0')} ${t.period}`;

  const handleAddShift = async () => {
    if (!selectedNurse) return Alert.alert("Error", "Select a nurse");
    const sT = formatTimeStr(startTime);
    const eT = formatTimeStr(endTime);

    try {
      if (isRecurring) {
        if (selectedDays.length === 0) return Alert.alert("Error", "Select days");
        await Promise.all(selectedDays.map(day => addDoc(collection(db, "schedules"), {
          nurseId: selectedNurse.id, nurseName: selectedNurse.fullName,
          date: null, dayOfWeek: day, startTime: sT, endTime: eT, isRecurring: true, createdAt: new Date().toISOString()
        })));
      } else {
        await addDoc(collection(db, "schedules"), {
          nurseId: selectedNurse.id, nurseName: selectedNurse.fullName,
          date, dayOfWeek: selectedDayName, startTime: sT, endTime: eT, isRecurring: false, createdAt: new Date().toISOString()
        });
      }
      setModalVisible(false);
      setSelectedDays([]);
      setSelectedNurse(null);
    } catch (e) { Alert.alert("Error", "Save failed"); }
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

        <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* MAIN CONTENT */}
      <View style={styles.mainContent}>
        {/* HEADER - Unified with Profile Box */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Shift Assignments</Text>
            <Text style={styles.headerSubtitle}>Manage duty cycles and recurring schedules</Text>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}>
            <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addBtnText}>New Assignment</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/admin/profile')} style={styles.profileBox}>
              <View style={styles.profileTextWrap}>
                <Text style={styles.adminName}>Administrator</Text>
                <Text style={styles.adminRole}>Super User</Text>
              </View>
              <View style={styles.profileCircle}><Text style={styles.profileInitial}>A</Text></View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.contentGrid}>
          {/* LEFT: CALENDAR */}
          <View style={styles.calendarSection}>
            <View style={styles.glassCard}>
              <Calendar 
                onDayPress={(d: any) => setDate(d.dateString)} 
                markedDates={{[date]:{selected:true, selectedColor:'#1a73e8'}}}
                theme={{ 
                  backgroundColor: 'transparent',
                  calendarBackground: 'transparent',
                  monthTextColor: '#1E293B', 
                  textMonthFontWeight: '900', 
                  arrowColor: '#1a73e8',
                  todayTextColor: '#1a73e8',
                  dayTextColor: '#475569',
                }}
              />
            </View>
          </View>

          {/* RIGHT: LIST */}
          <View style={styles.listSection}>
            <Text style={styles.sectionHeading}>
              {new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', weekday: 'short' })}
            </Text>
            {loading ? (
              <ActivityIndicator color="#1a73e8" style={{marginTop: 50}} />
            ) : (
              <FlatList
                data={filteredShifts}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View style={styles.shiftRow}>
                    <View style={styles.nurseAvatar}><Text style={styles.avatarText}>{item.nurseName.charAt(0)}</Text></View>
                    <View style={{flex: 1, marginLeft: 12}}>
                      <Text style={styles.nurseName}>{item.nurseName}</Text>
                      <Text style={styles.timeRange}>{item.startTime} — {item.endTime}</Text>
                    </View>
                    {item.isRecurring && <View style={styles.recurringTag}><Text style={styles.recurringTagText}>WEEKLY</Text></View>}
                    <TouchableOpacity onPress={() => deleteDoc(doc(db, "schedules", item.id))} style={styles.deleteBtn}>
                      <Ionicons name="close-circle" size={20} color="#CBD5E1" />
                    </TouchableOpacity>
                  </View>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>No shifts assigned.</Text>}
              />
            )}
          </View>
        </View>
      </View>

      {/* CREATE MODAL */}
      <Modal visible={isModalVisible} animationType="fade" transparent>
        <BlurView intensity={30} tint="dark" style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Assign Shift</Text>
            
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Recurring Schedule</Text>
              <Switch value={isRecurring} onValueChange={setIsRecurring} trackColor={{ true: '#1a73e8' }} />
            </View>

            {isRecurring ? (
              <View style={styles.daySelection}>
                {FULL_DAYS.map((d, i) => (
                  <TouchableOpacity key={d} style={[styles.dayCircle, selectedDays.includes(d) && styles.activeDayCircle]} onPress={() => setSelectedDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])}>
                    <Text style={[styles.dayText, selectedDays.includes(d) && {color:'#fff'}]}>{DAYS_SHORT[i]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : <View style={styles.dateBanner}><Text style={styles.dateBannerText}>{date}</Text></View>}

            <TouchableOpacity style={styles.selector} onPress={() => setDropdownVisible(true)}>
              <Text style={[styles.selectorText, !selectedNurse && {color: '#94A3B8'}]}>
                {selectedNurse ? selectedNurse.fullName : "Select Nurse..."}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#64748B" />
            </TouchableOpacity>

            <View style={styles.timeGrid}>
              <View style={{flex:1}}>
                <Text style={styles.miniLabel}>START</Text>
                <View style={styles.timeRow}>
                  <TextInput style={styles.timeIn} value={startTime.hr} onChangeText={(t)=>setStartTime({...startTime, hr:t})} keyboardType="numeric" maxLength={2}/>
                  <Text>:</Text>
                  <TextInput style={styles.timeIn} value={startTime.min} onChangeText={(t)=>setStartTime({...startTime, min:t})} keyboardType="numeric" maxLength={2}/>
                </View>
              </View>
              <View style={{flex:1}}>
                <Text style={styles.miniLabel}>END</Text>
                <View style={styles.timeRow}>
                  <TextInput style={styles.timeIn} value={endTime.hr} onChangeText={(t)=>setEndTime({...endTime, hr:t})} keyboardType="numeric" maxLength={2}/>
                  <Text>:</Text>
                  <TextInput style={styles.timeIn} value={endTime.min} onChangeText={(t)=>setEndTime({...endTime, min:t})} keyboardType="numeric" maxLength={2}/>
                </View>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleAddShift}><Text style={styles.confirmBtnText}>Save Shift</Text></TouchableOpacity>
            </View>
          </View>
        </BlurView>

        <Modal visible={isDropdownVisible} transparent>
          <TouchableOpacity style={styles.dropOverlay} activeOpacity={1} onPress={() => setDropdownVisible(false)}>
            <View style={styles.dropList}>
              {nurses.map(n => (
                <TouchableOpacity key={n.id} style={styles.dropItem} onPress={() => { setSelectedNurse(n); setDropdownVisible(false); }}>
                  <Text style={styles.dropItemText}>{n.fullName}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
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
  
  // Sidebar (Unified)
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

  // Main Content
  mainContent: { flex: 1, padding: 32 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#0F172A' },
  headerSubtitle: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },
  
  addBtn: { backgroundColor: '#1a73e8', flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, gap: 8 },
  addBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },

  profileBox: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  profileTextWrap: { alignItems: 'flex-end' },
  adminName: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  adminRole: { fontSize: 11, fontWeight: '600', color: '#94A3B8' },
  profileCircle: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' },
  profileInitial: { color: '#fff', fontWeight: '800', fontSize: 14 },

  contentGrid: { flexDirection: 'row', gap: 30, flex: 1 },
  calendarSection: { flex: 1.2 },
  glassCard: { backgroundColor: '#fff', borderRadius: 24, padding: 10, borderWidth: 1, borderColor: '#F1F5F9' },
  
  listSection: { flex: 1 },
  sectionHeading: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 0.5 },
  shiftRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 14, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#F1F5F9' },
  nurseAvatar: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 14, fontWeight: '800', color: '#64748B' },
  nurseName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  timeRange: { fontSize: 11, color: '#94A3B8', fontWeight: '600', marginTop: 2 },
  recurringTag: { backgroundColor: '#F0FDF4', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 10 },
  recurringTagText: { color: '#16A34A', fontSize: 9, fontWeight: '800' },
  deleteBtn: { padding: 4 },
  emptyText: { textAlign: 'center', color: '#CBD5E1', marginTop: 40, fontSize: 13, fontWeight: '600' },

  // Modal (Enhanced for consistency)
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', width: 360, padding: 28, borderRadius: 28 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A', marginBottom: 24, textAlign: 'center' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  switchLabel: { fontSize: 14, fontWeight: '700', color: '#475569' },
  daySelection: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 24 },
  dayCircle: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  activeDayCircle: { backgroundColor: '#1a73e8', borderColor: '#1a73e8' },
  dayText: { fontSize: 11, fontWeight: '800', color: '#64748B' },
  dateBanner: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, marginBottom: 24, alignItems: 'center' },
  dateBannerText: { color: '#1a73e8', fontWeight: '800', fontSize: 13 },
  selector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 24 },
  selectorText: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  miniLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8', marginBottom: 8, letterSpacing: 0.5 },
  timeGrid: { flexDirection: 'row', gap: 18, marginBottom: 32 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeIn: { backgroundColor: '#F8FAFC', width: 50, padding: 12, borderRadius: 10, textAlign: 'center', fontWeight: '700', borderWidth: 1, borderColor: '#E2E8F0' },
  modalFooter: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, padding: 16, borderRadius: 14, alignItems: 'center', backgroundColor: '#F1F5F9' },
  cancelBtnText: { fontWeight: '700', color: '#64748B' },
  confirmBtn: { flex: 2, padding: 16, borderRadius: 14, alignItems: 'center', backgroundColor: '#1a73e8' },
  confirmBtnText: { fontWeight: '800', color: '#fff' },

  dropOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.1)', justifyContent: 'center', alignItems: 'center' },
  dropList: { width: 300, backgroundColor: '#fff', borderRadius: 18, padding: 10, elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
  dropItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  dropItemText: { fontSize: 14, fontWeight: '600', color: '#334155' }
});