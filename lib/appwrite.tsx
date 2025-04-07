import SignIn from '@/app/(auth)/sign-in';
import * as Location from 'expo-location';  // Add this import
import { Client, Account, Avatars, Databases,Storage, ID, Query, AppwriteException } from 'react-native-appwrite';
import * as DocumentPicker from 'expo-document-picker';
import * as Notifications from 'expo-notifications';
// import { getNotificationActions } from '../context/NotificationContext';
import { sendNewClassNotification, sendSessionCreatedNotification } from '../services/NotificationService';


// Export utilities needed across the app
export { ID, Query };  // Make sure to export Query

// import { Client, Account, ID, Avatars, Databases } from 'appwrite';
export const appwriteConfig = {
    endpoint: 'https://cloud.appwrite.io/v1',
    platform: 'com.win.attendance',
    projectId: '673308040024ad5f0292',
    databaseId: '6733094b0030099a3e4c',
    userCollectionId: '67330a2600212bd7b42c',
    classCollectionId: '6770252d001271cb06f6',
    fileCollectionId: '67ad50fe0007a8b0f20a',
    storageId: '67330bfe001b740c30af',
    notificationCollectionId: '67e95ebb003172e6f91a'

}

// Init your React Native SDK
const client = new Client();

client
    .setEndpoint(appwriteConfig.endpoint) // Your Appwrite Endpoint
    .setProject(appwriteConfig.projectId) // Your project ID
    .setPlatform(appwriteConfig.platform) // Your application ID or bundle ID.

export const account = new Account(client);
export const avatars = new Avatars(client);
export const databases = new Databases(client);
export const storage = new Storage(client);  // Add this line

export { client };  // Make sure to export the client


// //this function is showing notification even when there is no new class.
export const  signIn = async (email, password) => {
    try { 
        // Check for and delete any existing session
        try {
            await account.deleteSession('current');

        } catch (e) {
            // Ignore error if no session exists
        }

        const session = await account.createEmailPasswordSession(email, password);

        // After successful login, get user's role
        const users = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [Query.equal('accountId', session.userId)]
        );
        
        if (users.documents.length > 0) {
            const user = users.documents[0];
            
            // // If student, show available classes
            // if (user.role === 'student') {
            //     // Get available classes
            //     const classes = await databases.listDocuments(
            //         appwriteConfig.databaseId,
            //         appwriteConfig.classCollectionId,
            //         [], // No query filters to get all classes
            //         10  // Limit to 10 classes
            //     );
                
            //     if (classes.documents.length > 0) {
            //         // Get the most recent class
            //         const recentClass = classes.documents[classes.documents.length - 1];
                    
            //         // Send notification with class name
            //         await Notifications.scheduleNotificationAsync({
            //             content: {
            //                 title: "Welcome back!",
            //                 body: `New class "${recentClass.class_name}" is available for enrollment!`,
            //             },
            //             trigger: null, // Show immediately
            //         });
            //     } else {
            //         // No classes available
            //         await Notifications.scheduleNotificationAsync({
            //             content: {
            //                 title: "Welcome back!",
            //                 body: "No classes available at the moment.",
            //             },
            //             trigger: null,
            //         });
            //     }
            // } else {
                // For teachers or other roles
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: "Welcome back!",
                    body: "You're logged in successfully.",
                },
                trigger: null,
            });
            }
        
        
        return session;

    } catch(error) {
        console.log(error);
        throw error; // Throw the original error
    }
}



export const createUser = async (email, password, username, role) => {
    try {
        console.log('Starting user creation process for:', email);

        // 1. First try to delete any existing sessions
        try {
            await account.deleteSessions();
            console.log('Cleared existing sessions');
        } catch (e) {
            console.log('No existing sessions to clear');
        }

        // 2. Check if the account exists using a try-catch
        let accountExists = false;
        try {
            await account.createEmailPasswordSession(email, password);
            accountExists = true;
            await account.deleteSessions();
            console.log('Account already exists');
            throw new Error('An account with this email already exists');
        } catch (error) {
            if (error?.code !== 401) {
                console.log('Account check error:', error);
                accountExists = true;
                throw error;
            }
            console.log('Account does not exist, proceeding with creation');
        }

        if (accountExists) {
            throw new Error('An account with this email already exists');
        }

        // 3. Create new account
        console.log('Creating new account...');
        const newAccount = await account.create(
            ID.unique(),
            email, 
            password,
            username
        );

        console.log('Account created successfully:', newAccount.$id);

        // 4. Create user document
        console.log('Creating user document...');
        const newUser = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            ID.unique(),
            {
                accountId: newAccount.$id,
                email,
                username,
                role: role,
                joined_classes: []
            }
        );

        console.log('User document created successfully');

        // 5. Create new session
        console.log('Creating new session...');
        const session = await account.createEmailPasswordSession(email, password);
        console.log('Session created successfully');

        return {
            user: newUser,
            session: session
        };

    } catch (error) {
        console.error('Detailed error in createUser:', {
            message: error.message,
            code: error.code,
            type: error.type,
            response: error.response
        });
        
        // Handle specific error cases
        if (error?.message?.includes('already exists')) {
            throw new Error('An account with this email already exists');
        } else if (error?.code === 401) {
            throw new Error('Authentication failed. Please try again.');
        } else if (error?.code === 409) {
            throw new Error('An account with this email already exists');
        } else if (error?.message?.includes('invalid email')) {
            throw new Error('Please enter a valid email address');
        } else if (error?.message?.includes('password')) {
            throw new Error('Password must be at least 8 characters long');
        }
        
        // For any other errors
        throw new Error(`Failed to create account: ${error.message}`);
    }
}

export const getCurrentUser = async () => {
    console.log('=== Starting getCurrentUser ===');
    
    try {
        console.log('Getting current account...');
        const currentAccount = await account.get();
        // console.log('Current account:', currentAccount);

        if (!currentAccount) {
            console.log('No current account found');
            throw Error('No current account');
        }

        console.log('Getting user document...');
        console.log('Account ID:', currentAccount.$id);
        const currentUser = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [Query.equal('accountId', currentAccount.$id)]
        );

        // console.log('Current user query result:', currentUser);

        if (!currentUser || !currentUser.documents.length) {
            console.log('No user document found');
            throw Error('No user document found');
        }

        const userDoc = currentUser.documents[0];
        // console.log('Returning user document:', userDoc);
        return userDoc;

    } catch (error) {
        console.log('=== Error in getCurrentUser ===');
        console.log('Error details:', error);
        throw error;
    }
}

//creating a class


// //with update class address
// export const createClass = async (className, location, address, schedule,classSize) => {
//     try {
//         console.log('createClass function received:', {
//             className,
//             location,
//             address,
//             schedule
//         });

//         // Get location coordinates
//         const locationCoords = await getLocationCoordinates();
//         console.log('Location coordinates for class:', locationCoords);

//         const session = await account.getSession('current');
//         if (!session) throw new Error('Not authenticated');

//         const users = await databases.listDocuments(
//             appwriteConfig.databaseId,
//             appwriteConfig.userCollectionId,
//             [
//                 Query.equal('accountId', session.userId)
//             ]
//         );

//         if (!users.documents.length) throw new Error('User not found');
//         const user = users.documents[0];

//         const classData = {
//             class_id: ID.unique(),
//             class_name: className,
//             created_by: user.$id,
//             class_location: [JSON.stringify(locationCoords)],
//             class_address: [JSON.stringify(address)],
//             class_schedule: [JSON.stringify(schedule)], 
//             students: [],
//             attendance_days: [],
//             class_size: classSize
//         };

//         console.log('Attempting to create class with data:', classData);

//         const newClass = await databases.createDocument(
//             appwriteConfig.databaseId,
//             appwriteConfig.classCollectionId,
//             ID.unique(),
//             classData
//         );

//         console.log('Class created successfully:', newClass);
//         return newClass;

//     } catch (error) {
//         console.error('Error in createClass:', error);
//         throw error;
//     }
// };

//with push notification
// //with push notification
// export const createClass = async (className, location, address, schedule, classSize, imageUrl) => {
//     try {
//         // console.log('Creating class with name, location and address:', {
//         //     className,
//         //     location,
//         //     address,
//         //     imageUrl
//         // });

//         // Get location coordinates if not provided
//         const locationCoords = location || await getLocationCoordinates();
        
//         const session = await account.getSession('current');
//         if (!session) throw new Error('Not authenticated');

//         const users = await databases.listDocuments(
//             appwriteConfig.databaseId,
//             appwriteConfig.userCollectionId,
//             [
//                 Query.equal('accountId', session.userId)
//             ]
//         );

//         if (!users.documents.length) throw new Error('User not found');
//         const user = users.documents[0];

//         // Create properly formatted class data
//         const classData = {
//             class_id: ID.unique(),
//             class_name: className,
//             created_by: user.$id,
//             class_location: [JSON.stringify(locationCoords)],
//             class_address: [JSON.stringify(address)],
//             class_schedule: schedule ? [JSON.stringify(schedule)] : [],
//             class_image: imageUrl,
//             students: [],
//             attendance_days: [],
//             class_size: classSize || 30
            
