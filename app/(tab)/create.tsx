// import { View, Text, ScrollView, Alert } from 'react-native'
// import { router } from 'expo-router';
// import React, { useState } from 'react'
// import { SafeAreaView } from 'react-native-safe-area-context'
// import FormField from '@/components/FormField'
// import CustomButton from '@/components/CustomButton'
// import { createClass } from '../../lib/appwrite'

// const CreateClass = () => {
//   const [className, setClassName] = useState('')
//   const [isSubmitting, setIsSubmitting] = useState(false)

//   const handleCreateClass = async () => {
//     if (!className) {
//       Alert.alert('Error', 'Class name is required')
//       return
//     }

//     setIsSubmitting(true)
//     try {
//       await createClass(className)
//       setClassName('') // Reset form
//       // router.replace('/home');
//       router.push({
//         pathname: '/home',
//         params: { refresh: Date.now() } // Add a timestamp to force refresh
//       });
//       Alert.alert('Success', 'Class created successfully')
      
//     } catch (error) {
//       Alert.alert('Error', error.message)
//     } finally {
//       setIsSubmitting(false)
//     }
//   }

//   return (
//     <SafeAreaView className="bg-primary h-full">
//       <ScrollView>
//         <View className='W-full px-4 my-6'>
//           <Text className='text-2xl text-white font-psemibold mb-8'>Create Class</Text>

//           <FormField 
//             title="Class Name"
//             value={className}
//             handleChangeText={setClassName}
//             placeholder="Enter class name"
//           />

//           <CustomButton 
//             title='Create Class' 
//             handlePress={handleCreateClass}
//             containerStyle="mt-7" 
//             isLoading={isSubmitting}
//           />
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   )
// }

// export default CreateClass

///it worked for student only, but for teacher it didn't work

// import { View, Text, ScrollView, Alert, Image, TouchableOpacity, Dimensions } from 'react-native'
// import { router } from 'expo-router';
// import React, { useState, useEffect } from 'react'
// import { SafeAreaView } from 'react-native-safe-area-context'
// import FormField from '@/components/FormField'
// import CustomButton from '@/components/CustomButton'
// import { createClass, getCurrentUser, getUserClasses } from '../../lib/appwrite'
// import { images } from '@/constants'

// const Create = () => {
//   const [className, setClassName] = useState('')
//   const [isSubmitting, setIsSubmitting] = useState(false)
//   const [currentUser, setCurrentUser] = useState(null)
//   const [classes, setClasses] = useState([])
//   const [isLoading, setIsLoading] = useState(true)
//   const screenWidth = Dimensions.get('window').width
//   const itemWidth = (screenWidth - 48) / 2

//   useEffect(() => {
//     loadUserAndClasses();
//   }, []);


//   const loadUserAndClasses = async () => {
//     try {
//       setIsLoading(true);
      
//       // Get current user and their role
//       const user = await getCurrentUser();
//       console.log('Current user data:', user);
//       setCurrentUser(user);
  
//       if (user.role === 'student') {
//         // Parse joined classes from user document
//         console.log('Parsing joined classes:', user.joined_classes);
        
//         const joinedClasses = user.joined_classes.map(classStr => {
//           try {
//             const parsed = JSON.parse(classStr);
//             console.log('Parsed class entry:', parsed);
//             return parsed;
//           } catch (e) {
//             console.error('Error parsing class:', e);
//             return null;
//           }
//         }).filter(Boolean);
        
//         console.log('All joined classes after parsing:', joinedClasses);
        
//         // Get all classes from database
//         const allClasses = await getUserClasses();
//         console.log('All classes from database:', allClasses);
  
//         // Filter for only approved classes
//         const approvedClasses = allClasses.filter(cls => {
//           const isApproved = joinedClasses.some(joined => 
//             joined.class_id === cls.class_id && joined.status === 'approved' // Changed from cls.$id to cls.class_id
//           );
//           console.log(`Class ${cls.class_name} (${cls.class_id}) approved status:`, isApproved);
//           return isApproved;
//         });
  
//         console.log('Final approved classes:', approvedClasses);
//         setClasses(approvedClasses);
//       }
//     } catch (error) {
//       console.error('Error in loadUserAndClasses:', error);
//       Alert.alert('Error', 'Failed to load classes');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleClassPress = (classItem) => {
//     console.log('Navigating to class:', classItem);
//     router.push({
//       pathname: '/bookmark',
//       params: { 
//         className: classItem.class_name || classItem.name,
//         classId: classItem.$id
//       }
//     });
//   };

//   const renderClassItem = (classItem) => {
//     console.log('Rendering class item:', classItem);
//     return (
//       <TouchableOpacity 
//         key={classItem.$id}
//         onPress={() => handleClassPress(classItem)}
//         className="bg-primary rounded-lg overflow-hidden mb-4"
//         style={{ width: itemWidth }}
//       >
//         <Image 
//           source={images.class_icon}
//           style={{ width: '100%', height: itemWidth }}
//           resizeMode="cover"
//         />
//         <View className="p-2">
//           <Text className="text-white text-lg">
//             {classItem.class_name || classItem.name}
//           </Text>
//           {/* <View className="bg-green-500 px-2 py-1 rounded mt-2 opacity-70">
//             <Text className="text-white text-sm">Enrolled</Text>
//           </View> */}
//         </View>
//       </TouchableOpacity>
//     );
//   };

