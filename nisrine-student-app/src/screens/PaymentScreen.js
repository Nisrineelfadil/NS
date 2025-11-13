import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

const API_URL = 'http://192.168.1.31:3000'; // Server IP address

export default function PaymentScreen() {
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPaymentInfo();
  }, []);

  const loadPaymentInfo = async () => {
    try {
      const token = await AsyncStorage.getItem('studentToken');

      const response = await axios.get(
        `${API_URL}/api/grades/student/payment-status`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setPaymentInfo(response.data.student);
      }
    } catch (error) {
      console.error('Error loading payment info:', error);
      Alert.alert('Error', 'Failed to load payment information. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPaymentInfo();
  };

  const getPaymentStatus = () => {
    if (!paymentInfo) return { status: 'unknown', color: '#9ca3af', icon: 'help-circle' };

    const status = paymentInfo.paymentStatus?.toLowerCase();
    if (status === 'paid') {
      return { status: 'Paid', color: '#10b981', icon: 'checkmark-circle' };
    } else if (status === 'pending') {
      return { status: 'Pending', color: '#f59e0b', icon: 'time' };
    } else if (status === 'overdue') {
      return { status: 'Overdue', color: '#ef4444', icon: 'alert-circle' };
    }
    return { status: 'Unknown', color: '#9ca3af', icon: 'help-circle' };
  };

  const getDaysUntilDue = () => {
    if (!paymentInfo?.paymentDate) return null;

    const paymentDate = new Date(paymentInfo.paymentDate);
    const today = new Date();
    const diffTime = paymentDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFCC00" />
        <Text style={styles.loadingText}>Loading payment information...</Text>
      </View>
    );
  }

  const paymentStatus = getPaymentStatus();
  const daysUntilDue = getDaysUntilDue();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FFCC00']} />
      }
    >
      {/* Status Card */}
      <View style={[styles.statusCard, { backgroundColor: paymentStatus.color + '20' }]}>
        <View style={[styles.statusIcon, { backgroundColor: paymentStatus.color }]}>
          <Ionicons name={paymentStatus.icon} size={40} color="#fff" />
        </View>
        <Text style={styles.statusTitle}>Payment Status</Text>
        <Text style={[styles.statusText, { color: paymentStatus.color }]}>
          {paymentStatus.status}
        </Text>
      </View>

      {/* Payment Details */}
      <View style={styles.detailsCard}>
        <Text style={styles.cardTitle}>Payment Information</Text>

        <View style={styles.detailRow}>
          <View style={styles.detailLabel}>
            <Ionicons name="cash-outline" size={20} color="#6b7280" />
            <Text style={styles.labelText}>Amount</Text>
          </View>
          <Text style={styles.detailValue}>
            {paymentInfo?.paymentAmount ? `${paymentInfo.paymentAmount} MAD` : 'N/A'}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <View style={styles.detailLabel}>
            <Ionicons name="calendar-outline" size={20} color="#6b7280" />
            <Text style={styles.labelText}>Due Date</Text>
          </View>
          <Text style={styles.detailValue}>
            {paymentInfo?.paymentDate
              ? new Date(paymentInfo.paymentDate).toLocaleDateString()
              : 'N/A'}
          </Text>
        </View>

        {daysUntilDue !== null && (
          <>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <View style={styles.detailLabel}>
                <Ionicons name="hourglass-outline" size={20} color="#6b7280" />
                <Text style={styles.labelText}>Days Until Due</Text>
              </View>
              <Text
                style={[
                  styles.detailValue,
                  {
                    color: daysUntilDue < 0 ? '#ef4444' : daysUntilDue < 7 ? '#f59e0b' : '#10b981',
                  },
                ]}
              >
                {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} days overdue` : `${daysUntilDue} days`}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Student Info */}
      <View style={styles.detailsCard}>
        <Text style={styles.cardTitle}>Student Information</Text>

        <View style={styles.detailRow}>
          <View style={styles.detailLabel}>
            <Ionicons name="person-outline" size={20} color="#6b7280" />
            <Text style={styles.labelText}>Full Name</Text>
          </View>
          <Text style={styles.detailValue}>{paymentInfo?.fullName || 'N/A'}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <View style={styles.detailLabel}>
            <Ionicons name="mail-outline" size={20} color="#6b7280" />
            <Text style={styles.labelText}>Email</Text>
          </View>
          <Text style={[styles.detailValue, { fontSize: 12 }]}>
            {paymentInfo?.schoolEmail || 'N/A'}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <View style={styles.detailLabel}>
            <Ionicons name="school-outline" size={20} color="#6b7280" />
            <Text style={styles.labelText}>Formation</Text>
          </View>
          <Text style={styles.detailValue}>
            {paymentInfo?.formation?.join(', ') || 'N/A'}
          </Text>
        </View>
      </View>

      {/* Help Card */}
      <View style={styles.helpCard}>
        <Ionicons name="information-circle" size={24} color="#3b82f6" />
        <Text style={styles.helpText}>
          For payment inquiries, please contact the school administration office.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6b7280',
  },
  statusCard: {
    margin: 15,
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusTitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 5,
  },
  statusText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  detailsCard: {
    backgroundColor: '#fff',
    margin: 15,
    marginTop: 0,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  labelText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 10,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'right',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  helpCard: {
    flexDirection: 'row',
    backgroundColor: '#dbeafe',
    margin: 15,
    marginTop: 0,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  helpText: {
    flex: 1,
    fontSize: 14,
    color: '#1e40af',
    marginLeft: 12,
    lineHeight: 20,
  },
});
