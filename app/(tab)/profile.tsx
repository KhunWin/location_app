import { StyleSheet, Text, View, Image, TouchableOpacity, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { images } from '../../constants'
import { icons } from '../../constants'
import { getCurrentUser, logoutUser } from '../../lib/appwrite'
import { useGlobalContext } from '../../context/GlobalProvider'
import { router } from 'expo-router'

// const Profile = () => {
//   const { setIsLoggedIn, setUser } = useGlobalContext();
//   const [userData, setUserData] = useState(null);

//   useEffect(() => {
//     fetchUserData();
//   }, []);

//   const fetchUserData = async () => {
//     try {
//       const user = await getCurrentUser();
//       setUserData(user);
//     } catch (error) {
//       console.log("Error fetching user data:", error);
//     }
//   };

//   const handleLogout = async () => {
//     try {
//       await logoutUser();
//       setIsLoggedIn(false);
//       setUser(null);
//       router.replace('/sign-in');
//     } catch (error) {
//       Alert.alert('Error', 'Failed to logout. Please try again.');
//     }
//   };

//   const handleClassesPress = () => {
//     router.push('/home');
//   };

//   const handleAttendancePress = () => {
//     // To be implemented
//     Alert.alert('Coming Soon', 'Attendance record feature is coming soon!');
//   };

//   return (
//     <SafeAreaView className="bg-primary h-full">
//       <View className="items-center mt-8">
//         <View className="w-32 h-32 rounded-full bg-white justify-center items-center overflow-hidden">
//           <Image 
//             source={images.profile}
//             className="w-full h-full"
//             resizeMode="cover"
//           />
//         </View>

//         <Text className="text-white text-2xl font-psemibold mt-4">
//           {userData?.username || 'Loading...'}
//         </Text>
//         <Text className="text-gray-300 text-lg font-pregular mt-1 capitalize">
//           {userData?.role || 'Loading...'}
//         </Text>

//         <View className="w-full px-6 mt-12">
//           {/* Attendance Record Button */}
//           <TouchableOpacity 
//             className="flex-row items-center bg-secondary/10 p-4 rounded-xl mb-4"
//             onPress={handleAttendancePress}
//           >
//             <Image source={icons.record} className="w-6 h-6 tint-color-white" />
//             <Text className="text-white text-lg font-psemibold ml-4">Attendance Record</Text>
//           </TouchableOpacity>

//           {/* Classes Button */}
//           <TouchableOpacity 
//             className="flex-row items-center bg-secondary/10 p-4 rounded-xl mb-4"
//             onPress={handleClassesPress}
//           >
//             <Image source={icons.list1} className="w-6 h-6 tint-color-white" />
//             <Text className="text-white text-lg font-psemibold ml-4">Classes</Text>
//           </TouchableOpacity>

//           {/* Logout Button */}
//           <TouchableOpacity 
//             className="flex-row items-center bg-red-500/20 p-4 rounded-xl"
//             onPress={handleLogout}
//           >
//             <Image source={icons.logout} className="w-6 h-6 tint-color-white" />
//             <Text className="text-red-500 text-lg font-psemibold ml-4">Logout</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </SafeAreaView>
//   )
// }

const Profile = () => {
  const { setIsLoggedIn, setUser } = useGlobalContext();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const user = await getCurrentUser();
      setUserData(user);
    } catch (error) {
      console.log("Error fetching user data:", error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "No",
          style: "cancel"
        },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            try {
              await logoutUser();
              setIsLoggedIn(false);
              setUser(null);
              router.replace('/sign-in');
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ],
      { cancelable: true }
    );
  };

  const handleClassesPress = () => {
    router.push('/home');
  };

  const handleAttendancePress = () => {
    // To be implemented
    Alert.alert('Coming Soon', 'Attendance record feature is coming soon!');
  };

  return (
    <SafeAreaView className="bg-primary h-full">
      <View className="items-center mt-8">
        <View className="w-32 h-32 rounded-full bg-white justify-center items-center overflow-hidden">
          <Image 
            source={images.profile}
            className="w-full h-full"
            resizeMode="cover"
          />
        </View>

        <Text className="text-white text-2xl font-psemibold mt-4">
          {userData?.username || 'Loading...'}
        </Text>
        <Text className="text-gray-300 text-lg font-pregular mt-1 capitalize">
          {userData?.role || 'Loading...'}
        </Text>

        <View className="w-full px-6 mt-12">
          {/* Attendance Record Button */}
          <TouchableOpacity 
            className="flex-row items-center bg-secondary/10 p-4 rounded-xl mb-4"
            onPress={handleAttendancePress}
          >
            <Image source={icons.record} className="w-6 h-6 tint-color-white" />
            <Text className="text-white text-lg font-psemibold ml-4">Attendance Record</Text>
          </TouchableOpacity>

          {/* Classes Button */}
          <TouchableOpacity 
            className="flex-row items-center bg-secondary/10 p-4 rounded-xl mb-4"
            onPress={handleClassesPress}
          >
            <Image source={icons.list1} className="w-6 h-6 tint-color-white" />
            <Text className="text-white text-lg font-psemibold ml-4">Classes</Text>
          </TouchableOpacity>

          {/* Logout Button */}
          <TouchableOpacity 
            className="flex-row items-center bg-red-500/20 p-4 rounded-xl"
            onPress={handleLogout}
          >
            <Image source={icons.logout} className="w-6 h-6 tint-color-white" />
            <Text className="text-red-500 text-lg font-psemibold ml-4">Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}


export default Profile