//         };

//         console.log('Formatted class data:', classData);

//         const newClass = await databases.createDocument(
//             appwriteConfig.databaseId,
//             appwriteConfig.classCollectionId,
//             ID.unique(),
//             classData
//         );

//         console.log('Class created successfully:', newClass);
        
//         // Send push notification to all students about new class
//         // await sendNewClassNotification(newClass);

//         // Send notifications to all students about the new class
//         // Get current user's session
//         const currentSession = await account.getSession('current');
//         const students = await databases.listDocuments(
//             appwriteConfig.databaseId,
//             appwriteConfig.userCollectionId,
//             [Query.equal('role', 'student'),
//                 Query.notEqual('accountId', currentSession.userId) // Exclude current user
//             ]
//         );
//         console.log("list of students to notify:", students)
//         // Send notification to each student
//         for (const student of students.documents) {
//             await Notifications.scheduleNotificationAsync({
//                 content: {
//                     title: "New Class Available!",
//                     body: `A new class "${className}" is now available for enrollment!`,
//                     data: { classId: classData.class_id }
//                 },
//                 trigger: null,
//             });
//         }
//         //end of push notification

//         return newClass;

//     } catch (error) {
//         console.error('Error in createClass:', error);
//         throw error;
//     }
// };


// export const createClass = async (className, location, address, schedule, classSize, imageUrl) => {
//     try {
//         console.log('Creating class with name:', className);

//         // Get location coordinates if not provided
//         const locationCoords = location || await getLocationCoordinates();
        
//         const session = await account.getSession('current');
//         if (!session) throw new Error('Not authenticated');

//         const users = await databases.listDocuments(
//             appwriteConfig.databaseId,
//             appwriteConfig.userCollectionId,
//             [
//                 Query.equal('accountId', session.userId)
//             ]
//         );

//         if (!users.documents.length) throw new Error('User not found');
//         const user = users.documents[0];
        
//         console.log('Class creator details:', {
//             userId: user.$id,
//             username: user.username,
//             role: user.role
//         });

//         // Create properly formatted class data
//         const classData = {
//             class_id: ID.unique(),
//             class_name: className,
//             created_by: user.$id,
//             class_location: [JSON.stringify(locationCoords)],
//             class_address: [JSON.stringify(address)],
//             class_schedule: schedule ? [JSON.stringify(schedule)] : [],
//             class_image: imageUrl,
//             students: [],
//             attendance_days: [],
//             class_size: classSize || 30
//         };

//         const newClass = await databases.createDocument(
//             appwriteConfig.databaseId,
//             appwriteConfig.classCollectionId,
//             ID.unique(),
//             classData
//         );

//         console.log('Class created successfully:', newClass);
        
//         // Get current user's session
//         const currentSession = await account.getSession('current');
        
//         // Get all students
//         const allStudents = await databases.listDocuments(
//             appwriteConfig.databaseId,
//             appwriteConfig.userCollectionId,
//             [
//                 Query.equal('role', 'student')
//             ]
//         );
        
//         console.log(`Found ${allStudents.documents.length} total students`);
        
//         // Filter out current user if they're a student
//         const studentsToNotify = allStudents.documents.filter(
//             student => student.accountId !== currentSession.userId
//         );
        
//         console.log(`Sending notifications to ${studentsToNotify.length} students (excluding current user if student)`);
        
//         // Log each student who will receive a notification
//         studentsToNotify.forEach((student, index) => {
//             console.log(`Student ${index + 1} to notify:`, {
//                 userId: student.$id,
//                 username: student.username,
//                 accountId: student.accountId
//             });
//         });
        
//         // Send notification to each student
//         for (const student of studentsToNotify) {
//             try {
//                 await Notifications.scheduleNotificationAsync({
//                     content: {
//                         title: "New Class Available!",
//                         body: `A new class "${className}" is now available for enrollment!`,
//                         data: { classId: classData.class_id }
//                     },
//                     trigger: null,
//                 });
//                 console.log(`Notification sent to student: ${student.username}`);
//             } catch (error) {
//                 console.error(`Failed to send notification to ${student.username}:`, error);
//             }
//         }
        
//         return newClass;

//     } catch (error) {
//         console.error('Error in createClass:', error);
//         throw error;
//     }
// };


// export const createClass = async (className, location, address, schedule, classSize, imageUrl) => {
//     try {
//         console.log('Creating class with name:', className);

//         // Get location coordinates if not provided
//         const locationCoords = location || await getLocationCoordinates();
        
//         const session = await account.getSession('current');
//         if (!session) throw new Error('Not authenticated');

//         const users = await databases.listDocuments(
//             appwriteConfig.databaseId,
//             appwriteConfig.userCollectionId,
//             [
//                 Query.equal('accountId', session.userId)
//             ]
//         );

//         if (!users.documents.length) throw new Error('User not found');
//         const user = users.documents[0];
        
//         console.log('Class creator details:', {
//             userId: user.$id,
//             username: user.username,
//             role: user.role
//         });

//         // Create properly formatted class data
//         const classData = {
//             class_id: ID.unique(),
//             class_name: className,
//             created_by: user.$id,
//             class_location: [JSON.stringify(locationCoords)],
//             class_address: [JSON.stringify(address)],
//             class_schedule: schedule ? [JSON.stringify(schedule)] : [],
//             class_image: imageUrl,
//             students: [],
//             attendance_days: [],
//             class_size: classSize || 30
//         };

//         const newClass = await databases.createDocument(
//             appwriteConfig.databaseId,
//             appwriteConfig.classCollectionId,
//             ID.unique(),
//             classData
//         );

//         console.log('Class created successfully:', newClass);
        
//         // Get all students
//         const allStudents = await databases.listDocuments(
//             appwriteConfig.databaseId,
//             appwriteConfig.userCollectionId,
//             [
//                 Query.equal('role', 'student')
//             ]
//         );
        
//         console.log(`Found ${allStudents.documents.length} total students`);
        
//         // Filter out current user if they're a student
//         const studentsToNotify = allStudents.documents.filter(
//             student => student.accountId !== session.userId
//         );
        
//         console.log(`Sending notifications to ${studentsToNotify.length} students (excluding current user if student)`);
        
//         // Log each student who will receive a notification
//         studentsToNotify.forEach((student, index) => {
//             console.log(`Student ${index + 1} to notify:`, {
//                 userId: student.$id,
//                 username: student.username,
//                 accountId: student.accountId
//             });
//         });
        
//         // Send notification to each student with their user ID in the data
//         for (const student of studentsToNotify) {
//             try {
//                 await Notifications.scheduleNotificationAsync({
//                     content: {
//                         title: "New Class Available!",
//                         body: `A new class "${className}" is now available for enrollment!`,
//                         data: { 
//                             classId: classData.class_id,
//                             targetUserId: student.$id,  // Add the target user ID
//                             // notificationType: 'new_class'
//                         }
//                     },
//                     trigger: null,
//                 });
//                 console.log(`Notification sent to student: ${student.username} (ID: ${student.$id})`);
//             } catch (error) {
//                 console.error(`Failed to send notification to ${student.username}:`, error);
//             }
//         }
        
//         return newClass;

//     } catch (error) {
//         console.error('Error in createClass:', error);
//         throw error;
//     }
// };

// export const createClass = async (className, location, address, schedule, classSize, imageUrl) => {
//     try {
//         console.log('Creating class with name:', className);

//         const locationCoords = location || await getLocationCoordinates();
        
//         const session = await account.getSession('current');
//         if (!session) throw new Error('Not authenticated');

//         const users = await databases.listDocuments(
//             appwriteConfig.databaseId,
//             appwriteConfig.userCollectionId,
//             [Query.equal('accountId', session.userId)]
//         );

//         if (!users.documents.length) throw new Error('User not found');
//         const user = users.documents[0];

//         const classData = {
//             class_id: ID.unique(),
//             class_name: className,
//             created_by: user.$id,
//             class_location: [JSON.stringify(locationCoords)],
//             class_address: [JSON.stringify(address)],
//             class_schedule: schedule ? [JSON.stringify(schedule)] : [],
//             class_image: imageUrl,
//             students: [],
//             attendance_days: [],
//             class_size: classSize || 30
//         };

//         const newClass = await databases.createDocument(
//             appwriteConfig.databaseId,
//             appwriteConfig.classCollectionId,
//             ID.unique(),
//             classData
//         );

//         // Get all students
//         const students = await databases.listDocuments(
//             appwriteConfig.databaseId,
//             appwriteConfig.userCollectionId,
//             [Query.equal('role', 'student')]
//         );

//         console.log(`Sending notifications to ${students.documents.length} students`);

//         // Send notification to each student
//         for (const student of students.documents) {
//             try {
//                 await Notifications.scheduleNotificationAsync({
//                     content: {
//                         title: "New Class Available!",
//                         body: `A new class "${className}" has been created!`,
//                         data: {
//                             type: 'new_class',
//                             classId: classData.class_id,
//                             className: className,
//                             targetUserId: student.accountId, // Use accountId instead of $id
//                             timestamp: new Date().toISOString()
//                         }
//                     },
//                     trigger: null,
//                 });
//                 console.log(`Notification sent to student: ${student.username} (ID: ${student.accountId})`);
//             } catch (error) {
//                 console.error(`Failed to send notification to ${student.username}:`, error);
//             }
//         }
        
