import { View, Text, ScrollView, Alert } from 'react-native';
import React, { useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import FormField from '@/components/FormField';
import CustomButton from '@/components/CustomButton';
import { updateClassDetails } from '@/lib/appwrite';

const EditClassDetails = () => {
    const { classId, className, classAddress, classSchedule } = useLocalSearchParams();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Parse initial values
    const initialAddress = classAddress ? JSON.parse(classAddress) : {};
    const initialSchedule = classSchedule ? JSON.parse(classSchedule) : {};

    // Form state
    const [address, setAddress] = useState({
        room: initialAddress.room || '',
        floor: initialAddress.floor || '',
        building: initialAddress.building || '',
        street: initialAddress.street || ''
    });

    const [schedule, setSchedule] = useState({
        Monday: initialSchedule.Monday || '',
        Tuesday: initialSchedule.Tuesday || '',
        Wednesday: initialSchedule.Wednesday || '',
        Thursday: initialSchedule.Thursday || '',
        Friday: initialSchedule.Friday || ''
    });

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            await updateClassDetails(classId, address, schedule);
            Alert.alert('Success', 'Class details updated successfully');
            // router.back();
            router.back({
            params: {
                refresh: Date.now()
            }
            });
        } catch (error) {
            console.error('Error updating class details:', error);
            Alert.alert('Error', 'Failed to update class details');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView className="bg-primary flex-1 pb-2">
            <ScrollView className="px-4 py-6">
                <Text className="text-white text-2xl font-semibold mb-6">
                    Edit {className}
                </Text>

                <View className="mb-6">
                    <Text className="text-white text-lg mb-4">Address Details</Text>
                    <FormField
                        title="Room"
                        value={address.room}
                        handleChangeText={(text) => setAddress(prev => ({ ...prev, room: text }))}
                        placeholder="Enter room number"
                    />
                    <FormField
                        title="Floor"
                        value={address.floor}
                        handleChangeText={(text) => setAddress(prev => ({ ...prev, floor: text }))}
                        placeholder="Enter floor number"
                    />
                    <FormField
                        title="Building"
                        value={address.building}
                        handleChangeText={(text) => setAddress(prev => ({ ...prev, building: text }))}
                        placeholder="Enter building name"
                    />
                    <FormField
                        title="Street"
                        value={address.street}
                        handleChangeText={(text) => setAddress(prev => ({ ...prev, street: text }))}
                        placeholder="Enter street address"
                    />
                </View>

                <View className="mb-6">
                    <Text className="text-white text-lg mb-4">Schedule (Format: HH-HH, e.g., 9-12)</Text>
                    {Object.keys(schedule).map((day) => (
                        <FormField
                            key={day}
                            title={day}
                            value={schedule[day]}
                            handleChangeText={(text) => setSchedule(prev => ({ ...prev, [day]: text }))}
                            placeholder="Enter time (e.g., 9-12)"
                        />
                    ))}
                </View>
                
                <View className="mb-6">
                <CustomButton
                    title="Update Class Details"
                    handlePress={handleSubmit}
                    isLoading={isSubmitting}
                />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default EditClassDetails;