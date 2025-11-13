import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

const API_URL = 'http://192.168.1.31:3000'; // Server IP address

export default function MessagesScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const token = await AsyncStorage.getItem('studentToken');
      const response = await axios.get(
        `${API_URL}/api/grades/student/messages`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMessages();
  };

  const markAsRead = async (id) => {
    try {
      const token = await AsyncStorage.getItem('studentToken');
      await axios.put(
        `${API_URL}/api/grades/student/messages/${id}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessages(messages.map(msg => 
        msg._id === id ? { ...msg, isRead: true } : msg
      ));
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const deleteMessage = async (id) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('studentToken');
              await axios.delete(
                `${API_URL}/api/grades/student/messages/${id}`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              setMessages(messages.filter(msg => msg._id !== id));
            } catch (error) {
              console.error('Error deleting message:', error);
              Alert.alert('Error', 'Failed to delete message');
            }
          },
        },
      ]
    );
  };

  const getIcon = (type) => {
    switch (type) {
      case 'announcement':
        return 'megaphone';
      case 'notification':
        return 'notifications';
      case 'alert':
        return 'alert-circle';
      default:
        return 'mail';
    }
  };

  const getIconColor = (type) => {
    switch (type) {
      case 'announcement':
        return '#FFCC00';
      case 'notification':
        return '#3b82f6';
      case 'alert':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = messages.filter(m => !m.isRead).length;

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#FFCC00" />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Stats */}
      <View style={styles.headerCard}>
        <View style={styles.statItem}>
          <Ionicons name="mail" size={24} color="#FFCC00" />
          <Text style={styles.statValue}>{messages.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="mail-unread" size={24} color="#ef4444" />
          <Text style={styles.statValue}>{unreadCount}</Text>
          <Text style={styles.statLabel}>Unread</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FFCC00']} />
        }
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="mail-open-outline" size={80} color="#d1d5db" />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>
              You'll receive announcements and notifications here
            </Text>
          </View>
        ) : (
          <View style={styles.messagesContainer}>
            {messages.map((message) => (
              <TouchableOpacity
                key={message._id}
                style={[
                  styles.messageCard,
                  !message.isRead && styles.unreadCard
                ]}
                onPress={() => markAsRead(message._id)}
                activeOpacity={0.7}
              >
                <View style={styles.messageHeader}>
                  <View style={[
                    styles.iconContainer,
                    { backgroundColor: getIconColor(message.type) + '20' }
                  ]}>
                    <Ionicons 
                      name={getIcon(message.type)} 
                      size={24} 
                      color={getIconColor(message.type)} 
                    />
                  </View>
                  <View style={styles.messageHeaderText}>
                    <Text style={styles.messageTitle}>{message.title}</Text>
                    <Text style={styles.messageDate}>{formatDate(message.createdAt)}</Text>
                  </View>
                  {!message.isRead && (
                    <View style={styles.unreadBadge}>
                      <View style={styles.unreadDot} />
                    </View>
                  )}
                </View>
                <Text style={styles.messageText}>{message.message}</Text>
                <View style={styles.messageFooter}>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteMessage(message._id)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  headerCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
  },
  scrollView: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
  },
  messageCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#e5e7eb',
  },
  unreadCard: {
    borderLeftColor: '#FFCC00',
    backgroundColor: '#fffbeb',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  messageDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  unreadBadge: {
    marginLeft: 8,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
  },
  messageText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingHorizontal: 40,
  },
});
