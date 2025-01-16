// import { View, Text, Image } from 'react-native'
// import React from 'react'
// import {Tabs, Redirect} from 'expo-router';
// import {icons} from '../../constants';

// const TabIcon = ({icon, color, name, focused}) => {
//   return (
//     <View className="items-center justify-center gap-2">
//       <Image 
//         source ={icon}
//         resizeMode="contain"
//         tintColor={color}
//         className="w-6 h-6" />

//         <Text className={`${focused ? 'font-psemibold' : 'font-pregular'} text-xs`} style={{color: color}}>
//           {name}
//         </Text>
//     </View>
//   )
// }

// const TabsLayout = () => {
//   return (
//     <>
//     <Tabs screenOptions={{
//       tabBarShowLabel: false,
//       tabBarActiveTintColor: '#FFA001',
//       tabBarInactiveTintColor: '#CDCDE0',
//       tabBarStyle: {
//         backgroundColor: '#161622',
//         borderTopWidth: 1,
//         height: 84
//       }
//     }}>
//       <Tabs.Screen name="home" options={{title: 'Home', headerShown: false, tabBarIcon: ({color, focused}) => (
//           <TabIcon 
//             icon={icons.home}
//             color={color}
//             name="Home"
//             focused={focused}
          
//           />
//       )}}/>

//       <Tabs.Screen name="bookmark" options={{title: 'Bookmark', headerShown: false, tabBarIcon: ({color, focused}) => (
//           <TabIcon 
//             icon={icons.bookmark}
//             color={color}
//             name="MyClass"
//             focused={focused}
          
//           />
//       )}}/>

//       <Tabs.Screen name="create" options={{title: 'Create', headerShown: false, tabBarIcon: ({color, focused}) => (
//           <TabIcon 
//             icon={icons.plus}
//             color={color}
//             name="Create"
//             focused={focused}
          
//           />
//       )}}/>

//       <Tabs.Screen name="profile" options={{title: 'Profile', headerShown: false, tabBarIcon: ({color, focused}) => (
//           <TabIcon 
//             icon={icons.profile}
//             color={color}
//             name="Profile"
//             focused={focused}
          
//           />
//       )}}/>

//     </Tabs>
//     </>
//   )
// }

// export default TabsLayout


import { View, Text, Image } from 'react-native'
import React, { useState, useEffect } from 'react'
import { Tabs, Redirect } from 'expo-router';
import { icons } from '../../constants';
import { getCurrentUser } from '../../lib/appwrite';

const TabIcon = ({icon, color, name, focused}) => {
  return (
    <View className="items-center justify-center gap-2">
      <Image 
        source={icon}
        resizeMode="contain"
        tintColor={color}
        className="w-6 h-6" />

        <Text className={`${focused ? 'font-psemibold' : 'font-pregular'} text-xs`} style={{color: color}}>
          {name}
        </Text>
    </View>
  )
}

const TabsLayout = () => {
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const user = await getCurrentUser();
        console.log('Current user role:', user.role);
        setUserRole(user.role);
      } catch (error) {
        console.error('Error fetching user role:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  if (isLoading) {
    return null;
  }

  return (
    <>
    <Tabs screenOptions={{
      tabBarShowLabel: false,
      tabBarActiveTintColor: '#FFA001',
      tabBarInactiveTintColor: '#CDCDE0',
      tabBarStyle: {
        backgroundColor: '#161622',
        borderTopWidth: 1,
        height: 84
      }
    }}>
      <Tabs.Screen name="home" options={{title: 'Home', headerShown: false, tabBarIcon: ({color, focused}) => (
          <TabIcon 
            icon={icons.home}
            color={color}
            name="Home"
            focused={focused}
          />
      )}}/>

      <Tabs.Screen name="bookmark" options={{title: 'Bookmark', headerShown: false, tabBarIcon: ({color, focused}) => (
          <TabIcon 
            icon={userRole === 'student' ? icons.checkin : icons.bookmark}
            color={color}
            name={userRole === 'student' ? "Checkin" : "MyClass"}
            focused={focused}
          />
      )}}/>

      <Tabs.Screen name="create" options={{title: 'Create', headerShown: false, tabBarIcon: ({color, focused}) => (
          <TabIcon 
            icon={userRole === 'student' ? icons.bookmark : icons.plus}
            color={color}
            name={userRole === 'student' ? "MyClass" :"Create"}
            focused={focused}
          />
      )}}/>

      <Tabs.Screen name="profile" options={{title: 'Profile', headerShown: false, tabBarIcon: ({color, focused}) => (
          <TabIcon 
            icon={icons.profile}
            color={color}
            name="Profile"
            focused={focused}
          />
      )}}/>

    </Tabs>
    </>
  )
}

export default TabsLayout