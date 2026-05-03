import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity, 
  Modal, 
  Animated, 
  Pressable, 
  ScrollView, 
  Alert,
  TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import { db } from '../../config/firebase';
import { collection, query, onSnapshot, where, addDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

interface PayrollRecord {
  nurseName: string;
  totalHours: number;
  basePay: number;
  shiftCount: number;
  uid: string;
}

export default function Payroll() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [payrollData, setPayrollData] = useState<PayrollRecord[]>([]);
  const [adjustments, setAdjustments] = useState<{ [key: string]: string }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const blurOpacity = useRef(new Animated.Value(0)).current;
  const HOURLY_RATE = 250; 

  useEffect(() => {
    Animated.timing(blurOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    const nursesQuery = query(collection(db, "users"), where("role", "==", "nurse"));
    const attendanceQuery = query(collection(db, "attendance"));

    const unsubscribeNurses = onSnapshot(nursesQuery, (nurseSnap) => {
      const nurseList = nurseSnap.docs.map(doc => ({
        uid: doc.data().uid,
        fullName: doc.data().fullName
      }));

      const unsubscribeAttendance = onSnapshot(attendanceQuery, (attendanceSnap) => {
        const statsMap: { [key: string]: any } = {};

        nurseList.forEach(nurse => {
          statsMap[nurse.fullName] = { totalMs: 0, shifts: 0, uid: nurse.uid };
        });

        attendanceSnap.docs.forEach(doc => {
          const data = doc.data();
          const name = data.nurseName;
          const checkIn = data.checkIn?.toDate();
          const checkOut = data.checkOut?.toDate();

          if (statsMap[name] && checkIn && checkOut) {
            const duration = checkOut.getTime() - checkIn.getTime();
            statsMap[name].totalMs += duration;
            statsMap[name].shifts += 1;
          }
        });

        const formatted = Object.keys(statsMap).map(name => {
          const hours = statsMap[name].totalMs / (1000 * 60 * 60);
          return {
            nurseName: name,
            uid: statsMap[name].uid,
            totalHours: parseFloat(hours.toFixed(2)),
            basePay: hours * HOURLY_RATE,
            shiftCount: statsMap[name].shifts
          };
        });

        setPayrollData(formatted);
        setLoading(false);
      });

      return () => unsubscribeAttendance();
    });

    return () => unsubscribeNurses();
  }, []);

  const filteredData = payrollData.filter(item => 
    item.nurseName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdjustment = (name: string, val: string) => {
    if (/^-?\d*\.?\d*$/.test(val)) {
      setAdjustments(prev => ({ ...prev, [name]: val }));
    }
  };

  const calculateNurseTotal = (item: PayrollRecord) => {
    const adj = parseFloat(adjustments[item.nurseName]) || 0;
    return Math.max(0, Math.round(item.basePay + adj));
  };

  const totalExpense = payrollData.reduce((sum, item) => sum + calculateNurseTotal(item), 0);

  // New function to process and notify
  const handleProcessAndNotify = async () => {
    try {
      const notificationPromises = payrollData.map(async (nurse) => {
        await addDoc(collection(db, "notifications"), {
          recipientUid: nurse.uid,
          title: "Payroll Processed",
          message: `Your payroll for this period of ₱${calculateNurseTotal(nurse).toLocaleString()} has been processed.`,
          timestamp: new Date(),
          read: false,
          type: "payment"
        });
      });
      
      await Promise.all(notificationPromises);
      setShowSuccess(true);
    } catch (error) {
      Alert.alert("Error", "Failed to send notifications to nurses.");
      console.error(error);
    }
  };

  const handleClose = () => {
    Animated.timing(blurOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
        setIsVisible(false);
        setTimeout(() => router.back(), 300);
    });
  };

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={handleClose}>
      <View style={styles.mainContainer}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: blurOpacity }]}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          <Pressable style={styles.backDropTap} onPress={handleClose} />
        </Animated.View>

        <View style={styles.cardContainer}>
          <View style={styles.headerControl}>
            <View style={styles.modalHandle} />
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.topInfo}>
              <Text style={styles.mainTitle}>Nurse Payroll</Text>
              <Text style={styles.subTitle}>Syncing data from User & Attendance collections</Text>
            </View>

            <View style={styles.searchSection}>
              <Ionicons name="search" size={18} color="#94A3B8" style={styles.searchIcon} />
              <TextInput 
                style={styles.searchInput}
                placeholder="Find a nurse..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Payout</Text>
              <Text style={styles.summaryAmount}>₱{totalExpense.toLocaleString()}</Text>
            </View>

            <Text style={styles.sectionTitle}>Nurse List ({filteredData.length})</Text>

            {loading ? (
              <ActivityIndicator color="#1a73e8" size="large" style={{ marginTop: 40 }} />
            ) : (
              filteredData.map((item, index) => (
                <View key={index} style={styles.nurseRow}>
                  <View style={styles.rowTop}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{item.nurseName.charAt(0)}</Text>
                    </View>
                    <View style={styles.infoContainer}>
                      <Text style={styles.nurseName}>{item.nurseName}</Text>
                      <Text style={styles.subInfo}>{item.shiftCount} shifts • {item.totalHours} hrs</Text>
                    </View>
                    <View style={styles.payContainer}>
                      <Text style={styles.payAmount}>₱{calculateNurseTotal(item).toLocaleString()}</Text>
                      <Text style={styles.rateLabel}>Total Due</Text>
                    </View>
                  </View>

                  <View style={styles.adjustmentArea}>
                    <Text style={styles.adjLabel}>Manual Adjustment</Text>
                    <TextInput
                      style={styles.adjInput}
                      placeholder="0"
                      keyboardType="numeric"
                      value={adjustments[item.nurseName] || ""}
                      onChangeText={(val) => handleAdjustment(item.nurseName, val)}
                    />
                  </View>
                </View>
              ))
            )}

            <TouchableOpacity style={styles.approveBtn} onPress={handleProcessAndNotify}>
              <Text style={styles.approveBtnText}>Confirm & Notify Nurses</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {showSuccess && (
          <View style={styles.successOverlay}>
            <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
            <View style={styles.successBox}>
              <View style={styles.successIconBox}>
                <Ionicons name="checkmark-circle" size={70} color="#10B981" />
              </View>
              <Text style={styles.successTitle}>Confirmed!</Text>
              <Text style={styles.successSub}>Payroll processed and notifications sent to {payrollData.length} nurses.</Text>
              <TouchableOpacity 
                style={styles.successDoneBtn} 
                onPress={() => {
                  setShowSuccess(false);
                  handleClose();
                }}
              >
                <Text style={styles.successDoneText}>Return to Reports</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, justifyContent: 'flex-end' },
  backDropTap: { ...StyleSheet.absoluteFillObject },
  cardContainer: { height: '92%', backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, elevation: 25 },
  headerControl: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: 40 },
  modalHandle: { width: 40, height: 5, backgroundColor: '#E2E8F0', borderRadius: 10, marginTop: 12 },
  closeBtn: { position: 'absolute', right: 20, top: 15, width: 32, height: 32, borderRadius: 16, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 60 },
  topInfo: { marginTop: 15, marginBottom: 15 },
  mainTitle: { fontSize: 22, fontWeight: '900', color: '#0F172A' },
  subTitle: { fontSize: 13, color: '#94A3B8', fontWeight: '600', marginTop: 4 },
  searchSection: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 15, paddingHorizontal: 15, marginBottom: 20, height: 48, borderWidth: 1, borderColor: '#E2E8F0' },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1E293B' },
  summaryCard: { backgroundColor: '#1E293B', padding: 25, borderRadius: 28, marginBottom: 25 },
  summaryLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  summaryAmount: { color: '#fff', fontSize: 32, fontWeight: '900', marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginBottom: 15 },
  nurseRow: { backgroundColor: '#fff', padding: 16, borderRadius: 24, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  rowTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#1a73e8' },
  infoContainer: { flex: 1, marginLeft: 12 },
  nurseName: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  subInfo: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  payContainer: { alignItems: 'flex-end' },
  payAmount: { fontSize: 16, fontWeight: '900', color: '#10B981' },
  rateLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '700' },
  adjustmentArea: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F8FAFC' },
  adjLabel: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  adjInput: { backgroundColor: '#F8FAFC', borderRadius: 10, width: 80, paddingHorizontal: 10, paddingVertical: 5, textAlign: 'right', fontSize: 14, fontWeight: '700', borderWidth: 1, borderColor: '#E2E8F0' },
  approveBtn: { backgroundColor: '#1a73e8', padding: 18, borderRadius: 20, alignItems: 'center', marginTop: 20 },
  approveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  successOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: 25 },
  successBox: { backgroundColor: '#fff', borderRadius: 32, padding: 35, alignItems: 'center', width: '100%', elevation: 20 },
  successIconBox: { marginBottom: 15 },
  successTitle: { fontSize: 24, fontWeight: '900', color: '#0F172A', marginBottom: 5 },
  successSub: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 25 },
  successDoneBtn: { backgroundColor: '#0F172A', paddingVertical: 14, paddingHorizontal: 30, borderRadius: 15 },
  successDoneText: { color: '#fff', fontWeight: '800' }
});