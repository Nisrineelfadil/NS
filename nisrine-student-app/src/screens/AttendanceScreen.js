import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
// import { BarCodeScanner } from 'expo-barcode-scanner'; // Disabled for Expo Go compatibility

const API_URL = 'http://192.168.1.31:3000'; // Server IP address

export default function AttendanceScreen() {
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAttendanceHistory();
  }, []);

  const loadAttendanceHistory = async () => {
    try {
      const token = await AsyncStorage.getItem('studentToken');
      const response = await axios.get(
        `${API_URL}/api/attendance/student/history`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 50 },
        }
      );

      if (response.data.success) {
        setAttendanceHistory(response.data.records);
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error loading attendance history:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAttendanceHistory();
  };

  const handleManualEntry = async () => {
    const idToUse = sessionId;
    if (!idToUse.trim()) {
      Alert.alert('Error', 'Please enter a session ID');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('studentToken');
      const response = await axios.post(
        `${API_URL}/api/attendance/scan`,
        {
          sessionId: idToUse.trim(),
          timestamp: new Date().toISOString(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        const status = response.data.status;
        const statusEmoji = status === 'present' ? '✅' : status === 'late' ? '⏰' : '❌';
        const statusText = status === 'present' ? 'Present' : status === 'late' ? 'Late' : 'Absent';
        
        Alert.alert(
          'Success',
          `${statusEmoji} Marked as ${statusText}\n\nSession: ${response.data.session?.groupName || 'Unknown'}\nFormation: ${response.data.session?.formation || 'Unknown'}`,
          [{ text: 'OK', onPress: () => {
            setSessionId('');
            loadAttendanceHistory();
          }}]
        );
      }
    } catch (error) {
      console.error('Error scanning attendance:', error);
      const errorMessage = error.response?.data?.error || 'Failed to mark attendance';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return '#10b981';
      case 'late':
        return '#f59e0b';
      case 'absent':
        return '#ef4444';
      case 'pending':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return 'checkmark-circle';
      case 'late':
        return 'time';
      case 'absent':
        return 'close-circle';
      case 'pending':
        return 'hourglass-outline';
      default:
        return 'help-circle';
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FFCC00']} />
      }
    >
      {/* QR Code Scanner Section */}
      <View style={styles.scannerCard}>
        <View style={styles.scannerHeader}>
          <Ionicons name="qr-code" size={32} color="#FFCC00" />
          <Text style={styles.scannerTitle}>Scan Attendance QR Code</Text>
        </View>
        
        <Text style={styles.scannerDescription}>
          Enter the Session ID from the QR code displayed by your teacher
        </Text>

        <View style={styles.inputContainer}>
          <Ionicons name="key-outline" size={20} color="#6b7280" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter Session ID"
            value={sessionId}
            onChangeText={setSessionId}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <TouchableOpacity
          style={[styles.scanButton, loading && styles.scanButtonDisabled]}
          onPress={handleManualEntry}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.scanButtonText}>Mark Attendance</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#3b82f6" />
          <Text style={styles.infoText}>
            You'll be marked as Present if on time, or Late if after the grace period
          </Text>
        </View>
      </View>

      {/* Statistics Card */}
      {stats && (
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Attendance Statistics</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: '#10b98120' }]}>
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              </View>
              <Text style={styles.statValue}>{stats.present}</Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: '#f59e0b20' }]}>
                <Ionicons name="time" size={24} color="#f59e0b" />
              </View>
              <Text style={styles.statValue}>{stats.late}</Text>
              <Text style={styles.statLabel}>Late</Text>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: '#ef444420' }]}>
                <Ionicons name="close-circle" size={24} color="#ef4444" />
              </View>
              <Text style={styles.statValue}>{stats.absent}</Text>
              <Text style={styles.statLabel}>Absent</Text>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: '#FFCC0020' }]}>
                <Ionicons name="stats-chart" size={24} color="#FFCC00" />
              </View>
              <Text style={styles.statValue}>{stats.attendanceRate}%</Text>
              <Text style={styles.statLabel}>Rate</Text>
            </View>
          </View>
        </View>
      )}

      {/* Attendance History */}
      <View style={styles.historySection}>
        <Text style={styles.historyTitle}>Attendance History</Text>
        
        {attendanceHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>No attendance records yet</Text>
            <Text style={styles.emptySubtext}>
              Your attendance history will appear here
            </Text>
          </View>
        ) : (
          attendanceHistory.map((record, index) => (
            <View key={index} style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(record.status) + '20' }
                ]}>
                  <Ionicons
                    name={getStatusIcon(record.status)}
                    size={20}
                    color={getStatusColor(record.status)}
                  />
                  <Text style={[
                    styles.statusText,
                    { color: getStatusColor(record.status) }
                  ]}>
                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                  </Text>
                </View>
                <Text style={styles.dateText}>
                  {new Date(record.date).toLocaleDateString()}
                </Text>
              </View>

              <View style={styles.historyDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="school" size={16} color="#6b7280" />
                  <Text style={styles.detailText}>{record.formation}</Text>
                </View>
                
                {record.scanTime && (
                  <View style={styles.detailRow}>
                    <Ionicons name="time" size={16} color="#6b7280" />
                    <Text style={styles.detailText}>
                      Scanned at {new Date(record.scanTime).toLocaleTimeString()}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scannerCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  scannerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  scannerDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1f2937',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFCC00',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  scanButtonDisabled: {
    opacity: 0.6,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#3b82f6',
    lineHeight: 18,
  },
  statsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  historySection: {
    padding: 16,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
  },
  historyCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 14,
    color: '#6b7280',
  },
  historyDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
  },
});
