import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { submitAttendance } from '../lib/appwrite';
import * as Location from 'expo-location';

const AttendanceSessionsTable = ({ sessions, classId, studentId, currentUser }) => {
  const [checkInStatus, setCheckInStatus] = useState({});

  const handleCheckIn = async (session) => {
    try {
      // Request location permission
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Location permission is required for attendance');
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({});
      
      // Submit attendance
      const result = await submitAttendance(
        classId,
        session.attendance_code,
        studentId,
        {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        },
        currentUser
      );

      // Update status in state
      setCheckInStatus(prev => ({
        ...prev,
        [session.attendance_code]: result.status
      }));

    } catch (error) {
      console.error('Check-in error:', error);
      alert('Failed to check in: ' + error.message);
    }
  };

  const getButtonStatus = (session) => {
    // Check if there's an existing record for this session
    const existingRecord = session.records?.find(record => record.student_id === studentId);
    if (existingRecord) {
      return existingRecord.status;
    }
    // Check if there's a new status in our state
    return checkInStatus[session.attendance_code] || 'pending';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.headerCell, { flex: 2 }]}>Session Title</Text>
        <Text style={[styles.headerCell, { flex: 2 }]}>Date</Text>
        <Text style={[styles.headerCell, { flex: 2 }]}>Code</Text>
        <Text style={[styles.headerCell, { flex: 2 }]}>Action</Text>
      </View>

      {sessions.map((session) => {
        const status = getButtonStatus(session);
        
        return (
          <View key={session.attendance_code} style={styles.row}>
            <Text style={[styles.cell, { flex: 2 }]}>{session.session_title}</Text>
            <Text style={[styles.cell, { flex: 2 }]}>{session.date}</Text>
            <Text style={[styles.cell, { flex: 2 }]}>{session.attendance_code}</Text>
            <View style={[styles.cell, { flex: 2 }]}>
              {status === 'pending' ? (
                <TouchableOpacity
                  style={styles.checkInButton}
                  onPress={() => handleCheckIn(session)}
                >
                  <Text style={styles.buttonText}>Check In</Text>
                </TouchableOpacity>
              ) : (
                <Text style={[
                  styles.statusText,
                  { color: status === 'present' ? '#4CAF50' : '#F44336' }
                ]}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 10,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    backgroundColor: '#333',
    padding: 10,
  },
  headerCell: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    padding: 10,
  },
  cell: {
    color: 'white',
    textAlign: 'center',
    justifyContent: 'center',
  },
  checkInButton: {
    backgroundColor: '#2196F3',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  statusText: {
    fontWeight: 'bold',
  },
});

export default AttendanceSessionsTable;