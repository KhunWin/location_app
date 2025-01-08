import { Image, StyleSheet, Text, Platform, View, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {Redirect, router} from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { images } from '../constants';
// import { images } from '../../constants';
import "../global.css";
import React from 'react';
import CustomButton from '@/components/CustomButton';
import {useGlobalContext} from '../context/GlobalProvider';


export default function HomeScreen() {

  const {isLoading, isLoggedIn} = useGlobalContext();
  
  // if(!isLoading && isLoggedIn) return <Redirect href="/home" />

  return (
    <SafeAreaView className='bg-primary h-full'>
      <ScrollView contentContainerStyle={{ height: '100%'}}>     
        <View className='w-full justify-center items-center min-h-[85vh] px-4'>
          <Image
            source={images.logo}
            className='w-[130px] h-[84px]'
            resizeMode='contain' 
            />
          <Image 
            source={images.cards}
            className='max-w--[380px] w-full h-[300px]'
            resizeMode='contain' 
              />

          <View className='relative mt-5'>
            <Text className="text-3xl text-white font-bold text-center">Welcome to the App {''}
              <Text className="text-secondary-200"> Attendance</Text>
            </Text>
            <Image
              source={images.path}
              className='w-[136px] h-[15px] absolute -bottom-2 -right-8'
              resizeMode='contain'
              />

          </View>

          <Text className='text-sm font-pregular text-gray-100 mt-7 text-center'> Where records are accurate with Attendance</Text>

          <CustomButton
            title="Continue with Email"
            handlePress={() => router.push('/sign-in')}
            containerStyle="w-full mt-7"
            />
        </View>
      </ScrollView>
      <StatusBar backgroundColor="#161622" style="light" />
    </SafeAreaView>
  );
}


