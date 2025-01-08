import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { createClassSession, getClassSessions } from '../../lib/appwrite';
import CustomButton from '@/components/CustomButton';


const CreateSession = () => {
    const { classId, className } = useLocalSearchParams();
    const [sessionTitle, setSessionTitle] = useState('');
    const [sessions, setSessions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        loadSessions();
    }, [classId]);

    const loadSessions = async () => {
        try {
            const classSessions = await getClassSessions(classId);
            setSessions(classSessions);
        } catch (error) {
            console.error('Error loading sessions:', error);
            Alert.alert('Error', 'Failed to load sessions');
        }
    };

    const handleCreateSession = async () => {
        if (!sessionTitle.trim()) {
            Alert.alert('Error', 'Please enter a session title');
            return;
        }

        setIsLoading(true);
        try {
            await createClassSession(classId, sessionTitle.trim());
            setSessionTitle('');
            await loadSessions();
            Alert.alert('Success', 'Session created successfully');
        } catch (error) {
            console.error('Error creating session:', error);
            Alert.alert('Error', 'Failed to create session');
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewAttendance = (session) => {
        router.push({
            pathname: '/ViewAttendance',
            params: {
                classId,
                className,
                sessionDate: session.date
            }
        });
    };

    return (
        <SafeAreaView className="bg-primary h-full">
            <ScrollView className="p-4">
                <Text className="text-2xl text-white font-semibold mb-6">
                    Create Session - {className}
                </Text>

                {/* Create Session Section */}
                <View className="flex-row items-center mb-6 gap-4">
                    <TextInput
                        className="flex-1 bg-gray-800 text-white px-4 py-2 rounded"
                        placeholder="Enter Session Title"
                        placeholderTextColor="#666"
                        value={sessionTitle}
                        onChangeText={setSessionTitle}
                    />
                    <CustomButton
                        title="Create"
                        handlePress={handleCreateSession}
                        isLoading={isLoading}
                        containerStyle="bg-secondary px-4"
                    />
                </View>

                {/* Sessions Table */}
                <View>
                    {/* Table Header */}
                    <View className="flex-row bg-secondary p-3 rounded-t-lg">
                        <Text className="flex-1 text-white font-medium">Session</Text>
                        <Text className="flex-1 text-white font-medium">Code</Text>
                        <Text className="flex-1 text-white font-medium">Date</Text>
                        <Text className="flex-1 text-white font-medium">Action</Text>
                    </View>

                    {/* Table Body */}
                    {sessions.map((session, index) => (
                        <View 
                            key={index}
                            className="flex-row bg-gray-800 p-3 border-b border-gray-700 items-center"
                        >
                            <Text className="flex-1 text-white">{session.session_title}</Text>
                            <Text className="flex-1 text-white">{session.attendance_code}</Text>
                            <Text className="flex-1 text-white">{session.date}</Text>
                            <TouchableOpacity 
                                className="flex-1"
                                onPress={() => handleViewAttendance(session)}
                            >
                                <Text className="text-blue-400">View</Text>
                            </TouchableOpacity>
                        </View>
                    ))}

                    {sessions.length === 0 && (
                        <Text className="text-white text-center py-4">
                            No sessions created yet.
                        </Text>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default CreateSession;