import { View, Text, ScrollView, Alert, Image, TouchableOpacity, Dimensions } from 'react-native'
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import FormField from '@/components/FormField'
import CustomButton from '@/components/CustomButton'
import { createClass, getUserClasses, getCurrentUser, enrollInClass, databases, appwriteConfig } from '../../lib/appwrite'
import { images } from '@/constants'

// const Home = () => {
//   const [className, setClassName] = useState('')
//   const [isSubmitting, setIsSubmitting] = useState(false)
//   const [showForm, setShowForm] = useState(false)
//   const [classes, setClasses] = useState([])
//   const [isLoading, setIsLoading] = useState(true)

//   // Calculate item width for 2 columns with padding
//   const screenWidth = Dimensions.get('window').width
//   const itemWidth = (screenWidth - 48) / 2 // 48 = padding (16 * 2) + gap between items (16)

//   useEffect(() => {
//     loadClasses()
//   }, [])

//   const loadClasses = async () => {
//     try {
//       setIsLoading(true)
//       const userClasses = await getUserClasses()
//       setClasses(userClasses)
//     } catch (error) {
//       Alert.alert('Error', 'Failed to load classes')
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   const handleCreateClass = async () => {
//     if (!className) {
//       Alert.alert('Error', 'Class name is required')
//       return
//     }

//     setIsSubmitting(true)
//     try {
//       await createClass(className)
//       setClassName('') // Reset form
//       setShowForm(false) // Hide form
//       loadClasses() // Reload classes
//       Alert.alert('Success', 'Class created successfully')
//     } catch (error) {
//       Alert.alert('Error', error.message)
//     } finally {
//       setIsSubmitting(false)
//     }
//   }

//   const handleClassPress = (classItem) => {
//     console.log('Selected class item:', JSON.stringify(classItem, null, 2));
//     console.log('Class ID being passed:', classItem.class_id);
    
//     router.push({
//         pathname: '/bookmark',
//         params: { 
//             className: classItem.class_name,
//             classId: classItem.class_id
//         }
//     });
    
//     console.log('Router params:', {
//         className: classItem.class_name,
//         classId: classItem.class_id
//     });
// }

//   return (
//     <SafeAreaView className="bg-primary h-full">
//       <ScrollView>
//         <View className='px-4 my-6'>
//           <View className="flex-row justify-between items-center mb-8">
//             <Text className='text-2xl text-white font-semibold'>My Classes</Text>
//             <TouchableOpacity 
//               onPress={() => setShowForm(!showForm)}
//               className="bg-secondary px-4 py-2 rounded-lg"
//             >
//               <Text className="text-white">
//                 {showForm ? 'Cancel' : 'Create Class'}
//               </Text>
//             </TouchableOpacity>
//           </View>

//           {showForm && (
//             <View className="mb-8">
//               <FormField 
//                 title="Class Name"
//                 value={className}
//                 handleChangeText={setClassName}
//                 placeholder="Enter class name"
//               />

//               <CustomButton 
//                 title='Create Class' 
//                 handlePress={handleCreateClass}
//                 containerStyle="mt-4" 
//                 isLoading={isSubmitting}
//               />
//             </View>
//           )}

//           {isLoading ? (
//             <Text className="text-white text-center">Loading classes...</Text>
//           ) : (
//             <View className="flex-row flex-wrap gap-2 justify-between">
//               {classes.map((classItem) => (
//                 <TouchableOpacity 
//                   key={classItem.$id}
//                   onPress={() => handleClassPress(classItem)}
//                   className="bg-primary rounded-lg overflow-hidden"
//                   style={{ width: itemWidth }}
//                 >
//                   <Image 
//                     source={images.class_icon}
//                     style={{ width: '100%', height: itemWidth }}
//                     resizeMode="cover"
//                   />
//                   <Text className="text-white text-center py-2 px-2 text-lg">
//                     {classItem.class_name}
//                   </Text>
//                 </TouchableOpacity>
//               ))}
//             </View>
//           )}

//           {!isLoading && classes.length === 0 && (
//             <Text className="text-white text-center">
//               No classes created yet. Create your first class!
//             </Text>
//           )}
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   )
// }

