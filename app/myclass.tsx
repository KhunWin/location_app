import { View, Text, ScrollView, Alert, TouchableOpacity, Linking } from 'react-native'
import React, { useState, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import CustomButton from '@/components/CustomButton'
import FormField from '@/components/FormField'
import { useLocalSearchParams, router } from 'expo-router'
import { calculateDistance, getClassAddress, getCurrentUser, submitAttendance, parseJoinedClasses, listFiles, getClassAttendanceDaysForStudent } from '../lib/appwrite'
import { deleteFile } from '../lib/appwrite'
import * as Location from 'expo-location'
import { useFocusEffect } from '@react-navigation/native';


const MyClass = () => {
    const { className, classId, classSize } = useLocalSearchParams();
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [attendanceCode, setAttendanceCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [files, setFiles] = useState([]);
    const [attendanceDays, setAttendanceDays] = useState([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [classAddress, setClassAddress] = useState(null);
    const [classDetails, setClassDetails] = useState(null);
    
        // Add this function to refresh all data
    const refreshAllData = async () => {
        try {
            if (currentUser) {
                const attendanceData = await getClassAttendanceDaysForStudent(classId);
                setAttendanceDays(attendanceData);
                
                const classDetails = await getClassAddress(classId);
                if (classDetails) {
                    setClassAddress(classDetails.address);
                    setClassDetails(classDetails);
                }
                
                await loadFiles();
            }
        } catch (error) {
            console.error('Error refreshing data:', error);
        }
    };
    
        // Update the useFocusEffect to use the new refresh function
    useFocusEffect(
        React.useCallback(() => {
            refreshAllData();
            return () => {};
        }, [currentUser, classId])
    );


    useEffect(() => {
        const loadClassData = async () => {
            try {
                // Load attendance data if user is available
                if (currentUser) {
                    const attendanceData = await getClassAttendanceDaysForStudent(classId);
                    console.log("attendanceData:", attendanceData);
                    setAttendanceDays(attendanceData);
                }

                // // Load class address
                // const address = await getClassAddress(classId);
                // setClassAddress(address);
                // Load class address and schedule
                const classDetails = await getClassAddress(classId);
                // console.log("Full classDetails structure:", classDetails);
                if (classDetails) {
                    setClassAddress(classDetails.address);
                    setClassDetails(classDetails); // This will contain both address and schedule
                }

            } catch (error) {
                console.error('Error loading class data:', error);
                Alert.alert('Error', 'Failed to load class data');
            }
        };

        if (classId) {
            loadClassData();
        }
    }, [classId, currentUser]);

    // Add this effect to refresh when screen is focused
    useFocusEffect(
        React.useCallback(() => {
            const refreshData = async () => {
                if (currentUser?.role === 'teacher') {
                    await loadFiles();
                }
            };
            // Add 1 second delay before refreshing
            const timer = setTimeout(() => {
                refreshData();
            }, 1000);
            return () => clearTimeout(timer);
        }, [currentUser, classId])
    );

    useEffect(() => {
        initializeComponent();
    }, []);

    // Modify the useEffect to load files for all users
    useEffect(() => {
        if (currentUser) {  // Remove role check
            loadFiles();
        }
    }, [currentUser, classId]);

    const loadFiles = async () => {
        try {
            // console.log('Attempting to load files for class:', classId);
            const filesList = await listFiles(classId);
            // console.log('Files list:', filesList)
            
            // Add detailed logging
            if (!filesList || filesList.length === 0) {
                console.log('No files found or invalid response:', filesList);
                setFiles([]);
                return;
            }

            // console.log('Raw files data:', filesList);
            const filteredFiles = filesList.filter(file => file.is_classimage !== "Yes");
            
            // Verify file structure
            const validFiles = filteredFiles.filter(file => {
                const isValid = file && file.fileURL && file.filename;
                if (!isValid) {
                    console.log('Invalid file structure:', file);
                }
                return isValid;
            });

            // console.log('Valid files to display:', validFiles);
            setFiles(validFiles);
            
        } catch (error) {
            console.error('Error in loadFiles:', error);
            Alert.alert('Error', 'Failed to load class files');
            setFiles([]);
        }
    };

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

    // Keep all your existing functions
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

    // Modify the refreshAttendanceData function to use the loading state
    const refreshAttendanceData = async () => {
        setIsRefreshing(true);
        try {
            const attendanceData = await getClassAttendanceDaysForStudent(classId);
            setAttendanceDays(attendanceData);
        } catch (error) {
            console.error('Error refreshing attendance data:', error);
        } finally {
            setIsRefreshing(false);
        }
    };
    

    // Update handleCheckIn function
    
    
    const handleCheckIn = async (skipCodeCheck = false, dayData = null, isCheckout = false) => {
        if (!currentUser) {
            Alert.alert('Error', 'Please wait for user data to load');
            return;
        }

        if (!skipCodeCheck && !attendanceCode.trim()) {
            Alert.alert('Error', 'Please enter an attendance code');
            return;
        }

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
            const userLocation = await getCurrentLocation();
            if (!userLocation) {
                throw new Error('Unable to get your current location. Please ensure GPS is enabled.');
            }

            const result = await submitAttendance(
                classId,
                skipCodeCheck ? dayData.attendance_code : attendanceCode.trim(),
                currentUser.$id,
                userLocation,
                currentUser,
                isCheckout // Add isCheckout parameter
            );

            Alert.alert(
                'Success',
                isCheckout ? 
                    'Successfully checked out' : 
                    `Attendance marked as ${result.status}` +
                    (result.status === 'absent' ? 
                        ` (${Math.round(result.distance)}m from class location)` : 
                        '')
            );

            if (!skipCodeCheck) {
                setAttendanceCode('');
            }
            await refreshAttendanceData();

        } catch (error) {
            console.error('Check-in error:', error);
            Alert.alert('Error', error.message || 'Failed to check in');
        } finally {
            setIsSubmitting(false);
        }
    };


    const FileItem = ({ file }) => {
        const handleFilePress = async () => {
            try {
    
                // If user is a student, check location before allowing file access
                if (currentUser?.role !== 'teacher') {
                    // Get the user's current location
                    const userLocation = await getCurrentLocation();
                    if (!userLocation) {
                        Alert.alert('Error', 'Unable to get your location. Please ensure GPS is enabled.');
                        return;
                    }

                    // Check if classDetails and location exist
                    if (!classDetails?.location) {
                        console.log('Missing class location data:', classDetails);
                        Alert.alert('Error', 'Class location information is not available.');
                        return;
                    }


                    // Use the location from classDetails instead of classAddress
                    if (!classDetails?.location) {
                        Alert.alert('Error', 'Class location information is not available.');
                        return;
                    }

                    // console.log('User location:', userLocation);
                    // console.log('Class location:', classDetails.location);

                    // Calculate distance to class using the proper location coordinates
                    const distance = calculateDistance(
                        userLocation.latitude,
                        userLocation.longitude,
                        classDetails.location.latitude,
                        classDetails.location.longitude
                    );

                    // console.log('Distance to class:', distance, 'meters');

                    // Set threshold for presence
                    const PRESENCE_THRESHOLD = 50; // meters

                    if (distance > PRESENCE_THRESHOLD) {
                        Alert.alert('Access Denied', `You need to be in the class to see this file. You are currently ${Math.round(distance)} meters away.`);
                        return;
                    }
                }

                // Proceed with file opening if location check passes or user is teacher
                if (file.fileURL) {
                    console.log('Attempting to open file:', file.fileURL);
                    const canOpen = await Linking.canOpenURL(file.fileURL);
                    
                    if (canOpen) {
                        await Linking.openURL(file.fileURL);
                        console.log('File opened successfully');
                    } else {
                        console.log('Cannot open URL:', file.fileURL);
                        Alert.alert('Error', 'Cannot open this file type');
                    }
                } else {
                    console.log('No file URL available:', file);
                    Alert.alert('Error', 'File URL not available');
                }
            } catch (error) {
                console.error('Error opening file:', error);
                Alert.alert('Error', 'Failed to open file');
            }
        };

    const handleDeleteFile = async () => {
            try {
                Alert.alert(
                    "Delete File",
                    "Are you sure you want to delete this file?",
                    [
                        { text: "Cancel", style: "cancel" },
                        { 
                            text: "Delete", 
                            style: "destructive",
                            onPress: async () => {
                                try {
                                    // You'll need to implement this function in your appwrite.js
                                    await deleteFile(file.$id, classId);
                                    Alert.alert("Success", "File deleted successfully");
                                    // Refresh the files list
                                    loadFiles();
                                } catch (error) {
                                    console.error('Error deleting file:', error);
                                    Alert.alert('Error', 'Failed to delete file');
                                }
                            }
                        }
                    ]
                );
            } catch (error) {
                console.error('Error in delete dialog:', error);
                Alert.alert('Error', 'Failed to process delete request');
            }
        };

        return (
            <TouchableOpacity 
                className="bg-secondary rounded-lg p-3 m-2"
                onPress={handleFilePress}
            >
                <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                        <Text className="text-white text-sm" numberOfLines={2}>
                            {file.filename || 'Unnamed file'}
                        </Text>
                        <Text className="text-gray-400 text-xs mt-1">
                            {new Date(file.$createdAt).toLocaleDateString()}
                        </Text>
                    </View>
                    
                    {currentUser?.role === 'teacher' && (
                        <TouchableOpacity 
                            onPress={handleDeleteFile}
                            className="bg-red-500 rounded-full w-6 h-6 items-center justify-center"
                        >
                            <Text className="text-white text-xs font-bold">X</Text>
                        </TouchableOpacity>
                    )}
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


    return (
        <SafeAreaView className="bg-primary h-full">
            <View className="flex-1 px-4">
                <Text className='text-xl text-white font-psemibold mb-5 text-center'>
                    {className || 'Class Name'}
                </Text>
    
                {/* Class Address Section - More compact */}
                {classAddress && (
                    <View className="mb-3">
                        <Text className="text-white text-base mb-1">Class Address</Text>
                        <Text className="text-gray-300 text-sm">
                            {`Floor: ${classAddress.floor}, Room: ${classAddress.room}, Building: ${classAddress.building}, Street: ${classAddress.street}`}
                        </Text>
                    </View>
                )}
                
                {/* Schedule Section - More compact */}
                {classDetails?.schedule && (
                    <View className="mb-3">
                        <Text className="text-white text-base mb-1">Class Schedule</Text>
                        <View className="flex-row flex-wrap">
                            {Object.entries(classDetails.schedule).map(([day, time]) => (
                                time && (
                                    <Text key={day} className="text-gray-300 text-sm mr-3">
                                        {day}: {time}
                                    </Text>
                                )
                            ))}
                        </View>
                    </View>
                )}
                    
                {/* Files Section - More space for scrolling */}
                <View className="flex-1 mb-1">
                    <Text className="text-white text-base mb-1">
                        Class Files
                    </Text>
                    <ScrollView 
                        className="flex-1"
                        contentContainerStyle={{
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            justifyContent: 'space-between',
                            paddingBottom: 10
                        }}
                    >
                        {files.length > 0 ? (
                            files.map((file, index) => (
                                <View key={file.$id || index} style={{ width: '48%' }}>
                                    <FileItem file={file} />
                                </View>
                            ))
                        ) : (
                            <Text className="text-gray-400 text-center w-full p-2">
                                No files uploaded yet
                            </Text>
                        )}
                    </ScrollView>
                </View>
                
                {/* Teacher-specific controls - Made more compact */}
                {currentUser?.role === 'teacher' ? (
                    <View className="flex-row flex-wrap justify-between mb-2">
                        <TouchableOpacity 
                            onPress={handleViewClasses}
                            className="bg-blue-500 rounded-lg py-2 px-3 mb-2"
                            style={{ width: '48%' }}
                        >
                            <Text className="text-white text-xs text-center">View Students</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            onPress={handleGenerateCode}
                            className="bg-blue-500 rounded-lg py-2 px-3 mb-2"
                            style={{ width: '48%' }}
                            disabled={isGenerating}
                        >
                            <Text className="text-white text-xs text-center">
                                {isGenerating ? 'Generating...' : 'Attendance Code'}
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            onPress={() => router.push({
                                pathname: '/pages/EditClassDetails',
                                params: { 
                                    classId: classId,
                                    className: className,
                                    classAddress: JSON.stringify(classAddress),
                                    classSchedule: JSON.stringify(classDetails?.schedule),
                                    classSize: classDetails?.size?.toString() || ''
                                }
                            })}
                            className="bg-blue-500 rounded-lg py-2 px-3 mb-2"
                            style={{ width: '48%' }}
                        >
                            <Text className="text-white text-xs text-center">Edit Details</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            onPress={() => router.push({
                                pathname: '/fileupload',
                                params: { classId: classId }
                            })}
                            className="bg-blue-500 rounded-lg py-2 px-3 mb-2 border border-gray-500"
                            style={{ width: '48%' }}
                        >
                            <Text className="text-white text-xs text-center">Upload File</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    /* Student check-in section - More compact */
                    <View className="mt-2 mb-4">
                        <Text className="text-white text-base mb-1">Attendance Days</Text>
                        <ScrollView horizontal={false} className="mb-2" style={{ maxHeight: 150 }}>
                            <View className="border border-gray-600 rounded-lg mx-1">
                                <View className="flex-row bg-secondary">
                                    <Text className="text-white font-medium p-1 flex-1 w-[25%] text-xs">Session</Text>
                                    <Text className="text-white font-medium p-1 flex-1 w-[25%] text-xs">Date</Text>
                                    <Text className="text-white font-medium p-1 flex-1 w-[25%] text-xs">Status</Text>
                                    <Text className="text-white font-medium p-1 flex-1 w-[30%] text-xs">Check-out</Text>
                                </View>
                                {attendanceDays.map((day, index) => {
                                    const dayData = typeof day === 'string' ? JSON.parse(day) : day;
                                    const record = dayData.records?.find(r => r.student_id === currentUser.$id);
                                    return (
                                        <View key={index} className="flex-row border-t border-gray-600">
                                            <Text className="text-gray-300 p-1 flex-1 w-[25%] text-xs">
                                                {dayData.session_title}
                                            </Text>
                                            <Text className="text-gray-300 p-1 flex-1 w-[25%] text-xs">
                                                {new Date(dayData.date).toLocaleDateString()}
                                            </Text>
                                            <Text className={`p-1 flex-1 w-[25%] text-xs ${
                                                record?.status === 'present' ? 'text-green-400' : 
                                                record?.status === 'checked-out' ? 'text-blue-400' : 
                                                'text-gray-300'
                                            }`}>
                                                {record?.status === 'present' ? 'Present' : 
                                                 record?.status === 'checked-out' ? 'Check-out' : 
                                                 'Not checked in'}
                                            </Text>
                                            <View className="p-1 flex-1 w-[25%]">

                                                {record?.status === 'present' && !record.checkout_time ? (
                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            setAttendanceCode(dayData.attendance_code);
                                                            handleCheckIn(true, dayData, true);
                                                        }}
                                                        className="bg-blue-500 rounded-lg py-1 px-2"
                                                        disabled={isSubmitting}
                                                    >
                                                        <Text className="text-white text-center text-xs">
                                                            Check Out
                                                        </Text>
                                                    </TouchableOpacity>
                                                ) : record?.checkout_time ? (
                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            setAttendanceCode(dayData.attendance_code);
                                                            handleCheckIn(true, dayData);
                                                        }}
                                                        className="bg-secondary rounded-lg py-1 px-2"
                                                        disabled={isSubmitting}
                                                    >
                                                        <Text className="text-white text-center text-xs">
                                                            Check In
                                                        </Text>
                                                    </TouchableOpacity>
                                                ) : (
                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            setAttendanceCode(dayData.attendance_code);
                                                            handleCheckIn(true, dayData, false);
                                                        }}
                                                        className="bg-secondary rounded-lg py-1 px-2"
                                                        disabled={isSubmitting}
                                                    >
                                                        <Text className="text-white text-center text-xs">
                                                            {record?.status === 'absent' ? 'Try Again' : 'Check-in'}
                                                        </Text>
                                                    </TouchableOpacity>
                                                )}




                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        </ScrollView>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );

};

export default MyClass;