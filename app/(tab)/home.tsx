import { View, Text, ScrollView, Alert, Image, TouchableOpacity, Dimensions } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import FormField from '@/components/FormField'
import CustomButton from '@/components/CustomButton'
import { createClass, getUserClasses, getCurrentUser, enrollInClass, databases, appwriteConfig } from '../../lib/appwrite'
import { images } from '@/constants'

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
  const { refresh } = useLocalSearchParams();

  useEffect(() => {
    loadUserAndClasses()
  // }, [])
}, [refresh]); // Add refresh to dependency array

  // const handleClassPress = (classItem) => {
  //   // Navigate to class details page
  //   router.push({
  //     // pathname: `/bookmark`,
  //     pathname: `/myclass`,
  //     params: { className: classItem.class_name,
  //                   classId: classItem.class_id}
  //   });
  // };


  const handleClassPress = (classItem) => {
    const isStudent = currentUser?.role === 'student';
    const status = enrollmentStatus[classItem.class_id];

    if (isStudent) {
      // Only allow enrolled students to view class
      if (status === 'approved') {
        router.push({
          pathname: '/myclass',
          params: { 
            className: classItem.class_name,
            classId: classItem.class_id,
            studentId: currentUser?.$id,
            accountId: currentUser?.accountId,
            student_name: currentUser?.name,
            email: currentUser?.email
          }
        });
      }
      // No action for non-enrolled students
      return;
    }

    // Teacher view
    router.push({
      pathname: '/myclass',
      params: { 
        className: classItem.class_name,
        classId: classItem.class_id
      }
    });
  };

const loadUserAndClasses = async () => {
  try {
    setIsLoading(true);
    
    // Get current user and their role
    const user = await getCurrentUser();
    setCurrentUser(user);

    // Force fresh data fetch from server
    const userClasses = await getUserClasses(true); // Add a parameter to force cache refresh
    // console.log('Fetched classes:', userClasses);
    setClasses(userClasses);

    // Set enrollment status for students
    if (user && user.role === 'student') {
        const statusObj = {};
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
        setEnrollmentStatus(statusObj);
    }
  } catch (error) {
    console.error('Error loading data:', error);
    Alert.alert('Error', 'Failed to load data');
  } finally {
    setIsLoading(false);
  }
};

const handleMapPress = () => {
  router.push('/map');
};

