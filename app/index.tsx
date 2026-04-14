import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert
} from "react-native";
// Import Firebase auth and db from your config
import { auth, db } from "../config/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

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
      // 1. Authenticate with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Fetch User Role from Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // 3. Route based on role
        if (userData.role === "admin") {
          router.replace("/admin/dashboard");
        } else if (userData.role === "nurse") {
          router.replace("/nurses/dashboard");
        } else {
          Alert.alert("Access Denied", "User role not recognized.");
        }
      } else {
        // Fallback for your hardcoded admin if it's not in Firestore yet
        if (email === "admin@gmail.com" && password === "password") {
          router.replace("/admin/dashboard");
        } else {
          Alert.alert("Error", "User data not found in system.");
        }
      }
    } catch (error: any) {
      // Friendly error handling
      let errorMessage = "Failed to login. Please check your credentials.";
      if (error.code === 'auth/user-not-found') errorMessage = "No user found with this email.";
      if (error.code === 'auth/wrong-password') errorMessage = "Incorrect password.";
      
      Alert.alert("Login Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>ShiftManager</Text>
        <Text style={styles.subtitle}>Hospital Portal</Text>

        <TextInput
          style={styles.input}
          placeholder="Email Address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity 
          style={styles.loginButton} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signupContainer}
          onPress={() => router.push("/signup")}
        >
          <Text style={styles.signupText}>
            {"Don't have an account? "}
            <Text style={styles.signupLink}>Sign Up</Text>
          </Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.line} />
        </View>

        <TouchableOpacity
          style={styles.kioskButton}
          onPress={() => router.push("/attendance")}
        >
          <Text style={styles.kioskButtonText}>Open Attendance Kiosk</Text>
          <Text style={styles.kioskSubtext}>(RFID Scan Mode)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f2f5", justifyContent: "center", alignItems: "center" },
  card: { backgroundColor: "#fff", padding: 40, borderRadius: 15, width: "100%", maxWidth: 420, elevation: 5, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
  title: { fontSize: 32, fontWeight: "800", textAlign: "center", color: "#1a73e8" },
  subtitle: { fontSize: 16, textAlign: "center", color: "#5f6368", marginBottom: 30 },
  input: { height: 50, borderColor: "#dadce0", borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, marginBottom: 15 },
  loginButton: { backgroundColor: "#1a73e8", height: 50, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  signupContainer: { marginTop: 20, alignItems: "center" },
  signupText: { color: "#5f6368", fontSize: 14 },
  signupLink: { color: "#1a73e8", fontWeight: "bold" },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 25 },
  line: { flex: 1, height: 1, backgroundColor: "#dadce0" },
  orText: { marginHorizontal: 10, color: "#70757a" },
  kioskButton: { backgroundColor: "#fff", height: 70, borderRadius: 8, borderWidth: 2, borderColor: "#34a853", justifyContent: "center", alignItems: "center" },
  kioskButtonText: { color: "#34a853", fontWeight: "700" },
  kioskSubtext: { color: "#34a853", fontSize: 12 },
});