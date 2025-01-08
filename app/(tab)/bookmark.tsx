// import { View, Text, ScrollView } from 'react-native'
// import React, { useState } from 'react'
// import { SafeAreaView } from 'react-native-safe-area-context'
// import CustomButton from '@/components/CustomButton'
// import { useLocalSearchParams, router } from 'expo-router'

// const Bookmark = () => {
//   const { className, classId  } = useLocalSearchParams()
//   const [isGenerating, setIsGenerating] = useState(false)

//   const handleViewClasses = () => {
//     // router.push('/pages/ViewAttendance')
//     router.push({
//       pathname: '/pages/ViewEnrolledStudent',
//       // params: { 
//       //     // classId: "677138d30025b530a07e",  // Use the _id from classCollectionId
//       //     classId: "677138d30025a8c56eb8",
//       //     className: "Class I"
//       // }
//       params: { 
//         classId: classId,        // Use the received classId
//         className: className      // Use the received className
//     }
//   })

//   }


//   const handleGenerateCode = async () => {
//     setIsGenerating(true)
//     try {
//       // Redirect to CreateSession page with class information
//       router.push({
//         pathname: '/pages/CreateSession',
//         params: {
//           classId: classId,
//           className: className
//         }
//       })
//     } catch (error) {
//       console.log('Error navigating to CreateSession:', error)
//     } finally {
//       setIsGenerating(false)
//     }
//   }

//   return (
//     <SafeAreaView className="bg-primary h-full">
//       <View className="flex-1 px-4">
//         <Text className='text-2xl text-white font-psemibold mb-8 text-center mt-6'>
//           {className || 'Class Name'}
//         </Text>

//         {/* Button Container - Positioned at bottom */}
//         <View className="mt-auto mb-6 gap-4">
//           <CustomButton 
//             title='View Enrolled Students' 
//             handlePress={handleViewClasses}
//             containerStyle="bg-secondary"
//           />

//           <CustomButton 
//             title='Generate Attendance Code' 
//             handlePress={handleGenerateCode}
//             isLoading={isGenerating}
//           />

//         </View>
//       </View>
//     </SafeAreaView>
//   )
// }

// export default Bookmark


// import { View, Text, ScrollView, Alert } from 'react-native'
// import React, { useState, useEffect } from 'react'
// import { SafeAreaView } from 'react-native-safe-area-context'
// import CustomButton from '@/components/CustomButton'
// import FormField from '@/components/FormField'
// import { useLocalSearchParams, router } from 'expo-router'
// import { getCurrentUser, submitAttendance } from '../../lib/appwrite'
// import * as Location from 'expo-location';


// const Bookmark = () => {
//   const { className, classId } = useLocalSearchParams()
//   const [isGenerating, setIsGenerating] = useState(false)
//   const [currentUser, setCurrentUser] = useState(null)
//   const [attendanceCode, setAttendanceCode] = useState('')
//   const [isSubmitting, setIsSubmitting] = useState(false)

//   // Load current user when component mounts
//   useEffect(() => {
//     loadCurrentUser()
//     requestLocationPermission()
//   }, [])

//   const loadCurrentUser = async () => {
//     try {
//       const user = await getCurrentUser()
//       console.log('Current user in Bookmark:', user)
//       setCurrentUser(user)
//     } catch (error) {
//       console.error('Error loading user:', error)
//     }
//   }

//   const handleViewClasses = () => {
//     router.push({
//       pathname: '/pages/ViewEnrolledStudent',
//       params: { 
//         classId: classId,
//         className: className
//       }
//     })
//   }

//   const requestLocationPermission = async () => {
//     const { status } = await Location.requestForegroundPermissionsAsync();
//     if (status !== 'granted') {
//         console.log('Location permission denied');
//         return false;
//     }
//     return true;
// };

//   const handleGenerateCode = async () => {
//     setIsGenerating(true)
//     try {
//       router.push({
//         pathname: '/pages/CreateSession',
//         params: {
//           classId: classId,
//           className: className
//         }
//       })
//     } catch (error) {
//       console.log('Error navigating to CreateSession:', error)
//     } finally {
//       setIsGenerating(false)
//     }
//   }

//   const getCurrentLocation = async () => {
//     try {
//       const { status } = await Location.requestForegroundPermissionsAsync();
//       if (status !== 'granted') {
//         console.log('Permission denied');
//         return null;
//       }
  
//       const location = await Location.getCurrentPositionAsync({});
//       return {
//         latitude: location.coords.latitude,
//         longitude: location.coords.longitude
//       };
//     } catch (error) {
//       console.error('Error getting location:', error);
//       return null;
//     }
//   };

//   // const handleCheckIn = () => {
//   //   console.log('Check-in attempted with code:', attendanceCode)
    
//   //   if (!attendanceCode.trim()) {
//   //     console.log('Attendance code is empty')
//   //     Alert.alert('Error', 'Please enter an attendance code')
//   //     return
//   //   }

//   //   console.log('Processing check-in for:')
//   //   console.log('- User:', currentUser)
//   //   console.log('- Class:', className)
//   //   console.log('- Class ID:', classId)
//   //   console.log('- Attendance Code:', attendanceCode)

