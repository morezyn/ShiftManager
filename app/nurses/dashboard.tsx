import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '../../config/firebase'; 
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

// 1. Define the Shift Interface
export interface Shift {
  id: string;
  nurseId: string;
  nurseName: string;
  date: string | null;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  createdAt: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function NurseDashboard() {
  const router = useRouter();
  const user = auth.currentUser;
  
  const [myShifts, setMyShifts] = useState<Shift[]>([]);
  const [isOnDuty, setIsOnDuty] = useState(false);

  // Date Logic for Status Checking
  const today = new Date().toISOString().split('T')[0];
  const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  // Get first letter for Profile Avatar
  const userInitial = user?.email?.charAt(0).toUpperCase() || 'N';

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "schedules"),
      where("nurseId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const fetchedShifts = snap.docs.map(d => ({ 
        id: d.id, 
        ...(d.data() as Omit<Shift, 'id'>) 
      })) as Shift[];

      setMyShifts(fetchedShifts);

      const hasShiftToday = fetchedShifts.some(shift => 
        shift.date === today || (shift.isRecurring && shift.dayOfWeek === dayName)
      );
      setIsOnDuty(hasShiftToday);
    });

    return () => unsub();
  }, [user]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.replace('/');
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Nurse Personnel</Text>
          <Text style={styles.headerTitle}>{user?.email?.split('@')[0] || 'Dashboard'}</Text>
        </View>
        
        {/* ACTION BUTTONS GROUP */}
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.profileBtn} 
            onPress={() => router.push('/nurses/profile')}
          >
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>{userInitial}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Duty Status Card */}
        <View style={[styles.statusCard, !isOnDuty && styles.statusCardOff]}>
          <View style={styles.statusHeader}>
            <Text style={styles.cardLabel}>CURRENT ASSIGNMENT</Text>
            <Ionicons name={isOnDuty ? "flash" : "notifications-off"} size={18} color="#fff" />
          </View>
          <Text style={styles.statusValue}>{isOnDuty ? "ON DUTY" : "OFF DUTY"}</Text>
          <Text style={styles.statusSubtext}>
            {isOnDuty ? "You have a scheduled shift for today." : "No active shifts found for today."}
          </Text>
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionHeading}>My Schedule Logs</Text>
          <Ionicons name="calendar" size={16} color="#64748B" />
        </View>

        {myShifts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No shifts have been assigned to you yet.</Text>
          </View>
        ) : (
          myShifts.map((item) => {
            const isToday = item.date === today || (item.isRecurring && item.dayOfWeek === dayName);
            return (
              <View key={item.id} style={[styles.shiftCard, isToday && styles.shiftCardActive]}>
                <View style={[styles.dateBadge, isToday && styles.dateBadgeActive]}>
                  <Text style={[styles.dateText, isToday && {color: '#fff'}]}>
                    {item.isRecurring ? item.dayOfWeek.substring(0, 3).toUpperCase() : item.date?.split('-')[2]}
                  </Text>
                  <Text style={[styles.monthText, isToday && {color: 'rgba(255,255,255,0.7)'}]}>
                    {item.isRecurring ? "WEEK" : "APR"}
                  </Text>
                </View>
                
                <View style={styles.shiftDetails}>
                  <Text style={styles.shiftTime}>{item.startTime} - {item.endTime}</Text>
                  <Text style={styles.shiftType}>
                    {item.isRecurring ? `Recurring Every ${item.dayOfWeek}` : `Scheduled: ${item.date}`}
                  </Text>
                </View>

                {isToday && (
                  <View style={styles.activeDotContainer}>
                    <View style={styles.activeDot} />
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    backgroundColor: '#fff', 
    paddingTop: 60, 
    paddingHorizontal: 24, 
    paddingBottom: 20, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  headerSubtitle: { fontSize: 11, color: '#94A3B8', fontWeight: '800', textTransform: 'uppercase' },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#1E293B' },
  
  // Header Action Styles
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  profileBtn: { padding: 2 },
  avatarCircle: { 
    width: 42, 
    height: 42, 
    borderRadius: 21, 
    backgroundColor: '#0F172A', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F1F5F9'
  },
  avatarInitial: { color: '#fff', fontSize: 16, fontWeight: '800' },
  logoutBtn: { width: 42, height: 42, backgroundColor: '#FEF2F2', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

  scrollContent: { padding: 20 },
  statusCard: { backgroundColor: '#1a73e8', padding: 22, borderRadius: 24, marginBottom: 25, elevation: 6 },
  statusCardOff: { backgroundColor: '#334155' },
  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '800' },
  statusValue: { color: '#fff', fontSize: 26, fontWeight: '900' },
  statusSubtext: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  sectionHeading: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  shiftCard: { backgroundColor: '#fff', borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  shiftCardActive: { borderColor: '#1a73e8', borderWidth: 1.5 },
  dateBadge: { width: 52, height: 52, backgroundColor: '#F1F5F9', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  dateBadgeActive: { backgroundColor: '#1a73e8' },
  dateText: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
  monthText: { fontSize: 8, fontWeight: '900', color: '#94A3B8' },
  shiftDetails: { flex: 1, marginLeft: 16 },
  shiftTime: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  shiftType: { fontSize: 11, color: '#64748B', marginTop: 3 },
  activeDotContainer: { paddingLeft: 10 },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  emptyState: { alignItems: 'center', padding: 50 },
  emptyText: { color: '#94A3B8', fontSize: 13 }
});