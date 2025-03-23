import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { databases, account } from '../lib/appwrite';
import { appwriteConfig } from '../lib/appwrite';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Register for push notifications
export const registerForPushNotifications = async () => {
  try {
    if (!Device.isDevice) {
      console.log('Push notifications are not available on emulator');
      return null;
    }

    // Request permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token: permission not granted');
      return null;
    }

    // Get token
    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PROJECT_ID, // Add your Expo project ID here
    })).data;
    
    console.log('Push token:', token);
    
    // Save token to user document
    try {
      const session = await account.getSession('current');
      if (!session) throw new Error('Not authenticated');

      // Get user document
      const users = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        [Query.equal('accountId', session.userId)]
      );

      if (!users.documents.length) throw new Error('User not found');
      const user = users.documents[0];

      // Update user with push token
      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        user.$id,
        { pushToken: token }
      );
      
      console.log('Push token saved to user document');
    } catch (error) {
      console.error('Error saving push token:', error);
    }

    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
};

// Add notification listeners
export const addNotificationListeners = (navigation) => {
  // Handle notification when app is in foreground
  const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received in foreground:', notification);
  });

  // Handle notification when user taps on it
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification response:', response);
    
    // Get data from notification
    const data = response.notification.request.content.data;
    
    // Navigate based on notification type
    if (data.classId) {
      if (data.sessionTitle) {
        // This is a check-in reminder or new session notification
        navigation.navigate('MyClass', { 
          classId: data.classId,
          className: data.className || 'Class'
        });
      } else {
        // This is a new class notification
        navigation.navigate('JoinClass');
      }
    }
  });

  // Return cleanup function
  return () => {
    foregroundSubscription.remove();
    responseSubscription.remove();
  };
};