//   //   // Reset the input field after successful log
//   //   setAttendanceCode('')
//   // }

//   // In Bookmark.js


//   const handleCheckIn = async () => {
//   if (!attendanceCode.trim()) {
//       Alert.alert('Error', 'Please enter an attendance code');
//       return;
//   }

//   setIsSubmitting(true);
//   try {
//       // Get location permission
//       const hasPermission = await requestLocationPermission();
//       if (!hasPermission) {
//           throw new Error('Location permission is required');
//       }

//       // Get current location
//       const userLocation = await getCurrentLocation();

//       // Submit attendance
//       const result = await submitAttendance(
//           classId,
//           attendanceCode.trim(),
//           currentUser.$id,
//           {
//               latitude: userLocation.coords.latitude,
//               longitude: userLocation.coords.longitude
//           }
//       );

//       // Show result
//       Alert.alert(
//           'Success',
//           `Attendance marked as ${result.status}` +
//           (result.status === 'absent' ? 
//               ` (${Math.round(result.distance)}m from class location)` : 
//               '')
//       );

//       // Clear input
//       setAttendanceCode('');

//   } catch (error) {
//       console.error('Check-in error:', error);
//       Alert.alert('Error', error.message || 'Failed to check in');
//   } finally {
//       setIsSubmitting(false);
//   }
// };

//   return (
//     <SafeAreaView className="bg-primary h-full">
//       <View className="flex-1 px-4">
//         <Text className='text-2xl text-white font-psemibold mb-8 text-center mt-6'>
//           {className || 'Class Name'}
//         </Text>

//         {/* Show different views based on user role */}
//         {currentUser?.role === 'teacher' ? (
//           // Teacher View
//           <View className="mt-auto mb-6 gap-4">
//             <CustomButton 
//               title='View Enrolled Students' 
//               handlePress={handleViewClasses}
//               containerStyle="bg-secondary"
//             />

//             <CustomButton 
//               title='Generate Attendance Code' 
//               handlePress={handleGenerateCode}
//               isLoading={isGenerating}
//             />
//           </View>
//         ) : (
//           // Student View
//           <View className="mt-auto mb-6 gap-4">
//             <FormField 
//               title="Attendance Code"
//               value={attendanceCode}
//               handleChangeText={setAttendanceCode}
//               placeholder="Enter attendance code"
//             />

//             <CustomButton 
//               title='Check In' 
//               handlePress={handleCheckIn}
//               isLoading={isSubmitting}
//               containerStyle="bg-secondary"
//             />
//           </View>
//         )}
//       </View>
//     </SafeAreaView>
//   )
// }

// export default Bookmark


