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

// // context/NotificationContext.js
// import React, { createContext, useState, useContext, useEffect } from 'react';
// import { getCurrentUser } from '../lib/appwrite';

// const NotificationContext = createContext();

// // Create a reference we can use outside of React components
// let notificationActions = {
//   addNotification: () => {},
//   clearNotifications: () => {}
// };

// export const NotificationProvider = ({ children }) => {
//   const [notifications, setNotifications] = useState([]);
//   const [currentUserRole, setCurrentUserRole] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);

//   // Fetch user role when provider is mounted
//   useEffect(() => {
//     const fetchUserRole = async () => {
//       try {
//         const user = await getCurrentUser();
//         setCurrentUserRole(user.role);
//       } catch (error) {
//         console.error('Error fetching user role:', error);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchUserRole();
//   }, []);

//   // Add a notification with the intended role
//   const addNotification = (title, body, intendedRole = null) => {
//     const newNotification = {
//       id: Date.now().toString(),
//       title,
//       body,
//       createdAt: new Date(),
//       read: false,
//       intendedRole // This can be 'student', 'teacher', or null (for all roles)
//     };

//     setNotifications(prev => [newNotification, ...prev]);
//   };

//   const markAsRead = (id) => {
//     setNotifications(prev =>
//       prev.map(notification =>
//         notification.id === id ? { ...notification, read: true } : notification
//       )
//     );
//   };

//   const markAllAsRead = () => {
//     setNotifications(prev =>
//       prev.map(notification => ({ ...notification, read: true }))
//     );
//   };

//   const clearNotifications = () => {
//     setNotifications([]);
//   };

//   // Filter notifications based on user role
//   const getFilteredNotifications = () => {
//     if (!currentUserRole) return [];
    
//     return notifications.filter(notification => 
//       // Keep notification if:
//       // 1. It's intended for all roles (intendedRole is null)
//       // 2. It's specifically intended for the current user's role
//       notification.intendedRole === null || notification.intendedRole === currentUserRole
//     );
//   };

//   // Update the global reference to these functions
//   notificationActions = {
//     addNotification,
//     clearNotifications
//   };

//   const value = {
//     notifications: getFilteredNotifications(),
//     addNotification,
//     markAsRead,
//     markAllAsRead,
//     clearNotifications,
//     currentUserRole,
//     isLoading
//   };

//   return (
//     <NotificationContext.Provider value={value}>
//       {children}
//     </NotificationContext.Provider>
//   );
// };

// export const useNotifications = () => useContext(NotificationContext);

// // Export the actions for use outside of React components
// export const getNotificationActions = () => notificationActions;