//         return newClass;

//     } catch (error) {
//         console.error('Error in createClass:', error);
//         throw error;
//     }
// };


// export const createClass = async (className, location, address, schedule, classSize, imageUrl) => {
//     try {
//         console.log('Creating class with name:', className);

//         const locationCoords = location || await getLocationCoordinates();
        
//         const session = await account.getSession('current');
//         if (!session) throw new Error('Not authenticated');

//         const users = await databases.listDocuments(
//             appwriteConfig.databaseId,
//             appwriteConfig.userCollectionId,
//             [Query.equal('accountId', session.userId)]
//         );

//         if (!users.documents.length) throw new Error('User not found');
//         const user = users.documents[0];

//         const classData = {
//             class_id: ID.unique(),
//             class_name: className,
//             created_by: user.$id,
//             class_location: [JSON.stringify(locationCoords)],
//             class_address: [JSON.stringify(address)],
//             class_schedule: schedule ? [JSON.stringify(schedule)] : [],
//             class_image: imageUrl,
//             students: [],
//             attendance_days: [],
//             class_size: classSize || 30
//         };

//         const newClass = await databases.createDocument(
//             appwriteConfig.databaseId,
//             appwriteConfig.classCollectionId,
//             ID.unique(),
//             classData
//         );

//         // Get all users (excluding the creator)
//         const allUsers = await databases.listDocuments(
//             appwriteConfig.databaseId,
//             appwriteConfig.userCollectionId
//         );

//         console.log(`Sending notifications to ${allUsers.documents.length - 1} users`);

//         // Send notification to each user (except the creator)
//         for (const targetUser of allUsers.documents) {
//             // Skip the creator of the class
//             if (targetUser.accountId === session.userId) continue;

//             try {
//                 await Notifications.scheduleNotificationAsync({
//                     content: {
//                         title: "New Class Available!",
//                         body: `A new class "${className}" has been created!`,
//                         data: {
//                             type: 'new_class',
//                             classId: classData.class_id,
//                             className: className,
//                             targetUserId: targetUser.accountId,
//                             timestamp: new Date().toISOString()
//                         }
//                     },
//                     trigger: null,
//                 });
//                 console.log(`Notification sent to user: ${targetUser.username} (ID: ${targetUser.accountId})`);
//             } catch (error) {
//                 console.error(`Failed to send notification to ${targetUser.username}:`, error);
//             }
//         }
        
//         return newClass;

//     } catch (error) {
//         console.error('Error in createClass:', error);
//         throw error;
//     }
// };

// export const createClass = async (className, location, address, schedule, classSize, imageUrl) => {
//     try {
//         console.log('\n=== Starting createClass with notifications ===');

//         const locationCoords = location || await getLocationCoordinates();
        
//         const session = await account.getSession('current');
//         if (!session) throw new Error('Not authenticated');

//         const users = await databases.listDocuments(
//             appwriteConfig.databaseId,
//             appwriteConfig.userCollectionId,
//             [Query.equal('accountId', session.userId)]
//         );

//         if (!users.documents.length) throw new Error('User not found');
//         const user = users.documents[0];

//         const classData = {
//             class_id: ID.unique(),
//             class_name: className,
//             created_by: user.$id,
//             class_location: [JSON.stringify(locationCoords)],
//             class_address: [JSON.stringify(address)],
//             class_schedule: schedule ? [JSON.stringify(schedule)] : [],
//             class_image: imageUrl,
//             students: [],
//             attendance_days: [],
//             class_size: classSize || 30
//         };

//         const newClass = await databases.createDocument(
//             appwriteConfig.databaseId,
//             appwriteConfig.classCollectionId,
//             ID.unique(),
//             classData
//         );

//         // Get all users (excluding the creator)
//         const allUsers = await databases.listDocuments(
//             appwriteConfig.databaseId,
//             appwriteConfig.userCollectionId
//         );

//         console.log('Found users to notify:', allUsers.documents.map(user => ({
//             id: user.$id,
//             accountId: user.accountId,
//             username: user.username,
//             role: user.role
//         })));

//         // Send notification to each user (except the creator)
//         for (const targetUser of allUsers.documents) {
//             // Skip the creator of the class
//             if (targetUser.accountId === session.userId) {
//                 console.log(`Skipping notification for creator: ${targetUser.username}`);
//                 continue;
//             }

//             try {
//                 console.log(`Preparing notification for ${targetUser.username} (${targetUser.role})`);
//                 await Notifications.scheduleNotificationAsync({
//                     content: {
//                         title: "New Class Available!",
//                         body: `A new class "${className}" has been created!`,
//                         data: {
//                             type: 'new_class',
//                             classId: classData.class_id,
//                             className: className,
//                             targetUserId: targetUser.accountId,
//                             userRole: targetUser.role,
//                             timestamp: new Date().toISOString()
//                         }
//                     },
//                     trigger: null,
//                 });
//                 console.log(`Successfully sent notification to ${targetUser.username} (${targetUser.role})`);
//             } catch (error) {
//                 console.error(`Failed to send notification to ${targetUser.username}:`, error);
//             }
//         }
        
//         return newClass;
//     } catch (error) {
//         console.error('Error in createClass:', error);
//         throw error;
//     }
// };


// // Add this helper function for sending new class notifications
// const sendNewClassNotification = async (classData) => {
//     try {
//         // Get all users with student role
//         const students = await databases.listDocuments(
//             appwriteConfig.databaseId,
//             appwriteConfig.userCollectionId,
//             [Query.equal('role', 'student')]
//         );
        
//         // Send notification to each student
//         for (const student of students.documents) {
//             if (student.pushToken) {
//                 // Use Expo Push Notifications API
//                 await fetch('https://exp.host/--/api/v2/push/send', {
//                     method: 'POST',
//                     headers: {
//                         'Content-Type': 'application/json',
//                     },
//                     body: JSON.stringify({
//                         to: student.pushToken,
//                         title: 'New Class Available',
//                         body: `A new class "${classData.class_name}" is now available for enrollment!`,
//                         data: { 
//                             classId: classData.class_id,
//                             className: classData.class_name
//                         }
//                     })
//                 });
//             }
//             console.log('Notification sent to student:', student.username);
//         }
//     } catch (error) {
//         console.error('Error sending new class notifications:', error);
//     }
// };
//with end of push notification


// Get all classes
///this work for both teacher and student role, depending on the role of the user, the classes will be fetched

// export const createClass = async (className, location, address, schedule, classSize, imageUrl) => {
//     try {
//         // Get location coordinates if not provided
//         const locationCoords = location || await getLocationCoordinates();
        
//         const session = await account.getSession('current');
//         if (!session) throw new Error('Not authenticated');

//         const users = await databases.listDocuments(
//             appwriteConfig.databaseId,
//             appwriteConfig.userCollectionId,
//             [
//                 Query.equal('accountId', session.userId)
//             ]
//         );

//         if (!users.documents.length) throw new Error('User not found');
//         const user = users.documents[0];

//         // Create properly formatted class data
//         const classData = {
//             class_id: ID.unique(),
//             class_name: className,
//             created_by: user.$id,
//             class_location: [JSON.stringify(locationCoords)],
//             class_address: [JSON.stringify(address)],
//             class_schedule: schedule ? [JSON.stringify(schedule)] : [],
//             class_image: imageUrl,
//             students: [],
//             attendance_days: [],
//             class_size: classSize || 30
//         };

//         const newClass = await databases.createDocument(
//             appwriteConfig.databaseId,
//             appwriteConfig.classCollectionId,
//             ID.unique(),
//             classData
//         );

//         console.log('Class created successfully:', newClass);
        
//         // Send notifications using our new service
//         await sendNewClassNotification(classData);
        
//         return newClass;

//     } catch (error) {
//         console.error('Error in createClass:', error);
//         throw error;
//     }
// };

export const createClass = async (className, location, address, schedule, classSize, imageUrl) => {
    try {
        // Get location coordinates if not provided
        const locationCoords = location || await getLocationCoordinates();
        
        const session = await account.getSession('current');
        if (!session) throw new Error('Not authenticated');

        const users = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [
                Query.equal('accountId', session.userId)
            ]
        );

        if (!users.documents.length) throw new Error('User not found');
        const user = users.documents[0];

        // Create properly formatted class data
        const classData = {
            class_id: ID.unique(),
            class_name: className,
            created_by: user.$id,
            class_location: [JSON.stringify(locationCoords)],
            class_address: [JSON.stringify(address)],
            class_schedule: schedule ? [JSON.stringify(schedule)] : [],
            class_image: imageUrl,
            students: [],
            attendance_days: [],
            class_size: classSize || 30
        };

        const newClass = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.classCollectionId,
            ID.unique(),
            classData
        );

        console.log('Class created successfully:', newClass);
        
        // Send notifications to ALL users
        try {
            console.log('Sending notifications for new class to all users:', classData.class_name);
            await sendNewClassNotification(classData);
            console.log('Notifications sent successfully');
            
            // // Also trigger a local notification for immediate feedback
            // await Notifications.scheduleNotificationAsync({
            //     content: {
            //         title: "Class Created!",
            //         body: `Your class "${classData.class_name}" has been created successfully.`,
            //         data: {
            //             type: 'class_created',
            //             classId: classData.class_id
            //         }
            //     },
            //     trigger: null
            // });
        } catch (notificationError) {
            console.error('Error sending notifications:', notificationError);
            // Continue even if notifications fail - don't fail the class creation
        }
        
        return newClass;

    } catch (error) {
        console.error('Error in createClass:', error);
        throw error;
    }
};


