// import React, { createContext, useContext, useState, useEffect } from 'react';
// import * as Notifications from 'expo-notifications';
// import { Platform } from 'react-native';
// import { getCurrentUser } from '../lib/appwrite';
// import { 
//   getUserNotifications, 
//   markNotificationAsRead, 
//   configureNotifications, 
//   registerForPushNotifications,
//   sendLocalNotificationToAll
// } from '../services/NotificationService';

// // Define notification types
// export type NotificationType = {
//   id: string;
//   title: string;
//   body: string;
//   data?: any;
//   read: boolean;
//   createdAt: Date;
// };

// // Create context
// type NotificationContextType = {
//   notifications: NotificationType[];
//   unreadCount: number;
//   addNotification: (notification: Omit<NotificationType, 'id' | 'read' | 'createdAt'>) => void;
//   markAsRead: (id: string) => void;
//   markAllAsRead: () => void;
//   clearNotifications: () => void;
//   refreshNotifications: () => Promise<void>;
// };

// const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// // Provider component
// export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const [notifications, setNotifications] = useState<NotificationType[]>([]);
//   const [unreadCount, setUnreadCount] = useState(0);
//   const [userId, setUserId] = useState<string | null>(null);
//   const [isInitialized, setIsInitialized] = useState(false);

//   // Load notifications from database when user changes
//   const loadNotifications = async (userId: string) => {
//     try {
//       console.log('Loading notifications for user:', userId);
      
//       // Get notifications from database
//       const userNotifications = await getUserNotifications(userId);
      
//       // If no notifications found in database
//       if (userNotifications.length === 0) {
//         console.log('No database notifications found for user', userId);
//         return;
//       }
      
//       console.log(`Found ${userNotifications.length} notifications in database for user ${userId}`);
      
//       // Convert to our notification format
//       const formattedNotifications = userNotifications.map(notification => ({
//         id: notification.$id,
//         title: notification.title,
//         body: notification.body,
//         data: notification.data,
//         read: notification.read,
//         createdAt: new Date(notification.created_at)
//       }));
      
//       console.log('Setting notifications in state:', formattedNotifications.length);
//       setNotifications(formattedNotifications);
      
//       // Update unread count
//       const unreadCount = formattedNotifications.filter(n => !n.read).length;
//       setUnreadCount(unreadCount);
//     } catch (error) {
//       console.error('Error loading notifications:', error);
//     }
//   };

//   // Refresh notifications
//   const refreshNotifications = async () => {
//     if (userId) {
//       await loadNotifications(userId);
//     }
//   };

//   // Register for push notifications on mount
//   useEffect(() => {
//     const setupNotifications = async () => {
//       try {
//         // Configure notification handler
//         await configureNotifications();
    
//         try {
//           // Get current user
//           const user = await getCurrentUser();
//           if (user) {
//             setUserId(user.$id);
//             console.log('NotificationContext: User ID set to', user.$id);
//             console.log('User role:', user.role); // Log user role to debug
            
//             // Register for push notifications
//             await registerForPushNotifications(user.$id);
            
//             // Load notifications for this user
//             await loadNotifications(user.$id);
//           }
//         } catch (userError) {
//           console.error('Error getting user in notification setup:', userError);
//         }
        
//         // Mark as initialized
//         setIsInitialized(true);
//       } catch (error) {
//         console.error('Error setting up notifications:', error);
//         setIsInitialized(true); // Still mark as initialized to avoid hanging
//       }
//     };
  
//     setupNotifications();
  
//     // Set up notification listener for all users
//     const subscription = Notifications.addNotificationReceivedListener(notification => {
//       const { title, body, data } = notification.request.content;
      
//       if (title && body) {
//         console.log('NotificationContext: Received notification:', title, body);
        
//         // Add to state for the current UI
//         addNotification({
//           title,
//           body,
//           data
//         });
        
//         console.log('NotificationContext: Added notification to UI');
//       }
//     });
  
//     return () => {
//       subscription.remove();
//     };
//   }, []);

//   // Add a new notification
//   const addNotification = (notification: Omit<NotificationType, 'id' | 'read' | 'createdAt'>) => {
//     const newNotification: NotificationType = {
//       ...notification,
//       id: Date.now().toString(),
//       read: false,
//       createdAt: new Date()
//     };

//     setNotifications(prev => [newNotification, ...prev]);
//     setUnreadCount(prev => prev + 1);
//   };

