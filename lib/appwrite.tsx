import SignIn from '@/app/(auth)/sign-in';
import * as Location from 'expo-location';  // Add this import
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


//not creating a new user
// export const createUser = async (email, password, username, role) => {
//     try {
//         // First, check if there's an active session and delete it
//         try {
//             await account.deleteSession('current');
//         } catch (e) {
//             // Ignore error if no session exists
//         }

//         const newAccount = await account.create(
//             ID.unique(),
//             email, 
//             password,
//             username
//         );

//         if(!newAccount) throw Error;

//         // const avatarUrl = avatars.getInitials(username);

//         // Define the class_id and joined_classes structure
//         const classId = "23424Id";
//         // Convert the joined_classes array into a JSON string
//         const joinedClasses = JSON.stringify([
//             {
//                 class_id: classId,
//                 status: "pending", // Default status
//             },
//         ]);

//         const newUser = await databases.createDocument(
//             appwriteConfig.databaseId,
//             appwriteConfig.userCollectionId,
//             ID.unique(),
//             {
//                 accountId: newAccount.$id,
//                 email,
//                 username,
//                 // avatar: avatarUrl,
//                 role: role, // Default role
//                 joined_classes: [joinedClasses],
//             }
//         );

//         // Create new session after everything else is done
//         const session = await account.createEmailPasswordSession(email, password);
        
//         return {
//             user: newUser,
//             session: session
//         };

//     } catch(error) {
//         console.log(error);
//         throw error; // Throw the original error
//     }
// }


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

// export const getCurrentUser = async () => {

//     try {
//         const currentAccount = await account.get();

//         if (!currentAccount) throw Error;

//         const currentUser = await databases.listDocuments(
//             appwriteConfig.databaseId,
//             appwriteConfig.userCollectionId,
//             [Query.equal('accountId', currentAccount.$id)]

//         );

//         if (!currentUser) throw Error;

//         return currentUser.documents[0]; //return only one user

//     } catch (error) {
//         console.log(error);
//     }

// }


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
        console.log('Current account:', currentAccount);

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

        console.log('Current user query result:', currentUser);

        if (!currentUser || !currentUser.documents.length) {
            console.log('No user document found');
            throw Error('No user document found');
        }

        const userDoc = currentUser.documents[0];
        console.log('Returning user document:', userDoc);
        return userDoc;

    } catch (error) {
        console.log('=== Error in getCurrentUser ===');
        console.log('Error details:', error);
        throw error;
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

// export const getUserClasses = async () => {
//     try {
//         const session = await account.getSession('current');
//         if (!session) throw new Error('Not authenticated');

//         // First get the user document to get the correct $id
//         const users = await databases.listDocuments(
//             appwriteConfig.databaseId,
//             appwriteConfig.userCollectionId,
//             [Query.equal('accountId', session.userId)]
//         );

//         if (!users.documents.length) throw new Error('User not found');
//         const user = users.documents[0];

//         // Now query classes with the correct user.$id
//         const classes = await databases.listDocuments(
//             appwriteConfig.databaseId,
//             appwriteConfig.classCollectionId,
//             [
//                 Query.equal('created_by', user.$id)  // Use user.$id instead of session.userId
//             ]
//         );

//         return classes.documents;
//     } catch (error) {
//         console.error('Error fetching classes:', error);
//         throw error;
//     }
// }

///this work for both teacher and student role, depending on the role of the user, the classes will be fetched
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

        console.log('Successfully updated class document');
        return updatedClass;

    } catch (error) {
        console.error('=== Error in createClassSession ===');
        console.error('Error details:', error);
        throw error;
    }
};

