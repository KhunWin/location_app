import SignIn from '@/app/(auth)/sign-in';
import { Client, Account, Avatars, Databases, ID, Query } from 'react-native-appwrite';

// import { Client, Account, ID, Avatars, Databases } from 'appwrite';


export const appwriteConfig = {
    endpoint: 'https://cloud.appwrite.io/v1',
    platform: 'com.win.attendance',
    projectId: '673308040024ad5f0292',
    databaseId: '6733094b0030099a3e4c',
    userCollectionId: '67330a2600212bd7b42c',
    classCollectionId: '6770252d001271cb06f6',
    videoCollectionId: '67330a5f000505b03f74',
    storageId: '67330bfe001b740c30af',

}

// Init your React Native SDK
const client = new Client();

client
    .setEndpoint(appwriteConfig.endpoint) // Your Appwrite Endpoint
    .setProject(appwriteConfig.projectId) // Your project ID
    .setPlatform(appwriteConfig.platform) // Your application ID or bundle ID.

const account = new Account(client);
const avatars = new Avatars(client);
const databases = new Databases(client);


export const createUser = async (email, password, username, role) => {
    try {
        // First, check if there's an active session and delete it
        try {
            await account.deleteSession('current');
        } catch (e) {
            // Ignore error if no session exists
        }

        const newAccount = await account.create(
            ID.unique(),
            email, 
            password,
            username
        );

        if(!newAccount) throw Error;

        const avatarUrl = avatars.getInitials(username);

        // Define the class_id and joined_classes structure
        const classId = "23424Id";
        // Convert the joined_classes array into a JSON string
        const joinedClasses = JSON.stringify([
            {
                class_id: classId,
                status: "pending", // Default status
            },
        ]);

        const newUser = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            ID.unique(),
            {
                accountId: newAccount.$id,
                email,
                username,
                avatar: avatarUrl,
                role: role, // Default role
                joined_classes: [joinedClasses],
            }
        );

        // Create new session after everything else is done
        const session = await account.createEmailPasswordSession(email, password);
        
        return {
            user: newUser,
            session: session
        };

    } catch(error) {
        console.log(error);
        throw error; // Throw the original error
    }
}

export const  signIn = async (email, password) => {
    try { 
        // Check for and delete any existing session
        try {
            await account.deleteSession('current');
        } catch (e) {
            // Ignore error if no session exists
        }

        const session = await account.createEmailPasswordSession(email, password);
        return session;

    } catch(error) {
        console.log(error);
        throw error; // Throw the original error
    }
}

export const getCurrentUser = async () => {

    try {
        const currentAccount = await account.get();

        if (!currentAccount) throw Error;

        const currentUser = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [Query.equal('accountId', currentAccount.$id)]

        );

        if (!currentUser) throw Error;

        return currentUser.documents[0]; //return only one user

    } catch (error) {
        console.log(error);
    }

}

//creating a class

export const createClass = async (className) => {
    try {
        // Debug: Check if we have a current session
        const session = await account.getSession('current');
        if (!session) throw new Error('Not authenticated');

        // Get user details from users collection
        const users = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [
                Query.equal('accountId', session.userId)
            ]
        );

        if (!users.documents.length) throw new Error('User not found');
        const user = users.documents[0];
        // Debug: Log class document being created
        const classData = {
            class_id: ID.unique(),
            class_name: className,
            created_by: user.$id,
            students: [],
            attendance_days: []
        };
        // console.log('Attempting to create class with data:', JSON.stringify(classData, null, 2));


        // Create new class document
        const newClass = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.classCollectionId,
            ID.unique(),
            classData
        );

        return newClass;

    } catch (error) {
        throw error;
    }
}

// Get all classes

export const getUserClasses = async () => {
    try {
        const session = await account.getSession('current');
        if (!session) throw new Error('Not authenticated');

        // First get the user document to get the correct $id
        const users = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [Query.equal('accountId', session.userId)]
        );

        if (!users.documents.length) throw new Error('User not found');
        const user = users.documents[0];

        // Now query classes with the correct user.$id
        const classes = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.classCollectionId,
            [
                Query.equal('created_by', user.$id)  // Use user.$id instead of session.userId
            ]
        );

        return classes.documents;
    } catch (error) {
        console.error('Error fetching classes:', error);
        throw error;
    }
}