export const getUserClasses = async () => {
    try {
        const session = await account.getSession('current');
        if (!session) throw new Error('Not authenticated');

        // First get the user document to get the correct $id and role
        const users = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [Query.equal('accountId', session.userId)]
        );

        if (!users.documents.length) throw new Error('User not found');
        const user = users.documents[0];

        // Different queries based on user role
        if (user.role === 'teacher') {
            // For teachers, get only classes they created
            const classes = await databases.listDocuments(
                appwriteConfig.databaseId,
                appwriteConfig.classCollectionId,
                [Query.equal('created_by', user.$id)]
            );

            // Print each class details
        // classes.documents.forEach(classDoc => {
        //     console.log('Class Details:');
        //     console.log('- Name:', classDoc.class_name);
        //     console.log('- ID:', classDoc.class_id);
        //     console.log('- Created by:', classDoc.created_by);
        //     console.log('- Number of students:', classDoc.students ? classDoc.students.length : 0);
        //     console.log('------------------------');
        // });
            
            // console.log("this is in getuserclasses", classes.documents)
            return classes.documents;
        } else if (user.role === 'student') {
            // For students, get all available classes
            const classes = await databases.listDocuments(
                appwriteConfig.databaseId,
                appwriteConfig.classCollectionId
            );
            return classes.documents;
        }
        throw new Error('Invalid user role');
    } catch (error) {
        console.error('Error fetching classes:', error);
        throw error;
    }
}

export const getClassStudents = async (classId) => {
    try {
        console.log('\n=== Starting getClassStudents ===');
        console.log('Input classId:', classId);

        const classes = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.classCollectionId,
            [Query.equal('class_id', classId)]
        );

        if (!classes.documents.length) {
            console.log('No class found with class_id:', classId);
            return [];
        }

        const classDoc = classes.documents[0];
        console.log('Class Document found:', JSON.stringify(classDoc, null, 2));

        // Parse the students array
        let studentsArray = [];
        if (classDoc.students && Array.isArray(classDoc.students)) {
            try {
                // Parse each student string in the array
                studentsArray = classDoc.students.map(studentStr => {
                    try {
                        return JSON.parse(studentStr);
                    } catch (parseError) {
                        console.error('Error parsing student string:', studentStr, parseError);
                        return null;
                    }
                }).filter(student => student !== null); // Remove any failed parses

                console.log('Parsed students array:', JSON.stringify(studentsArray, null, 2));
            } catch (parseError) {
                console.error('Error processing students array:', parseError);
                return [];
            }
        }

        // Get student details for each student
        const studentsPromises = studentsArray.map(async (studentInfo) => {
            try {
                console.log(`Fetching details for student_id: ${studentInfo.student_id}`);
                
                const studentDoc = await databases.getDocument(
                    appwriteConfig.databaseId,
                    appwriteConfig.userCollectionId,
                    studentInfo.student_id
                );

                return {
                    $id: studentDoc.$id,
                    username: studentDoc.username,
                    email: studentDoc.email,
                    status: studentInfo.status,
                    joined_date: studentInfo.joined_date
                };

            } catch (error) {
                console.error(`Error fetching student ${studentInfo.student_id}:`, error);
                return null;
            }
        });

        const students = await Promise.all(studentsPromises);
        const validStudents = students.filter(student => student !== null);

        console.log('Final processed students:', JSON.stringify(validStudents, null, 2));
        return validStudents;

    } catch (error) {
        console.error('Error in getClassStudents:', error);
        throw error;
    }
}

export const approveStudent = async (classId, studentId) => {
    try {
        console.log('\n=== Starting approveStudent ===');
        console.log('ClassId:', classId);
        console.log('StudentId:', studentId);

        // 1. Update class document (students array)
        const classes = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.classCollectionId,
            [Query.equal('class_id', classId)]
        );

        if (!classes.documents.length) {
            console.log('No class found with class_id:', classId);
            throw new Error('Class not found');
        }

        const classDoc = classes.documents[0];
        console.log('Found class document:', classDoc);

        // Update students array in class document
        let studentsArray = classDoc.students.map(studentStr => {
            const student = JSON.parse(studentStr);
            if (student.student_id === studentId) {
                console.log('Updating status for student in class:', studentId);
                return JSON.stringify({
                    ...student,
                    status: 'approved'
                });
            }
            return studentStr;
        });

        // 2. Update user document (joined_classes array)
        const users = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [Query.equal('$id', studentId)]
        );

        if (!users.documents.length) {
            console.log('No user found with id:', studentId);
            throw new Error('User not found');
        }

        const userDoc = users.documents[0];
        console.log('Found user document:', userDoc);

        // Update joined_classes array in user document
        let joinedClassesArray = userDoc.joined_classes.map(classStr => {
            const classObj = JSON.parse(classStr);
            if (classObj.class_id === classId) {
                console.log('Updating status for class in user document:', classId);
                return JSON.stringify({
                    ...classObj,
                    status: 'approved'
                });
            }
            return classStr;
        });

        // Perform both updates
        const [updatedClass, updatedUser] = await Promise.all([
            // Update class document
            databases.updateDocument(
                appwriteConfig.databaseId,
                appwriteConfig.classCollectionId,
                classDoc.$id,
                {
                    students: studentsArray
                }
            ),
            // Update user document
            databases.updateDocument(
                appwriteConfig.databaseId,
                appwriteConfig.userCollectionId,
                userDoc.$id,
                {
                    joined_classes: joinedClassesArray
                }
            )
        ]);

        console.log('Both documents updated successfully');
        console.log('Updated class:', updatedClass);
        console.log('Updated user:', updatedUser);

        return {
            classUpdate: updatedClass,
            userUpdate: updatedUser
        };

    } catch (error) {
        console.error('Error in approveStudent:', error);
        throw error;
    }
}

export const removeStudent = async (classId, studentId) => {
    try {
        console.log('\n=== Starting removeStudent ===');
        console.log('ClassId:', classId);
        console.log('StudentId:', studentId);

        // Get the class document
        const classes = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.classCollectionId,
            [Query.equal('class_id', classId)]
        );

        if (!classes.documents.length) {
            console.log('No class found with class_id:', classId);
            throw new Error('Class not found');
        }

        const classDoc = classes.documents[0];
        console.log('Found class document:', classDoc.$id);

        // Parse and filter out the student to remove
        let studentsArray = classDoc.students
            .map(studentStr => JSON.parse(studentStr))
            .filter(student => student.student_id !== studentId)
            .map(student => JSON.stringify(student));

        console.log('Updated students array after removal:', studentsArray);

        // Update the class document
        const updatedClass = await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.classCollectionId,
            classDoc.$id,
            {
                students: studentsArray
            }
        );

        console.log('Class document updated successfully - student removed');
        return updatedClass;

    } catch (error) {
        console.error('Error in removeStudent:', error);
        throw error;
    }
}

//for ViewCheckin.tsx page
export const getClassAttendanceDays = async (classId) => {
    try {
        console.log('\n=== Starting getClassAttendanceDays ===');
        console.log('Input classId:', classId);

        // Fetch class document by class ID
        const classDoc = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.classCollectionId,
            [
                Query.equal('class_id', classId)
            ]
        );

        if (!classDoc.documents.length) {
            throw new Error('Class not found.');
        }

        const classData = classDoc.documents[0];
        console.log('Class Document found:', classData);

        // Parse the attendance_days field
        const attendanceDays = classData.attendance_days.map((day) => JSON.parse(day));
        console.log('Parsed attendance_days array:', attendanceDays);

        return attendanceDays;
    } catch (error) {
        console.error('Error in getClassAttendanceDays:', error);
        throw error;
    }
};

export const getStudentById = async (studentId) => {
    try {
        console.log('Fetching student details for ID:', studentId);

        const studentDoc = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [
                Query.equal('$id', studentId), // Query by student ID
            ]
        );

        if (!studentDoc.documents.length) {
            throw new Error('Student not found');
        }

        return studentDoc.documents[0]; // Return the student document
    } catch (error) {
        console.error('Error in getStudentById:', error);
        throw error;
    }
};
//end for ViewCheckin.tsx page


