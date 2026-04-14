import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '../config/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async () => {
    if (!email || !password || !fullName || !department) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      // 1. Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Save additional nurse details to Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        fullName: fullName,
        email: email,
        department: department,
        role: 'nurse', // Default role for this signup page
        rfidTag: '',   // Will be linked later in Phase 2
        createdAt: new Date().toISOString(),
      });

      alert('Account created successfully!');
      router.replace('/nurses/dashboard');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Nurse Registration</Text>
        <Text style={styles.subtitle}>Create your ShiftManager account</Text>

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Jane Doe"
          value={fullName}
          onChangeText={setFullName}
        />

        <Text style={styles.label}>Department</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. ICU, Emergency, Pediatrics"
          value={department}
          onChangeText={setDepartment}
        />

        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder="nurse@hospital.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity 
          style={[styles.signupButton, loading && { opacity: 0.7 }]} 
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Register Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/')} style={styles.backLink}>
          <Text style={styles.backLinkText}>Already have an account? <Text style={styles.loginText}>Login</Text></Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f0f2f5', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { backgroundColor: '#fff', padding: 40, borderRadius: 15, width: '100%', maxWidth: 450, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
  title: { fontSize: 28, fontWeight: '800', color: '#1a73e8', marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#5f6368', marginBottom: 25 },
  label: { fontSize: 14, fontWeight: '600', color: '#3c4043', marginBottom: 8, marginLeft: 2 },
  input: { height: 50, borderColor: '#dadce0', borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, marginBottom: 20, fontSize: 16 },
  signupButton: { backgroundColor: '#1a73e8', height: 55, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  backLink: { marginTop: 25, alignItems: 'center' },
  backLinkText: { color: '#5f6368', fontSize: 14 },
  loginText: { color: '#1a73e8', fontWeight: 'bold' }
});