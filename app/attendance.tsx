import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function AttendanceKiosk() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* High-Visibility Back Button */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => router.replace('/')}
      >
        <Text style={styles.backButtonText}>← Back to Login</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.instruction}>PLEASE TAP YOUR CARD</Text>
        
        <View style={styles.scannerIcon}>
          <Text style={{ fontSize: 100 }}>💳</Text>
        </View>
        
        <View style={styles.statusContainer}>
          <View style={styles.pulseDot} />
          <Text style={styles.status}>SCANNER ACTIVE</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#0a0a0a', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 40,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#2c2c2e', // Solid dark gray for contrast
    borderWidth: 1,
    borderColor: '#48484a', // Border helps separate it from the black background
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  backButtonText: {
    color: '#ffffff', // Pure white text for maximum readability
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  instruction: { 
    color: '#ffffff', 
    fontSize: 48, 
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1.5,
    marginBottom: 20,
  },
  scannerIcon: { 
    marginVertical: 40, 
    padding: 60, 
    borderRadius: 30, 
    backgroundColor: '#1c1c1e',
    borderWidth: 3,
    borderColor: '#3a3a3c',
    // Subtle shadow to make the scanner area pop
    shadowColor: '#1a73e8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(52, 168, 83, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 50,
  },
  status: { 
    color: '#34a853', 
    fontSize: 22, 
    fontWeight: 'bold',
    letterSpacing: 2
  },
  pulseDot: { 
    width: 12, 
    height: 12, 
    borderRadius: 6, 
    backgroundColor: '#34a853' 
  }
});