export const getTeacherClasses = async () => {
    try {
        const session = await account.getSession('current');
        if (!session) throw new Error('Not authenticated');

        // Get the teacher's user document
        const teacherDoc = await databases.getDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            '6770e2e7001cb9897392'  // Your teacher _id
        );

        console.log('Teacher document:', teacherDoc);

        // Get all classes created by this teacher
        const classes = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.classCollectionId,
            [
                Query.equal('created_by', teacherDoc.$id)
            ]
        );

        console.log('Classes found:', classes);
        return classes.documents;
    } catch (error) {
        console.error('Error fetching teacher classes:', error);
        throw error;
    }
}

//for CreateSession.tsx page
// Generate a random 6-character code with letters and numbers
const generateAttendanceCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
};

// Get current location as a separate async function
const getLocationCoordinates = async () => {
    try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            console.log('Location permission denied');
            return { latitude: 0, longitude: 0 };
        }

        const location = await Location.getCurrentPositionAsync({});
        return {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
        };
    } catch (error) {
        console.error('Error getting location:', error);
        return { latitude: 0, longitude: 0 };
    }
};


// export const createClassSession = async (classId: string, sessionTitle: string) => {
//     try {
//         console.log('\n=== Starting createClassSession ===');
//         console.log('Input classId:', classId);
//         console.log('Input sessionTitle:', sessionTitle);

//         // Get the class document
//         const classes = await databases.listDocuments(
//             appwriteConfig.databaseId,
//             appwriteConfig.classCollectionId,
//             [Query.equal('class_id', classId)]
//         );

//         if (!classes.documents || classes.documents.length === 0) {
//             throw new Error(`No class found with class_id: ${classId}`);
//         }

//         const classDoc = classes.documents[0];
//         console.log('Found class document:', JSON.stringify(classDoc, null, 2));

//         // Get location
//         const locationCoords = await getLocationCoordinates();
//         console.log('Location coordinates:', locationCoords);

//         // Create new session object
//         const newSession = {
//             session_title: sessionTitle,
//             date: new Date().toISOString().split('T')[0],
//             attendance_code: generateAttendanceCode(),
//             location: locationCoords,
//             records: []
//         };
//         console.log('New session object:', JSON.stringify(newSession, null, 2));

//         // Convert new session to string
//         const newSessionString = JSON.stringify(newSession);

//         // Handle attendance_days as array of strings
//         let existingAttendanceDays = Array.isArray(classDoc.attendance_days) 
//             ? classDoc.attendance_days 
//             : [];

//         // Add new session as string
//         existingAttendanceDays.push(newSessionString);

//         console.log('Updated attendance_days array:', JSON.stringify(existingAttendanceDays, null, 2));

//         // Update document
//         const updatedClass = await databases.updateDocument(
//             appwriteConfig.databaseId,
//             appwriteConfig.classCollectionId,
//             classDoc.$id,
//             {
//                 attendance_days: existingAttendanceDays  // Array of strings
//             }
//         );

//         console.log('Successfully updated class document');
//         return updatedClass;

//     } catch (error) {
//         console.error('=== Error in createClassSession ===');
//         console.error('Error details:', error);
//         throw error;
//     }
// };



//with push notification
//with push notification


//the one being use at the moment (do not delete this)
export const createClassSession = async (classId: string, sessionTitle: string) => {
    try {
        console.log('\n=== Starting createClassSession ===');
        console.log('Input classId:', classId);
        console.log('Input sessionTitle:', sessionTitle);

        // Get the class document
        const classes = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.classCollectionId,
            [Query.equal('class_id', classId)]
        );

        if (!classes.documents || classes.documents.length === 0) {
            throw new Error(`No class found with class_id: ${classId}`);
        }

        const classDoc = classes.documents[0];
        console.log('Found class document:', JSON.stringify(classDoc, null, 2));

        // Get location
        const locationCoords = await getLocationCoordinates();
        console.log('Location coordinates:', locationCoords);

        // Create new session object
        const newSession = {
            session_title: sessionTitle,
            date: new Date().toISOString().split('T')[0],
            attendance_code: generateAttendanceCode(),
            location: locationCoords,
            records: []
        };
        console.log('New session object:', JSON.stringify(newSession, null, 2));

        // Convert new session to string
        const newSessionString = JSON.stringify(newSession);

        // Handle attendance_days as array of strings
        let existingAttendanceDays = Array.isArray(classDoc.attendance_days) 
            ? classDoc.attendance_days 
            : [];

        // Add new session as string
        existingAttendanceDays.push(newSessionString);

        console.log('Updated attendance_days array:', JSON.stringify(existingAttendanceDays, null, 2));

        // Update document
        const updatedClass = await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.classCollectionId,
            classDoc.$id,
            {
                attendance_days: existingAttendanceDays  // Array of strings
            }
        );

        // Send notifications to enrolled students
        await sendSessionCreatedNotifications(classDoc, newSession);

        console.log('Successfully updated class document');
        return updatedClass;

    } catch (error) {
        console.error('=== Error in createClassSession ===');
        console.error('Error details:', error);
        throw error;
    }
};

// Add this helper function for sending session notifications
const sendSessionCreatedNotifications = async (classDoc, session) => {
    try {
        // Parse students array
        const enrolledStudents = classDoc.students
            .map(student => {
                try {
                    return JSON.parse(student);
                } catch (error) {
                    return null;
                }
            })
            .filter(student => student && student.status === 'approved')
            .map(student => student.student_id);
        
        // For each enrolled student, send a notification
        for (const studentId of enrolledStudents) {
            try {
                const student = await databases.getDocument(
                    appwriteConfig.databaseId,
                    appwriteConfig.userCollectionId,
                    studentId
                );
                
                if (student.pushToken) {
                    // Send notification
                    await fetch('https://exp.host/--/api/v2/push/send', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            to: student.pushToken,
                            title: 'New Attendance Session',
                            body: `${session.session_title} for ${classDoc.class_name} is now available!`,
                            data: { 
                                classId: classDoc.class_id,
                                className: classDoc.class_name,
                                sessionTitle: session.session_title,
                                date: session.date
                            }
                        })
                    });
                    console.log(`Sent notification to student ${studentId}`);
                }
            } catch (error) {
                console.error(`Error sending notification to student ${studentId}:`, error);
            }
        }
    } catch (error) {
        console.error('Error sending session notifications:', error);
    }
};

//end of with push notification

// Add this function to send check-in reminders
export const sendCheckInReminders = async () => {
    try {
        // Get today's date in ISO format (YYYY-MM-DD)
        const today = new Date().toISOString().split('T')[0];
        
        // Get all classes
        const classes = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.classCollectionId
        );
        
        // For each class, check attendance days
        for (const classDoc of classes.documents) {
            if (!classDoc.attendance_days || !Array.isArray(classDoc.attendance_days)) {
                continue;
            }
            
            // Parse attendance days and find sessions for today
            const attendanceDays = classDoc.attendance_days.map(day => {
                try {
                    return typeof day === 'string' ? JSON.parse(day) : day;
                } catch (error) {
                    return null;
                }
            }).filter(Boolean);
            
            // Find sessions scheduled for today
            const todaySessions = attendanceDays.filter(day => day.date === today);
            
            if (todaySessions.length > 0) {
                // Get enrolled students for this class
                const enrolledStudents = classDoc.students
                    .map(student => {
                        try {
                            return JSON.parse(student);
                        } catch (error) {
                            return null;
                        }
                    })
                    .filter(student => student && student.status === 'approved')
                    .map(student => student.student_id);
                
                // For each enrolled student, send a notification
                for (const studentId of enrolledStudents) {
                    try {
                        const student = await databases.getDocument(
                            appwriteConfig.databaseId,
                            appwriteConfig.userCollectionId,
                            studentId
                        );
                        
                        if (student.pushToken) {
                            // Send notification
                            await fetch('https://exp.host/--/api/v2/push/send', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    to: student.pushToken,
                                    title: 'Class Check-in Reminder',
                                    body: `Don't forget to check in for ${classDoc.class_name} today!`,
                                    data: { 
                                        classId: classDoc.class_id,
                                        className: classDoc.class_name,
                                        sessionTitle: todaySessions[0].session_title
                                    }
                                })
                            });
                        }
                    } catch (error) {
                        console.error(`Error sending reminder to student ${studentId}:`, error);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error sending check-in reminders:', error);
    }
};



export const getClassSessions = async (classId: string) => {
    try {
        // console.log('\n=== Starting getClassSessions ===');
        // console.log('Input classId:', classId);

        const classes = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.classCollectionId,
            [Query.equal('class_id', classId)]
        );

        if (!classes.documents || classes.documents.length === 0) {
            console.log('No class found with class_id:', classId);
            return [];
        }

        const classDoc = classes.documents[0];
        
        // Parse each string in the array back to an object
        if (!Array.isArray(classDoc.attendance_days)) {
            return [];
        }

        const sessions = classDoc.attendance_days.map(sessionString => {
            try {
                return JSON.parse(sessionString);
            } catch (error) {
                console.error('Error parsing session:', error);
                return null;
            }
        }).filter(session => session !== null);

        console.log("Class sessions:", sessions)

        return sessions;
    } catch (error) {
        console.error('=== Error in getClassSessions ===');
        console.error('Error details:', error);
        throw error;
    }
};

//end for CreateSession.tsx page

