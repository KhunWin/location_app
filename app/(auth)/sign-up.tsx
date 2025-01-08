import { View, Text, ScrollView , Image, Alert, } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { images } from '../../constants';
import FormField from '@/components/FormField';
import CustomButton from '@/components/CustomButton';
import { Link, router } from 'expo-router';
import { create } from 'react-test-renderer';
import { createUser, signIn } from '../../lib/appwrite';
import {useGlobalContext} from '../../context/GlobalProvider';
import { Picker } from '@react-native-picker/picker'; // Import dropdown picker (install it if needed)


// const SignIn = () => {

//   const { setUser, setIsLoggedIn } = useGlobalContext();

//   const [form, setForm] = useState({
//     username: '',
//     email: '',
//     password: ''
//   })

//   const [role, setRole] = useState('student'); // Default role is "student"

//   const [isSubmitting, setIsSubmitting] = useState(false)

//   const submit = async () => {
//     if (!form.username || !form.email || !form.password) {
//       Alert.alert('Error', 'All fields are required');
//       return;
//     }

//     setIsSubmitting(true);
//     try {
//       const result = await createUser(form.email, form.password, form.username,role);

//       setUser(result);
//       setIsLoggedIn(true);

//       //set it to global state..
//         router.replace('/home');
      
//     }
//     catch (error) {
//       Alert.alert('Error', error.message);
//     }finally {
//       setIsSubmitting(false);
//     }

//   }

//   return (
//    <SafeAreaView className="bg-primary h-full">
//       <ScrollView>

//         <View className='W-full justify-center min-h-[85vh] px-4 my-6'>

//           <Image source={images.logo} 
//           resizeMode='contain'
//           className="w-[115px] h-[35px]" />

//           <Text className='text-2xl text-white text-semibold mt-10 font-psemibold'>Sign up to Attendance</Text>


//           <FormField 
//             title="Username"
//             value={form.username}
//             handleChangeText={(e) => setForm({...form, username: e})}
//             otherStyles="mt-10"
//             />
          
//           <FormField 
//             title="Email"
//             value={form.email}
//             handleChangeText={(e) => setForm({...form, email: e})}
//             otherStyles="mt-7"
//             keyboardType="email-address"
//             />

//           <FormField 
//             title="Password"
//             value={form.password}
//             handleChangeText={(e) => setForm({...form, password: e})}
//             otherStyles="mt-7"
//             />

//             <View className="mt-4">
//               <Text className="text-lg text-white font-psemibold mb-2">Role</Text>
//               <View
//                 className="bg-white rounded-md w-full mx-atuo justify-center"
//               >
//                 <Picker
//                   selectedValue={role}
//                   onValueChange={(itemValue) => setRole(itemValue)}
//                   style={{ fontSize: 10, height: 140, marginTop: -40}} // Compact Picker
//                   mode="dropdown" // Dropdown mode for Android
//                 >
//                   <Picker.Item label="Student" value="student" />
//                   <Picker.Item label="Teacher" value="teacher" />
//                 </Picker>
//               </View>
//             </View>

//             <CustomButton title='Sign up' handlePress={submit}
//             containerStyle="mt-7" isLoading={isSubmitting}
//                />

//             <View className='justify-center pt-5 flex-row gap-2'>
//               <Text className='text-lg text-gray-100 font-pregular'>Have an account already?</Text>
//               <Link href="/sign-in" className='text-lg font-psemibold text-secondary'> Sign in</Link>

//             </View>
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   )
// }

const SignIn = () => {
  const { setUser, setIsLoggedIn } = useGlobalContext();

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: ''
  });

  const [role, setRole] = useState('student');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    if (!form.username || !form.email || !form.password) {
      Alert.alert('Error', 'All fields are required');
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    // Password validation
    if (form.password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return false;
    }

    return true;
  };

  const submit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const result = await createUser(form.email, form.password, form.username, role);
      
      if (result?.session && result?.user) {
        setUser(result.user);
        setIsLoggedIn(true);
        router.replace('/home');
      } else {
        throw new Error('Failed to create account');
      }
    } catch (error) {
      Alert.alert(
        'Error', 
        error.message || 'Failed to create account. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="bg-primary h-full">
       <ScrollView>

        <View className='W-full justify-center min-h-[85vh] px-4 my-6'>

           <Image source={images.logo} 
          resizeMode='contain'
          className="w-[115px] h-[35px]" />

          <Text className='text-2xl text-white text-semibold mt-10 font-psemibold'>Sign up to Attendance</Text>


          <FormField 
            title="Username"
            value={form.username}
            handleChangeText={(e) => setForm({...form, username: e})}
            otherStyles="mt-10"
            />
          
          <FormField 
            title="Email"
            value={form.email}
            handleChangeText={(e) => setForm({...form, email: e})}
            otherStyles="mt-7"
            keyboardType="email-address"
            />

          <FormField 
            title="Password"
            value={form.password}
            handleChangeText={(e) => setForm({...form, password: e})}
            otherStyles="mt-7"
            />

            <View className="mt-4">
              <Text className="text-lg text-white font-psemibold mb-2">Role</Text>
              <View
                className="bg-white rounded-md w-full mx-atuo justify-center"
              >
                <Picker
                  selectedValue={role}
                  onValueChange={(itemValue) => setRole(itemValue)}
                  style={{ fontSize: 10, height: 140, marginTop: -40}} // Compact Picker
                  mode="dropdown" // Dropdown mode for Android
                >
                  <Picker.Item label="Student" value="student" />
                  <Picker.Item label="Teacher" value="teacher" />
                </Picker>
              </View>
            </View>

            <CustomButton title='Sign up' handlePress={submit}
            containerStyle="mt-7" isLoading={isSubmitting}
               />

            <View className='justify-center pt-5 flex-row gap-2'>
              <Text className='text-lg text-gray-100 font-pregular'>Have an account already?</Text>
              <Link href="/sign-in" className='text-lg font-psemibold text-secondary'> Sign in</Link>

            </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SignIn