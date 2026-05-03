import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Modal, Animated, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { db } from '../../config/firebase';
import { collection, query, onSnapshot, Timestamp } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur'; // Import Blur

interface AttendanceRecord {
  nurseName: string;
  checkIn: Timestamp;
  checkOut: Timestamp | null;
}

interface NurseStats {
  name: string;
  totalShifts: number;
  punctualShifts: number;
  completedShifts: number;
  reliabilityScore: number;
}

export default function Performance() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [nurseStats, setNurseStats] = useState<NurseStats[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  
  // Animation value for smooth fade-in of the blur
  const blurOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start blur fade-in when component mounts
    Animated.timing(blurOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    const q = query(collection(db, "attendance"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => doc.data() as AttendanceRecord);
      const statsMap: { [key: string]: any } = {};

      records.forEach(rec => {
        if (!statsMap[rec.nurseName]) {
          statsMap[rec.nurseName] = { total: 0, punctual: 0, completed: 0 };
        }
        statsMap[rec.nurseName].total += 1;
        if (rec.checkOut) statsMap[rec.nurseName].completed += 1;

        const checkInTime = rec.checkIn.toDate();
        if (checkInTime.getHours() < 8 || (checkInTime.getHours() === 8 && checkInTime.getMinutes() <= 5)) {
          statsMap[rec.nurseName].punctual += 1;
        }
      });

      const formattedStats = Object.keys(statsMap).map(name => {
        const s = statsMap[name];
        return {
          name,
          totalShifts: s.total,
          punctualShifts: s.punctual,
          completedShifts: s.completed,
          reliabilityScore: Math.round((s.punctual / s.total) * 100)
        };
      }).sort((a, b) => b.reliabilityScore - a.reliabilityScore);

      setNurseStats(formattedStats);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleClose = () => {
    // Fade out blur before closing
    Animated.timing(blurOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
        setIsVisible(false);
        // Allows the native modal slide-down animation to complete
        setTimeout(() => router.back(), 300);
    });
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={handleClose}
    >
      <View style={styles.mainContainer}>
        {/* ANIMATED BLUR BACKGROUND */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: blurOpacity }]}>
          <BlurView 
            intensity={30} // Adjust blur strength (0-100)
            tint="dark" // 'light', 'dark', or 'default'
            style={StyleSheet.absoluteFill} 
          />
          {/* Optional: Add a subtle overlay to help readability if tint isn't enough */}
          <Pressable style={styles.backDropTap} onPress={handleClose} />
        </Animated.View>

        {/* THE CARD CONTENT */}
        <View style={styles.cardContainer}>
          <View style={styles.headerControl}>
            <View style={styles.modalHandle} />
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.topInfo}>
            <Text style={styles.mainTitle}>Team Performance</Text>
            <Text style={styles.subTitle}>Ranking based on punctuality and reliability</Text>
          </View>

          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator color="#1a73e8" size="large" />
            </View>
          ) : (
            <FlatList
              data={nurseStats}
              keyExtractor={(item) => item.name}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.avatar}><Text style={styles.avatarText}>{item.name.charAt(0)}</Text></View>
                    <View style={styles.nurseInfo}>
                      <Text style={styles.nurseName}>{item.name}</Text>
                      <View style={styles.rankBadge}>
                        <Ionicons name="trending-up" size={10} color="#10B981" />
                        <Text style={styles.rankText}>Reliability: {item.reliabilityScore}%</Text>
                      </View>
                    </View>
                    <View style={[styles.scoreCircle, { borderColor: item.reliabilityScore > 80 ? '#10B981' : '#F59E0B' }]}>
                      <Text style={[styles.scoreValue, { color: item.reliabilityScore > 80 ? '#059669' : '#D97706' }]}>
                        {item.reliabilityScore > 80 ? 'A+' : 'B'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.statsGrid}>
                    <View style={styles.statItem}><Text style={styles.statLabel}>Punctual</Text><Text style={styles.statVal}>{item.punctualShifts}</Text></View>
                    <View style={[styles.statItem, styles.borderLeft]}><Text style={styles.statLabel}>Completed</Text><Text style={styles.statVal}>{item.completedShifts}</Text></View>
                    <View style={[styles.statItem, styles.borderLeft]}><Text style={styles.statLabel}>Total</Text><Text style={styles.statVal}>{item.totalShifts}</Text></View>
                  </View>
                  <View style={styles.progressContainer}><View style={[styles.progressBar, { width: `${item.reliabilityScore}%`, backgroundColor: item.reliabilityScore > 80 ? '#10B981' : '#F59E0B' }]} /></View>
                </View>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, justifyContent: 'flex-end' },
  // Allows tapping the blurred area to close the card
  backDropTap: { ...StyleSheet.absoluteFillObject }, 
  
  cardContainer: { 
    height: '90%',
    backgroundColor: '#fff', 
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32,
    // Shadow is still important to separate card from blur
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -15 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  headerControl: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: 40 },
  modalHandle: { width: 40, height: 5, backgroundColor: '#E2E8F0', borderRadius: 10, marginTop: 12 },
  closeBtn: { position: 'absolute', right: 20, top: 15, width: 32, height: 32, borderRadius: 16, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  topInfo: { paddingHorizontal: 24, marginTop: 20, marginBottom: 20 },
  mainTitle: { fontSize: 22, fontWeight: '900', color: '#0F172A' },
  subTitle: { fontSize: 13, color: '#94A3B8', fontWeight: '600', marginTop: 4 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 24, paddingBottom: 60 },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  avatar: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#1a73e8' },
  nurseInfo: { flex: 1, marginLeft: 14 },
  nurseName: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  rankBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  rankText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  scoreCircle: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  scoreValue: { fontSize: 13, fontWeight: '900' },
  statsGrid: { flexDirection: 'row', paddingVertical: 12, backgroundColor: '#F8FAFC', borderRadius: 16 },
  statItem: { flex: 1, alignItems: 'center' },
  borderLeft: { borderLeftWidth: 1, borderLeftColor: '#E2E8F0' },
  statLabel: { fontSize: 9, color: '#94A3B8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  statVal: { fontSize: 14, fontWeight: '800', color: '#1E293B', marginTop: 2 },
  progressContainer: { height: 4, backgroundColor: '#F1F5F9', borderRadius: 2, marginTop: 15, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 2 }
});