//Student to enrol in a class
const safeJsonParse = (str) => {
    try {
      return typeof str === 'string' ? JSON.parse(str) : str;
    } catch {
      return str;
    }
  };
  
  // Modified enrollInClass function

export const enrollInClass = async (classItem, currentUser) => {
    // console.log('Starting enrollInClass with:', { classItem, currentUser });
    
    try {
        if (!databases) {
            // console.error('Databases instance is undefined');
            throw new Error('Database configuration error');
        }

        // 1. Update Class Document
        // console.log('Fetching class document...');
        const classes = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.classCollectionId,
            [Query.equal('class_id', classItem.class_id)]
        );

        if (!classes.documents.length) {
            throw Error('Class not found');
        }

        const classDoc = classes.documents[0];
        
        // Handle students array in class document
        let studentsArray = classDoc.students || [];

        // Check for existing enrollment in class
        const isEnrolledInClass = studentsArray.some(student => {
            const parsedStudent = safeJsonParse(student);
            return parsedStudent.student_id === currentUser.$id;
        });

        if (isEnrolledInClass) {
            throw Error('Already enrolled in this class');
        }

        // Create new student entry for class
        const newStudentInClass = {
            student_id: currentUser.$id,
            status: "pending",
            joined_date: new Date().toISOString()
        };

        // Update class document
        const updatedClass = await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.classCollectionId,
            classDoc.$id,
            {
                students: [...studentsArray, JSON.stringify(newStudentInClass)]
            }
        );

        // 2. Update User Document
        // console.log('Updating user document...');
        
        // Initialize joined_classes array
        let userJoinedClasses = [];
        
        // Parse existing joined_classes
        if (currentUser.joined_classes && Array.isArray(currentUser.joined_classes)) {
            userJoinedClasses = currentUser.joined_classes
                .filter(entry => entry) // Remove empty entries
                .map(entry => {
                    try {
                        return typeof entry === 'string' ? JSON.parse(entry) : entry;
                    } catch (e) {
                        return null;
                    }
                })
                .filter(entry => entry !== null); // Remove failed parses
        }

        // Create new class entry
        const newClassEntry = {
            class_id: classItem.class_id,
            status: "pending"
        };

        // Check if class is already in joined_classes
        const existingIndex = userJoinedClasses.findIndex(entry => 
            entry && entry.class_id === classItem.class_id
        );

        // Update or add the class entry
        if (existingIndex !== -1) {
            userJoinedClasses[existingIndex] = newClassEntry;
        } else {
            userJoinedClasses.push(newClassEntry);
        }

        // console.log('Final joined_classes array:', userJoinedClasses);

        // Update user document - Keep as array but stringify each element
        const updatedUser = await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            currentUser.$id,
            {
                joined_classes: userJoinedClasses.map(entry => JSON.stringify(entry))
            }
        );

        return {
            classUpdate: updatedClass,
            userUpdate: updatedUser
        };
    } catch (error) {
        console.error('Error in enrollInClass:', error);
        console.error('Error stack:', error.stack);
        throw error;
    }
};

// // Calculate distance between two points using Haversine formula
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    console.log('Calculating distance between points:', {
        student: { lat: lat1, lon: lon1 },
        class: { lat: lat2, lon: lon2 }
    });

    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    console.log('Calculated distance:', distance, 'meters');
    return distance;
};

// Helper function to parse joined_classes
export const parseJoinedClasses = (classesArray) => {
    return classesArray.map(classStr => {
        try {
            return JSON.parse(classStr);
        } catch (e) {
            console.error('Error parsing class string:', classStr, e);
            return null;
        }
    }).filter(item => item !== null);
};


export const findAttendanceSession = async (classId, attendanceCode, studentId, currentUser) => {
    try {
        console.log('Finding attendance session with:', {
            classId,
            attendanceCode,
            studentId
        });

        // List documents with a query filter for class_id
        const classDocuments = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.classCollectionId,
            [
                Query.equal('class_id', classId)
            ]
        );

        console.log('Found class documents:', classDocuments);

        if (!classDocuments.documents || classDocuments.documents.length === 0) {
            throw new Error('Class not found');
        }

        const classDoc = classDocuments.documents[0];
        console.log('Retrieved class document:', classDoc);

        // Parse and verify student enrollment
        let enrollments = [];
        try {
            enrollments = classDoc.students.map(student => {
                if (typeof student === 'string') {
                    return JSON.parse(student);
                }
                return student;
            });
        } catch (error) {
            console.error('Error parsing student enrollments:', error);
            throw new Error('Invalid student enrollment data');
        }
        
        console.log('All student enrollments:', enrollments);

        // Find the specific student's enrollment
        const studentEnrollment = enrollments.find(
            enrollment => enrollment.student_id === studentId
        );
        
        console.log('Found student enrollment:', studentEnrollment);

        if (!studentEnrollment) {
            throw new Error('You are not enrolled in this class');
        }

        if (studentEnrollment.status !== 'approved') {
            throw new Error('Your enrollment is pending approval');
        }

        // Parse attendance days
        let attendanceDays = [];
        try {
            if (Array.isArray(classDoc.attendance_days)) {
                attendanceDays = classDoc.attendance_days.map(day => {
                    if (typeof day === 'string') {
                        return JSON.parse(day);
                    }
                    return day;
                });
            }
        } catch (error) {
            console.error('Error parsing attendance days:', error);
            throw new Error('Invalid attendance days data');
        }

        console.log('Parsed attendance days:', attendanceDays);

        // Find active attendance session
        const session = attendanceDays.find(
            day => day.attendance_code === attendanceCode
        );
        // const session = attendanceDays[attendanceDays.length - 1];

        console.log('Found attendance session:', session);

        if (!session) {
            throw new Error('Invalid attendance code');
        }

        return { classDoc, session };
        // return { classDoc};
    } catch (error) {
        console.error('Error finding attendance session:', error);
        throw error;
    }
};

// Update updateAttendanceRecord function without checkout
// export const updateAttendanceRecord = async (classDoc, session, studentId, status, isCheckout) => {
//     try {
//         console.log('Updating attendance record:', {
//             classId: classDoc.class_id,
//             sessionCode: session.attendance_code,
//             studentId,
//             status,
//             isCheckout
//         });

//         // Parse existing attendance days
//         let attendanceDays = classDoc.attendance_days.map(day => {
//             if (typeof day === 'string') {
//                 return JSON.parse(day);
//             }
//             return day;
//         });

//         // Find the session to update
//         const sessionIndex = attendanceDays.findIndex(
//             day => day.attendance_code === session.attendance_code
//         );

//         if (sessionIndex === -1) {
//             throw new Error('Session not found');
//         }

//         // Create new record
//         const newRecord = {
//             student_id: studentId,
//             submission_time: new Date().toISOString(),
//             status: status,
//             checkout_time: isCheckout ? new Date().toISOString() : null
//         };

//         // Initialize or update records array
//         if (!attendanceDays[sessionIndex].records) {
//             attendanceDays[sessionIndex].records = [];
//         }

//         // Check for existing record
//         const existingRecordIndex = attendanceDays[sessionIndex].records.findIndex(
//             record => record.student_id === studentId
//         );

//         if (existingRecordIndex !== -1) {
//             // Update existing record
//             if (isCheckout) {
//                 newRecord.submission_time = attendanceDays[sessionIndex].records[existingRecordIndex].submission_time;
//             }
//             attendanceDays[sessionIndex].records[existingRecordIndex] = newRecord;
//         } else {
//             // Add new record
//             attendanceDays[sessionIndex].records.push(newRecord);
//         }

//         // Convert attendance days back to strings
//         const updatedAttendanceDays = attendanceDays.map(day => JSON.stringify(day));

//         // Update document
//         const result = await databases.updateDocument(
//             appwriteConfig.databaseId,
//             appwriteConfig.classCollectionId,
//             classDoc.$id,
//             {
//                 attendance_days: updatedAttendanceDays
//             }
//         );

//         console.log('Database update result:', result);
//         return result;
//     } catch (error) {
//         console.error('Error updating attendance record:', error);
//         throw error;
//     }
// };

// //this function has check-in and check-out time
// export const updateAttendanceRecord = async (classDoc, session, studentId, status, isCheckout = false) => {
//     try {
//         console.log('Updating attendance record:', {
//             classId: classDoc.class_id,
//             sessionCode: session.attendance_code,
//             studentId,
//             status,
//             isCheckout
//         });

//         // Parse existing attendance days
//         let attendanceDays = classDoc.attendance_days.map(day => {
//             if (typeof day === 'string') {
//                 return JSON.parse(day);
//             }
//             return day;
//         });

//         // Find the session to update
//         const sessionIndex = attendanceDays.findIndex(
//             day => day.attendance_code === session.attendance_code
//         );

//         if (sessionIndex === -1) {
//             throw new Error('Session not found');
//         }

//         const currentTime = new Date().toISOString();

//         // Create new record with checkout handling
//         const newRecord = {
//             // student_id: studentId,
//             // submission_time: new Date().toISOString(),
//             // status: isCheckout ? 'checked-out' : status, // Change status to 'checked-out' when checking out
//             // checkout_time: isCheckout ? new Date().toISOString() : null