//   if (isLoading) {
//     return (
//       <SafeAreaView className="bg-primary h-full">
//         <View className="flex-1 justify-center items-center">
//           <Text className="text-white">Loading...</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   // For students, show enrolled classes
//   if (currentUser?.role === 'student') {
//     console.log('Rendering student view with classes:', classes);
//     return (
//       <SafeAreaView className="bg-primary h-full">
//         <ScrollView>
//           <View className="px-4 my-6">
//             <Text className="text-2xl text-white font-semibold mb-8">
//               My Enrolled Classes
//             </Text>

//             {classes.length === 0 ? (
//               <Text className="text-white text-center">
//                 You haven't enrolled in any classes yet.
//               </Text>
//             ) : (
//               <View className="flex-row flex-wrap gap-2 justify-between">
//                 {classes.map(renderClassItem)}
//               </View>
//             )}
//           </View>
//         </ScrollView>
//       </SafeAreaView>
//     );
//   }

//   // For teachers, show create class form
//   console.log('Rendering teacher view');
//   return (
//     <SafeAreaView className="bg-primary h-full">
//       <ScrollView>
//         <View className="px-4 my-6">
//           <Text className="text-2xl text-white font-semibold mb-8">
//             Create Class
//           </Text>

//           <FormField 
//             title="Class Name"
//             value={className}
//             handleChangeText={setClassName}
//             placeholder="Enter class name"
//           />

//           <CustomButton 
//             title="Create Class" 
//             handlePress={handleCreateClass}
//             containerStyle="mt-7" 
//             isLoading={isSubmitting}
//           />
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// export default Create;


import { View, Text, ScrollView, Alert, Image, TouchableOpacity, Dimensions } from 'react-native'
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import FormField from '@/components/FormField'
import CustomButton from '@/components/CustomButton'
import { createClass, getCurrentUser, getUserClasses } from '../../lib/appwrite'
import { images } from '@/constants'

const Create = () => {
  const [className, setClassName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [classes, setClasses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const screenWidth = Dimensions.get('window').width
  const itemWidth = (screenWidth - 48) / 2

  useEffect(() => {
    loadUserAndClasses();
  }, []);

  const loadUserAndClasses = async () => {
    try {
      setIsLoading(true);
      
      const user = await getCurrentUser();
      console.log('Current user data:', user);
      setCurrentUser(user);
  
      if (user.role === 'student') {
        console.log('Parsing joined classes:', user.joined_classes);
        
        const joinedClasses = user.joined_classes.map(classStr => {
          try {
            const parsed = JSON.parse(classStr);
            console.log('Parsed class entry:', parsed);
            return parsed;
          } catch (e) {
            console.error('Error parsing class:', e);
            return null;
          }
        }).filter(Boolean);
        
        console.log('All joined classes after parsing:', joinedClasses);
        
        const allClasses = await getUserClasses();
        console.log('All classes from database:', allClasses);
  
        const approvedClasses = allClasses.filter(cls => {
          const isApproved = joinedClasses.some(joined => 
            joined.class_id === cls.class_id && joined.status === 'approved'
          );
          console.log(`Class ${cls.class_name} (${cls.class_id}) approved status:`, isApproved);
          return isApproved;
        });
  
        console.log('Final approved classes:', approvedClasses);
        setClasses(approvedClasses);
      }
    } catch (error) {
      console.error('Error in loadUserAndClasses:', error);
      Alert.alert('Error', 'Failed to load classes');
    } finally {
      setIsLoading(false);
    }
  };

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
      
      // Navigate back to home with refresh parameter
      router.push({
        pathname: '/home',
        params: { refresh: Date.now() }
      });
      
      Alert.alert('Success', 'Class created successfully');
    } catch (error) {
      console.error('Error creating class:', error);
      Alert.alert('Error', 'Failed to create class');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClassPress = (classItem) => {
    console.log('Navigating to class:', classItem);
    router.push({
      pathname: '/bookmark',
      params: { 
        className: classItem.class_name || classItem.name,
        classId: classItem.$id
      }
    });
  };

  const renderClassItem = (classItem) => {
    console.log('Rendering class item:', classItem);
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
          <Text className="text-white text-lg">
            {classItem.class_name || classItem.name}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="bg-primary h-full">
        <View className="flex-1 justify-center items-center">
          <Text className="text-white">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (currentUser?.role === 'student') {
    console.log('Rendering student view with classes:', classes);
    return (
      <SafeAreaView className="bg-primary h-full">
        <ScrollView>
          <View className="px-4 my-6">
            <Text className="text-2xl text-white font-semibold mb-8">
              My Enrolled Classes
            </Text>

            {classes.length === 0 ? (
              <Text className="text-white text-center">
                You haven't enrolled in any classes yet.
              </Text>
            ) : (
              <View className="flex-row flex-wrap gap-2 justify-between">
                {classes.map(renderClassItem)}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  console.log('Rendering teacher view');
  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView>
        <View className="px-4 my-6">
          <Text className="text-2xl text-white font-semibold mb-8">
            Create Class
          </Text>

          <FormField 
            title="Class Name"
            value={className}
            handleChangeText={setClassName}
            placeholder="Enter class name"
          />

          <CustomButton 
            title="Create Class" 
            handlePress={handleCreateClass}
            containerStyle="mt-7" 
            isLoading={isSubmitting}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default Create;