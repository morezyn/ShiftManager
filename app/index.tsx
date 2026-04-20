import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from "react-native";
import { auth, db } from "../config/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Ionicons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function EntryScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role === "admin") {
          router.replace("/admin/dashboard");
        } else if (userData.role === "nurse") {
          router.replace("/nurses/dashboard");
        } else {
          Alert.alert("Access Denied", "User role not recognized.");
        }
      } else {
        if (email === "admin@gmail.com" && password === "password") {
          router.replace("/admin/dashboard");
        } else {
          Alert.alert("Error", "User data not found.");
        }
      }
    } catch (error: any) {
      Alert.alert("Login Failed", "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
      style={styles.container}
    >
      <View style={styles.innerContainer}>
        {/* Branding Section - Lighter Theme */}
        <View style={styles.topSection}>
          <View style={styles.logoCircle}>
            <Ionicons name="medical" size={32} color="#1a73e8" />
          </View>
          <Text style={styles.title}>ShiftManager</Text>
          <Text style={styles.subtitle}>Medical Staff Portal</Text>
        </View>

        {/* Adaptive Form Card */}
        <View style={styles.formCard}>
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color="#1a73e8" />
              <TextInput
                style={styles.input}
                placeholder="nurse@hospital.com"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>PASSWORD</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color="#1a73e8" />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.loginButton, loading && styles.disabledButton]} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/signup")} style={styles.signupBtn}>
            <Text style={styles.signupText}>
              {"Don't have an account? "} 
              <Text style={styles.signupLink}>Create one</Text>
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.orText}>SYSTEM ACCESS</Text>
            <View style={styles.line} />
          </View>

          {/* Kiosk Mode - Matches Admin "Badge" style */}
          <TouchableOpacity
            style={styles.kioskButton}
            onPress={() => router.push("/attendance")}
          >
            <View style={styles.kioskIconBox}>
              <Ionicons name="finger-print" size={20} color="#1a73e8" />
            </View>
            <Text style={styles.kioskTitle}>Open Attendance Kiosk</Text>
            <Ionicons name="chevron-forward" size={16} color="#1a73e8" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#92c8fe" // Matches Admin/Nurse background
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  topSection: {
    alignItems: 'center',
    paddingBottom: SCREEN_HEIGHT * 0.05,
  },
  logoCircle: {
    width: 64,
    height: 64,
    backgroundColor: '#EFF6FF', // Lighter Blue
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  title: { 
    fontSize: 28, 
    fontWeight: "900", 
    color: "#1E293B", 
    letterSpacing: -0.5 
  },
  subtitle: { 
    fontSize: 14, 
    color: "#64748B", 
    fontWeight: '600' 
  },
  formCard: { 
    backgroundColor: "#fff", 
    borderTopLeftRadius: 40, 
    borderTopRightRadius: 40, 
    paddingHorizontal: 25, 
    paddingTop: 35,
    paddingBottom: Platform.OS === 'ios' ? 40 : 25,
    elevation: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 15,
  },
  inputContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    marginBottom: 6,
    letterSpacing: 1,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    height: 56,
  },
  input: { 
    flex: 1, 
    height: '100%', 
    marginLeft: 12,
    color: '#1E293B', 
    fontSize: 15, 
    fontWeight: '600' 
  },
  loginButton: { 
    backgroundColor: "#1a73e8", 
    height: 56, 
    borderRadius: 16, 
    justifyContent: "center", 
    alignItems: "center",
    marginTop: 8,
    elevation: 4,
    shadowColor: "#1a73e8",
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  disabledButton: { opacity: 0.7 },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  
  signupBtn: { marginTop: 18, alignItems: "center" },
  signupText: { color: "#64748B", fontSize: 13, fontWeight: '600' },
  signupLink: { color: "#1a73e8", fontWeight: "800" },
  
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 25 },
  line: { flex: 1, height: 1, backgroundColor: "#F1F5F9" },
  orText: { marginHorizontal: 12, color: "#CBD5E1", fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  
  kioskButton: { 
    backgroundColor: "#EFF6FF", // Alice Blue
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: "#DBEAFE", 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  kioskIconBox: {
    width: 32,
    height: 32,
    backgroundColor: '#fff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kioskTitle: { 
    color: "#1a73e8", 
    fontWeight: "800", 
    fontSize: 14,
    flex: 1,
    marginLeft: 12
  },
});