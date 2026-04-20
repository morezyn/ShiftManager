import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '../config/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async () => {
    if (!email || !password || !fullName || !department) {
      Alert.alert('Missing Info', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        fullName,
        email,
        department,
        role: 'nurse',
        createdAt: new Date().toISOString(),
      });
      router.replace('/nurses/dashboard');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.background}
    >
      <View style={styles.centerContainer}>
        {/* Floating Card */}
        <View style={styles.card}>
          
          {/* Header Area */}
          <View style={styles.cardHeader}>
            <TouchableOpacity onPress={() => router.replace('/')} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#0F172A" />
            </TouchableOpacity>
            <Ionicons name="medical" size={24} color="#1a73e8" />
            <View style={{ width: 32 }} />
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.title}>Create your account</Text>

            {/* Compact Form */}
            <View style={styles.formStack}>
              <View style={styles.inputBox}>
                <Text style={styles.floatingLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="e.g., Jane Doe"
                  placeholderTextColor="#CBD5E1"
                />
              </View>

              <View style={styles.inputBox}>
                <Text style={styles.floatingLabel}>Department</Text>
                <TextInput
                  style={styles.input}
                  value={department}
                  onChangeText={setDepartment}
                  placeholder="e.g., Emergency"
                  placeholderTextColor="#CBD5E1"
                />
              </View>

              <View style={styles.inputBox}>
                <Text style={styles.floatingLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputBox}>
                <Text style={styles.floatingLabel}>Password</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            </View>
          </View>

          {/* Pill Style Footer Button */}
          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.nextButton, loading && styles.disabledButton]} 
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.nextButtonText}>Next</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#92c8fe', // Slightly darker background to make the card pop
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    width: '90%',
    maxWidth: 400, // Keeps it compact on tablets/web
    height: Platform.OS === 'web' ? 'auto' : '85%',
    maxHeight: 650,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    // High-end floating shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    marginVertical: 15,
  },
  formStack: {
    gap: 12,
  },
  inputBox: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  floatingLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1a73e8', // Medical blue label
    marginBottom: 2,
  },
  input: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '500',
    padding: 0, // Keeps it tight
  },
  footer: {
    padding: 30,
    paddingBottom: 40,
  },
  nextButton: {
    backgroundColor: '#0F172A', // Dark pill button like your reference
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});