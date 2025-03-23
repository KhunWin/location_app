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
  const [classSize, setClassSize] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [classes, setClasses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const screenWidth = Dimensions.get('window').width
  const itemWidth = (screenWidth - 48) / 2
  const [isUploading, setIsUploading] = useState(false);

  // Add new state for address fields
  const [room, setRoom] = useState('');
  const [floor, setFloor] = useState('');
  const [building, setBuilding] = useState('');
  const [street, setStreet] = useState('');

  const [schedule, setSchedule] = useState({
    Monday: '',
    Tuesday: '',
    Wednesday: '',
    Thursday: '',
    Friday: '',
    Saturday:'',
    Sunday:''
  });

  // Add handleScheduleChange function
  const handleScheduleChange = (day, value) => {
    setSchedule(prev => ({
        ...prev,
        [day]: value
    }));
  };

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
        // console.log('Parsing joined classes:', user.joined_classes);
        
        const joinedClasses = user.joined_classes.map(classStr => {
          try {
            const parsed = JSON.parse(classStr);
            // console.log('Parsed class entry:', parsed);
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
          // console.log(`Class ${cls.class_name} (${cls.class_id}) approved status:`, isApproved);
          return isApproved;
        });
  
        // console.log('Final approved classes:', approvedClasses);
        setClasses(approvedClasses);
      }
    } catch (error) {
      console.error('Error in loadUserAndClasses:', error);
      Alert.alert('Error', 'Failed to load classes');
    } finally {
      setIsLoading(false);
    }
  };

  // const handleCreateClass = async () => {
  //     if (!className.trim()) {
  //       Alert.alert('Error', 'Please enter a class name');
  //       return;
  //     }

  //     try {
  //       setIsSubmitting(true);
        
  //       // Get current location
  //       let { status } = await Location.requestForegroundPermissionsAsync();
  //       if (status !== 'granted') {
  //         Alert.alert('Permission denied', 'Location permission is required');
  //         return;
  //       }

  //       const location = await Location.getCurrentPositionAsync({});
  //       const locationCoords = {
  //         latitude: location.coords.latitude,
  //         longitude: location.coords.longitude
  //       };
        
  //       console.log('Creating class with name and location:', {
  //         className,
  //         location: locationCoords
  //       });
        
  //       const newClass = await createClass(className, locationCoords);
  //       console.log('Class created:', newClass);
        
  //       setClassName('');
        
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
  // };

  const handleCreateClass = async () => {
    if (!className.trim()) {
      Alert.alert('Error', 'Please enter a class name');
      return;
    }

    // Validate at least one schedule entry
    const hasSchedule = Object.values(schedule).some(time => time.trim() !== '');
    if (!hasSchedule) {
        Alert.alert('Error', 'Please enter at least one class schedule');
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

      // Create address object
      const addressData = {
        room,
        floor,
        building,
        street
      };
      
      console.log('Creating class with name, location and address:', {
        className,
        location: locationCoords,
        address: addressData
      });

      // Filter out empty schedule entries
      const cleanSchedule = Object.fromEntries(
        Object.entries(schedule).filter(([_, value]) => value.trim() !== '')
    );
      const classSizeInt = parseInt(classSize) || 0;
      const newClass = await createClass(className, locationCoords, addressData,cleanSchedule,classSizeInt);
      console.log('Class created:', newClass);
      
      // Clear all form fields
      setClassName('');
      setClassSize('');
      setRoom('');
      setFloor('');
      setBuilding('');
      setStreet('');
      setSchedule({
        Monday: '',
        Tuesday: '',
        Wednesday: '',
        Thursday: '',
        Friday: '',
        Saturday:'',
        Sunday:''
      });
      
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
      // pathname: '/bookmark',
      pathname: '/myclass',
      params: { 
        className: classItem.class_name || classItem.name,
        classId: classItem.class_id  // Changed from classItem.$id to classItem.class_id
      }
    });
  };

  const renderClassItem = (classItem) => {
    // console.log('Rendering class item:', classItem);
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
    // console.log('Rendering student view with classes:', classes);
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

  // // console.log('Rendering teacher view');
  // return (
  //   <SafeAreaView className="bg-primary h-full">
  //     <ScrollView>
  //       <View className="px-4 my-6">
  //         {/* <Text className="text-2xl text-white font-semibold mb-8">
  //           This is a place for report.
  //         </Text> */}

  //         <FormField 
  //           title="Class Name"
  //           value={className}
  //           handleChangeText={setClassName}
  //           placeholder="Enter class name"
  //         />
  //         <FormField
  //           title="Classroom Limit"
  //           value={classSize}
  //           handleChangeText={setClassSize}
  //           placeholder="Enter classroom limit"
  //           keyboardType="numeric"
  //         />

  //         {/* Add address fields */}
  //         <FormField
  //           title="Room Number"
  //           value={room}
  //           handleChangeText={setRoom}
  //           placeholder="Enter room number"
  //         />

  //         <FormField
  //           title="Floor"
  //           value={floor}
  //           handleChangeText={setFloor}
  //           placeholder="Enter floor number"
  //           keyboardType="numeric"
  //         />

  //         <FormField
  //           title="Building"
  //           value={building}
  //           handleChangeText={setBuilding}
  //           placeholder="Enter building name"
  //         />

  //         <FormField
  //           title="Street"
  //           value={street}
  //           handleChangeText={setStreet}
  //           placeholder="Enter street address"
  //         />

  //         {/* date and time */}
  //         <Text className="text-white text-lg mb-2">Class Schedule</Text>
  //                         {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
  //                             <FormField
  //                                 key={day}
  //                                 title={day}
  //                                 value={schedule[day]}
  //                                 handleChangeText={(value) => handleScheduleChange(day, value)}
  //                                 placeholder="Enter time (e.g., 8-11)"
  //                             />
  //                         ))}

  //         <View className="mt-4">
  //             <CustomButton
  //                 title={isSubmitting ? "Creating..." : "Create Class"}
  //                 handlePress={handleCreateClass}
  //                 isLoading={isSubmitting}
  //                 containerStyle="mt-7"
  //             />
  //         </View>


  //       </View>
  //     </ScrollView>
  //   </SafeAreaView>
  // );

  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView>
        <View className="px-4 my-6">
          {/* Basic class information section */}
          <Text className="text-white text-xl font-semibold mb-3">Class Information</Text>
          <View className="bg-[#1E293B] rounded-lg p-4 mb-5">
            <FormField 
              title="Class Name"
              value={className}
              handleChangeText={setClassName}
              placeholder="Enter class name"
            />
            <FormField
              title="Classroom Limit"
              value={classSize}
              handleChangeText={setClassSize}
              placeholder="Enter classroom limit"
              keyboardType="numeric"
            />
          </View>

          {/* Location section */}
          <Text className="text-white text-xl font-semibold mb-3">Location Details</Text>
          <View className="bg-[#1E293B] rounded-lg p-4 mb-5">
            {/* Two columns for room and floor */}
            <View className="flex-row gap-2">
              <View className="flex-1">
                <FormField
                  title="Room"
                  value={room}
                  handleChangeText={setRoom}
                  placeholder="Room #"
                />
              </View>
              <View className="flex-1">
                <FormField
                  title="Floor"
                  value={floor}
                  handleChangeText={setFloor}
                  placeholder="Floor #"
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            {/* Building and street */}
            <FormField
              title="Building"
              value={building}
              handleChangeText={setBuilding}
              placeholder="Enter building name"
            />
            <FormField
              title="Street"
              value={street}
              handleChangeText={setStreet}
              placeholder="Enter street address"
            />
          </View>

          {/* Schedule section */}
          <Text className="text-white text-xl font-semibold mb-3">Class Schedule</Text>
          <View className="bg-[#1E293B] rounded-lg p-4 mb-5">
            <View className="flex-row flex-wrap">
              {['Monday', 'Tuesday', 'Wednesday'].map((day) => (
                <View key={day} className="w-1/2 pr-1 mb-2">
                  <FormField
                    title={day.substring(0, 3)}
                    value={schedule[day]}
                    handleChangeText={(value) => handleScheduleChange(day, value)}
                    placeholder="e.g., 8-11"
                  />
                </View>
              ))}
              {['Thursday', 'Friday', 'Saturday'].map((day) => (
                <View key={day} className="w-1/2 pr-1 mb-2">
                  <FormField
                    title={day.substring(0, 3)}
                    value={schedule[day]}
                    handleChangeText={(value) => handleScheduleChange(day, value)}
                    placeholder="e.g., 8-11"
                  />
                </View>
              ))}
            </View>
          </View>

          <CustomButton
            title={isSubmitting ? "Creating..." : "Create Class"}
            handlePress={handleCreateClass}
            isLoading={isSubmitting}
            containerStyle="mt-4"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );



}

export default Create;

// do not remove anything here yet. Create might be added more questions later. 
//maybe just a report page.