//   // Mark a notification as read
//   const markAsRead = async (id: string) => {
//     // Update in database
//     await markNotificationAsRead(id);
    
//     // Update local state
//     setNotifications(prev => 
//       prev.map(notification => 
//         notification.id === id ? { ...notification, read: true } : notification
//       )
//     );
    
//     // Recalculate unread count
//     const updatedUnreadCount = notifications.filter(n => n.id !== id && !n.read).length;
//     setUnreadCount(updatedUnreadCount);
//   };

//   // Mark all notifications as read
//   const markAllAsRead = async () => {
//     // Update each notification in database
//     for (const notification of notifications.filter(n => !n.read)) {
//       await markNotificationAsRead(notification.id);
//     }
    
//     // Update local state
//     setNotifications(prev => 
//       prev.map(notification => ({ ...notification, read: true }))
//     );
    
//     // Set unread count to 0
//     setUnreadCount(0);
//   };

//   // Clear all notifications
//   const clearNotifications = () => {
//     setNotifications([]);
//     setUnreadCount(0);
//   };

//   // Context value
//   const value = {
//     notifications,
//     unreadCount,
//     addNotification,
//     markAsRead,
//     markAllAsRead,
//     clearNotifications,
//     refreshNotifications
//   };

//   return (
//     <NotificationContext.Provider value={value}>
//       {children}
//     </NotificationContext.Provider>
//   );
// };

// // Custom hook to use the notification context
// export const useNotifications = () => {
//   const context = useContext(NotificationContext);
//   if (context === undefined) {
//     console.warn('useNotifications was called outside of NotificationProvider');
//     // Return a default implementation instead of throwing an error
//     return {
//       notifications: [],
//       unreadCount: 0,
//       addNotification: () => {},
//       markAsRead: () => {},
//       markAllAsRead: () => {},
//       clearNotifications: () => {},
//       refreshNotifications: async () => {}
//     };
//   }
//   return context;
// };

// // Helper function to get notification actions from outside components
// export const getNotificationActions = () => {
//   const context = useContext(NotificationContext);
//   if (!context) {
//     return {
//       addNotification: () => {},
//       markAsRead: () => {},
//       markAllAsRead: () => {},
//       clearNotifications: () => {},
//       refreshNotifications: async () => {}
//     };
//   }
//   return {
//     addNotification: context.addNotification,
//     markAsRead: context.markAsRead,
//     markAllAsRead: context.markAllAsRead,
//     clearNotifications: context.clearNotifications,
//     refreshNotifications: context.refreshNotifications
//   };
// };

import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform, AppState } from 'react-native'; // Add AppState import
import { getCurrentUser } from '../lib/appwrite';
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  configureNotifications, 
  registerForPushNotifications 
} from '../services/NotificationService';

// Define notification types
export type NotificationType = {
  id: string;
  title: string;
  body: string;
  data?: any;
  read: boolean;
  createdAt: Date;
};

