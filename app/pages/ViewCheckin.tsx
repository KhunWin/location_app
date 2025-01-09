
// import { View, Text, ScrollView, Alert } from 'react-native';
// import React, { useState, useEffect } from 'react';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { useLocalSearchParams } from 'expo-router';
// import { getClassAttendanceDays } from '../../lib/appwrite'; // Function to fetch attendance_days
// import { getStudentById } from '../../lib/appwrite'; // Function to fetch student details by ID
// import { MaterialIcons } from '@expo/vector-icons';

// const ViewCheckin = () => {
//     const { classId, className } = useLocalSearchParams();
//     const [attendanceRecords, setAttendanceRecords] = useState([]);
//     const [isLoading, setIsLoading] = useState(true);

//     const targetAttendanceCode = 'PSH47L'; // The specific attendance code to filter

//     useEffect(() => {
//         console.log('\n=== ViewCheckin Component Mounted ===');
//         console.log('Received params - classId:', classId);
//         console.log('Received params - className:', className);

//         if (classId) {
//             loadAttendanceRecords();
//         }
//     }, [classId]);

//     const loadAttendanceRecords = async () => {
//         try {
//             console.log('Loading attendance records for class:', classId);
//             setIsLoading(true);

//             // Fetch attendance_days for the class
//             const days = await getClassAttendanceDays(classId);
//             console.log('Loaded attendance days:', days);

//             // Find the session with the specific attendance code
//             const targetSession = days.find(
//                 (session) => session.attendance_code === targetAttendanceCode
//             );

//             if (!targetSession) {
//                 console.log('No session found with the specified attendance code.');
//                 setAttendanceRecords([]);
//                 return;
//             }

//             console.log('Target session:', targetSession);

//             // Fetch student details for each record in the session
//             const recordsWithDetails = await Promise.all(
//                 targetSession.records.map(async (record) => {
//                     const student = await getStudentById(record.student_id); // Fetch student details
//                     return {
//                         ...record,
//                         name: student.username || 'Unknown', // Use student username or fallback to 'Unknown'
//                     };
//                 })
//             );

//             console.log('Records with student details:', recordsWithDetails);

