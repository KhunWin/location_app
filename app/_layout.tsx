import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect } from 'react'
import { Slot, SplashScreen, Stack } from 'expo-router'
import { isLoaded, useFonts } from 'expo-font'
import '../global.css'
import GlobalProvider  from '../context/GlobalProvider'

import { registerForPushNotifications, addNotificationListeners } from '../lib/notifications'
import { registerBackgroundTask, checkTaskRegistration } from '../lib/backgroundTasks'
import { useRouter } from 'expo-router'
import NotificationIcon from '../components/NotificationIcon'
import { NotificationProvider } from '../context/NotificationContext';

SplashScreen.preventAutoHideAsync();



const RootLayout = () => {
  const router = useRouter(); // Add this line to initialize the router
  
  const [fontsLoaded, error] = useFonts({
    "Poppins-Black": require("../assets/fonts/Poppins-Black.ttf"),
    "Poppins-Bold": require("../assets/fonts/Poppins-Bold.ttf"),
    "Poppins-ExtraBold": require("../assets/fonts/Poppins-ExtraBold.ttf"),
    "Poppins-ExtraLight": require("../assets/fonts/Poppins-ExtraLight.ttf"),
    "Poppins-Light": require("../assets/fonts/Poppins-Light.ttf"),
    "Poppins-Medium": require("../assets/fonts/Poppins-Medium.ttf"),
    "Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-SemiBold": require("../assets/fonts/Poppins-SemiBold.ttf"),
    "Poppins-Thin": require("../assets/fonts/Poppins-Thin.ttf"),
  });

  useEffect(() => {
    if (error) {
      throw error;
    }
    if(fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded, error])

  // Push notification setup
  useEffect(() => {
    // Register for push notifications
    const setupNotifications = async () => {
      try {
        await registerForPushNotifications();
        console.log('Push notifications registered');

        // Register background task for check-in reminders
        const isTaskRegistered = await checkTaskRegistration();
        if (!isTaskRegistered) {
          await registerBackgroundTask();
        }
      } catch (error) {
        console.error('Error setting up push notifications:', error);
      }
    };
    
    setupNotifications();
    
    // Add notification listeners
    const unsubscribe = addNotificationListeners(router);
    
    // Cleanup on unmount
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [router]);

  if (!fontsLoaded && !error) {
    return null;
  }

  return (
    <GlobalProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="(tab)" 
          options={{ 
            headerShown: true,
            headerRight: () => <NotificationIcon />
          }} 
        />
        <Stack.Screen 
          name="notifications" 
          options={{ 
            title: "Notifications",
            headerShown: true 
          }} 
        />
        {/* <Stack.Screen name="(tabs)" options={{ headerShown: false }} /> */}
        {/* <Stack.Screen name="/search/[query]" options={{ headerShown: false }} /> */}
      </Stack>
    </GlobalProvider>
  )
}

export default RootLayout


// import { StyleSheet, Text, View } from 'react-native'
// import React, { useEffect } from 'react'
// import { Slot, SplashScreen, Stack } from 'expo-router'
// import { isLoaded, useFonts } from 'expo-font'
// import '../global.css'
// import GlobalProvider  from '../context/GlobalProvider'

// import { registerForPushNotifications, addNotificationListeners } from '../lib/notifications'
// import { registerBackgroundTask, checkTaskRegistration } from '../lib/backgroundTasks'
// import { useRouter, usePathname } from 'expo-router'
// import NotificationIcon from '../components/NotificationIcon'
// import { NotificationProvider, useNotifications } from '../context/NotificationContext';

// SplashScreen.preventAutoHideAsync();

// // Wrap the main layout in a component that can use hooks
// const NavigationWrapper = ({ children }) => {
//   const router = useRouter();
//   const pathname = usePathname();
//   const { refreshNotifications } = useNotifications();
  
//   // Refresh notifications when navigating to the notifications screen
//   useEffect(() => {
//     if (pathname === '/notifications') {
//       console.log('Navigated to notifications screen, refreshing...');
//       refreshNotifications();
//     }
//   }, [pathname]);
  
//   return children;
// };

// const RootLayout = () => {
//   const router = useRouter(); // Add this line to initialize the router
  
//   const [fontsLoaded, error] = useFonts({
//     "Poppins-Black": require("../assets/fonts/Poppins-Black.ttf"),
//     "Poppins-Bold": require("../assets/fonts/Poppins-Bold.ttf"),
//     "Poppins-ExtraBold": require("../assets/fonts/Poppins-ExtraBold.ttf"),
//     "Poppins-ExtraLight": require("../assets/fonts/Poppins-ExtraLight.ttf"),
//     "Poppins-Light": require("../assets/fonts/Poppins-Light.ttf"),
//     "Poppins-Medium": require("../assets/fonts/Poppins-Medium.ttf"),
//     "Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
//     "Poppins-SemiBold": require("../assets/fonts/Poppins-SemiBold.ttf"),
//     "Poppins-Thin": require("../assets/fonts/Poppins-Thin.ttf"),
//   });

//   useEffect(() => {
//     if (error) {
//       throw error;
//     }
//     if(fontsLoaded) SplashScreen.hideAsync();
//   }, [fontsLoaded, error])

//   // Push notification setup
//   useEffect(() => {
//     // Register for push notifications
//     const setupNotifications = async () => {
//       try {
//         await registerForPushNotifications();
//         console.log('Push notifications registered');

//         // Register background task for check-in reminders
//         const isTaskRegistered = await checkTaskRegistration();
//         if (!isTaskRegistered) {
//           await registerBackgroundTask();
//         }
//       } catch (error) {
//         console.error('Error setting up push notifications:', error);
//       }
//     };
    
//     setupNotifications();
    
//     // Add notification listeners
//     const unsubscribe = addNotificationListeners(router);
    
//     // Cleanup on unmount
//     return () => {
//       if (unsubscribe) unsubscribe();
//     };
//   }, [router]);

//   if (!fontsLoaded && !error) {
//     return null;
//   }

//   return (
//     <GlobalProvider>
//       <NotificationProvider>
//         <NavigationWrapper>
//           <Stack>
//             <Stack.Screen name="index" options={{ headerShown: false }} />
//             <Stack.Screen name="(auth)" options={{ headerShown: false }} />
//             <Stack.Screen 
//               name="(tab)" 
//               options={{ 
//                 headerShown: true,
//                 headerRight: () => <NotificationIcon />
//               }} 
//             />
//             <Stack.Screen 
//               name="notifications" 
//               options={{ 
//                 title: "Notifications",
//                 headerShown: false // Changed to false since we have our own header
//               }} 
//             />
//             {/* <Stack.Screen name="(tabs)" options={{ headerShown: false }} /> */}
//             {/* <Stack.Screen name="/search/[query]" options={{ headerShown: false }} /> */}
//           </Stack>
//         </NavigationWrapper>
//       </NotificationProvider>
//     </GlobalProvider>
//   )
// }

// export default RootLayout

