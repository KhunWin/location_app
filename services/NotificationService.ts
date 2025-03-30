import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { databases, account } from '../lib/appwrite';
import { appwriteConfig } from '@/lib/appwrite';
import { ID, Query } from 'react-native-appwrite';

// // Configure notifications
// export const configureNotifications = async () => {
//   if (Platform.OS === 'android') {
//     await Notifications.setNotificationChannelAsync('default', {
//       name: 'default',
//       importance: Notifications.AndroidImportance.MAX,
//       vibrationPattern: [0, 250, 250, 250],
//       lightColor: '#FF231F7C',
//     });
//   }

//   const { status: existingStatus } = await Notifications.getPermissionsAsync();
//   let finalStatus = existingStatus;
  
//   if (existingStatus !== 'granted') {
//     const { status } = await Notifications.requestPermissionsAsync();
//     finalStatus = status;
//   }
  
//   if (finalStatus !== 'granted') {
//     console.log('Failed to get push token for push notification!');
//     return false;
//   }

//   return true;
// };


// Update configureNotifications to check authentication
export const configureNotifications = async () => {
    try {
      // Check if user is authenticated
      const currentUser = await account.get();
      if (!currentUser) {
        console.log('No authenticated user found');
        return false;
      }
  
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
  
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return false;
      }
  
      return true;
    } catch (error) {
      if (error.code === 401) {
        console.log('User not authenticated');
        return false;
      }
      console.error('Error in configureNotifications:', error);
      return false;
    }
  };
  

// Register for push notifications
export const registerForPushNotifications = async (userId: string) => {
  try {
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return null;
    }

    const permissionGranted = await configureNotifications();
    if (!permissionGranted) return null;

    // Get the token that uniquely identifies this device
    const expoPushToken = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PROJECT_ID // Make sure to add this to your env variables
    });

    console.log('Expo Push Token:', expoPushToken.data);

    // Store token in user document
    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      userId,
      { 
        pushToken: expoPushToken.data,
        devicePlatform: Platform.OS
      }
    );

    return expoPushToken.data;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
};

// Function to send push notification through Expo's push service
export const sendPushNotification = async (expoPushToken: string, title: string, body: string, data: any = {}) => {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: title,
    body: body,
    data: data,
  };

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
};

// Convert data object to array of strings
const dataObjectToArray = (data) => {
  if (!data) return [];
  
  // Convert the data object to a JSON string
  const dataStr = JSON.stringify(data);
  
  // If it's longer than 300 characters (to be safe), split it
  if (dataStr.length <= 300) {
    return [dataStr];
  } else {
    // Split the data into chunks of 300 characters
    const chunks = [];
    for (let i = 0; i < dataStr.length; i += 300) {
      chunks.push(dataStr.substring(i, i + 300));
    }
    return chunks;
  }
};

// Convert array of strings back to object
const dataArrayToObject = (dataArray) => {
  if (!dataArray || !Array.isArray(dataArray) || dataArray.length === 0) {
    return {};
  }
  
  try {
    // Join all chunks and parse
    const dataStr = dataArray.join('');
    return JSON.parse(dataStr);
  } catch (e) {
    console.error('Error parsing notification data array:', e);
    return {};
  }
};

// Create a notification in the database for a specific user
const createNotificationDocument = async (userId, title, body, data) => {
  try {
    const uniqueId = ID.unique();
    console.log('Creating notification with ID:', uniqueId, 'for user:', userId);
    
    // Convert data object to array of strings
    const dataArray = dataObjectToArray(data);
    
    const notification = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.notificationCollectionId,
      uniqueId,
      {
        user_id: userId,
        title: title,
        body: body,
        data: dataArray, // Store as array of strings
        read: false,
        created_at: new Date().toISOString(),
        notification_type: data.type || 'general'
      }
    );
    
    console.log('Notification created successfully for user:', userId);
    return notification;
  } catch (error) {
    console.error('Error creating notification document:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      type: error.type
    });
    return null;
  }
};

// Send notification to all devices
export const sendLocalNotificationToAll = async (title, body, data = {}) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: title,
        body: body,
        data: data,
      },
      trigger: null // Deliver immediately
    });
    return true;
  } catch (error) {
    console.error('Error sending local notification:', error);
    return false;
  }
};


// Update sendNewClassNotification to include immediate local notification
export const sendNewClassNotification = async (classData) => {
    try {
      const users = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        []
      );
      
      console.log(`Sending notifications to ${users.documents.length} users`);
      
      // Create database notifications first
      for (const user of users.documents) {
        try {
          const notificationData = {
            type: 'new_class',
            classId: classData.class_id,
            className: classData.class_name,
            recipientId: user.$id,
            recipientRole: user.role,
            timestamp: new Date().toISOString()
          };
  
          const message = user.role === 'student' 
            ? `A new class "${classData.class_name}" is now available for enrollment!`
            : `A new class "${classData.class_name}" has been created.`;
  
          // Create database notification
          const dbNotification = await createNotificationDocument(
            user.$id,
            "New Class Available!",
            message,
            notificationData
          );
  
          // Send immediate local notification for the current user
          if (dbNotification) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: "New Class Available!",
                body: message,
                data: {
                  ...notificationData,
                  notificationId: dbNotification.$id
                },
                sound: 'default'
              },
              trigger: null // Deliver immediately
            });
          }
          
          console.log(`Notification sent to ${user.role} ${user.username || user.$id}`);
        } catch (error) {
          console.error(`Error sending notification to user ${user.$id}:`, error);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error sending new class notifications:', error);
      return false;
    }
  };
  
  // Update getUserNotifications to handle immediate updates
export const getUserNotifications = async (userId) => {
    try {
      // Set up notification handler for immediate updates
      const subscription = Notifications.addNotificationReceivedListener(notification => {
        if (notification.request.content.data?.type === 'new_class') {
          // Trigger a refresh of notifications
          refreshNotifications();
        }
      });
  
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.notificationCollectionId,
        [
          Query.equal('user_id', userId),
          Query.orderDesc('created_at')
        ]
      );
      
      // Clean up subscription
      subscription.remove();
  
      return response.documents.map(doc => ({
        ...doc,
        data: Array.isArray(doc.data) ? dataArrayToObject(doc.data) : doc.data
      }));
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  };
  
  // Add a helper function to refresh notifications
  const refreshNotifications = async () => {
    try {
      const currentUser = await account.get();
      if (currentUser) {
        await getUserNotifications(currentUser.$id);
      }
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    }
  };


// Function to mark a notification as read
export const markNotificationAsRead = async (notificationId) => {
  try {
    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.notificationCollectionId,
      notificationId,
      { read: true }
    );
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
};

// Placeholder for session notification
export const sendSessionCreatedNotification = async () => {
  // Implement this if needed
  return true;
};


// Add this new function to delete notifications from database
export const deleteAllUserNotifications = async (userId: string) => {
    try {
      // Get all notifications for the user
      const notifications = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.notificationCollectionId,
        [Query.equal('user_id', userId)]
      );
  
      // Delete each notification
      const deletePromises = notifications.documents.map(notification => 
        databases.deleteDocument(
          appwriteConfig.databaseId,
          appwriteConfig.notificationCollectionId,
          notification.$id
        )
      );
  
      await Promise.all(deletePromises);
      console.log(`Deleted all notifications for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Error deleting notifications:', error);
      return false;
    }
  };
  