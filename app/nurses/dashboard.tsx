import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  FlatList,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "../../config/firebase";

// --- WEB COMPATIBILITY FIX ---
if (Platform.OS === 'web') {
  const ignoredWarnings = ['Unknown event handler property', 'Invalid DOM property', 'shadow*', 'transform-origin'];
  const originalWarn = console.warn;
  const originalError = console.error;
  console.warn = (...args) => { if (typeof args[0] === 'string' && ignoredWarnings.some(w => args[0].includes(w))) return; originalWarn(...args); };
  console.error = (...args) => { if (typeof args[0] === 'string' && ignoredWarnings.some(w => args[0].includes(w))) return; originalError(...args); };
}

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

interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: Timestamp;
  read: boolean;
  avatarUrl?: string;
}

export default function NurseDashboard() {
  const router = useRouter();
  const user = auth.currentUser;

  // State
  const [myShifts, setMyShifts] = useState<Shift[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [assignedPatient, setAssignedPatient] = useState<string | null>(null);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Constants
  const today = new Date().toISOString().split("T")[0];
  const dayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const userInitial = user?.email?.charAt(0).toUpperCase() || "N";
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const unsubUser = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) setAssignedPatient(docSnap.data().assignedPatientName || null);
    });

    const qShifts = query(collection(db, "schedules"), where("nurseId", "==", user.uid), orderBy("createdAt", "desc"));
    const unsubShifts = onSnapshot(qShifts, (snap) => {
      const fetchedShifts = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Shift, "id">) })) as Shift[];
      setMyShifts(fetchedShifts);
      setIsOnDuty(fetchedShifts.some(s => s.date === today || (s.isRecurring && s.dayOfWeek === dayName)));
      setLoading(false);
    });

    // UPDATED: Querying 'recipientUid' for payroll notifications
    const qNotifs = query(collection(db, "notifications"), where("recipientUid", "==", user.uid), orderBy("timestamp", "desc"));
    const unsubNotifs = onSnapshot(qNotifs, (snap) => {
      // Trigger local alert for new notifications
      snap.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          Alert.alert(data.title, data.message);
        }
      });
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })) as AppNotification[]);
    });

    return () => { unsubUser(); unsubShifts(); unsubNotifs(); };
  }, [user]);

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: async () => { try { await auth.signOut(); router.replace("/"); } catch (e) { console.error(e); } } },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.userSection}>
            <View style={styles.welcomeRow}>
              <View style={styles.activeIndicator} />
              <Text style={styles.headerSubtitle}>Nurse Personnel</Text>
            </View>
            <Text style={styles.headerTitle} numberOfLines={1}>{user?.email?.split("@")[0] || "Dashboard"}</Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionIconButton} onPress={() => setShowNotifModal(true)}>
              <Ionicons name={unreadCount > 0 ? "notifications" : "notifications-outline"} size={22} color={unreadCount > 0 ? "#1a73e8" : "#64748B"} />
              {unreadCount > 0 && <View style={styles.notifBadge} />}
            </TouchableOpacity>

            <TouchableOpacity style={styles.profileBtn} onPress={() => router.push("/nurses/profile")}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>{userInitial}</Text>
                <View style={styles.onlineBadge} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* NOTIFICATION POPOUT */}
      <Modal visible={showNotifModal} animationType="fade" transparent={true} onRequestClose={() => setShowNotifModal(false)}>
        <TouchableOpacity style={styles.popoutOverlay} activeOpacity={1} onPress={() => setShowNotifModal(false)}>
          <View style={styles.popoutContainer}>
            <View style={styles.popoutPointer} />
            <View style={styles.popoutContent}>
              <View style={styles.popoutHeader}>
                <Ionicons name="notifications-outline" size={20} color="#1a73e8" />
                <Text style={styles.popoutTitle}>Notifications</Text>
                <Ionicons name="search-outline" size={18} color="#94A3B8" />
              </View>
              {notifications.length === 0 ? (
                <View style={styles.emptyNotifContainer}><Text style={styles.emptyNotifText}>No recent activity</Text></View>
              ) : (
                <FlatList
                  data={notifications.slice(0, 5)}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <View style={[styles.popoutItem, !item.read && styles.popoutItemUnread]}>
                      <View style={styles.popoutAvatarPlaceholder}><Text style={styles.avatarText}>{item.title.charAt(0)}</Text></View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.popoutItemHeader}>
                          <Text style={styles.popoutItemName}>{item.title}</Text>
                          <Text style={styles.popoutItemTime}>5m</Text>
                        </View>
                        <Text style={styles.popoutItemMsg} numberOfLines={2}>{item.message}</Text>
                      </View>
                    </View>
                  )}
                  ListFooterComponent={() => (
                    <TouchableOpacity style={styles.seeAllButton}><Text style={styles.seeAllText}>See all activity</Text></TouchableOpacity>
                  )}
                />
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ASSIGNMENT STATUS */}
        <View style={[styles.statusCard, !isOnDuty && styles.statusCardOff]}>
          <View style={styles.statusHeader}>
            <Text style={styles.cardLabel}>CURRENT ASSIGNMENT</Text>
            <Ionicons name={isOnDuty ? "flash" : "notifications-off"} size={18} color="#fff" />
          </View>
          <Text style={styles.statusValue}>{isOnDuty ? "ON DUTY" : "OFF DUTY"}</Text>
          <Text style={styles.statusSubtext}>{assignedPatient ? `Assigned to: ${assignedPatient}` : "No patient linked."}</Text>
        </View>

        {/* QUICK ACTIONS */}
        <Text style={styles.sectionHeading}>Quick Actions</Text>
        <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/nurses/patientStatus")}>
          <View style={styles.actionIconContainer}><Ionicons name="pulse" size={22} color="#10B981" /></View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>View Patient Status</Text>
            <Text style={styles.actionSubtitle}>Monitor vitals and current health logs</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/nurses/patientRegister")}>
          <View style={styles.actionIconContainer}><Ionicons name="person-add" size={22} color="#1a73e8" /></View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Register New Patient</Text>
            <Text style={styles.actionSubtitle}>Add a new patient to the system</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>

        {/* SCHEDULE LOGS */}
        <View style={[styles.sectionRow, { marginTop: 30 }]}>
          <Text style={styles.sectionHeading}>My Schedule Logs</Text>
          <Ionicons name="calendar-outline" size={18} color="#64748B" />
        </View>

        {loading ? (
          <ActivityIndicator size="small" color="#1a73e8" style={{ marginTop: 20 }} />
        ) : myShifts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-clear-outline" size={40} color="#E2E8F0" />
            <Text style={styles.emptyText}>No shifts assigned yet.</Text>
          </View>
        ) : (
          myShifts.map((item) => {
            const isToday = item.date === today || (item.isRecurring && item.dayOfWeek === dayName);
            return (
              <View key={item.id} style={[styles.shiftCard, isToday && styles.shiftCardActive]}>
                <View style={[styles.dateBadge, isToday && styles.dateBadgeActive]}>
                  <Text style={[styles.dateText, isToday && { color: "#fff" }]}>
                    {item.isRecurring ? item.dayOfWeek.substring(0, 3).toUpperCase() : item.date?.split("-")[2]}
                  </Text>
                  <Text style={[styles.monthText, isToday && { color: "rgba(255,255,255,0.7)" }]}>
                    {item.isRecurring ? "WEEK" : "DATE"}
                  </Text>
                </View>
                <View style={styles.shiftDetails}>
                  <Text style={styles.shiftTime}>{item.startTime} - {item.endTime}</Text>
                  <Text style={styles.shiftType}>
                    {item.isRecurring ? `Every ${item.dayOfWeek}` : `Scheduled: ${item.date}`}
                  </Text>
                </View>
                {isToday && <View style={styles.activeDot} />}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "ios" ? 55 : 40,
    paddingBottom: 15,
    paddingHorizontal: 20,
    zIndex: 100,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9'
  },
  headerContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  userSection: { flex: 1 },
  welcomeRow: { flexDirection: "row", alignItems: "center", marginBottom: 2 },
  activeIndicator: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#10B981", marginRight: 6 },
  headerSubtitle: { fontSize: 11, color: "#94A3B8", fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },
  headerTitle: { fontSize: 24, fontWeight: "900", color: "#0F172A", letterSpacing: -0.5 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  actionIconButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#F8FAFC", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#F1F5F9" },
  notifBadge: { position: "absolute", top: 8, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: "#EF4444", borderWidth: 1.5, borderColor: "#fff" },
  profileBtn: { marginLeft: 4 },
  avatarCircle: { width: 46, height: 46, borderRadius: 16, backgroundColor: "#0F172A", justifyContent: "center", alignItems: "center" },
  onlineBadge: { position: "absolute", bottom: -2, right: -2, width: 14, height: 14, borderRadius: 7, backgroundColor: "#10B981", borderWidth: 2, borderColor: "#fff" },
  avatarInitial: { color: "#fff", fontSize: 18, fontWeight: "800" },
  
  scrollContent: { padding: 20, paddingBottom: 100 },
  statusCard: { backgroundColor: "#1a73e8", padding: 22, borderRadius: 28, marginBottom: 25 },
  statusCardOff: { backgroundColor: "#334155" },
  statusHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  cardLabel: { color: "rgba(255,255,255,0.6)", fontSize: 10, fontWeight: "800" },
  statusValue: { color: "#fff", fontSize: 26, fontWeight: "900" },
  statusSubtext: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 4, fontWeight: "600" },
  
  actionCard: { backgroundColor: "#fff", borderRadius: 24, padding: 18, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#F1F5F9", marginTop: 12 },
  actionIconContainer: { width: 48, height: 48, borderRadius: 14, backgroundColor: "#EFF6FF", justifyContent: "center", alignItems: "center" },
  actionTextContainer: { flex: 1, marginLeft: 16 },
  actionTitle: { fontSize: 15, fontWeight: "800", color: "#1E293B" },
  actionSubtitle: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 15 },
  sectionHeading: { fontSize: 16, fontWeight: "800", color: "#1E293B" },

  shiftCard: { backgroundColor: "#fff", borderRadius: 20, padding: 14, flexDirection: "row", alignItems: "center", marginBottom: 12, borderWidth: 1, borderColor: "#F1F5F9" },
  shiftCardActive: { borderColor: "#1a73e8", borderWidth: 1.5 },
  dateBadge: { width: 52, height: 52, backgroundColor: "#F1F5F9", borderRadius: 14, justifyContent: "center", alignItems: "center" },
  dateBadgeActive: { backgroundColor: "#1a73e8" },
  dateText: { fontSize: 18, fontWeight: "900", color: "#1E293B" },
  monthText: { fontSize: 8, fontWeight: "900", color: "#94A3B8" },
  shiftDetails: { flex: 1, marginLeft: 16 },
  shiftTime: { fontSize: 15, fontWeight: "700", color: "#1E293B" },
  shiftType: { fontSize: 11, color: "#64748B", marginTop: 3 },
  activeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#10B981", borderWidth: 2, borderColor: "#fff" },
  emptyState: { alignItems: "center", padding: 40 },
  emptyText: { color: "#94A3B8", fontSize: 13, marginTop: 10 },

  popoutOverlay: { flex: 1, backgroundColor: "transparent" },
  popoutContainer: { position: 'absolute', top: 95, right: 20, width: 320, zIndex: 999 },
  popoutPointer: { width: 14, height: 14, backgroundColor: '#fff', alignSelf: 'flex-end', marginRight: 62, transform: [{ rotate: '45deg' }], marginBottom: -7 },
  popoutContent: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0', elevation: 10 },
  popoutHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#F1F5F9' },
  popoutTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#1E293B', textAlign: 'center' },
  popoutItem: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderColor: '#F8FAFC', gap: 12 },
  popoutItemUnread: { borderLeftWidth: 3, borderLeftColor: '#1a73e8' },
  popoutAvatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  popoutItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  popoutItemName: { fontSize: 14, fontWeight: '700', color: '#1a73e8' },
  popoutItemTime: { fontSize: 10, color: '#94A3B8' },
  popoutItemMsg: { fontSize: 13, color: '#475569', marginTop: 2 },
  seeAllButton: { padding: 14, alignItems: 'center' },
  seeAllText: { color: '#1a73e8', fontSize: 13, fontWeight: '700' },
  emptyNotifContainer: { padding: 30, alignItems: 'center' },
  emptyNotifText: { color: '#94A3B8', fontSize: 13 },
});