//with Docuemnt ID
// export const getClassStudents = async (classId) => {
//     try {
//         console.log('\n=== Starting getClassStudents ===');
//         console.log('Input classId:', classId);
//         console.log('Database ID:', appwriteConfig.databaseId);
//         console.log('Class Collection ID:', appwriteConfig.classCollectionId);
//         console.log('User Collection ID:', appwriteConfig.userCollectionId);

//         // First, get the class document
//         console.log('\n--- Fetching Class Document ---');
//         const classDoc = await databases.getDocument(
//             appwriteConfig.databaseId,
//             appwriteConfig.classCollectionId,
//             classId
//         );
//         console.log('Class Document received:', JSON.stringify(classDoc, null, 2));

//         if (!classDoc.students || classDoc.students.length === 0) {
//             console.log('No students found in class');
//             return [];
//         }

//         console.log('\n--- Students array in class ---');
//         console.log(JSON.stringify(classDoc.students, null, 2));

//         // Get student details for each student
//         console.log('\n--- Fetching individual student details ---');
//         const studentsPromises = classDoc.students.map(async (studentInfo) => {
//             try {
//                 console.log(`\nFetching details for student_id: ${studentInfo.student_id}`);
//                 console.log('Student info from class:', JSON.stringify(studentInfo, null, 2));
                
//                 const studentDoc = await databases.getDocument(
//                     appwriteConfig.databaseId,
//                     appwriteConfig.userCollectionId,
//                     studentInfo.student_id
//                 );

//                 console.log('Student document received:', JSON.stringify(studentDoc, null, 2));

//                 const processedStudent = {
//                     $id: studentDoc.$id,
//                     username: studentDoc.username,
//                     email: studentDoc.email,
//                     avatar: studentDoc.avatar,
//                     status: studentInfo.status,
//                     joined_date: studentInfo.joined_date
//                 };

//                 console.log('Processed student data:', JSON.stringify(processedStudent, null, 2));
//                 return processedStudent;

//             } catch (error) {
//                 console.error(`Error fetching student ${studentInfo.student_id}:`);
//                 console.error('Error details:', error);
//                 return null;
//             }
//         });

//         const students = await Promise.all(studentsPromises);
//         const validStudents = students.filter(student => student !== null);

//         console.log('\n=== Final processed students list ===');
//         console.log(JSON.stringify(validStudents, null, 2));
        
//         return validStudents;

//     } catch (error) {
//         console.error('\n=== Error in getClassStudents ===');
//         console.error('Error message:', error.message);
//         console.error('Error stack:', error.stack);
//         console.error('Full error object:', JSON.stringify(error, null, 2));
//         throw error;
//     }
// }

// export const getClassStudents = async (classId) => {
//     try {
//         console.log('\n=== Starting getClassStudents ===');
//         console.log('Input classId:', classId);
//         console.log('Database ID:', appwriteConfig.databaseId);
//         console.log('Class Collection ID:', appwriteConfig.classCollectionId);
//         console.log('User Collection ID:', appwriteConfig.userCollectionId);

//         // Get the class document
//         const classDoc = await databases.getDocument(
//             appwriteConfig.databaseId,
//             appwriteConfig.classCollectionId,
//             classId
//         );

//         console.log('Class Document received:', JSON.stringify(classDoc, null, 2));

//         // Parse the students string into an array of objects
//         let studentsArray = [];
//         try {
//             // Handle the string format and convert to array of objects
//             if (classDoc.students && classDoc.students.length > 0) {
//                 const studentsString = classDoc.students[0]; // Get the first element which contains all students
//                 // Clean up the string and parse it
//                 const cleanedString = `[${studentsString}]`;
//                 console.log('Attempting to parse students string:', cleanedString);
//                 studentsArray = JSON.parse(cleanedString.replace(/\n/g, ''));
//             }
//         } catch (parseError) {
//             console.error('Error parsing students array:', parseError);
//             return [];
//         }

//         console.log('Parsed students array:', JSON.stringify(studentsArray, null, 2));

//         if (!studentsArray.length) {
//             console.log('No students found in class');
//             return [];
//         }

