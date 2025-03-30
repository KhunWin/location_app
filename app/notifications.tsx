import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, SafeAreaView, RefreshControl, Platform } from 'react-native';
import { useNotifications } from '../context/NotificationContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { deleteAllUserNotifications } from '../services/NotificationService';
import { getCurrentUser } from '../lib/appwrite';

const NotificationsScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  
  try {
    const { notifications, markAsRead, markAllAsRead, clearNotifications, refreshNotifications } = useNotifications();
    const router = useRouter();
    const [userId, setUserId] = useState(null);

    // Get current user ID on mount
    useEffect(() => {
      const fetchUserId = async () => {
        const user = await getCurrentUser();
        if (user) {
          setUserId(user.$id);
        }
      };
      fetchUserId();
    }, []);


    // const handleClearNotifications = async () => {
    //     try {
    //     // Show loading state
    //     setRefreshing(true);
        
    //     if (userId) {
    //         // Delete from database first
    //         await deleteAllUserNotifications(userId);
            
    //         // Explicitly clear notifications from context
    //         clearNotifications();
            
    //         // Force a refresh of notifications
    //         await refreshNotifications();
    //     } else {
    //         console.warn('No user ID available for clearing notifications');
    //     }
    //     } catch (error) {
    //     console.error('Error clearing notifications:', error);
    //     // You might want to show an error message to the user here
    //     } finally {
    //     setRefreshing(false);
    //     }
    // };

  //   const handleClearNotifications = async () => {
  //     try {
  //         // Show loading state
  //         setRefreshing(true);
          
  //         if (userId) {
  //             // Delete from database first
  //             await deleteAllUserNotifications(userId);
              
  //             // Explicitly clear notifications from context
  //             clearNotifications();
              
  //             // Give a small delay to ensure state updates properly
  //             setTimeout(async () => {
  //                 // Force a refresh of notifications
  //                 await refreshNotifications();
  //                 setRefreshing(false);
  //             }, 300);
              
  //             return; // Return early to avoid the finally block
  //         } else {
  //             console.warn('No user ID available for clearing notifications');
  //         }
  //     } catch (error) {
  //         console.error('Error clearing notifications:', error);
  //         // You might want to show an error message to the user here
  //     } finally {
  //         if (!userId) {
  //             setRefreshing(false);
  //         }
  //     }
  // };
    

    // Fix for Android duplicate notifications
    
    const handleClearNotifications = async () => {
      try {
          setRefreshing(true);
          
          if (userId) {
              // Delete from database first
              await deleteAllUserNotifications(userId);
              
              if (Platform.OS === 'ios') {
                  // For iOS: Clear notifications and force UI update
                  clearNotifications();
                  setRefreshing(false);
                  
                  // Force a state update to show empty state
                  setTimeout(() => {
                      clearNotifications();  // Call again to ensure UI update
                      refreshNotifications();
                  }, 50);
              } else {
                  // For Android: Normal flow
                  clearNotifications();
                  await refreshNotifications();
                  setRefreshing(false);
              }
          } else {
              console.warn('No user ID available for clearing notifications');
              setRefreshing(false);
          }
      } catch (error) {
          console.error('Error clearing notifications:', error);
          setRefreshing(false);
      }
  };

    
    useEffect(() => {
      if (Platform.OS === 'android') {
        const seen = new Set();
        const uniqueNotifications = notifications.filter(notification => {
          const duplicate = seen.has(notification.id);
          seen.add(notification.id);
          return !duplicate;
        });
        if (uniqueNotifications.length !== notifications.length) {
          clearNotifications();
          uniqueNotifications.forEach(notification => {
            // Re-add unique notifications
            // Your addNotification logic here
          });
        }
      }
    }, [notifications]);

    // Handle pull-to-refresh
    const onRefresh = async () => {
      setRefreshing(true);
      await refreshNotifications();
      setRefreshing(false);
    };
    
    // Refresh notifications when the screen loads
    useEffect(() => {
      refreshNotifications();
    }, []);

    const handleNotificationPress = (notification) => {
      markAsRead(notification.id);
      
      // Navigate based on notification type
      if (notification.data?.type === 'new_class') {
        router.push(`/class/${notification.data.classId}`);
      } else if (notification.data?.type === 'new_session') {
        router.push(`/class/${notification.data.classId}/sessions`);
      }
    };

    const formatDate = (date) => {
      return new Date(date).toLocaleString();
    };

    const renderNotification = ({ item }) => (
      <TouchableOpacity
        style={[styles.notificationItem, !item.read && styles.unreadNotification]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationBody}>{item.body}</Text>
          <Text style={styles.notificationTime}>{formatDate(item.createdAt)}</Text>
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          {/* <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity> */}
          {/* <Text style={styles.headerTitle}>Notifications</Text> */}
          <View style={styles.headerActions}>
            {/* <TouchableOpacity onPress={markAllAsRead} style={styles.headerButton}>
              <Text style={styles.headerButtonText}>Mark all as read</Text>
            </TouchableOpacity> */}
            <TouchableOpacity onPress={handleClearNotifications} style={styles.headerButton}>
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>

        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No notifications yet</Text>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={onRefresh}
            >
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderNotification}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#007AFF']}
              />
            }
          />
        )}
      </SafeAreaView>
    );
  } catch (error) {
    // Fallback UI in case of context error
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => useRouter().back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.errorText}>Unable to load notifications</Text>
        </View>
      </SafeAreaView>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: 16,
  },
  headerButtonText: {
    color: '#007AFF',
    fontSize: 14,
  },
  listContainer: {
    padding: 16,
  },
  notificationItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadNotification: {
    backgroundColor: '#f0f7ff',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#888',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    marginTop: 16,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    marginTop: 16,
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default NotificationsScreen;