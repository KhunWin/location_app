import { View, Text, ScrollView, Alert, Image, TouchableOpacity, Dimensions } from 'react-native'
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import FormField from '@/components/FormField'
import CustomButton from '@/components/CustomButton'
import { createClass, getUserClasses } from '../../lib/appwrite'
import { images } from '@/constants'

const Home = () => {
  const [className, setClassName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [classes, setClasses] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Calculate item width for 2 columns with padding
  const screenWidth = Dimensions.get('window').width
  const itemWidth = (screenWidth - 48) / 2 // 48 = padding (16 * 2) + gap between items (16)

  useEffect(() => {
    loadClasses()
  }, [])

  const loadClasses = async () => {
    try {
      setIsLoading(true)
      const userClasses = await getUserClasses()
      setClasses(userClasses)
    } catch (error) {
      Alert.alert('Error', 'Failed to load classes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateClass = async () => {
    if (!className) {
      Alert.alert('Error', 'Class name is required')
      return
    }

    setIsSubmitting(true)
    try {
      await createClass(className)
      setClassName('') // Reset form
      setShowForm(false) // Hide form
      loadClasses() // Reload classes
      Alert.alert('Success', 'Class created successfully')
    } catch (error) {
      Alert.alert('Error', error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClassPress = (classItem) => {
    console.log('Selected class item:', JSON.stringify(classItem, null, 2));
    console.log('Class ID being passed:', classItem.class_id);
    
    router.push({
        pathname: '/bookmark',
        params: { 
            className: classItem.class_name,
            classId: classItem.class_id
        }
    });
    
    console.log('Router params:', {
        className: classItem.class_name,
        classId: classItem.class_id
    });
}

  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView>
        <View className='px-4 my-6'>
          <View className="flex-row justify-between items-center mb-8">
            <Text className='text-2xl text-white font-semibold'>My Classes</Text>
            <TouchableOpacity 
              onPress={() => setShowForm(!showForm)}
              className="bg-secondary px-4 py-2 rounded-lg"
            >
              <Text className="text-white">
                {showForm ? 'Cancel' : 'Create Class'}
              </Text>
            </TouchableOpacity>
          </View>

          {showForm && (
            <View className="mb-8">
              <FormField 
                title="Class Name"
                value={className}
                handleChangeText={setClassName}
                placeholder="Enter class name"
              />

              <CustomButton 
                title='Create Class' 
                handlePress={handleCreateClass}
                containerStyle="mt-4" 
                isLoading={isSubmitting}
              />
            </View>
          )}

          {isLoading ? (
            <Text className="text-white text-center">Loading classes...</Text>
          ) : (
            <View className="flex-row flex-wrap gap-2 justify-between">
              {classes.map((classItem) => (
                <TouchableOpacity 
                  key={classItem.$id}
                  onPress={() => handleClassPress(classItem)}
                  className="bg-primary rounded-lg overflow-hidden"
                  style={{ width: itemWidth }}
                >
                  <Image 
                    source={images.class_icon}
                    style={{ width: '100%', height: itemWidth }}
                    resizeMode="cover"
                  />
                  <Text className="text-white text-center py-2 px-2 text-lg">
                    {classItem.class_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {!isLoading && classes.length === 0 && (
            <Text className="text-white text-center">
              No classes created yet. Create your first class!
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default Home