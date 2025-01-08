

// // export default Create
// import { View, Text, TextInput, Button, StyleSheet } from 'react-native'
// import React, { useEffect } from 'react'
// import { useState } from 'react'
// import * as Location from 'expo-location'
// import { StatusBar } from 'expo-status-bar';

// export default function Create() {
//   const [location, setLocation] = useState<Location.LocationObject | null>(null);
//   const [address, setAddress] = useState('');
//   const [geocodeResult, setGeocodeResult] = useState<Location.LocationGeocodedAddress[]>([]);
//   const [currentAddress, setCurrentAddress] = useState<Location.LocationGeocodedAddress | null>(null);

//   useEffect(() => {
//     const getPermission = async () => {
//       let { status } = await Location.requestForegroundPermissionsAsync();

//       if (status !== 'granted') {
//         console.log('Permission to access location was denied');
//         return;
//       }

//       try {
//         let currentLocation = await Location.getCurrentPositionAsync({});
//         setLocation(currentLocation);

//         // Reverse geocode the current location
//         const reverseGeocode = await Location.reverseGeocodeAsync({
//           latitude: currentLocation.coords.latitude,
//           longitude: currentLocation.coords.longitude
//         });

//         if (reverseGeocode.length > 0) {
//           setCurrentAddress(reverseGeocode[0]);
//           console.log('Current Location Details:', reverseGeocode[0]);
//         }
//       } catch (error) {
//         console.error('Error getting location or reverse geocoding:', error);
//       }
//     };
//     getPermission();
//   }, []);

//   const geocode = async () => {
//     try {
//       const geocodedLocation = await Location.geocodeAsync(address);
//       setGeocodeResult(geocodedLocation);
      
//       if (geocodedLocation.length > 0) {
//         // Get address details for searched location
//         const addressDetails = await Location.reverseGeocodeAsync({
//           latitude: geocodedLocation[0].latitude,
//           longitude: geocodedLocation[0].longitude
//         });
        
//         if (addressDetails.length > 0) {
//           console.log('Searched Location Details:', addressDetails[0]);
//         }
//       }
//     } catch (error) {
//       console.error("Geocoding error:", error);
//     }
//   }

//   return (
//     <View style={styles.container}>
//       <TextInput 
//         style={styles.input}
//         placeholder="Enter address" 
//         value={address} 
//         onChangeText={setAddress}
//       />
//       <Button title="Geocode" onPress={geocode} />
      
//       {location && currentAddress && (
//         <View style={styles.resultContainer}>
//           <Text style={styles.headerText}>Current Location:</Text>
//           <Text>Latitude: {location.coords.latitude}</Text>
//           <Text>Longitude: {location.coords.longitude}</Text>
//           <Text style={styles.headerText}>Current Address:</Text>
//           <Text>{currentAddress.street || ''}</Text>
//           <Text>{`${currentAddress.city || ''} ${currentAddress.region || ''} ${currentAddress.postalCode || ''}`}</Text>
//           <Text>{currentAddress.country || ''}</Text>
//           <Text>District: {currentAddress.district || ''}</Text>
//           <Text>Subregion: {currentAddress.subregion || ''}</Text>
//         </View>
//       )}
      
//       {geocodeResult.length > 0 && (
//         <View style={styles.resultContainer}>
//           <Text style={styles.headerText}>Searched Location:</Text>
//           <Text>Latitude: {geocodeResult[0].latitude}</Text>
//           <Text>Longitude: {geocodeResult[0].longitude}</Text>
//         </View>
//       )}
      
//       <StatusBar style="auto" />
//     </View>
//   )
// }

// // const styles = StyleSheet.create({
// //   container: {
// //     flex: 1,
// //     justifyContent: 'center',
// //     alignItems: 'center',
// //     backgroundColor: '#fff',
// //     padding: 20
// //   },
// //   input: {
// //     width: '100%',
// //     height: 40,
// //     borderWidth: 1,
// //     borderColor: '#ccc',
// //     borderRadius: 5,
// //     paddingHorizontal: 10,
// //     marginBottom: 20
// //   },
// //   resultContainer: {
// //     marginTop: 20,
// //     padding: 10,
// //     borderWidth: 1,
// //     borderColor: '#ccc',
// //     borderRadius: 5,
// //     width: '100%'
// //   },
// //   headerText: {
// //     fontWeight: 'bold',
// //     marginTop: 10,
// //     marginBottom: 5
// //   }
// // });


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
