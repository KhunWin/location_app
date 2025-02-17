import { View, Text, ScrollView, Alert, Image, TouchableOpacity, Dimensions } from 'react-native'
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import FormField from '@/components/FormField'
import CustomButton from '@/components/CustomButton'
import { createClass, getCurrentUser, getUserClasses, uploadFile } from '../../lib/appwrite'
import { images } from '@/constants'
import * as Location from 'expo-location';

const Create = () => {
  const [className, setClassName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [classes, setClasses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const screenWidth = Dimensions.get('window').width
  const itemWidth = (screenWidth - 48) / 2
  const [isUploading, setIsUploading] = useState(false);


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
      
      // Get current location
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const locationCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };
      
      console.log('Creating class with name and location:', {
        className,
        location: locationCoords
      });
      
      const newClass = await createClass(className, locationCoords);
      console.log('Class created:', newClass);
      
      setClassName('');
      
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

  //for creating a map
  // const handleMapPress = () => {
  //   router.push('/map');
  // };

  // Add this new function
  // const handleFileUpload = async () => {
  //   try {
  //     setIsUploading(true);
      
  //     // Pick a document
  //     const result = await DocumentPicker.getDocumentAsync({
  //       type: '*/*', // Allow all file types
  //       copyToCacheDirectory: true
  //     });

  //     if (result.type === 'success') {
  //       const file = {
  //         uri: result.uri,
  //         name: result.name,
  //         type: result.mimeType
  //       };

  //       // Upload file with current user ID
  //       const uploadResult = await uploadFile(file, currentUser.$id);
  //       console.log('Upload successful:', uploadResult);
        
  //       Alert.alert('Success', 'File uploaded successfully');
  //     }
  //   } catch (error) {
  //     console.error('Error uploading file:', error);
  //     Alert.alert('Error', 'Failed to upload file');
  //   } finally {
  //     setIsUploading(false);
  //   }
  // };

  const handleUploadPress = () => {
    router.push('/fileupload');
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

          {/* <CustomButton 
            title="View Classes on Map" 
            handlePress={handleMapPress}
            containerStyle="mt-4" 
          />
          <CustomButton 
            title="Upload File" 
            handlePress={handleUploadPress}
            containerStyle="mt-4" 
          /> */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default Create;



// // Add these to your imports
// import { View, Text, ScrollView, Alert, Image, TouchableOpacity, Dimensions } from 'react-native'
// import { router } from 'expo-router';
// import React, { useState, useEffect } from 'react'
// import { SafeAreaView } from 'react-native-safe-area-context'
// import FormField from '@/components/FormField'
// import CustomButton from '@/components/CustomButton'
// import { createClass, getCurrentUser, getUserClasses, uploadFile } from '../../lib/appwrite'
// import { images } from '@/constants'

// import * as Location from 'expo-location';

// const Create = () => {
//   // Add these missing state variables
//   const [className, setClassName] = useState('');
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);
//   const [currentUser, setCurrentUser] = useState(null);
//   const [classLocation, setClassLocation] = useState(null);
//   const [isGettingLocation, setIsGettingLocation] = useState(false);
//   const [classes, setClasses] = useState([]); // Add this
//   const screenWidth = Dimensions.get('window').width; // Add this
//   const itemWidth = (screenWidth - 48) / 2; // Add this

//   useEffect(() => {
//     loadUserAndClasses();
//   }, []);

//   const loadUserAndClasses = async () => {
//     try {
//       setIsLoading(true);
//       const user = await getCurrentUser();
//       console.log('Current user data:', user);
//       setCurrentUser(user);
  
//       if (user.role === 'student') {
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
        
//         const allClasses = await getUserClasses();
//         const approvedClasses = allClasses.filter(cls => {
//           const isApproved = joinedClasses.some(joined => 
//             joined.class_id === cls.class_id && joined.status === 'approved'
//           );
//           return isApproved;
//         });
        
//         setClasses(approvedClasses);
//       }
//     } catch (error) {
//       console.error('Error in loadUserAndClasses:', error);
//       Alert.alert('Error', 'Failed to load classes');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Add these missing functions
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
//         </View>
//       </TouchableOpacity>
//     );
//   };

//   // Remove duplicate state declarations and continue with getCurrentLocation function
//   const getCurrentLocation = async () => {
//     try {
//       setIsGettingLocation(true);
      
//       let { status } = await Location.requestForegroundPermissionsAsync();
//       if (status !== 'granted') {
//         Alert.alert('Permission denied', 'Location permission is required');
//         return;
//       }

//       const location = await Location.getCurrentPositionAsync({});
//       console.log('Retrieved current location:', {
//         latitude: location.coords.latitude,
//         longitude: location.coords.longitude
//       });

//       setClassLocation({
//         latitude: location.coords.latitude,
//         longitude: location.coords.longitude
//       });
//       console.log('Class location state updated:', classLocation);
//     } catch (error) {
//       console.error('Error getting location:', error);
//       Alert.alert('Error', 'Failed to get location');
//     } finally {
//       setIsGettingLocation(false);
//     }
//   };

//     //for creating a map
//   const handleMapPress = () => {
//     router.push('/map');
//   };
  

//     const handleUploadPress = () => {
//     router.push('/fileupload');
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

//   // Modify handleCreateClass
//   const handleCreateClass = async () => {
//     if (!className.trim()) {
//       Alert.alert('Error', 'Please enter a class name');
//       return;
//     }

//     if (!classLocation || !classLocation.latitude || !classLocation.longitude) {
//       Alert.alert('Error', 'Please set class location');
//       return;
//     }

//     try {
//       setIsSubmitting(true);
//       console.log('Attempting to create class with:', {
//         className,
//         location: {
//           latitude: classLocation.latitude,
//           longitude: classLocation.longitude
//         },
//         timestamp: new Date().toISOString()
//       });
      
//       const newClass = await createClass(className, {
//         latitude: classLocation.latitude,
//         longitude: classLocation.longitude
//       });

//       console.log('Class creation response:', {
//         classId: newClass.$id,
//         className: newClass.class_name,
//         location: newClass.class_location,
//         createdAt: newClass.$createdAt
//       });
      
//       setClassName('');
//       setClassLocation(null);
      
//       router.push({
//         pathname: '/home',
//         params: { refresh: Date.now() }
//       });
      
//       Alert.alert('Success', 'Class created successfully');
//     } catch (error) {
//       console.error('Error creating class:', error);
//       Alert.alert('Error', 'Failed to create class');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   // In your return statement, add the location button before the Create Class button
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

//           {classLocation && (
//             <View className="mt-4">
//               <Text className="text-white">
//                 Location: {classLocation.latitude.toFixed(6)}, {classLocation.longitude.toFixed(6)}
//               </Text>
//             </View>
//           )}

//           <CustomButton 
//             title={classLocation ? "Update Location" : "Set Class Location"}
//             handlePress={getCurrentLocation}
//             containerStyle="mt-4"
//             isLoading={isGettingLocation}
//           />

//           <CustomButton 
//             title="Create Class" 
//             handlePress={handleCreateClass}
//             containerStyle="mt-7" 
//             isLoading={isSubmitting}
//           />

//           <CustomButton 
//             title="View Classes on Map" 
//             handlePress={handleMapPress}
//             containerStyle="mt-4" 
//           />
//           <CustomButton 
//             title="Upload File" 
//             handlePress={handleUploadPress}
//             containerStyle="mt-4" 
//           />
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// };
// export default Create;