import { View, Text, ScrollView, Alert } from 'react-native'
import React, { useState, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import CustomButton from '@/components/CustomButton'
import FormField from '@/components/FormField'
import { useLocalSearchParams, router } from 'expo-router'
import { getCurrentUser, submitAttendance, parseJoinedClasses } from '../../lib/appwrite'
import * as Location from 'expo-location'

// const Bookmark = () => {
//   const { className, classId } = useLocalSearchParams()
//   const [isGenerating, setIsGenerating] = useState(false)
//   const [currentUser, setCurrentUser] = useState(null)
//   const [attendanceCode, setAttendanceCode] = useState('')
//   const [isSubmitting, setIsSubmitting] = useState(false)

//   // useEffect(() => {
//   //   initializeComponent()
//   // }, [])

//   useEffect(() => {
//     if (!currentUser) {
//         console.log('Current user not loaded yet');
//         return;
//     }
    
//     console.log('Current user loaded:', {
//         userId: currentUser.$id,
//         joined_classes: currentUser.joined_classes
//     });
// }, [currentUser]);


//   const initializeComponent = async () => {
//     try {
//       await loadCurrentUser()
//       await requestLocationPermission()
//     } catch (error) {
//       console.error('Error initializing component:', error)
//     }
//   }

//   const loadCurrentUser = async () => {
//     try {
//       const user = await getCurrentUser()
//       console.log('Current user in Bookmark:', user)
//       setCurrentUser(user)
//     } catch (error) {
//       console.error('Error loading user:', error)
//       Alert.alert('Error', 'Failed to load user information')
//     }
//   }

//   const requestLocationPermission = async () => {
//     try {
//       const { status } = await Location.requestForegroundPermissionsAsync()
//       if (status !== 'granted') {
//         console.log('Location permission denied')
//         Alert.alert(
//           'Permission Required',
//           'Location access is required for attendance marking'
//         )
//         return false
//       }
//       return true
//     } catch (error) {
//       console.error('Error requesting location permission:', error)
//       Alert.alert('Error', 'Failed to request location permission')
//       return false
//     }
//   }

//   const getCurrentLocation = async () => {
//     try {
//       // Check permission status
//       const { status } = await Location.getForegroundPermissionsAsync()
//       if (status !== 'granted') {
//         const granted = await requestLocationPermission()
//         if (!granted) {
//           throw new Error('Location permission is required')
//         }
//       }

//       // Get location with high accuracy
//       const location = await Location.getCurrentPositionAsync({
//         accuracy: Location.Accuracy.High,
//         timeout: 15000 // 15 second timeout
//       })

//       console.log('Retrieved location:', location) // Debug log

//       if (!location || !location.coords) {
//         throw new Error('Failed to get location coordinates')
//       }

//       return {
//         latitude: location.coords.latitude,
//         longitude: location.coords.longitude
//       }
//     } catch (error) {
//       console.error('Error getting current location:', error)
//       throw new Error('Failed to get your location. Please check your device settings.')
//     }
//   }

//   const handleViewClasses = () => {
//     router.push({
//       pathname: '/pages/ViewEnrolledStudent',
//       params: { 
//         classId: classId,
//         className: className
//       }
//     })
//   }

//   const handleGenerateCode = async () => {
//     setIsGenerating(true)
//     try {
//       router.push({
//         pathname: '/pages/CreateSession',
//         params: {
//           classId: classId,
//           className: className
//         }
//       })
//     } catch (error) {
//       console.log('Error navigating to CreateSession:', error)
//       Alert.alert('Error', 'Failed to navigate to code generation')
//     } finally {
//       setIsGenerating(false)
//     }
//   }


// const handleCheckIn = async () => {
//   if (!attendanceCode.trim()) {
//       Alert.alert('Error', 'Please enter an attendance code');
//       return;
//   }

//   setIsSubmitting(true);
//   try {
//       console.log('Starting check-in process for:', {
//           classId,
//           className,
//           userId: currentUser.$id
//       });

//       // Get current location
//       const userLocation = await getCurrentLocation();
//       if (!userLocation) {
//           throw new Error('Unable to get your location');
//       }

//       console.log('Retrieved user location:', userLocation);

//       // Submit attendance
//       console.log('Submitting attendance with:', {
//           classId,
//           attendanceCode: attendanceCode.trim(),
//           userId: currentUser.$id,
//           location: userLocation
//       });

//       const result = await submitAttendance(
//           classId,
//           attendanceCode.trim(),
//           currentUser.$id,
//           userLocation
//       );

//       console.log('Attendance submission result:', result);

//       // Show success message
//       Alert.alert(
//           'Success',
//           `Attendance marked as ${result.status}` +
//           (result.status === 'absent' ? 
//               ` (${Math.round(result.distance)}m from class location)` : 
//               '')
//       );

//       setAttendanceCode('');

//   } catch (error) {
//       console.error('Check-in error:', error);
//       Alert.alert('Error', error.message || 'Failed to check in');
//   } finally {
//       setIsSubmitting(false);
//   }
// };


//   return (
//     <SafeAreaView className="bg-primary h-full">
//       <View className="flex-1 px-4">
//         <Text className='text-2xl text-white font-psemibold mb-8 text-center mt-6'>
//           {className || 'Class Name'}
//         </Text>

//         {currentUser?.role === 'teacher' ? (
//           <View className="mt-auto mb-6 gap-4">
//             <CustomButton 
//               title='View Enrolled Students' 
//               handlePress={handleViewClasses}
//               containerStyle="bg-secondary"
//             />

//             <CustomButton 
//               title='Generate Attendance Code' 
//               handlePress={handleGenerateCode}
//               isLoading={isGenerating}
//             />
//           </View>
//         ) : (
//           <View className="mt-auto mb-6 gap-4">
//             <FormField 
//               title="Attendance Code"
//               value={attendanceCode}
//               handleChangeText={setAttendanceCode}
//               placeholder="Enter attendance code"
//             />

//             <CustomButton 
//               title='Check In' 
//               handlePress={handleCheckIn}
//               isLoading={isSubmitting}
//               containerStyle="bg-secondary"
//             />
//           </View>
//         )}
//       </View>
//     </SafeAreaView>
//   )
// }


// const Bookmark = () => {
//   const { className, classId } = useLocalSearchParams();
//   const [isGenerating, setIsGenerating] = useState(false);
//   const [currentUser, setCurrentUser] = useState(null);
//   const [attendanceCode, setAttendanceCode] = useState('');
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//       initializeComponent();
//   }, []);

//   const getCurrentLocation = async () => {
//     try {
//         const { status } = await Location.requestForegroundPermissionsAsync();
//         if (status !== 'granted') {
//             Alert.alert(
//                 'Permission Denied',
//                 'Location permission is required to mark attendance'
//             );
//             return null;
//         }

//         const location = await Location.getCurrentPositionAsync({
//             accuracy: Location.Accuracy.High,
//             timeInterval: 5000,
//         });
        
//         console.log("=================");
//         console.log('---Current location:----', location);

//         return {
//             latitude: location.coords.latitude,
//             longitude: location.coords.longitude
//         };
//     } catch (error) {
//         console.error('Error getting location:', error);
//         Alert.alert('Error', 'Failed to get your location. Please check your GPS settings.');
//         return null;
//     }
// };

// const handleGenerateCode = async () => {
//     setIsGenerating(true);
//     try {
//         router.push({
//             pathname: '/pages/CreateSession',
//             params: {
//                 classId: classId,
//                 className: className
//             }
//         });
//     } catch (error) {
//         console.error('Error navigating to CreateSession:', error);
//         Alert.alert('Error', 'Failed to navigate to code generation');
//     } finally {
//         setIsGenerating(false);
//     }
// };

//   const requestLocationPermission = async () => {
//       try {
//           const { status } = await Location.requestForegroundPermissionsAsync();
//           if (status !== 'granted') {
//               console.log('Location permission denied');
//               Alert.alert(
//                   'Permission Required',
//                   'Location access is required for attendance marking'
//               );
//               return false;
//           }
//           return true;
//       } catch (error) {
//           console.error('Error requesting location permission:', error);
//           Alert.alert('Error', 'Failed to request location permission');
//           return false;
//       }
//   };

//   const handleViewClasses = () => {
//       try {
//           router.push({
//               pathname: '/pages/ViewEnrolledStudent',
//               params: { 
//                   classId: classId,
//                   className: className
//               }
//           });
//       } catch (error) {
//           console.error('Error navigating to ViewEnrolledStudent:', error);
//           Alert.alert('Error', 'Failed to navigate to enrolled students view');
//       }
//   };

//   const initializeComponent = async () => {
//       try {
//           setIsLoading(true);
//           await loadCurrentUser();
//           if (currentUser?.role === 'student') {
//               await requestLocationPermission();
//           }
//       } catch (error) {
//           console.error('Error initializing component:', error);
//           Alert.alert('Error', 'Failed to initialize application');
//       } finally {
//           setIsLoading(false);
//       }
//   };

//   const loadCurrentUser = async () => {
//       try {
//           const user = await getCurrentUser();
//           console.log('Current user in Bookmark:', user);
//           if (!user) {
//               throw new Error('Failed to load user data');
//           }
//           setCurrentUser(user);
//       } catch (error) {
//           console.error('Error loading user:', error);
//           Alert.alert('Error', 'Failed to load user information');
//           throw error;
//       }
//   };

// const handleCheckIn = async () => {
//   if (!currentUser) {
//       console.error('No user data available');
//       Alert.alert('Error', 'Please wait for user data to load');
//       return;
//   }

//   if (!attendanceCode.trim()) {
//       Alert.alert('Error', 'Please enter an attendance code');
//       return;
//   }

//   // Verify enrollment first
//   const joinedClasses = parseJoinedClasses(currentUser.joined_classes);
//   const enrollment = joinedClasses.find(cls => cls.class_id === classId);

//   if (!enrollment) {
//       Alert.alert('Error', 'You are not enrolled in this class');
//       return;
//   }

//   if (enrollment.status !== 'approved') {
//       Alert.alert('Error', 'Your enrollment is pending approval');
//       return;
//   }

//   setIsSubmitting(true);
//   try {
//       console.log('Starting check-in process for:', {
//           classId,
//           className,
//           userId: currentUser.$id,
//           accountId: currentUser.accountId,
//           student_id: currentUser.$id
//       });

//       // Get current location
//       const userLocation = await getCurrentLocation();
//       if (!userLocation) {
//           throw new Error('Unable to get your location');
//       }

//       console.log('Retrieved user location:', userLocation);

//       // Submit attendance
//       const result = await submitAttendance(
//           classId,
//           attendanceCode.trim(),
//           currentUser.$id,
//           userLocation,
//           currentUser
//       );

//       console.log('Attendance submission result:', result);

//       Alert.alert(
//           'Success',
//           `Attendance marked as ${result.status}` +
//           (result.status === 'absent' ? 
//               ` (${Math.round(result.distance)}m from class location)` : 
//               '')
//       );

//       setAttendanceCode('');

//   } catch (error) {
//       console.error('Check-in error:', error);
//       Alert.alert('Error', error.message || 'Failed to check in');
//   } finally {
//       setIsSubmitting(false);
//   }
// };


//   // Add loading state to your render
//   if (isLoading) {
//       return (
//           <SafeAreaView className="bg-primary h-full">
//               <View className="flex-1 justify-center items-center">
//                   <Text className="text-white">Loading...</Text>
//               </View>
//           </SafeAreaView>
//       );
//   }

//   return (
//     <SafeAreaView className="bg-primary h-full">
//         {isLoading ? (
//             <View className="flex-1 justify-center items-center">
//                 <Text className="text-white">Loading...</Text>
//             </View>
//         ) : (
//             <View className="flex-1 px-4">
//                 <Text className='text-2xl text-white font-psemibold mb-8 text-center mt-6'>
//                     {className || 'Class Name'}
//                 </Text>

//                 {currentUser?.role === 'teacher' ? (
//                     <View className="mt-auto mb-6 gap-4">
//                         <CustomButton 
//                             title='View Enrolled Students' 
//                             handlePress={handleViewClasses}
//                             containerStyle="bg-secondary"
//                         />

//                         <CustomButton 
//                             title='Generate Attendance Code' 
//                             handlePress={handleGenerateCode}
//                             isLoading={isGenerating}
//                         />
//                     </View>
//                 ) : (
//                     <View className="mt-auto mb-6 gap-4">
//                         <FormField 
//                             title="Attendance Code"
//                             value={attendanceCode}
//                             handleChangeText={setAttendanceCode}
//                             placeholder="Enter attendance code"
//                         />

//                         <CustomButton 
//                             title='Check In' 
//                             handlePress={handleCheckIn}
//                             isLoading={isSubmitting}
//                             containerStyle="bg-secondary"
//                             disabled={!currentUser}
//                         />
//                     </View>
//                 )}
//             </View>
//         )}
//     </SafeAreaView>
// );
// };



// const Bookmark = () => {
//     const { className, classId } = useLocalSearchParams();
//     const [isGenerating, setIsGenerating] = useState(false);
//     const [currentUser, setCurrentUser] = useState(null);
//     const [attendanceCode, setAttendanceCode] = useState('');
//     const [isSubmitting, setIsSubmitting] = useState(false);
//     const [isLoading, setIsLoading] = useState(true);
//     const [currentLocation, setCurrentLocation] = useState(null);
//     const [locationSubscription, setLocationSubscription] = useState(null);

//     useEffect(() => {
//         initializeComponent();
        
//         // Start location updates if user is a student
//         if (currentUser?.role === 'student') {
//             startLocationUpdates();
//         }

//         // Cleanup function
//         return () => {
//             if (locationSubscription) {
//                 locationSubscription.remove();
//             }
//         };
//     }, [currentUser]);

//     const startLocationUpdates = async () => {
//         try {
//             // Remove any existing subscription
//             if (locationSubscription) {
//                 locationSubscription.remove();
//             }

//             // Request permissions first
//             const { status } = await Location.requestForegroundPermissionsAsync();
//             if (status !== 'granted') {
//                 throw new Error('Location permission denied');
//             }

//             // Start watching location
//             const subscription = await Location.watchPositionAsync(
//                 {
//                     accuracy: Location.Accuracy.BestForNavigation,
//                     timeInterval: 5000, // Update every 5 seconds
//                     distanceInterval: 5, // Update every 5 meters
//                 },
//                 (location) => {
//                     console.log('Location updated:', location);
//                     setCurrentLocation({
//                         latitude: location.coords.latitude,
//                         longitude: location.coords.longitude
//                     });
//                 }
//             );

//             setLocationSubscription(subscription);
//         } catch (error) {
//             console.error('Error setting up location updates:', error);
//             Alert.alert('Location Error', 'Failed to set up location tracking');
//         }
//     };

//     const getCurrentLocation = async () => {
//         try {
//             const { status } = await Location.requestForegroundPermissionsAsync();
//             if (status !== 'granted') {
//                 Alert.alert(
//                     'Permission Denied',
//                     'Location permission is required to mark attendance'
//                 );
//                 return null;
//             }

//             // Clear any existing location cache
//             await Location.enableNetworkProviderAsync();
            
//             // Get fresh location with high accuracy and no caching
//             const location = await Location.getCurrentPositionAsync({
//                 accuracy: Location.Accuracy.BestForNavigation,
//                 maximumAge: 0, // Ensure we get a fresh location
//                 timeout: 20000, // Wait up to 20 seconds for accurate location
//             });
            
//             console.log("Current location details:", {
//                 accuracy: location.coords.accuracy,
//                 latitude: location.coords.latitude,
//                 longitude: location.coords.longitude,
//                 timestamp: new Date(location.timestamp).toISOString()
//             });

//             // Verify location freshness
//             const locationAge = Date.now() - location.timestamp;
//             if (locationAge > 30000) { // older than 30 seconds
//                 throw new Error('Location data is too old');
//             }

//             return {
//                 latitude: location.coords.latitude,
//                 longitude: location.coords.longitude
//             };
//         } catch (error) {
//             console.error('Error getting location:', error);
//             Alert.alert(
//                 'Location Error', 
//                 'Unable to get accurate location. Please ensure GPS is enabled and you have a clear view of the sky.'
//             );
//             return null;
//         }
//     };

//     const handleGenerateCode = async () => {
//         setIsGenerating(true);
//         try {
//             router.push({
//                 pathname: '/pages/CreateSession',
//                 params: {
//                     classId: classId,
//                     className: className
//                 }
//             });
//         } catch (error) {
//             console.error('Error navigating to CreateSession:', error);
//             Alert.alert('Error', 'Failed to navigate to code generation');
//         } finally {
//             setIsGenerating(false);
//         }
//     };

//     const requestLocationPermission = async () => {
//         try {
//             const { status } = await Location.requestForegroundPermissionsAsync();
//             if (status !== 'granted') {
//                 console.log('Location permission denied');
//                 Alert.alert(
//                     'Permission Required',
//                     'Location access is required for attendance marking'
//                 );
//                 return false;
//             }
//             return true;
//         } catch (error) {
//             console.error('Error requesting location permission:', error);
//             Alert.alert('Error', 'Failed to request location permission');
//             return false;
//         }
//     };

//     const handleViewClasses = () => {
//         try {
//             router.push({
//                 pathname: '/pages/ViewEnrolledStudent',
//                 params: { 
//                     classId: classId,
//                     className: className
//                 }
//             });
//         } catch (error) {
//             console.error('Error navigating to ViewEnrolledStudent:', error);
//             Alert.alert('Error', 'Failed to navigate to enrolled students view');
//         }
//     };

//     const initializeComponent = async () => {
//         try {
//             setIsLoading(true);
//             await loadCurrentUser();
//             if (currentUser?.role === 'student') {
//                 await requestLocationPermission();
//             }
//         } catch (error) {
//             console.error('Error initializing component:', error);
//             Alert.alert('Error', 'Failed to initialize application');
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const loadCurrentUser = async () => {
//         try {
//             const user = await getCurrentUser();
//             console.log('Current user in Bookmark:', user);
//             if (!user) {
//                 throw new Error('Failed to load user data');
//             }
//             setCurrentUser(user);
//         } catch (error) {
//             console.error('Error loading user:', error);
//             Alert.alert('Error', 'Failed to load user information');
//             throw error;
//         }
//     };

//     const handleCheckIn = async () => {
//         if (!currentUser) {
//             console.error('No user data available');
//             Alert.alert('Error', 'Please wait for user data to load');
//             return;
//         }

//         if (!attendanceCode.trim()) {
//             Alert.alert('Error', 'Please enter an attendance code');
//             return;
//         }

//         // Verify enrollment first
//         const joinedClasses = parseJoinedClasses(currentUser.joined_classes);
//         const enrollment = joinedClasses.find(cls => cls.class_id === classId);

//         if (!enrollment) {
//             Alert.alert('Error', 'You are not enrolled in this class');
//             return;
//         }

//         if (enrollment.status !== 'approved') {
//             Alert.alert('Error', 'Your enrollment is pending approval');
//             return;
//         }

//         setIsSubmitting(true);
//         try {
//             console.log('Starting check-in process for:', {
//                 classId,
//                 className,
//                 userId: currentUser.$id,
//                 accountId: currentUser.accountId,
//                 student_id: currentUser.$id
//             });

//             // Get fresh location data
//             const userLocation = await getCurrentLocation();
//             if (!userLocation) {
//                 throw new Error('Unable to get your current location. Please ensure GPS is enabled.');
//             }

//             console.log('Current location for check-in:', userLocation);

//             // Submit attendance
//             const result = await submitAttendance(
//                 classId,
//                 attendanceCode.trim(),
//                 currentUser.$id,
//                 userLocation,
//                 currentUser
//             );

//             console.log('Attendance submission result:', result);

//             Alert.alert(
//                 'Success',
//                 `Attendance marked as ${result.status}` +
//                 (result.status === 'absent' ? 
//                     ` (${Math.round(result.distance)}m from class location)` : 
//                     '')
//             );

//             setAttendanceCode('');

//         } catch (error) {
//             console.error('Check-in error:', error);
//             Alert.alert('Error', error.message || 'Failed to check in');
//         } finally {
//             setIsSubmitting(false);
//         }
//     };

//     if (isLoading) {
//         return (
//             <SafeAreaView className="bg-primary h-full">
//                 <View className="flex-1 justify-center items-center">
//                     <Text className="text-white">Loading...</Text>
//                 </View>
//             </SafeAreaView>
//         );
//     }

//     return (
//         <SafeAreaView className="bg-primary h-full">
//             <View className="flex-1 px-4">
//                 <Text className='text-2xl text-white font-psemibold mb-8 text-center mt-6'>
//                     {className || 'Class Name'}
//                 </Text>

//                 {currentLocation && (
//                     <Text className="text-white text-center mb-4">
//                         Current Location: {'\n'}
//                         Lat: {currentLocation.latitude.toFixed(6)}{'\n'}
//                         Long: {currentLocation.longitude.toFixed(6)}
//                     </Text>
//                 )}

//                 {currentUser?.role === 'teacher' ? (
//                     <View className="mt-auto mb-6 gap-4">
//                         <CustomButton 
//                             title='View Enrolled Students' 
//                             handlePress={handleViewClasses}
//                             containerStyle="bg-secondary"
//                         />

//                         <CustomButton 
//                             title='Generate Attendance Code' 
//                             handlePress={handleGenerateCode}
//                             isLoading={isGenerating}
//                         />
//                     </View>
//                 ) : (
//                     <View className="mt-auto mb-6 gap-4">
//                         <FormField 
//                             title="Attendance Code"
//                             value={attendanceCode}
//                             handleChangeText={setAttendanceCode}
//                             placeholder="Enter attendance code"
//                         />

//                         <CustomButton 
//                             title='Check In' 
//                             handlePress={handleCheckIn}
//                             isLoading={isSubmitting}
//                             containerStyle="bg-secondary"
//                             disabled={!currentUser || !currentLocation}
//                         />
//                     </View>
//                 )}
//             </View>
//         </SafeAreaView>
//     );
// };


const Bookmark = () => {
    const { className, classId } = useLocalSearchParams();
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [attendanceCode, setAttendanceCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        initializeComponent();
    }, []);

    const initializeComponent = async () => {
        try {
            setIsLoading(true);
            await loadCurrentUser();
        } catch (error) {
            console.error('Error initializing component:', error);
            Alert.alert('Error', 'Failed to initialize application');
        } finally {
            setIsLoading(false);
        }
    };

    const loadCurrentUser = async () => {
        try {
            const user = await getCurrentUser();
            console.log('Current user in Bookmark:', user);
            if (!user) {
                throw new Error('Failed to load user data');
            }
            setCurrentUser(user);
        } catch (error) {
            console.error('Error loading user:', error);
            Alert.alert('Error', 'Failed to load user information');
            throw error;
        }
    };

    // const getCurrentLocation = async () => {
    //     try {
    //         const { status } = await Location.requestForegroundPermissionsAsync();
    //         if (status !== 'granted') {
    //             Alert.alert(
    //                 'Permission Denied',
    //                 'Location permission is required to mark attendance'
    //             );
    //             return null;
    //         }

    //         // Get fresh location with high accuracy
    //         const location = await Location.getCurrentPositionAsync({
    //             accuracy: Location.Accuracy.BestForNavigation,
    //             maximumAge: 0, // Ensure we get a fresh location
    //             timeout: 20000, // Wait up to 20 seconds for accurate location
    //         });
            
    //         console.log("Current location details:", {
    //             accuracy: location.coords.accuracy,
    //             latitude: location.coords.latitude,
    //             longitude: location.coords.longitude,
    //             timestamp: new Date(location.timestamp).toISOString()
    //         });

    //         return {
    //             latitude: location.coords.latitude,
    //             longitude: location.coords.longitude
    //         };
    //     } catch (error) {
    //         console.error('Error getting location:', error);
    //         Alert.alert(
    //             'Location Error', 
    //             'Unable to get accurate location. Please ensure GPS is enabled and you have a clear view of the sky.'
    //         );
    //         return null;
    //     }
    // };


  //   const getCurrentLocation = async () => {
  //     try {
  //         const { status } = await Location.requestForegroundPermissionsAsync();
  //         if (status !== 'granted') {
  //             Alert.alert(
  //                 'Permission Denied',
  //                 'Location permission is required to mark attendance'
  //             );
  //             return null;
  //         }
  
  //         // Clear location cache and wait for accurate reading
  //         await Location.enableNetworkProviderAsync();
          
  //         // Force high accuracy and no caching
  //         const location = await Location.getCurrentPositionAsync({
  //             accuracy: Location.Accuracy.BestForNavigation,
  //             maximumAge: 0,
  //             timeout: 20000,
  //             mayShowUserSettingsDialog: true,
  //             distanceFilter: 0
  //         });
          
  //         // Additional verification to ensure location is fresh
  //         const currentTime = Date.now();
  //         const locationAge = currentTime - location.timestamp;
          
  //         if (locationAge > 10000) { // if location is older than 10 seconds
  //             // Try one more time to get a fresh location
  //             const freshLocation = await Location.getCurrentPositionAsync({
  //                 accuracy: Location.Accuracy.High,
  //                 maximumAge: 0,
  //                 timeout: 20000
  //             });
  //             console.log("==========================")
  //             console.log("Fresh location details:", {
  //                 accuracy: freshLocation.coords.accuracy,
  //                 latitude: freshLocation.coords.latitude,
  //                 longitude: freshLocation.coords.longitude,
  //                 timestamp: new Date(freshLocation.timestamp).toISOString()
  //             });
  
  //             return {
  //                 latitude: freshLocation.coords.latitude,
  //                 longitude: freshLocation.coords.longitude
  //             };
  //         }
  //         console.log("==========================")
  
  //         console.log("Current location details:", {
  //             accuracy: location.coords.accuracy,
  //             latitude: location.coords.latitude,
  //             longitude: location.coords.longitude,
  //             timestamp: new Date(location.timestamp).toISOString()
  //         });
  
  //         return {
  //             latitude: location.coords.latitude,
  //             longitude: location.coords.longitude
  //         };
  //     } catch (error) {
  //         console.error('Error getting location:', error);
  //         Alert.alert(
  //             'Location Error', 
  //             'Unable to get accurate location. Please ensure GPS is enabled and you have a clear view of the sky.'
  //         );
  //         return null;
  //     }
  // };


  const getCurrentLocation = async () => {
    try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Permission Denied',
                'Location permission is required to mark attendance'
            );
            return null;
        }

        // First, stop any ongoing location updates
        await Location.stopLocationUpdatesAsync('locationTask').catch(() => {});
        
        // Clear any cached locations
        await Location.enableNetworkProviderAsync().catch(() => {});
        
        // Force device to get a fresh GPS fix
        console.log("Requesting fresh location...");
        
        // Request location with high accuracy settings
        const options = {
            accuracy: Location.Accuracy.BestForNavigation,
            maximumAge: 0, // Don't use cached location
            timeout: 20000,
            distanceFilter: 0,
            mayShowUserSettingsDialog: true
        };

        // First attempt to get location
        let location = await Location.getCurrentPositionAsync(options);
        console.log("Initial location reading:", {
            accuracy: location.coords.accuracy,
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: new Date(location.timestamp).toISOString()
        });

        // Wait for 2 seconds to get a more accurate reading
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Second attempt to get a fresher location
        location = await Location.getCurrentPositionAsync({
            ...options,
            accuracy: Location.Accuracy.Highest
        });

        console.log("Fresh location details:", {
            accuracy: location.coords.accuracy,
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: new Date(location.timestamp).toISOString()
        });

        // Verify the location is actually fresh
        const locationAge = Date.now() - location.timestamp;
        if (locationAge > 5000) { // if location is older than 5 seconds
            console.log("Location data too old, requesting another reading...");
            
            // Final attempt with highest accuracy
            location = await Location.getCurrentPositionAsync({
                ...options,
                accuracy: Location.Accuracy.Highest,
                timeInterval: 1000
            });

            console.log("Final location attempt:", {
                accuracy: location.coords.accuracy,
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                timestamp: new Date(location.timestamp).toISOString()
            });
        }

        return {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
        };
    } catch (error) {
        console.error('Error getting location:', error);
        Alert.alert(
            'Location Error', 
            'Unable to get accurate location. Please ensure GPS is enabled and you have a clear view of the sky.'
        );
        return null;
    }
};
    const handleGenerateCode = async () => {
        setIsGenerating(true);
        try {
            router.push({
                pathname: '/pages/CreateSession',
                params: {
                    classId: classId,
                    className: className
                }
            });
        } catch (error) {
            console.error('Error navigating to CreateSession:', error);
            Alert.alert('Error', 'Failed to navigate to code generation');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleViewClasses = () => {
        try {
            router.push({
                pathname: '/pages/ViewEnrolledStudent',
                params: { 
                    classId: classId,
                    className: className
                }
            });
        } catch (error) {
            console.error('Error navigating to ViewEnrolledStudent:', error);
            Alert.alert('Error', 'Failed to navigate to enrolled students view');
        }
    };

    const handleCheckIn = async () => {
        if (!currentUser) {
            console.error('No user data available');
            Alert.alert('Error', 'Please wait for user data to load');
            return;
        }

        if (!attendanceCode.trim()) {
            Alert.alert('Error', 'Please enter an attendance code');
            return;
        }

        // Verify enrollment first
        const joinedClasses = parseJoinedClasses(currentUser.joined_classes);
        const enrollment = joinedClasses.find(cls => cls.class_id === classId);

        if (!enrollment) {
            Alert.alert('Error', 'You are not enrolled in this class');
            return;
        }

        if (enrollment.status !== 'approved') {
            Alert.alert('Error', 'Your enrollment is pending approval');
            return;
        }

        setIsSubmitting(true);
        try {
            console.log('Starting check-in process for:', {
                classId,
                className,
                userId: currentUser.$id,
                accountId: currentUser.accountId,
                student_id: currentUser.$id
            });

            // Get fresh location data only when checking in
            const userLocation = await getCurrentLocation();
            if (!userLocation) {
                throw new Error('Unable to get your current location. Please ensure GPS is enabled.');
            }

            console.log('Current location for check-in:', userLocation);

            // Submit attendance
            const result = await submitAttendance(
                classId,
                attendanceCode.trim(),
                currentUser.$id,
                userLocation,
                currentUser
            );

            console.log('Attendance submission result:', result);

            Alert.alert(
                'Success',
                `Attendance marked as ${result.status}` +
                (result.status === 'absent' ? 
                    ` (${Math.round(result.distance)}m from class location)` : 
                    '')
            );

            setAttendanceCode('');

        } catch (error) {
            console.error('Check-in error:', error);
            Alert.alert('Error', error.message || 'Failed to check in');
        } finally {
            setIsSubmitting(false);
        }
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

    return (
        <SafeAreaView className="bg-primary h-full">
            <View className="flex-1 px-4">
                <Text className='text-2xl text-white font-psemibold mb-8 text-center mt-6'>
                    {className || 'Class Name'}
                </Text>

                {currentUser?.role === 'teacher' ? (
                    <View className="mt-auto mb-6 gap-4">
                        <CustomButton 
                            title='View Enrolled Students' 
                            handlePress={handleViewClasses}
                            containerStyle="bg-secondary"
                        />

                        <CustomButton 
                            title='Generate Attendance Code' 
                            handlePress={handleGenerateCode}
                            isLoading={isGenerating}
                        />
                    </View>
                ) : (
                    <View className="mt-auto mb-6 gap-4">
                        <FormField 
                            title="Attendance Code"
                            value={attendanceCode}
                            handleChangeText={setAttendanceCode}
                            placeholder="Enter attendance code"
                        />

                        <CustomButton 
                            title='Check In' 
                            handlePress={handleCheckIn}
                            isLoading={isSubmitting}
                            containerStyle="bg-secondary"
                            disabled={!currentUser}
                        />
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
};



export default Bookmark