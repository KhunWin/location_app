import { View, Text, ScrollView, Alert } from 'react-native'
import React, { useState, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import CustomButton from '@/components/CustomButton'
import FormField from '@/components/FormField'
import { useLocalSearchParams, router } from 'expo-router'
import { getCurrentUser, submitAttendance, parseJoinedClasses } from '../../lib/appwrite'
import * as Location from 'expo-location'


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