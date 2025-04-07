import React, { useState } from 'react';
import { View, Text, Alert, TouchableOpacity } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { uploadFile, getCurrentUser, listFiles } from '../lib/appwrite';

import CustomButton from '@/components/CustomButton';

import { useLocalSearchParams } from 'expo-router';

const Fileupload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { classId } = useLocalSearchParams();

  const handleViewFiles = async () => {
    try {
      console.log('Fetching files for class:', classId);
      await listFiles(classId);
    } catch (error) {
      console.error('Error viewing files:', error);
      Alert.alert('Error', 'Failed to retrieve files');
    }
  };

  const handleFileUpload = async () => {
    try {
      setIsUploading(true);
      console.log('Starting file upload process for class:', classId);

      // Pick a document
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      console.log('Raw document picker result:', result);

      // Check if result is valid (updated validation)
      if (!result || result.canceled || !result.assets || result.assets.length === 0) {
        console.log('Document picker cancelled or returned invalid result');
        Alert.alert('Error', 'No file was selected');
        return;
      }

      const fileAsset = result.assets[0];
      console.log('Selected file asset:', fileAsset);

      // Only proceed if we have valid file data
      if (!fileAsset.uri || !fileAsset.name || !fileAsset.mimeType) {
        console.log('Invalid file data:', fileAsset);
        Alert.alert('Error', 'Invalid file data');
        return;
      }

      console.log('File details:', {
        fileName: fileAsset.name,
        fileExtension: fileAsset.name.split('.').pop(),
        mimeType: fileAsset.mimeType,
        size: fileAsset.size ? `${(fileAsset.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size',
        isImage: fileAsset.mimeType?.startsWith('image/'),
        isPDF: fileAsset.mimeType === 'application/pdf',
        isDocument: fileAsset.mimeType?.includes('document') || fileAsset.mimeType?.includes('msword')
      });

      const file = {
        uri: fileAsset.uri,
        name: fileAsset.name,
        type: fileAsset.mimeType,
        size: fileAsset.size,
        classId: classId // Add classId to the file object
      };
      
      // Upload file
      console.log('Attempting to upload file with class ID:', classId);
      const uploadResult = await uploadFile(file);
      
      console.log('Upload completed successfully:', {
        fileId: uploadResult.uploadResult.$id,
        fileName: uploadResult.fileMetadata.filename,
        fileURL: uploadResult.fileMetadata.fileURL,
        creator: uploadResult.fileMetadata.creator,
        classId: uploadResult.fileMetadata.class_id
      });

      Alert.alert('Success', 'File uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', error.message || 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View className="flex-1 bg-primary p-4">
      <Text className="text-2xl text-white font-semibold mb-8">
        Upload File
      </Text>

      <CustomButton
        title="Select and Upload File"
        handlePress={handleFileUpload}
        containerStyle="mt-4"
        isLoading={isUploading}
      />

      {/* <CustomButton
        title="View Files"
        handlePress={handleViewFiles}
        containerStyle="mt-4"
      /> */}

      <TouchableOpacity
        onPress={() => router.back()}
        className="mt-4 p-2 bg-secondary rounded-lg"
      >
        <Text className="text-white text-center">Go Back</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Fileupload;