const Home = () => {
  const [className, setClassName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [classes, setClasses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [enrollmentStatus, setEnrollmentStatus] = useState({})

  const screenWidth = Dimensions.get('window').width
  const itemWidth = (screenWidth - 48) / 2

  useEffect(() => {
    loadUserAndClasses()
  }, [])

  const handleClassPress = (classItem) => {
    // Navigate to class details page
    router.push({
      pathname: `/bookmark`,
      params: { className: classItem.class_name,
                    classId: classItem.class_id}
    });
  };

  // const loadUserAndClasses = async () => {
  //   try {
  //     setIsLoading(true)
      
  //     // Get current user and their role
  //     const user = await getCurrentUser()
  //     console.log('Current user:', user) // For debugging
  //     setCurrentUser(user)

  //     // Get classes
  //     const userClasses = await getUserClasses()
  //     setClasses(userClasses)

  //     // Check enrollment status if user is a student
  //     if (user && user.role === 'student') {
  //       const statusObj = {}
        
  //       // Get enrollment status from user's joined_classes
  //       if (user.joined_classes && Array.isArray(user.joined_classes)) {
  //         user.joined_classes.forEach(classData => {
  //           try {
  //             const parsedClass = typeof classData === 'string' 
  //               ? JSON.parse(classData) 
  //               : classData
              
  //             statusObj[parsedClass.class_id] = parsedClass.status
  //           } catch (error) {
  //             console.log('Error parsing joined class:', error)
  //           }
  //         })
  //       }
        
  //       setEnrollmentStatus(statusObj)
  //     }
  //   } catch (error) {
  //     console.error('Error loading data:', error)
  //     Alert.alert('Error', 'Failed to load data')
  //   } finally {
  //     setIsLoading(false)
  //   }
  // }

//   const loadUserAndClasses = async () => {
//     try {
//         setIsLoading(true);
        
//         // Get current user and their role
//         const user = await getCurrentUser();
//         console.log('Current user:', user);

//         // Parse joined_classes
//         let parsedJoinedClasses = [];
//         if (user.joined_classes && Array.isArray(user.joined_classes)) {
//             parsedJoinedClasses = user.joined_classes
//                 .filter(entry => entry) // Remove empty entries
//                 .map(entry => {
//                     try {
//                         return typeof entry === 'string' ? JSON.parse(entry) : entry;
//                     } catch (e) {
//                         console.error('Error parsing entry:', entry, e);
//                         return null;
//                     }
//                 })
//                 .filter(entry => entry !== null); // Remove failed parses
//         }

//         // Update user with parsed joined_classes
//         user.joined_classes = parsedJoinedClasses;
//         setCurrentUser(user);

//         // Get classes
//         const userClasses = await getUserClasses();
//         setClasses(userClasses);

//         // Set enrollment status
//         if (user && user.role === 'student') {
//             const statusObj = {};
//             parsedJoinedClasses.forEach(classData => {
//                 if (classData && classData.class_id) {
//                     statusObj[classData.class_id] = classData.status;
//                 }
//             });
//             console.log('Setting enrollment status:', statusObj);
//             setEnrollmentStatus(statusObj);
//         }
//     } catch (error) {
//         console.error('Error loading data:', error);
//         Alert.alert('Error', 'Failed to load data');
//     } finally {
//         setIsLoading(false);
//     }
// };

const loadUserAndClasses = async () => {
  try {
      setIsLoading(true);
      
      // Get current user and their role
      const user = await getCurrentUser();
      console.log('Current user:', user);
      setCurrentUser(user);

      // Get classes
      const userClasses = await getUserClasses();
      setClasses(userClasses);

      // Set enrollment status for students
      if (user && user.role === 'student') {
          const statusObj = {};
          
          // Check each class's students array for the current user's status
          userClasses.forEach(classItem => {
              if (classItem.students && Array.isArray(classItem.students)) {
                  const studentEntry = classItem.students.find(studentStr => {
                      try {
                          const student = JSON.parse(studentStr);
                          return student.student_id === user.$id;
                      } catch (e) {
                          console.error('Error parsing student:', e);
                          return false;
                      }
                  });

                  if (studentEntry) {
                      try {
                          const parsedStudent = JSON.parse(studentEntry);
                          statusObj[classItem.class_id] = parsedStudent.status;
                      } catch (e) {
                          console.error('Error parsing student entry:', e);
                      }
                  }
              }
          });
          
          console.log('Setting enrollment status:', statusObj);
          setEnrollmentStatus(statusObj);
      }
  } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
  } finally {
      setIsLoading(false);
  }
};


// const handleEnroll = async (classItem) => {
  //   console.log('Starting handleEnroll for:', classItem);
    
  //   if (!currentUser) {
  //     console.log('No current user found');
  //     Alert.alert('Error', 'Please log in first');
  //     return;
  //   }

  //   try {
  //     console.log('Current user:', currentUser);
      
  //     // Call the enrollInClass function
  //     await enrollInClass(classItem, currentUser);
      
  //     // Update local enrollment status
  //     setEnrollmentStatus(prev => ({
  //       ...prev,
  //       [classItem.class_id]: 'pending'
  //     }));

  //     Alert.alert('Success', 'Enrollment request sent');
      
  //     // Reload data
  //     console.log('Reloading data...');
  //     await loadUserAndClasses();
      
  //   } catch (error) {
  //     console.error('Error in handleEnroll:', error);
  //     Alert.alert('Error', error.message || 'Failed to enroll in class');
  //   }
  // };

  // const loadUserAndClasses = async () => {
  //   try {
  //     setIsLoading(true);
      
  //     // Get current user and their role
  //     const user = await getCurrentUser();
  //     console.log('Current user:', user);
  //     setCurrentUser(user);

  //     // Get classes
  //     const userClasses = await getUserClasses();
  //     setClasses(userClasses);

  //     // Check enrollment status if user is a student
  //     if (user && user.role === 'student') {
  //       const statusObj = {};
        
  //       // Get enrollment status from user's joined_classes
  //       if (user.joined_classes && Array.isArray(user.joined_classes)) {
  //         user.joined_classes.forEach(classData => {
  //           try {
  //             let parsedClass;
  //             if (typeof classData === 'string') {
  //               // Handle nested JSON string
  //               parsedClass = JSON.parse(classData);
  //               // Check if it's an array and take the first item
  //               if (Array.isArray(parsedClass)) {
  //                 parsedClass = parsedClass[0];
  //               }
  //             } else {
  //               parsedClass = classData;
  //             }
              
  //             console.log('Parsed class data:', parsedClass);
  //             if (parsedClass && parsedClass.class_id) {
  //               statusObj[parsedClass.class_id] = parsedClass.status;
  //             }
  //           } catch (error) {
  //             console.log('Error parsing joined class:', error);
  //             console.log('Problematic class data:', classData);
  //           }
  //         });
  //       }
        
  //       console.log('Final enrollment status:', statusObj);
  //       setEnrollmentStatus(statusObj);
  //     }
  //   } catch (error) {
  //     console.error('Error loading data:', error);
  //     Alert.alert('Error', 'Failed to load data');
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // const handleEnroll = async (classItem) => {
  //   console.log('Starting handleEnroll for:', classItem);
  //   console.log('Current enrollment status:', enrollmentStatus);
    
  //   if (!currentUser) {
  //     console.log('No current user found');
  //     Alert.alert('Error', 'Please log in first');
  //     return;
  //   }

  //   try {
  //     console.log('Current user:', currentUser);
      
  //     // Call the enrollInClass function
  //     await enrollInClass(classItem, currentUser);
      
  //     // Immediately update local enrollment status
  //     setEnrollmentStatus(prev => {
  //       const newStatus = {
  //         ...prev,
  //         [classItem.class_id]: 'pending'
  //       };
  //       console.log('Updated enrollment status:', newStatus);
  //       return newStatus;
  //     });

  //     Alert.alert('Success', 'Enrollment request sent');
      
  //     // Reload data
  //     console.log('Reloading data...');
  //     await loadUserAndClasses();
      
  //   } catch (error) {
  //     console.error('Error in handleEnroll:', error);
  //     Alert.alert('Error', error.message || 'Failed to enroll in class');
  //   }
  // };

  const handleEnroll = async (classItem) => {
    console.log('Starting handleEnroll for:', classItem);
    
    if (!currentUser) {
        console.log('No current user found');
        Alert.alert('Error', 'Please log in first');
        return;
    }

    try {
        console.log('Current user:', currentUser);
        
        // Call the enrollInClass function
        const result = await enrollInClass(classItem, currentUser);
        console.log('Enrollment result:', result);
        
        // Update local enrollment status
        setEnrollmentStatus(prev => {
            const newStatus = {
                ...prev,
                [classItem.class_id]: 'pending'
            };
            console.log('Updated local enrollment status:', newStatus);
            return newStatus;
        });

        // Update current user state with new joined_classes
        setCurrentUser(result.userUpdate);

        Alert.alert('Success', 'Enrollment request sent');
        
        // Reload data
        console.log('Reloading data...');
        await loadUserAndClasses();
        
    } catch (error) {
        console.error('Error in handleEnroll:', error);
        Alert.alert('Error', error.message || 'Failed to enroll in class');
    }
};

  const handleCreateClass = async () => {
    console.log('Starting handleCreateClass');
    if (!className.trim()) {
      Alert.alert('Error', 'Please enter a class name');
      return;
    }
  
    try {
      setIsSubmitting(true);
      console.log('Creating class with name:', className);
      
      const newClass = await createClass(className);
      console.log('Class created:', newClass);
      
      setClassName('');
      setShowForm(false);
      
      console.log('Reloading classes...');
      await loadUserAndClasses();
      
      Alert.alert('Success', 'Class created successfully');
    } catch (error) {
      console.error('Error creating class:', error);
      Alert.alert('Error', 'Failed to create class');
    } finally {
      setIsSubmitting(false);
    }
  };

  // const renderClassItem = (classItem) => {
  //   const isStudent = currentUser?.role === 'student'
  //   const status = enrollmentStatus[classItem.class_id]

  //   return (
  //     <TouchableOpacity 
  //       key={classItem.$id}
  //       onPress={() => handleClassPress(classItem)}
  //       className="bg-primary rounded-lg overflow-hidden"
  //       style={{ width: itemWidth }}
  //     >
  //       <Image 
  //         source={images.class_icon}
  //         style={{ width: '100%', height: itemWidth }}
  //         resizeMode="cover"
  //       />
  //       <View className="p-2">
  //         <View className="flex-row justify-between items-center">
  //           <Text className="text-white text-lg flex-1">
  //             {classItem.class_name}
  //           </Text>
  //           {isStudent && (
  //             status === 'pending' ? (
  //               <View className="bg-yellow-500 px-2 py-1 rounded">
  //                 <Text className="text-white text-sm">Pending</Text>
  //               </View>
  //             ) : status === 'approved' ? (
  //               <View className="bg-green-500 px-2 py-1 rounded">
  //                 <Text className="text-white text-sm">Enrolled</Text>
  //               </View>
  //             ) : (
  //               <TouchableOpacity 
  //                 onPress={() => handleEnroll(classItem)}
  //                 className="bg-blue-500 px-2 py-1 rounded"
  //               >
  //                 <Text className="text-white text-sm">Enroll</Text>
  //               </TouchableOpacity>
  //             )
  //           )}
  //         </View>
  //       </View>
  //     </TouchableOpacity>
  //   )
  // }

  const renderClassItem = (classItem) => {
    const isStudent = currentUser?.role === 'student';
    const status = enrollmentStatus[classItem.class_id];
    console.log(`Rendering class ${classItem.class_name} with status:`, status);

    return (
      <TouchableOpacity 
        key={classItem.$id}
        onPress={() => handleClassPress(classItem)}
        className="bg-primary rounded-lg overflow-hidden"
        style={{ width: itemWidth }}
      >
        <Image 
          source={images.class_icon}
          style={{ width: '100%', height: itemWidth }}
          resizeMode="cover"
        />
        <View className="p-2">
          <View className="flex-row justify-between items-center">
            <Text className="text-white text-lg flex-1">
              {classItem.class_name}
            </Text>
            {isStudent && (
              status === 'pending' ? (
                // Non-clickable pending status
                <View className="bg-yellow-500 px-2 py-1 rounded opacity-70">
                  <Text className="text-white text-sm">Pending</Text>
                </View>
              ) : status === 'approved' ? (
                // Non-clickable approved status
                <View className="bg-green-500 px-2 py-1 rounded opacity-70">
                  <Text className="text-white text-sm">Enrolled</Text>
                </View>
              ) : (
                // Clickable enroll button
                <TouchableOpacity 
                  onPress={() => handleEnroll(classItem)}
                  className="bg-blue-500 px-2 py-1 rounded"
                  activeOpacity={0.7}
                >
                  <Text className="text-white text-sm">Enroll</Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };


  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView>
        <View className='px-4 my-6'>
          <View className="flex-row justify-between items-center mb-8">
            <Text className='text-2xl text-white font-semibold'>My Classes</Text>
            {currentUser?.role === 'teacher' && (
              <TouchableOpacity 
                onPress={() => setShowForm(!showForm)}
                className="bg-secondary px-4 py-2 rounded-lg"
              >
                <Text className="text-white">
                  {showForm ? 'Cancel' : 'Create Class'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {showForm && currentUser?.role === 'teacher' && (
            <View className="mb-8">
              <FormField 
                title="Class Name"
                value={className}
                handleChangeText={setClassName}
                placeholder="Enter class name"
              />
              <CustomButton 
                title='Create Class' 
                handlePress={handleCreateClass}
                containerStyle="mt-4" 
                isLoading={isSubmitting}
              />
            </View>
          )}

          {isLoading ? (
            <Text className="text-white text-center">Loading classes...</Text>
          ) : (
            <View className="flex-row flex-wrap gap-2 justify-between">
              {classes.map(renderClassItem)}
            </View>
          )}

          {!isLoading && classes.length === 0 && (
            <Text className="text-white text-center">
              {currentUser?.role === 'teacher' 
                ? 'No classes created yet. Create your first class!'
                : 'No classes available yet.'}
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default Home