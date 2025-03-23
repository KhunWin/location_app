import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { sendCheckInReminders } from './appwrite';

const CHECK_IN_REMINDER_TASK = 'check-in-reminder';

// Define the task
TaskManager.defineTask(CHECK_IN_REMINDER_TASK, async () => {
  try {
    // Send check-in reminders
    await sendCheckInReminders();
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Error in background task:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Register the background task
export const registerBackgroundTask = async () => {
  try {
    await BackgroundFetch.registerTaskAsync(CHECK_IN_REMINDER_TASK, {
      minimumInterval: 60 * 60, // 1 hour in seconds
      stopOnTerminate: false,
      startOnBoot: true,
    });
    console.log('Background task registered');
  } catch (error) {
    console.error('Error registering background task:', error);
  }
};

// Check if task is registered
export const checkTaskRegistration = async () => {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(CHECK_IN_REMINDER_TASK);
  console.log('Is task registered:', isRegistered);
  return isRegistered;
};

// Unregister the background task
export const unregisterBackgroundTask = async () => {
  try {
    await BackgroundFetch.unregisterTaskAsync(CHECK_IN_REMINDER_TASK);
    console.log('Background task unregistered');
  } catch (error) {
    console.error('Error unregistering background task:', error);
  }
};

// Manually trigger the check-in reminders (useful for testing)
export const triggerCheckInReminders = async () => {
  try {
    console.log('Manually triggering check-in reminders...');
    await sendCheckInReminders();
    console.log('Check-in reminders sent successfully');
  } catch (error) {
    console.error('Error triggering check-in reminders:', error);
    throw error;
  }
};

// Get the status of all background fetch tasks
export const getBackgroundFetchStatus = async () => {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    let statusString = 'Unknown';
    
    switch (status) {
      case BackgroundFetch.BackgroundFetchStatus.Available:
        statusString = 'Available';
        break;
      case BackgroundFetch.BackgroundFetchStatus.Denied:
        statusString = 'Denied';
        break;
      case BackgroundFetch.BackgroundFetchStatus.Restricted:
        statusString = 'Restricted';
        break;
      case BackgroundFetch.BackgroundFetchStatus.Unavailable:
        statusString = 'Unavailable';
        break;
    }
    
    console.log('Background fetch status:', statusString);
    return { status, statusString };
  } catch (error) {
    console.error('Error getting background fetch status:', error);
    throw error;
  }
};