// Create context
type NotificationContextType = {
  notifications: NotificationType[];
  unreadCount: number;
  addNotification: (notification: Omit<NotificationType, 'id' | 'read' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  refreshNotifications: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Provider component
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [appState, setAppState] = useState(AppState.currentState);
  const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load notifications from database when user changes
  const loadNotifications = async (userId: string) => {
    try {
      // Prevent multiple simultaneous refreshes
      if (isRefreshing) return;
      setIsRefreshing(true);
      
    //   console.log('Loading notifications for user:', userId);
      
      // Get notifications from database
      const userNotifications = await getUserNotifications(userId);
      
      // If no notifications found in database
      if (userNotifications.length === 0) {
        console.log('No database notifications found for user', userId);
        setIsRefreshing(false);
        return;
      }
      
    //   console.log(`Found ${userNotifications.length} notifications for user ${userId}`);
      
      // Convert to our notification format
      const formattedNotifications = userNotifications.map(notification => ({
        id: notification.$id,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        read: notification.read,
        createdAt: new Date(notification.created_at)
      }));
      
    //   console.log('Setting notifications in state:', formattedNotifications.length);
      setNotifications(formattedNotifications);
      
      // Update unread count
      const unreadCount = formattedNotifications.filter(n => !n.read).length;
      setUnreadCount(unreadCount);
      
      // Update last refresh time
      setLastRefreshTime(Date.now());
      setIsRefreshing(false);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setIsRefreshing(false);
    }
  };

  // Refresh notifications
  const refreshNotifications = async () => {
    if (userId) {
    //   console.log('Manually refreshing notifications...');
      await loadNotifications(userId);
    }
  };

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.match(/inactive|background/) && 
        nextAppState === 'active' &&
        userId
      ) {
        console.log('App has come to the foreground, refreshing notifications');
        loadNotifications(userId);
      }
      setAppState(nextAppState);
    });

    return () => {
      subscription.remove();
    };
  }, [appState, userId]);
  
  // Periodic refresh (every 60 seconds when app is active)
  useEffect(() => {
    if (!userId) return;
    
    const intervalId = setInterval(() => {
      // Only refresh if app is in foreground and it's been at least 30 seconds
      if (appState === 'active' && Date.now() - lastRefreshTime > 30000) {
        console.log('Periodic notification refresh');
        loadNotifications(userId);
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, [userId, appState, lastRefreshTime]);

  // Register for push notifications on mount
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        // Configure notification handler
        await configureNotifications();
    
        try {
          // Get current user
          const user = await getCurrentUser();
          if (user) {
            setUserId(user.$id);
            console.log('NotificationContext: User ID set to', user.$id);
            console.log('User role:', user.role); // Log user role to debug
            
            // Register for push notifications
            await registerForPushNotifications(user.$id);
            
            // Load notifications for this user
            await loadNotifications(user.$id);
          }
        } catch (userError) {
          console.error('Error getting user in notification setup:', userError);
        }
      } catch (error) {
        console.error('Error setting up notifications:', error);
      }
    };
  
    setupNotifications();
  
    // Set up notification listener for all users
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      const { title, body, data } = notification.request.content;
      
      if (title && body) {
        console.log('NotificationContext: Received notification:', title, body);
        
        // Add to state for the current UI
        addNotification({
          title,
          body,
          data
        });
        
        console.log('NotificationContext: Added notification to UI');
      }
    });
  
    return () => {
      subscription.remove();
    };
  }, []);

  // Update unread count when notifications change
  useEffect(() => {
    const count = notifications.filter(n => !n.read).length;
    setUnreadCount(count);
  }, [notifications]);

  // Add a new notification
  const addNotification = (notification: Omit<NotificationType, 'id' | 'read' | 'createdAt'>) => {
    // Check if this notification is already in our list (to avoid duplicates)
    const isDuplicate = notifications.some(
      n => n.title === notification.title && n.body === notification.body && 
           Date.now() - n.createdAt.getTime() < 5000 // Within 5 seconds
    );
    
    if (!isDuplicate) {
      const newNotification: NotificationType = {
        ...notification,
        id: Date.now().toString(),
        read: false,
        createdAt: new Date()
      };
      
      setNotifications(prev => [newNotification, ...prev]);
    }
  };

  // Mark a notification as read
  const markAsRead = async (id: string) => {
    // Update in database
    await markNotificationAsRead(id);
    
    // Update local state
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    // Update each notification in database
    for (const notification of notifications.filter(n => !n.read)) {
      await markNotificationAsRead(notification.id);
    }
    
    // Update local state
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

//   // Clear all notifications
//   const clearNotifications = () => {
//     setNotifications([]);
//   };


    const clearNotifications = () => {
        // Explicitly set both notifications and unread count to initial values
        setNotifications([]);
        setUnreadCount(0);
        
        // Force a state update
        setLastRefreshTime(Date.now());
    };

  // Context value
  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    refreshNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use the notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    console.warn('useNotifications was called outside of NotificationProvider');
    // Return a default implementation instead of throwing an error
    return {
      notifications: [],
      unreadCount: 0,
      addNotification: () => {},
      markAsRead: () => {},
      markAllAsRead: () => {},
      clearNotifications: () => {},
      refreshNotifications: async () => {}
    };
  }
  return context;
};

// Helper function to get notification actions from outside components
export const getNotificationActions = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    return {
      addNotification: () => {},
      markAsRead: () => {},
      markAllAsRead: () => {},
      clearNotifications: () => {},
      refreshNotifications: async () => {}
    };
  }
  return {
    addNotification: context.addNotification,
    markAsRead: context.markAsRead,
    markAllAsRead: context.markAllAsRead,
    clearNotifications: context.clearNotifications,
    refreshNotifications: context.refreshNotifications
  };
};