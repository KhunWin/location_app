import React, { createContext, useState, useContext, useEffect } from 'react';
import * as Notifications from 'expo-notifications';

// Define notification type
export type Notification = {
  id: string;
  title: string;
  body: string;
  data?: any;
  read: boolean;
  createdAt: Date;
};

type NotificationContextType = {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Set up notification handler
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      const newNotification: Notification = {
        id: Date.now().toString(),
        title: notification.request.content.title || 'New Notification',
        body: notification.request.content.body || '',
        data: notification.request.content.data,
        read: false,
        createdAt: new Date()
      };
      
      setNotifications(prev => [newNotification, ...prev]);
    });

    return () => subscription.remove();
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider 
      value={{ 
        notifications, 
        unreadCount, 
        markAsRead, 
        markAllAsRead, 
        clearNotifications 
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};