export const getClassSessions = async (classId: string) => {
    try {
        console.log('\n=== Starting getClassSessions ===');
        console.log('Input classId:', classId);

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
// export const enrollInClass = async (classItem, currentUser) => {
//     console.log('Starting enrollInClass with:', { classItem, currentUser });
    
//     try {
//       if (!databases) {
//         console.error('Databases instance is undefined');
//         throw new Error('Database configuration error');
//       }
  
//       // Get class document
//       console.log('Fetching class document...');
//       const classes = await databases.listDocuments(
//         appwriteConfig.databaseId,
//         appwriteConfig.classCollectionId,
//         [Query.equal('class_id', classItem.class_id)]
//       );
//       console.log('Found classes:', classes);
  
//       if (!classes.documents.length) {
//         throw Error('Class not found');
//       }
  
//       const classDoc = classes.documents[0];
//       console.log('Class document:', classDoc);
  
//       // Handle students array
//       let studentsArray = classDoc.students || [];
//       console.log('Current students array:', studentsArray);
  
//       // Check for existing enrollment
//       const isEnrolled = studentsArray.some(student => {
//         const parsedStudent = safeJsonParse(student);
//         return parsedStudent.student_id === currentUser.$id;
//       });
  
//       if (isEnrolled) {
//         throw Error('Already enrolled in this class');
//       }
  
//       // Create new student entry
//       const newStudent = {
//         student_id: currentUser.$id,
//         status: "pending",
//         joined_date: new Date().toISOString()
//       };
//       console.log('New student entry:', newStudent);
  
//       // Add to students array
//       studentsArray.push(JSON.stringify(newStudent));
  
//       // Update class document
//       console.log('Updating class document...');
//       const updatedClass = await databases.updateDocument(
//         appwriteConfig.databaseId,
//         appwriteConfig.classCollectionId,
//         classDoc.$id,
//         {
//           students: studentsArray
//         }
//       );
//       console.log('Updated class document:', updatedClass);
  
//       return true;
//     } catch (error) {
//       console.error('Error in enrollInClass:', error);
//       console.error('Error stack:', error.stack);
//       throw error;
//     }
//   };

// export const enrollInClass = async (classItem, currentUser) => {
//     console.log('Starting enrollInClass with:', { classItem, currentUser });
    
//     try {
//         if (!databases) {
//             console.error('Databases instance is undefined');
//             throw new Error('Database configuration error');
//         }

//         // 1. Update Class Document
//         console.log('Fetching class document...');
//         const classes = await databases.listDocuments(
//             appwriteConfig.databaseId,
//             appwriteConfig.classCollectionId,
//             [Query.equal('class_id', classItem.class_id)]
//         );
//         console.log('Found classes:', classes);

//         if (!classes.documents.length) {
//             throw Error('Class not found');
//         }

//         const classDoc = classes.documents[0];
//         console.log('Class document:', classDoc);

//         // Handle students array in class document
//         let studentsArray = classDoc.students || [];
//         console.log('Current students array in class:', studentsArray);

//         // Check for existing enrollment in class
//         const isEnrolledInClass = studentsArray.some(student => {
//             const parsedStudent = safeJsonParse(student);
//             return parsedStudent.student_id === currentUser.$id;
//         });

//         if (isEnrolledInClass) {
//             throw Error('Already enrolled in this class');
//         }

//         // Create new student entry for class
//         const newStudentInClass = {
//             student_id: currentUser.$id,
//             status: "pending",
//             joined_date: new Date().toISOString()
//         };
//         console.log('New student entry for class:', newStudentInClass);

//         // Update class document
//         console.log('Updating class document...');
//         const updatedClass = await databases.updateDocument(
//             appwriteConfig.databaseId,
//             appwriteConfig.classCollectionId,
//             classDoc.$id,
//             {
//                 students: [...studentsArray, JSON.stringify(newStudentInClass)]
//             }
//         );
//         console.log('Updated class document:', updatedClass);

//         // 2. Update User Document
//         console.log('Updating user document...');
        
//         // Get current joined_classes array
//         let userJoinedClasses = currentUser.joined_classes || [];
//         console.log('Current joined_classes:', userJoinedClasses);

//         // Parse existing joined_classes if it's a string
//         if (typeof userJoinedClasses === 'string') {
//             try {
//                 userJoinedClasses = JSON.parse(userJoinedClasses);
//             } catch (e) {
//                 console.log('Error parsing joined_classes, initializing as empty array');
//                 userJoinedClasses = [];
//             }
//         }

//         // Ensure it's an array
//         if (!Array.isArray(userJoinedClasses)) {
//             userJoinedClasses = [];
//         }

//         // Create new class entry for user
//         const newClassEntry = {
//             class_id: classItem.class_id,
//             status: "pending"
//         };

//         // Add new class to user's joined_classes
//         userJoinedClasses.push(newClassEntry);
//         console.log('Updated joined_classes array:', userJoinedClasses);

//         // Update user document
//         const updatedUser = await databases.updateDocument(
//             appwriteConfig.databaseId,
//             appwriteConfig.userCollectionId,
//             currentUser.$id,
//             {
//                 joined_classes: [JSON.stringify(userJoinedClasses)]
//             }
//         );
//         console.log('Updated user document:', updatedUser);

//         return {
//             classUpdate: updatedClass,
//             userUpdate: updatedUser
//         };
//     } catch (error) {
//         console.error('Error in enrollInClass:', error);
//         console.error('Error stack:', error.stack);
//         throw error;
//     }
// };

export const enrollInClass = async (classItem, currentUser) => {
    console.log('Starting enrollInClass with:', { classItem, currentUser });
    
    try {
        if (!databases) {
            console.error('Databases instance is undefined');
            throw new Error('Database configuration error');
        }

        // 1. Update Class Document
        console.log('Fetching class document...');
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
        console.log('Updating user document...');
        
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

        console.log('Final joined_classes array:', userJoinedClasses);

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

