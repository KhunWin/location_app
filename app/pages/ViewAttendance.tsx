import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native'
import React, { useState, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams } from 'expo-router'
import { getClassStudents } from '../../lib/appwrite'
import { MaterialIcons } from '@expo/vector-icons'

const ViewAttendance = () => {
    const { classId, className } = useLocalSearchParams()
    const [students, setStudents] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [attendanceStatus, setAttendanceStatus] = useState({})

    useEffect(() => {
      console.log('\n=== ViewAttendance Component Mounted ===');
      console.log('Received params - classId:', classId);
      console.log('Received params - className:', className);
      if (classId) {
          loadStudents();
      }
  }, [classId]);

    const loadStudents = async () => {
        try {
            console.log('Loading students for class:', classId);
            setIsLoading(true);
            
            const classStudents = await getClassStudents(classId);
            console.log('Loaded students:', classStudents);
            
            setStudents(classStudents);
            
            // Initialize attendance status
            const initialStatus = {};
            classStudents.forEach(student => {
                initialStatus[student.$id] = false;
            });
            setAttendanceStatus(initialStatus);
        } catch (error) {
            console.error('Error in loadStudents:', error);
            Alert.alert('Error', 'Failed to load students');
        } finally {
            setIsLoading(false);
        }
    }

    const toggleAttendance = (studentId) => {
        setAttendanceStatus(prev => ({
            ...prev,
            [studentId]: !prev[studentId]
        }))
    }

    const handleRemoveStudent = (studentId) => {
        Alert.alert(
            'Remove Student',
            'Are you sure you want to remove this student?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => {
                        // Add remove student logic here
                        console.log('Removing student:', studentId)
                    }
                }
            ]
        )
    }

    const formatStudentId = (id: string) => {
      if (id.length < 4) return id;
      return `${id.slice(0, 2)}-${id.slice(-2)}`;
  };

    return (
        <SafeAreaView className="bg-primary h-full">
            <ScrollView>
                <View className="px-4 py-6">
                    <Text className="text-2xl text-white font-semibold mb-6">
                         Attendance Record - {className}
                    </Text>

                    {isLoading ? (
                        <Text className="text-white text-center">Loading students...</Text>
                    ) : (
                        <View>
                            {/* Table Header */}
                            <View className="flex-row bg-secondary p-3 rounded-t-lg">
                                <Text className="flex-1 text-white font-medium">SID</Text>
                                <Text className="flex-1 text-white font-medium">Name</Text>
                                <Text className="flex-1 text-white font-medium">Status</Text>
                                <Text className="flex-1 text-white font-medium">Present</Text>
                                <Text className="flex-1 text-white font-medium">Action</Text>
                            </View>

                            {/* Table Body */}
                            {students.map((student) => (
                                <View 
                                    key={student.$id}
                                    className="flex-row bg-gray-800 p-3 border-b border-gray-700 items-center"
                                >
                                    <Text className="flex-1 text-white">
                                        {formatStudentId(student.$id)}
                                    </Text>
                                    <Text className="flex-1 text-white">
                                        {student.username}
                                    </Text>
                                    <Text className={`flex-1 text-xs font-medium ${
                                        student.status === 'approved' 
                                            ? 'text-green-500' 
                                            : 'text-yellow-500'
                                    }`}>
                                        {student.status}
                                    </Text>
                                    <View className="flex-1 items-center">
                                        <Text className="text-white">
                                            {attendanceStatus[student.$id] ? 'Yes' : 'No'}
                                        </Text>
                                    </View>
                                    <TouchableOpacity 
                                        className="flex-1 items-center"
                                        onPress={() => handleRemoveStudent(student.$id)}
                                    >
                                        <MaterialIcons name="remove-circle" size={24} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            ))}

                            {students.length === 0 && (
                                <Text className="text-white text-center py-4">
                                    No students found in this class.
                                </Text>
                            )}
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default ViewAttendance