//         // Get student details for each student
//         const studentsPromises = studentsArray.map(async (studentInfo) => {
//             try {
//                 console.log(`\nFetching details for student_id: ${studentInfo.student_id}`);
//                 console.log('Student info from class:', JSON.stringify(studentInfo, null, 2));
                
//                 const studentDoc = await databases.getDocument(
//                     appwriteConfig.databaseId,
//                     appwriteConfig.userCollectionId,
//                     studentInfo.student_id
//                 );

//                 console.log('Student document received:', JSON.stringify(studentDoc, null, 2));

//                 const processedStudent = {
//                     $id: studentDoc.$id,
//                     username: studentDoc.username,
//                     email: studentDoc.email,
//                     avatar: studentDoc.avatar,
//                     status: studentInfo.status,
//                     joined_date: studentInfo.joined_date
//                 };

//                 console.log('Processed student data:', JSON.stringify(processedStudent, null, 2));
//                 return processedStudent;

//             } catch (error) {
//                 console.error(`Error fetching student ${studentInfo.student_id}:`, error);
//                 return null;
//             }
//         });

//         const students = await Promise.all(studentsPromises);
//         const validStudents = students.filter(student => student !== null);

//         console.log('\n=== Final processed students list ===');
//         console.log(JSON.stringify(validStudents, null, 2));
        
//         return validStudents;

//     } catch (error) {
//         console.error('Error in getClassStudents:', error);
//         console.error('Error stack:', error.stack);
//         throw error;
//     }
// }

// export const getClassStudents = async (classId) => {
//     try {
//         console.log('\n=== Starting getClassStudents ===');
//         console.log('Input classId:', classId);

//         // Query the class document using class_id
//         const classes = await databases.listDocuments(
//             appwriteConfig.databaseId,
//             appwriteConfig.classCollectionId,
//             [Query.equal('class_id', classId)]
//         );

//         if (!classes.documents.length) {
//             console.log('No class found with class_id:', classId);
//             return [];
//         }

//         const classDoc = classes.documents[0];
//         console.log('Class Document found:', JSON.stringify(classDoc, null, 2));

//         // Check if students array exists and has data
//         if (!classDoc.students || !classDoc.students.length) {
//             console.log('No students found in class');
//             return [];
//         }

//         // Get student details for each student
//         const studentsPromises = classDoc.students.map(async (studentInfo) => {
//             try {
//                 console.log(`Fetching details for student_id: ${studentInfo.student_id}`);
                
//                 const studentDoc = await databases.getDocument(
//                     appwriteConfig.databaseId,
//                     appwriteConfig.userCollectionId,
//                     studentInfo.student_id
//                 );

//                 return {
//                     $id: studentDoc.$id,
//                     username: studentDoc.username,
//                     email: studentDoc.email,
//                     avatar: studentDoc.avatar,
//                     status: studentInfo.status,
//                     joined_date: studentInfo.joined_date
//                 };

//             } catch (error) {
//                 console.error(`Error fetching student ${studentInfo.student_id}:`, error);
//                 return null;
//             }
//         });

//         const students = await Promise.all(studentsPromises);
//         const validStudents = students.filter(student => student !== null);

//         console.log('Final students list:', JSON.stringify(validStudents, null, 2));
//         return validStudents;

//     } catch (error) {
//         console.error('Error in getClassStudents:', error);
//         throw error;
//     }
// }

export const getClassStudents = async (classId) => {
    try {
        console.log('\n=== Starting getClassStudents ===');
        console.log('Input classId:', classId);

        // Query the class document using class_id
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

        // Parse the students string into an array of objects
        let studentsArray = [];
        if (classDoc.students && classDoc.students.length > 0) {
            try {
                const studentsString = classDoc.students[0];
                console.log('Raw students string:', studentsString);

                // Clean and parse the string
                const cleanString = studentsString
                    .replace(/\n/g, '')
                    .replace(/\s+/g, ' ')
                    .trim();
                console.log('Cleaned string:', cleanString);

                // Parse the cleaned string
                studentsArray = JSON.parse(`[${cleanString}]`);
                console.log('Parsed students array:', JSON.stringify(studentsArray, null, 2));
            } catch (parseError) {
                console.error('Error parsing students string:', parseError);
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
                    avatar: studentDoc.avatar,
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