//             student_id: studentId,
//             submission_time: null, // Initialize as null
//             status: isCheckout ? 'checked-out' : status,
//             checkout_time: isCheckout ? currentTime : null
//         };

//         // Initialize or update records array
//         if (!attendanceDays[sessionIndex].records) {
//             attendanceDays[sessionIndex].records = [];
//         }

//         // Check for existing record
//         const existingRecordIndex = attendanceDays[sessionIndex].records.findIndex(
//             record => record.student_id === studentId
//         );

//         if (existingRecordIndex !== -1) {
//             // // Preserve original check-in time if updating
//             // const existingRecord = attendanceDays[sessionIndex].records[existingRecordIndex];
//             // newRecord.submission_time = existingRecord.submission_time;
//             // attendanceDays[sessionIndex].records[existingRecordIndex] = newRecord;

//             // const existingRecord = attendanceDays[sessionIndex].records[existingRecordIndex];
//             // // Keep existing submission_time unless status is 'present'
//             // newRecord.submission_time = status === 'present' ? 
//             //     currentTime : existingRecord.submission_time;
//             // attendanceDays[sessionIndex].records[existingRecordIndex] = newRecord;

//             const existingRecord = attendanceDays[sessionIndex].records[existingRecordIndex];
//             // Preserve existing submission_time when checking out
//             newRecord.submission_time = isCheckout ? 
//                 existingRecord.submission_time : // Keep original time when checking out
//                 (status === 'present' ? currentTime : existingRecord.submission_time); // Update only for new present status
//             attendanceDays[sessionIndex].records[existingRecordIndex] = newRecord;

//         } else {
//             // attendanceDays[sessionIndex].records.push(newRecord);
//             // For new records, set submission_time only if status is present
//             newRecord.submission_time = status === 'present' ? currentTime : null;
//             attendanceDays[sessionIndex].records.push(newRecord);
//         }

//         // Convert attendance days back to strings
//         const updatedAttendanceDays = attendanceDays.map(day => JSON.stringify(day));

//         // Update document
//         const result = await databases.updateDocument(
//             appwriteConfig.databaseId,
//             appwriteConfig.classCollectionId,
//             classDoc.$id,
//             {
//                 attendance_days: updatedAttendanceDays
//             }
//         );

//         // console.log("this is in updateAttendanceRecord", result)
//         return result;
//     } catch (error) {
//         console.error('Error updating attendance record:', error);
//         throw error;
//     }
// };

// ///let's see this
// export const updateAttendanceRecord = async (classDoc, session, studentId, status, isCheckout = false) => {
//     try {
//         console.log('Updating attendance record:', {
//             classId: classDoc.class_id,
//             sessionCode: session.attendance_code,
//             studentId,
//             status,
//             isCheckout
//         });

//         // Parse existing attendance days
//         let attendanceDays = classDoc.attendance_days.map(day => {
//             if (typeof day === 'string') {
//                 return JSON.parse(day);
//             }
//             return day;
//         });

//         // Find the session to update
//         const sessionIndex = attendanceDays.findIndex(
//             day => day.attendance_code === session.attendance_code
//         );

//         if (sessionIndex === -1) {
//             throw new Error('Session not found');
//         }

//         const currentTime = new Date().toISOString();

//         // Create new record with checkout handling
//         const newRecord = {
//             student_id: studentId,
//             submission_time: currentTime, // Always set current time for new submissions
//             status: isCheckout ? 'checked-out' : status,
//             checkout_time: isCheckout ? currentTime : null
//         };

//         // Initialize or update records array
//         if (!attendanceDays[sessionIndex].records) {
//             attendanceDays[sessionIndex].records = [];
//         }

//         // Check for existing record
//         const existingRecordIndex = attendanceDays[sessionIndex].records.findIndex(
//             record => record.student_id === studentId
//         );

//         if (existingRecordIndex !== -1) {
//             const existingRecord = attendanceDays[sessionIndex].records[existingRecordIndex];
//             // When checking out, preserve the original submission time
//             // For new submissions (present or absent), use current time
//             newRecord.submission_time = isCheckout ? 
//                 existingRecord.submission_time : // Keep original time when checking out
//                 currentTime; // Use current time for new submissions regardless of status
//             attendanceDays[sessionIndex].records[existingRecordIndex] = newRecord;
//         } else {
//             // For new records, always set current submission time
//             attendanceDays[sessionIndex].records.push(newRecord);
//         }

//         // Convert attendance days back to strings
//         const updatedAttendanceDays = attendanceDays.map(day => JSON.stringify(day));

//         // Update document
//         const result = await databases.updateDocument(
//             appwriteConfig.databaseId,
//             appwriteConfig.classCollectionId,
//             classDoc.$id,
//             {
//                 attendance_days: updatedAttendanceDays
//             }
//         );

//         return result;
//     } catch (error) {
//         console.error('Error updating attendance record:', error);
//         throw error;
//     }
// };


// // Update submitAttendance function
// export const submitAttendance = async (classId, attendanceCode,studentId, location, currentUser, isCheckout) => {
//     try {

//         // Find attendance session and verify enrollment
//         const { classDoc, session } = await findAttendanceSession(
//             classId, 
//             attendanceCode, 
//             studentId,
//             currentUser
//         );

//         console.log('Found valid session:', {
//             sessionTitle: session.session_title,
//             date: session.date,
//             classLocation: session.location
//         });

//         // Calculate distance
//         const distance = calculateDistance(
//             location.latitude,
//             location.longitude,
//             session.location.latitude,
//             session.location.longitude
//         );

//         console.log('Distance calculation result:', {
//             distance,
//             withinLimit: distance <= 50
//         });

//         // Determine attendance status
//         const status = distance <= 50 ? 'present' : 'absent';

//         // Update attendance record
//         const result = await updateAttendanceRecord(classDoc, session, studentId, status, isCheckout);

//         return {
//             status,
//             distance
//         };
//     } catch (error) {
//         console.error('Error submitting attendance:', error);
//         throw error;
//     }
// };

export const submitAttendance = async (classId, attendanceCode, studentId, location, currentUser, isCheckout) => {
    try {
        console.log('Starting attendance submission at:', new Date().toISOString());

        // Find attendance session and verify enrollment
        const { classDoc, session } = await findAttendanceSession(
            classId, 
            attendanceCode, 
            studentId,
            currentUser
        );

        console.log('Session details:', {
            sessionTitle: session.session_title,
            date: session.date,
            classLocation: session.location,
            currentTime: new Date().toISOString()
        });

        // Calculate distance
        const distance = calculateDistance(
            location.latitude,
            location.longitude,
            session.location.latitude,
            session.location.longitude
        );

        console.log('Attendance check details:', {
            distance,
            withinLimit: distance <= 50,
            checkTime: new Date().toISOString(),
            status: distance <= 50 ? 'present' : 'absent'
        });

        // Determine attendance status
        const status = distance <= 50 ? 'present' : 'absent';

        // Update attendance record with current time
        const submissionTime = new Date().toISOString();
        console.log('Submitting attendance with time:', submissionTime);

        const result = await updateAttendanceRecord(
            classDoc, 
            session, 
            studentId, 
            status, 
            isCheckout,
            submissionTime  // Pass the submission time explicitly
        );

        return {
            status,
            distance,
            submissionTime
        };
    } catch (error) {
        console.error('Error submitting attendance:', error);
        throw error;
    }
};

export const updateAttendanceRecord = async (classDoc, session, studentId, status, isCheckout = false, submissionTime) => {
    try {
        console.log('Starting updateAttendanceRecord with:', {
            status,
            isCheckout,
            submissionTime,
            currentServerTime: new Date().toISOString()
        });

        let attendanceDays = classDoc.attendance_days.map(day => {
            if (typeof day === 'string') {
                return JSON.parse(day);
            }
            return day;
        });

        const sessionIndex = attendanceDays.findIndex(
            day => day.attendance_code === session.attendance_code
        );

        if (sessionIndex === -1) {
            throw new Error('Session not found');
        }

        // Log the current session data before modification
        console.log('Current session data:', attendanceDays[sessionIndex]);

        const currentTime = submissionTime || new Date().toISOString();
        console.log('Using submission time:', currentTime);

        const newRecord = {
            student_id: studentId,
            submission_time: currentTime,  // Use the passed submission time
            status: isCheckout ? 'checked-out' : status,
            checkout_time: isCheckout ? currentTime : null
        };

        console.log('New record to be added:', newRecord);

        if (!attendanceDays[sessionIndex].records) {
            attendanceDays[sessionIndex].records = [];
        }

        const existingRecordIndex = attendanceDays[sessionIndex].records.findIndex(
            record => record.student_id === studentId
        );

        if (existingRecordIndex !== -1) {
            const existingRecord = attendanceDays[sessionIndex].records[existingRecordIndex];
            console.log('Existing record found:', existingRecord);
            
            // Only preserve original submission time for checkouts
            if (isCheckout) {
                newRecord.submission_time = existingRecord.submission_time;
            }
            // Otherwise use the current submission time
            attendanceDays[sessionIndex].records[existingRecordIndex] = newRecord;
        } else {
            attendanceDays[sessionIndex].records.push(newRecord);
        }

        // Log the final record before saving
        console.log('Final record to be saved:', newRecord);

        const updatedAttendanceDays = attendanceDays.map(day => JSON.stringify(day));

        const result = await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.classCollectionId,
            classDoc.$id,
            {
                attendance_days: updatedAttendanceDays
            }
        );

        return result;
    } catch (error) {
        console.error('Error updating attendance record:', error);
        throw error;
    }
};

