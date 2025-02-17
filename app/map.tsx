import { View, Text, Dimensions, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import MapView, { Marker, Circle } from 'react-native-maps';
import Slider from '@react-native-community/slider';
import { getUserClasses } from '../lib/appwrite';
import { Stack } from 'expo-router';

const Map = () => {
  const [region, setRegion] = useState({
    latitude: 37.78825,  // Default coordinates (you should set this to your default location)
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [radius, setRadius] = useState(2000); // 2km in meters
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const allClasses = await getUserClasses();
      console.log('Retrieved classes:', allClasses);
  
      // Process classes to extract locations
      const classesWithLocations = allClasses.map(classItem => {
        let location = null;
        if (classItem.class_location && classItem.class_location[0]) {
          try {
            location = JSON.parse(classItem.class_location[0]);
            console.log(`Parsed location for class ${classItem.class_name}:`, location);
          } catch (error) {
            console.error(`Error parsing location for class ${classItem.class_name}:`, error);
          }
        }
        return {
          ...classItem,
          parsedLocation: location
        };
      });
  
      console.log('Processed classes with locations:', classesWithLocations);
      setClasses(classesWithLocations);
  
      // If there are classes with locations, center the map on the first one
      const firstClassWithLocation = classesWithLocations.find(c => c.parsedLocation);
      if (firstClassWithLocation?.parsedLocation) {
        setRegion({
          latitude: firstClassWithLocation.parsedLocation.latitude,
          longitude: firstClassWithLocation.parsedLocation.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      }
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const zoomIn = () => {
    setRegion(prev => ({
      ...prev,
      latitudeDelta: prev.latitudeDelta / 2,
      longitudeDelta: prev.longitudeDelta / 2,
    }));
  };

  const zoomOut = () => {
    setRegion(prev => ({
      ...prev,
      latitudeDelta: prev.latitudeDelta * 2,
      longitudeDelta: prev.longitudeDelta * 2,
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Class Map' }} />
      
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
        >
          {/* Current location circle */}
          <Circle
            center={region}
            radius={radius}
            fillColor="rgba(0, 128, 255, 0.2)"
            strokeColor="rgba(0, 128, 255, 0.5)"
          />

          {/* Class markers */}
          {/* Update the Marker section in the MapView */}
          {classes.map((classItem) => (
            classItem.parsedLocation && (
              <Marker
                key={classItem.$id}
                coordinate={{
                  latitude: classItem.parsedLocation.latitude,
                  longitude: classItem.parsedLocation.longitude,
                }}
                title={classItem.class_name}
                description={`Class ID: ${classItem.class_id}`}
              />
            )
          ))}
        </MapView>

        <View style={styles.zoomButtons}>
          <TouchableOpacity style={styles.zoomButton} onPress={zoomIn}>
            <Text style={styles.zoomButtonText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.zoomButton} onPress={zoomOut}>
            <Text style={styles.zoomButtonText}>-</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>
          Radius: {(radius / 1000).toFixed(1)}km
        </Text>
        <Slider
          style={styles.slider}
          minimumValue={100}
          maximumValue={2000}
          value={radius}
          onValueChange={setRadius}
          minimumTrackTintColor="#007AFF"
          maximumTrackTintColor="#000000"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height *0.65,
    marginTop: -60,
  },
  sliderContainer: {
    padding: 20,
    backgroundColor: 'white',
    marginTop: -10, 
  },
  sliderLabel: {
    textAlign: 'center',
    marginBottom: -10,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  mapContainer: {
    position: 'relative',
    height: Dimensions.get('window').height * 0.7,
  },
  zoomButtons: {
    position: 'absolute',
    right: 16,
    top: 16,
    backgroundColor: 'transparent',
  },
  zoomButton: {
    width: 40,
    height: 40,
    backgroundColor: 'white',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  zoomButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
});

export default Map;