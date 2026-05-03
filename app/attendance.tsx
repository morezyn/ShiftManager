import { useRouter } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../config/firebase";

interface AttendanceLog {
  id: string;
  nurseName: string;
  type: "Time In" | "Time Out";
  timestamp: any;
}

export default function AttendanceKiosk() {
  const router = useRouter();
  const [rfidInput, setRfidInput] = useState("");
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [latestNurse, setLatestNurse] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const focusInterval = setInterval(() => {
      inputRef.current?.focus();
    }, 1000);
    return () => clearInterval(focusInterval);
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, "attendance_logs"),
      orderBy("timestamp", "desc"),
      limit(20),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedLogs = snapshot.docs.map(
          (d) =>
            ({
              id: d.id,
              ...d.data(),
            }) as AttendanceLog,
        );
        setLogs(fetchedLogs);
      },
      (error) => {
        console.error("Firestore sync error:", error);
      },
    );

    return () => unsubscribe();
  }, []);

  const handleRfidScan = async (uid: string) => {
    const scannedTag = uid.trim();
    if (!scannedTag) return;

    try {
      const nurseQuery = query(
        collection(db, "users"),
        where("rfidTag", "==", scannedTag),
      );
      const nurseSnap = await getDocs(nurseQuery);

      if (nurseSnap.empty) {
        Alert.alert("Access Denied", "RFID Tag not recognized in the system.");
        setRfidInput("");
        return;
      }

      const nurseDoc = nurseSnap.docs[0];
      const nurseId = nurseDoc.id;
      const { fullName } = nurseDoc.data();

      const activeSessionQuery = query(
        collection(db, "attendance"),
        where("nurseId", "==", nurseId),
        where("checkOut", "==", null),
      );
      const sessionSnap = await getDocs(activeSessionQuery);

      let currentAction: "Time In" | "Time Out" = "Time In";

      if (sessionSnap.empty) {
        await addDoc(collection(db, "attendance"), {
          nurseId,
          nurseName: fullName,
          checkIn: serverTimestamp(),
          checkOut: null,
          date: new Date().toISOString().split("T")[0],
        });
      } else {
        const sessionDocId = sessionSnap.docs[0].id;
        await updateDoc(doc(db, "attendance", sessionDocId), {
          checkOut: serverTimestamp(),
        });
        currentAction = "Time Out";
      }

      await addDoc(collection(db, "attendance_logs"), {
        nurseName: fullName,
        type: currentAction,
        timestamp: serverTimestamp(),
      });

      setLatestNurse(fullName);
      setRfidInput("");
    } catch (error) {
      console.error("Scanning Error:", error);
      setRfidInput("");
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← Exit Kiosk</Text>
      </TouchableOpacity>

      <View style={styles.leftPanel}>
        <Text style={styles.kioskTitle}>ShiftManager Kiosk</Text>
        <Text style={styles.instruction}>Tap your card to log Attendance</Text>

        <View style={styles.statusCircle}>
          <Text style={styles.statusEmoji}>{latestNurse ? "✅" : "💳"}</Text>
        </View>

        {latestNurse && (
          <View style={styles.welcomeBox}>
            <Text style={styles.welcomeText}>Hello, {latestNurse}!</Text>
            <Text style={styles.timestampSub}>Entry logged successfully</Text>
          </View>
        )}

        <TextInput
          ref={inputRef}
          style={styles.hiddenInput}
          value={rfidInput}
          onChangeText={setRfidInput}
          onSubmitEditing={() => handleRfidScan(rfidInput)}
          autoFocus
          showSoftInputOnFocus={false}
        />
      </View>

      <View style={styles.rightPanel}>
        <Text style={styles.listTitle}>Recent Activity</Text>
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.logCard}>
              <View>
                <Text style={styles.logName}>{item.nurseName}</Text>
                <Text style={styles.logTime}>
                  {item.timestamp?.toDate
                    ? item.timestamp.toDate().toLocaleTimeString()
                    : "Syncing..."}
                </Text>
              </View>
              <View
                style={[
                  styles.typeBadge,
                  {
                    backgroundColor:
                      item.type === "Time In" ? "#e6f4ea" : "#fce8e6",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.typeText,
                    { color: item.type === "Time In" ? "#1e8e3e" : "#d93025" },
                  ]}
                >
                  {item.type}
                </Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No recent activity found.</Text>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: "row", backgroundColor: "#92c8fe" },
  backButton: { position: "absolute", top: 40, left: 40, zIndex: 10, padding: 12, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 8 },
  backText: { color: "#fff", fontWeight: "bold" },
  leftPanel: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  kioskTitle: { color: "#fff", fontSize: 36, fontWeight: "bold", marginBottom: 8 },
  instruction: { color: "rgba(255,255,255,0.8)", fontSize: 18, marginBottom: 40 },
  statusCircle: { width: 160, height: 160, borderRadius: 80, backgroundColor: "rgba(251, 251, 255, 0.15)", justifyContent: "center", alignItems: "center", marginBottom: 20 },
  statusEmoji: { fontSize: 100, textAlign: "center", top: -25, includeFontPadding: false },
  welcomeBox: { alignItems: "center" },
  welcomeText: { color: "#fff", fontSize: 26, fontWeight: "bold" },
  timestampSub: { color: "rgba(255,255,255,0.7)", marginTop: 5 },
  hiddenInput: { opacity: 0, position: "absolute" },
  rightPanel: { width: 420, backgroundColor: "#fff", borderTopLeftRadius: 40, borderBottomLeftRadius: 40, padding: 35, elevation: 20 },
  listTitle: { fontSize: 24, fontWeight: "bold", color: "#202124", marginBottom: 25 },
  logCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: "#f1f3f4" },
  logName: { fontSize: 17, fontWeight: "600", color: "#202124" },
  logTime: { fontSize: 14, color: "#5f6368", marginTop: 3 },
  typeBadge: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10 },
  typeText: { fontSize: 12, fontWeight: "bold", textTransform: "uppercase" },
  emptyText: { textAlign: "center", color: "#9aa0a6", marginTop: 40, fontSize: 16 },
});