//logout function
export const logoutUser = async () => {
    try {

        // const { clearNotifications } = getNotificationActions();
        
        // // Clear notifications
        // clearNotifications();

        await account.deleteSessions();
        
        return true;
    } catch (error) {
        console.log("Logout error:", error);
        throw error;
    }
}


export const listFiles = async (classId: string) => {
    try {
        // Get current user to check role
        const currentUser = await getCurrentUser();
        console.log('Checking files for classId:', classId);
        
        // For students, verify enrollment first
        if (currentUser.role === 'student') {
            const joinedClasses = parseJoinedClasses(currentUser.joined_classes);
            console.log('Student joined classes:', joinedClasses);
            
            // Find the matching class using exact class ID
            const enrollment = joinedClasses.find(cls => cls.class_id === classId);
            
            if (!enrollment || enrollment.status !== 'approved') {
                console.log('Student not approved for this class');
                return [];
            }
        }

        // Create query to filter files by exact class_id
        const queries = [
            Query.equal('class_id', classId),
            // Query.notEqual('is_classimage', 'Yes')

        ];

        // Get files with the query filter
        const files = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.fileCollectionId,
            queries
        );

        // console.log('Files query result:', files);

        return files.documents;
    } catch (error) {
        console.error('Error listing files:', error);
        throw error;
    }
};

export const listFiles_count = async (classId: string) => {
    try {
        // Get current user to check role
        const currentUser = await getCurrentUser();
        console.log('Checking files for classId:', classId);
        
        // For students, verify enrollment first
        if (currentUser.role === 'student') {
            const joinedClasses = parseJoinedClasses(currentUser.joined_classes);
            console.log('Student joined classes:', joinedClasses);
            
            // Find the matching class using exact class ID
            const enrollment = joinedClasses.find(cls => cls.class_id === classId);
            
            if (!enrollment || enrollment.status !== 'approved') {
                console.log('Student not approved for this class');
                return [];
            }
        }

        // Create query to filter files by exact class_id
        const queries = [
            Query.equal('class_id', classId),
            Query.notEqual('is_classimage', 'Yes')

        ];

        // Get files with the query filter
        const files = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.fileCollectionId,
            queries
        );

        // console.log('Files query result:', files);

        return files.documents;
    } catch (error) {
        console.error('Error listing files:', error);
        throw error;
    }
};

// export const uploadFile = async (fileData) => {
//     try {
//         console.log('Starting file upload');
        
//         // Get current user
//         const currentUser = await getCurrentUser();
        
//         // Prepare the file data
//         const preparedFile = {
//             name: fileData.name,
//             type: fileData.type,
//             size: fileData.size,
//             uri: fileData.uri
//         };

//         console.log('Prepared file:', preparedFile);

//         // Upload to Appwrite storage
//         const uploadResult = await storage.createFile(
//             appwriteConfig.storageId,
//             ID.unique(),
//             preparedFile,
//             ['read("any")', 'write("any")']
//         );

//         // Get file URL
//         const fileURL = storage.getFileView(
//             appwriteConfig.storageId,
//             uploadResult.$id
//         ).href;

//         // Create metadata document in fileCollection
//         const fileMetadata = await databases.createDocument(
//             appwriteConfig.databaseId,
//             appwriteConfig.fileCollectionId,
//             ID.unique(),
//             {
//                 filename: fileData.name,
//                 creator: currentUser.$id,
//                 fileURL: fileURL,
//                 class_id: fileData.classId // Add class_id to the metadata

//             }
//         );

//         console.log('File metadata created:', fileMetadata);
//         return {
//             uploadResult,
//             fileMetadata
//         };

//     } catch (error) {
//         console.error('Error uploading file:', error);
//         throw error;
//     }
// };

//for students to extract all attendace_days
// Add this new function after your other export functions


export const uploadFile = async (fileData) => {
    try {
        console.log('Starting file upload');
        
        // Get current user
        const currentUser = await getCurrentUser();
        
        // Prepare the file data
        const preparedFile = {
            name: fileData.name,
            type: fileData.type,
            size: fileData.size,
            uri: fileData.uri
        };

        console.log('Prepared file:', preparedFile);

        // Upload to Appwrite storage
        const uploadResult = await storage.createFile(
            appwriteConfig.storageId,
            ID.unique(),
            preparedFile,
            ['read("any")', 'write("any")']
        );

        // Get file URL
        const fileURL = storage.getFileView(
            appwriteConfig.storageId,
            uploadResult.$id
        ).href;

        // Create metadata document in fileCollection with additional fields
        const metadataFields = {
            filename: fileData.name,
            creator: currentUser.$id,
            fileURL: fileURL,
            // Always include class_id, use a default if not provided
            class_id: fileData.classId || 'global'
        };
        
        // Add classImage flag if this is a class image
        if (fileData.isClassImage) {
            metadataFields.is_classimage = "Yes";
        }

        const fileMetadata = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.fileCollectionId,
            ID.unique(),
            metadataFields
        );

        console.log('File metadata created:', fileMetadata);
        return {
            uploadResult,
            fileMetadata
        };

    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
};



export const getClassAttendanceDaysForStudent = async (classId) => {
    try {
        console.log('\n=== Starting getClassAttendanceDaysForStudent ===');
        console.log('Fetching attendance days for class:', classId);

        // Get class document
        const classDocuments = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.classCollectionId,
            [Query.equal('class_id', classId)]
        );

        if (!classDocuments.documents.length) {
            console.log('No class found with ID:', classId);
            return [];
        }

        const classDoc = classDocuments.documents[0];
        // console.log('Raw class document:', classDoc);

        // Check if attendance_days exists and is an array
        if (!classDoc.attendance_days || !Array.isArray(classDoc.attendance_days)) {
            console.log('No attendance days found or invalid format');
            return [];
        }

        // Parse attendance days
        const parsedAttendanceDays = classDoc.attendance_days.map(day => {
            try {
                // console.log('Processing attendance day:', day);
                const parsed = typeof day === 'string' ? JSON.parse(day) : day;
                // console.log('Successfully parsed day:', parsed);
                return parsed;
            } catch (error) {
                console.error('Error parsing attendance day:', error);
                return null;
            }
        }).filter(Boolean);

        // console.log('Final processed attendance days:', parsedAttendanceDays);
        return parsedAttendanceDays;

    } catch (error) {
        console.error('Error in getClassAttendanceDaysForStudent:', error);
        throw error;
    }
};

// Add this new function after getClassAttendanceDaysForStudent..this one also have the class information
export const getClassAddress = async (classId) => {
    try {
        const classDocuments = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.classCollectionId,
            [Query.equal('class_id', classId)]
        );

        if (!classDocuments.documents.length) {
            return null;
        }

        const classDoc = classDocuments.documents[0];
        // console.log("classDoc:", classDoc)
        const address = classDoc.class_address && classDoc.class_address[0] ? 
            JSON.parse(classDoc.class_address[0]) : null;
        const schedule = classDoc.class_schedule && classDoc.class_schedule[0] ? 
            JSON.parse(classDoc.class_schedule[0]) : null;
        
            // Parse class location
        const location = classDoc.class_location && classDoc.class_location[0] ? 
        JSON.parse(classDoc.class_location[0]) : null;
        
        // console.log("schedule:",schedule)
        return {address,schedule, location, size: classDoc.class_size};
    
        
    } catch (error) {
        console.error('Error getting class details:', error);
        return null;
    }
};

//updating class details for teacher
export const updateClassDetails = async (classId, name, newAddress, newSchedule, newClassSize, imageUrl) => {
    try {
        const classDocuments = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.classCollectionId,
            [Query.equal('class_id', classId)]
        );

        if (!classDocuments.documents.length) {
            throw new Error('Class not found');
        }

        const classDoc = classDocuments.documents[0];
        
        const updates = {
            class_name: name,
            class_address: [JSON.stringify(newAddress)],
            class_schedule: [JSON.stringify(newSchedule)],
            class_size: newClassSize
        };
        // Add image URL to updates if provided
        if (imageUrl) {
            updates.class_image = imageUrl;
        }

        console.log('Updating class with:', updates);

        const updatedClass = await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.classCollectionId,
            classDoc.$id,
            updates
        );

        return updatedClass;
    } catch (error) {
        console.error('Error updating class details:', error);
        throw error;
    }
};

//to delete files 
export const deleteFile = async (fileId) => {
    try {
        // Delete file metadata from database
        await databases.deleteDocument(
            appwriteConfig.databaseId,
            appwriteConfig.fileCollectionId,
            fileId
        );

        return true;
    } catch (error) {
        console.error('Error deleting file:', error);
        throw error;
    }
};