// Make sure handleCreateClass also forces a refresh
const handleCreateClass = async () => {
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
    
    // Force immediate refresh
    await loadUserAndClasses();
    
    Alert.alert('Success', 'Class created successfully');
  } catch (error) {
    console.error('Error creating class:', error);
    Alert.alert('Error', 'Failed to create class');
  } finally {
    setIsSubmitting(false);
  }
};


  //without class schedule crash detection
  // const handleEnroll = async (classItem) => {
  //   console.log('Starting handleEnroll for:', classItem);
    
  //   if (!currentUser) {
  //       console.log('No current user found');
  //       Alert.alert('Error', 'Please log in first');
  //       return;
  //   }

  //   try {
  //       console.log('Current user:', currentUser);
  //       const result = await enrollInClass(classItem, currentUser);
  //       console.log('Enrollment result:', result);
  //       // Update local enrollment status
  //       setEnrollmentStatus(prev => {
  //           const newStatus = {
  //               ...prev,
  //               [classItem.class_id]: 'pending'
  //           };
  //           console.log('Updated local enrollment status:', newStatus);
  //           return newStatus;
  //       });

  //       // Update current user state with new joined_classes
  //       setCurrentUser(result.userUpdate);

  //       Alert.alert('Success', 'Enrollment request sent');
        
  //       // Reload data
  //       console.log('Reloading data...');
  //       await loadUserAndClasses();
        
  //   } catch (error) {
  //       console.error('Error in handleEnroll:', error);
  //       Alert.alert('Error', error.message || 'Failed to enroll in class');
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
        
        // Check for schedule conflicts
        if (currentUser.role === 'student' && classItem.class_schedule && classItem.class_schedule[0]) {
            const newClassSchedule = JSON.parse(classItem.class_schedule[0]);
            
            // Get all enrolled classes with approved status
            const enrolledClasses = classes.filter(cls => 
                enrollmentStatus[cls.class_id] === 'approved' && 
                cls.class_schedule && 
                cls.class_schedule[0]
            );
            
            // Check for conflicts
            const conflicts = [];
            
            enrolledClasses.forEach(enrolledClass => {
                const enrolledSchedule = JSON.parse(enrolledClass.class_schedule[0]);
                
                // Compare each day's schedule
                Object.entries(newClassSchedule).forEach(([day, newTimeSlot]) => {
                    if (!newTimeSlot) return; // Skip empty time slots
                    
                    const enrolledTimeSlot = enrolledSchedule[day];
                    if (!enrolledTimeSlot) return; // No class on this day
                    
                    // Parse time ranges (assuming format "HH-HH")
                    const [newStart, newEnd] = newTimeSlot.split('-').map(Number);
                    const [enrolledStart, enrolledEnd] = enrolledTimeSlot.split('-').map(Number);
                    
                    // Check for overlap
                    if ((newStart < enrolledEnd && newEnd > enrolledStart)) {
                        conflicts.push({
                            className: enrolledClass.class_name,
                            day,
                            time: enrolledTimeSlot
                        });
                    }
                });
            });
            
            if (conflicts.length > 0) {
                const conflictMessages = conflicts.map(c => 
                    `${c.className} (${c.day}: ${c.time})`
                ).join('\n');
                
                Alert.alert(
                    'Schedule Conflict',
                    `You cannot enroll in this class due to schedule conflicts with:\n\n${conflictMessages}`,
                    [{ text: 'OK' }]
                );
                return;
            }
        }
        
        // Call the enrollInClass function if no conflicts
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

  const renderClassItem = (classItem) => {
    const isStudent = currentUser?.role === 'student';
    const status = enrollmentStatus[classItem.class_id];

    return (
      <TouchableOpacity 
        key={classItem.$id}
        onPress={() => handleClassPress(classItem)}
        className="bg-primary rounded-lg overflow-hidden mb-4"
        style={{ width: itemWidth }}
      >
        <Image 
          source={images.class_icon}
          style={{ width: '100%', height: itemWidth }}
          resizeMode="cover"
        />
        <View className="p-2">
          {isStudent && (
            <>
              {classItem.class_address && classItem.class_address[0] && (
                <View className="mb-2">
                  <Text className="text-gray-300 text-sm">
                    {`Room ${JSON.parse(classItem.class_address[0]).room}, Floor ${JSON.parse(classItem.class_address[0]).floor}, ${JSON.parse(classItem.class_address[0]).building},${JSON.parse(classItem.class_address[0]).street}`}
                  </Text>
                </View>
              )}
              {classItem.class_schedule && classItem.class_schedule[0] && (
                <View className="mb-2">
                  <Text className="text-gray-300 text-sm">
                    {Object.entries(JSON.parse(classItem.class_schedule[0]))
                      .filter(([_, time]) => time)
                      .map(([day, time]) => `${day.slice(0,3)}: ${time}`)
                      .join(', ')}
                  </Text>
                </View>
              )}
            </>
          )}
          <View className="flex-row justify-between items-center">
            <Text className="text-white text-lg flex-1">
              {classItem.class_name}
            </Text>
            {isStudent && (
              status === 'pending' ? (
                <View className="bg-yellow-500 px-2 py-1 rounded opacity-70">
                  <Text className="text-white text-sm">Pending</Text>
                </View>
              ) : status === 'approved' ? (
                <View className="bg-green-500 px-2 py-1 rounded opacity-70">
                  <Text className="text-white text-sm">Enrolled</Text>
                </View>
              ) : (
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

          <TouchableOpacity 
              onPress={handleMapPress}
              className="bg-secondary px-4 py-2 rounded-lg"
            >
              <Text className="text-white">View Classes on Map</Text>
            </TouchableOpacity>
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