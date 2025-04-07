
import { View, Text, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getUserClasses, getCurrentUser, listFiles_count } from '@/lib/appwrite';
import { BarChart } from 'react-native-chart-kit';

const Bookmark = () => {
  const [classStats, setClassStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    totalFiles: 0,
    classDetails: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Add userRole to the component state
  const [userRole, setUserRole] = useState(null);

  // Modify loadDashboardData to get user role
  const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        const user = await getCurrentUser(); // Add this line
        setUserRole(user.role); // Add this line
        const classes = await getUserClasses();
        
        let totalStudents = 0;
        let totalFiles = 0;
        let classDetailsArray = [];

        // Process each class
        for (const classItem of classes) {
          const studentCount = classItem.students ? classItem.students.length : 0;
          const files = await listFiles_count(classItem.class_id);
          const fileCount = files.length;

          totalStudents += studentCount;
          totalFiles += fileCount;

          classDetailsArray.push({
            name: classItem.class_name,
            class_id: classItem.class_id,  // Make sure to include class_id
            studentCount,
            classSize: classItem.class_size,
            fileCount
          });
        }

        setClassStats({
          totalClasses: classes.length,
          totalStudents,
          totalFiles,
          classDetails: classDetailsArray
        });

      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setIsLoading(false);
      }
  };

  const StatCard = ({ title, value, subtitle }) => (
    <View className="bg-secondary rounded-xl p-4 m-2 flex-1">
      <Text className="text-white text-lg font-semibold">{title}</Text>
      <Text className="text-white text-2xl font-bold my-2">{value}</Text>
      {subtitle && (
        <Text className="text-gray-300 text-sm">{subtitle}</Text>
      )}
    </View>
  );

  const ClassDetailsTable = ({ classes }) => (
    <View className="bg-secondary rounded-xl p-4 m-2">
      {/* Table Header */}
      <View className="flex-row border-b border-gray-600 pb-2">
        <View className="w-[50%]">
          <Text className="text-white font-semibold text-left">Name</Text>
        </View>
        <View className="w-[25%]">
          <Text className="text-white font-semibold text-center">Students</Text>
        </View>
        <View className="w-[25%]">
          <Text className="text-white font-semibold text-center">Files</Text>
        </View>
      </View>
      
      {/* Table Rows */}
      <ScrollView>
        {classes.map((classInfo, index) => (
          userRole === 'teacher' ? (
            <TouchableOpacity 
              key={index} 
              className="flex-row py-3 border-b border-gray-700"
              onPress={() => router.push({
                pathname: '/pages/ViewEnrolledStudent',
                params: { 
                  classId: classInfo.class_id,
                  className: classInfo.name
                }
              })}
            >
              <View className="w-[50%]">
                <Text className="text-white text-left" numberOfLines={1}>{classInfo.name}</Text>
              </View>
              <View className="w-[25%]">
                <Text className="text-white text-center">{classInfo.studentCount}/{classInfo.classSize}</Text>
              </View>
              <View className="w-[25%]">
                <Text className="text-white text-center">{classInfo.fileCount}</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View 
              key={index} 
              className="flex-row py-3 border-b border-gray-700"
            >
              <View className="w-[50%]">
                <Text className="text-white text-left" numberOfLines={1}>{classInfo.name}</Text>
              </View>
              <View className="w-[25%]">
                <Text className="text-white text-center">{classInfo.studentCount}</Text>
              </View>
              <View className="w-[25%]">
                <Text className="text-white text-center">{classInfo.fileCount}</Text>
              </View>
            </View>
          )
        ))}
      </ScrollView>
    </View>
  );

  // Add this after the ClassDetailsTable component
  const ClassEnrollmentChart = ({ classes }) => {
    // Prepare data for the chart
    const chartData = {
      labels: classes.map(c => c.name.length > 10 ? c.name.substring(0, 10) + '...' : c.name),
      datasets: [
        {
          data: classes.map(c => c.studentCount)
        }
      ]
    };

    return (
      <View className="bg-secondary rounded-xl p-4 m-2 mt-4">
        <Text className="text-white text-xl font-semibold mb-4">Student Enrollment</Text>
        <BarChart
          data={chartData}
          width={screenWidth - 40}
          height={220}
          yAxisSuffix=""
          chartConfig={{
            backgroundColor: '#1e1e30',
            backgroundGradientFrom: '#1e1e30',
            backgroundGradientTo: '#3a3a5a',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(255, 160, 1, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          style={{
            marginVertical: 8,
            borderRadius: 16,
          }}
        />
      </View>
    );
  };

  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView>
        <View className="p-4">
          <Text className="text-white text-2xl font-bold mb-4">
            Dashboard Overview
          </Text>

          {/* Summary Stats */}
          <View className="flex-row flex-wrap">
            <StatCard 
              title="Total Classes" 
              value={classStats.totalClasses}
              subtitle="Active classes"
            />
            <StatCard 
              title="Total Students" 
              value={classStats.totalStudents}
              subtitle="Enrolled students"
            />
            <StatCard 
              title={`Total${'\n'}Files`} 
              value={classStats.totalFiles}
              subtitle="Uploaded documents"
            />
          </View>

          {/* Class Details Table */}
          <Text className="text-white text-xl font-semibold mt-6 mb-2">
            Class Details
          </Text>
          <ClassDetailsTable classes={classStats.classDetails} />
          
          {/* Add the chart component here */}
          {classStats.classDetails.length > 0 && (
            <ClassEnrollmentChart classes={classStats.classDetails} />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Bookmark;
