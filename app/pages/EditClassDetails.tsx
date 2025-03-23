import { View, Text, ScrollView, Alert, Image, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import FormField from '@/components/FormField';
import CustomButton from '@/components/CustomButton';
import { updateClassDetails, uploadFile } from '@/lib/appwrite';
import * as ImagePicker from 'expo-image-picker';

const EditClassDetails = () => {
    const { classId, className, classAddress, classSchedule, classSize, classImage } = useLocalSearchParams();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Parse initial values
    const initialAddress = classAddress ? JSON.parse(classAddress) : {};
    const initialSchedule = classSchedule ? JSON.parse(classSchedule) : {};
                    
    // Add state for class name
    const [name, setName] = useState(className ? className.toString() : '');
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
        Friday: initialSchedule.Friday || '',
        Saturday: initialSchedule.Saturday || ''
    });

    // Add state for class size
    const [size, setSize] = useState(classSize ? classSize.toString() : '');
    
    // Add state for class image
    const [image, setImage] = useState(classImage ? classImage.toString() : null);

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });
            
            if (!result.canceled && result.assets && result.assets.length > 0) {
                const selectedImage = result.assets[0];
                
                // Upload the image
                const file = {
                    uri: selectedImage.uri,
                    name: `class_image_${Date.now()}.jpg`,
                    type: 'image/jpeg',
                    size: selectedImage.fileSize || 0,
                    isClassImage: true,
                    classId: classId
                };
                
                const uploadResult = await uploadFile(file);
                setImage(uploadResult.fileMetadata.fileURL);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to select image');
        }
    };

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            // Convert size to integer
            const sizeInt = parseInt(size) || 0;
            await updateClassDetails(classId, address, schedule, sizeInt, image);
            Alert.alert('Success', 'Class details updated successfully');
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
        <SafeAreaView className="bg-primary h-full">
          <ScrollView>
            <View className="px-4 my-6">
              {/* Basic class information section */}
              <Text className="text-white text-xl font-semibold mb-3">Edit Class</Text>
              <View className="bg-[#1E293B] rounded-lg p-4 mb-5">
                <FormField
                    title="Class Name"
                    value={name}
                    handleChangeText={setName}
                    placeholder="Enter class name"
                    />
                <FormField
                  title="Classroom Limit"
                  value={size}
                  handleChangeText={setSize}
                  placeholder="Enter classroom limit"
                  keyboardType="numeric"
                />
              </View>
              
              {/* Class Image Section */}
              <Text className="text-white text-xl font-semibold mb-3">Class Image</Text>
              <View className="bg-[#1E293B] rounded-lg p-4 mb-5">
                <TouchableOpacity 
                  onPress={pickImage}
                  className="bg-secondary p-3 rounded-lg mb-3 items-center"
                >
                  <Text className="text-white font-medium">Select Image</Text>
                </TouchableOpacity>
                
                {image && (
                  <View className="mt-2">
                    <Image 
                      source={{ uri: image }} 
                      className="w-full h-48 rounded-lg"
                      resizeMode="cover"
                    />
                  </View>
                )}
              </View>
    
              {/* Location section */}
              <Text className="text-white text-xl font-semibold mb-3">Location Details</Text>
              <View className="bg-[#1E293B] rounded-lg p-4 mb-5">
                {/* Two columns for room and floor */}
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <FormField
                      title="Room"
                      value={address.room}
                      handleChangeText={(text) => setAddress(prev => ({ ...prev, room: text }))}
                      placeholder="Room #"
                    />
                  </View>
                  <View className="flex-1">
                    <FormField
                      title="Floor"
                      value={address.floor}
                      handleChangeText={(text) => setAddress(prev => ({ ...prev, floor: text }))}
                      placeholder="Floor #"
                    />
                  </View>
                </View>
                
                {/* Building and street */}
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
    
              {/* Schedule section */}
              <Text className="text-white text-xl font-semibold mb-3">Class Schedule</Text>
              <View className="bg-[#1E293B] rounded-lg p-4 mb-5">
                <View className="flex-row flex-wrap">
                  {['Monday', 'Tuesday', 'Wednesday'].map((day) => (
                    <View key={day} className="w-1/2 pr-1 mb-2">
                      <FormField
                        title={day.substring(0, 3)}
                        value={schedule[day]}
                        handleChangeText={(text) => setSchedule(prev => ({ ...prev, [day]: text }))}
                        placeholder="e.g., 8-11"
                      />
                    </View>
                  ))}
                  {['Thursday', 'Friday', 'Saturday'].map((day) => (
                    <View key={day} className="w-1/2 pr-1 mb-2">
                      <FormField
                        title={day.substring(0, 3)}
                        value={schedule[day]}
                        handleChangeText={(text) => setSchedule(prev => ({ ...prev, [day]: text }))}
                        placeholder="e.g., 8-11"
                      />
                    </View>
                  ))}
                </View>
              </View>
    
              <CustomButton
                title={isSubmitting ? "Updating..." : "Update Class Details"}
                handlePress={handleSubmit}
                isLoading={isSubmitting}
                containerStyle="mt-4"
              />
            </View>
          </ScrollView>
        </SafeAreaView>
    );
};

export default EditClassDetails;