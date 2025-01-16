import { View, Text, ScrollView, Alert } from 'react-native'
import { router } from 'expo-router';
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import FormField from '@/components/FormField'
import CustomButton from '@/components/CustomButton'
import { createClass } from '../../lib/appwrite'

const CreateClass = () => {
  const [className, setClassName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreateClass = async () => {
    if (!className) {
      Alert.alert('Error', 'Class name is required')
      return
    }

    setIsSubmitting(true)
    try {
      await createClass(className)
      setClassName('') // Reset form
      // router.replace('/home');
      router.push({
        pathname: '/home',
        params: { refresh: Date.now() } // Add a timestamp to force refresh
      });
      Alert.alert('Success', 'Class created successfully')
      
    } catch (error) {
      Alert.alert('Error', error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView>
        <View className='W-full px-4 my-6'>
          <Text className='text-2xl text-white font-psemibold mb-8'>Create Class</Text>

          <FormField 
            title="Class Name"
            value={className}
            handleChangeText={setClassName}
            placeholder="Enter class name"
          />

          <CustomButton 
            title='Create Class' 
            handlePress={handleCreateClass}
            containerStyle="mt-7" 
            isLoading={isSubmitting}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default CreateClass
