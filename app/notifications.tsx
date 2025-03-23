import React, { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useNotifications } from '../context/NotificationContext';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const NotificationsScreen = () => {
  const { notifications, markAsRead, markAllAsRead, clearNotifications } = useNotifications();

  useEffect(() => {
    // Mark all as read when the screen is opened
    markAllAsRead();
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleString();
  };

  if (notifications.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="notifications-off" size={64} color="#ccc" />
        <Text style={styles.emptyText}>No notifications</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Notifications',
          headerRight: () => (
            <TouchableOpacity onPress={clearNotifications} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
          ),
        }} 
      />
      
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.notificationItem, !item.read && styles.unreadItem]}
            onPress={() => markAsRead(item.id)}
          >
            <View style={styles.notificationContent}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>
              <Text style={styles.time}>{formatDate(item.createdAt)}</Text>
            </View>
            {!item.read && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        )}
      />
    </View>
  );
};




const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  notificationItem: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
  },
  unreadItem: {
    backgroundColor: '#f0f7ff',
  },
  notificationContent: {
    flex: 1,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  body: {
    color: '#555',
    marginBottom: 8,
  },
  time: {
    color: '#888',
    fontSize: 12,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007bff',
    alignSelf: 'center',
    marginLeft: 10,
  },
  clearButton: {
    marginRight: 16,
  },
  clearButtonText: {
    color: '#007bff',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#888',
  },
});

export default NotificationsScreen;