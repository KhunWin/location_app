// import React from 'react';
// import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { useRouter } from 'expo-router';
// import { useNotifications } from '../context/NotificationContext';

// const NotificationIcon = () => {
//   const router = useRouter();
//   const { unreadCount } = useNotifications();

//   return (
//     <TouchableOpacity 
//       style={styles.container}
//       onPress={() => router.push('/notifications')}
//     >
//       <Ionicons name="notifications" size={24} color="#333" />
//       {unreadCount > 0 && (
//         <View style={styles.badge}>
//           <Text style={styles.badgeText}>
//             {unreadCount > 99 ? '99+' : unreadCount}
//           </Text>
//         </View>
//       )}
//     </TouchableOpacity>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     marginRight: 15,
//     position: 'relative',
//   },
//   badge: {
//     position: 'absolute',
//     right: -6,
//     top: -6,
//     backgroundColor: 'red',
//     borderRadius: 10,
//     minWidth: 20,
//     height: 20,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   badgeText: {
//     color: 'white',
//     fontSize: 12,
//     fontWeight: 'bold',
//   },
// });

// export default NotificationIcon;

import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useNotifications } from '../context/NotificationContext';
import * as Notifications from 'expo-notifications';

const NotificationIcon = () => {
  const router = useRouter();
  const { unreadCount, refreshNotifications } = useNotifications();
  const [localUnreadCount, setLocalUnreadCount] = useState(unreadCount);

  // Update local count when unreadCount changes
  useEffect(() => {
    setLocalUnreadCount(unreadCount);
  }, [unreadCount]);

  // Listen for new notifications and update count
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(() => {
      // Immediately refresh notifications when a new one is received
      refreshNotifications();
      // Increment local count immediately for UI feedback
      setLocalUnreadCount(prev => prev + 1);
    });

    // Set up periodic refresh
    const intervalId = setInterval(() => {
      refreshNotifications();
    }, 30000); // Refresh every 30 seconds

    // Initial refresh
    refreshNotifications();

    return () => {
      subscription.remove();
      clearInterval(intervalId);
    };
  }, [refreshNotifications]);

  // Navigate to notifications screen
  const handlePress = () => {
    router.push('/notifications');
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Ionicons name="notifications" size={24} color="#333" />
      {localUnreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {localUnreadCount > 99 ? '99+' : localUnreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginRight: 15,
    position: 'relative',
    padding: 5,
  },
  badge: {
    position: 'absolute',
    right: -6,
    top: -6,
    backgroundColor: 'red',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default NotificationIcon;