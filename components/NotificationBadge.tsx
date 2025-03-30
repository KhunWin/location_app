import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../context/NotificationContext';
import { useRouter } from 'expo-router';

type NotificationBadgeProps = {
  size?: number;
  color?: string;
};

const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  size = 24,
  color = '#000',
}) => {
  const { unreadCount } = useNotifications();
  const router = useRouter();

  const handlePress = () => {
    router.push('/notifications');
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.container}>
      <Ionicons name="notifications-outline" size={size} color={color} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default NotificationBadge;