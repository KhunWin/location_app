import { View, Text, ScrollView } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import CustomButton from '@/components/CustomButton'
import { useLocalSearchParams, router } from 'expo-router'

const Bookmark = () => {
  const { className, classId  } = useLocalSearchParams()
  const [isGenerating, setIsGenerating] = useState(false)

  const handleViewClasses = () => {
    // router.push('/pages/ViewAttendance')
    router.push({
      pathname: '/pages/ViewEnrolledStudent',
      // params: { 
      //     // classId: "677138d30025b530a07e",  // Use the _id from classCollectionId
      //     classId: "677138d30025a8c56eb8",
      //     className: "Class I"
      // }
      params: { 
        classId: classId,        // Use the received classId
        className: className      // Use the received className
    }
  })

  }


  const handleGenerateCode = async () => {
    setIsGenerating(true)
    try {
      // Redirect to CreateSession page with class information
      router.push({
        pathname: '/pages/CreateSession',
        params: {
          classId: classId,
          className: className
        }
      })
    } catch (error) {
      console.log('Error navigating to CreateSession:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <SafeAreaView className="bg-primary h-full">
      <View className="flex-1 px-4">
        <Text className='text-2xl text-white font-psemibold mb-8 text-center mt-6'>
          {className || 'Class Name'}
        </Text>

        {/* Button Container - Positioned at bottom */}
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
      </View>
    </SafeAreaView>
  )
}

export default Bookmark