//             setAttendanceRecords(recordsWithDetails);
//         } catch (error) {
//             console.error('Error in loadAttendanceRecords:', error);
//             Alert.alert('Error', 'Failed to load attendance records');
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const formatStudentId = (id: string) => {
//         if (id.length < 4) return id;
//         return `${id.slice(0, 2)}-${id.slice(-2)}`;
//     };

//     return (
//         <SafeAreaView className="bg-primary h-full">
//             <ScrollView>
//                 <View className="px-4 py-6">
//                     <Text className="text-2xl text-white font-semibold mb-6">
//                         Attendance Records for Code: {targetAttendanceCode}
//                     </Text>

//                     {isLoading ? (
//                         <Text className="text-white text-center">Loading attendance records...</Text>
//                     ) : (
//                         <View>
//                             {/* Table Header */}
//                             <View className="flex-row bg-secondary p-3 rounded-t-lg">
//                                 <Text className="flex-1 text-white font-medium">SID</Text>
//                                 <Text className="flex-1 text-white font-medium">Name</Text>
//                                 <Text className="flex-1 text-white font-medium">Status</Text>
//                             </View>

//                             {/* Attendance Records */}
//                             {attendanceRecords.length > 0 ? (
//                                 attendanceRecords.map((record, index) => (
//                                     <View
//                                         key={index}
//                                         className="flex-row bg-gray-800 p-3 border-b border-gray-700 items-center"
//                                     >
//                                         <Text className="flex-1 text-white">
//                                             {formatStudentId(record.student_id)}
//                                         </Text>
//                                         <Text className="flex-1 text-white">{record.name}</Text>
//                                         <Text
//                                             className={`flex-1 text-center font-medium ${
//                                                 record.status === 'present'
//                                                     ? 'text-green-500'
//                                                     : 'text-red-500'
//                                             }`}
//                                         >
//                                             {record.status === 'present' ? 'Present' : 'Absent'}
//                                         </Text>
//                                     </View>
//                                 ))
//                             ) : (
//                                 <Text className="text-white text-center py-4">
//                                     No attendance records found for this session.
//                                 </Text>
//                             )}
//                         </View>
//                     )}
//                 </View>
//             </ScrollView>
//         </SafeAreaView>
//     );
// };

// export default ViewCheckin;

import { View, Text, ScrollView, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { getClassAttendanceDays } from '../../lib/appwrite'; // Function to fetch attendance_days
import { getStudentById } from '../../lib/appwrite'; // Function to fetch student details by ID

const ViewCheckin = () => {
    const { classId, className, attendanceCode, sessionTitle } = useLocalSearchParams();
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        console.log('\n=== ViewCheckin Component Mounted ===');
        console.log('Received params - classId:', classId);
        console.log('Received params - className:', className);
        console.log('Received params - attendanceCode:', attendanceCode);

        if (classId && attendanceCode) {
            loadAttendanceRecords();
        }
    }, [classId, attendanceCode]);

    const loadAttendanceRecords = async () => {
        try {
            console.log('Loading attendance records for class:', classId);
            setIsLoading(true);

            // Fetch attendance_days for the class
            const days = await getClassAttendanceDays(classId);
            console.log('Loaded attendance days:', days);

            // Find the session with the specific attendance code
            const targetSession = days.find(
                (session) => session.attendance_code === attendanceCode
            );

            if (!targetSession) {
                console.log('No session found with the specified attendance code.');
                setAttendanceRecords([]);
                return;
            }

            console.log('Target session:', targetSession);

            // Fetch student details for each record in the session
            const recordsWithDetails = await Promise.all(
                targetSession.records.map(async (record) => {
                    const student = await getStudentById(record.student_id); // Fetch student details
                    return {
                        ...record,
                        name: student.username || 'Unknown', // Use student username or fallback to 'Unknown'
                    };
                })
            );

            console.log('Records with student details:', recordsWithDetails);

            setAttendanceRecords(recordsWithDetails);
        } catch (error) {
            console.error('Error in loadAttendanceRecords:', error);
            Alert.alert('Error', 'Failed to load attendance records');
        } finally {
            setIsLoading(false);
        }
    };

    const formatStudentId = (id: string) => {
        if (id.length < 4) return id;
        return `${id.slice(0, 2)}-${id.slice(-2)}`;
    };

    return (
        <SafeAreaView className="bg-primary h-full">
            <ScrollView>
                <View className="px-4 py-6">
                    <Text className="text-2xl text-white font-semibold mb-6">
                        {/* Check-in Records for: {sessionTitle} ({attendanceCode}) */}
                        Check-in Records: {sessionTitle}
                    </Text>

                    {isLoading ? (
                        <Text className="text-white text-center">Loading attendance records...</Text>
                    ) : (
                        <View>
                            {/* Table Header */}
                            <View className="flex-row bg-secondary p-3 rounded-t-lg">
                                <Text className="flex-1 text-white font-medium">SID</Text>
                                <Text className="flex-1 text-white font-medium">Name</Text>
                                <Text className="flex-1 text-white font-medium">Status</Text>
                            </View>

                            {/* Attendance Records */}
                            {attendanceRecords.length > 0 ? (
                                attendanceRecords.map((record, index) => (
                                    <View
                                        key={index}
                                        className="flex-row bg-gray-800 p-3 border-b border-gray-700 items-center"
                                    >
                                        <Text className="flex-1 text-white">
                                            {formatStudentId(record.student_id)}
                                        </Text>
                                        <Text className="flex-1 text-white">{record.name}</Text>
                                        <Text
                                            className={`flex-1 text-center font-medium ${
                                                record.status === 'present'
                                                    ? 'text-green-500'
                                                    : 'text-red-500'
                                            }`}
                                        >
                                            {record.status === 'present' ? 'Present' : 'Absent'}
                                        </Text>
                                    </View>
                                ))
                            ) : (
                                <Text className="text-white text-center py-4">
                                    No attendance records found for this session.
                                </Text>
                            )}
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default ViewCheckin;