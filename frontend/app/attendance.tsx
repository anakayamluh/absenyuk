import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import MapView, { Marker, Circle, UrlTile } from 'react-native-maps';
import * as Location from 'expo-location';
import * as LocalAuthentication from 'expo-local-authentication';
import { useTheme } from '../context/ThemeContext';
import { attendanceService, pb } from '../services/api';
import { queueAttendance, syncOfflineData } from '../services/offlineSync';
import { useRouter } from 'expo-router';
import { Camera as CameraIcon, MapPin, ShieldCheck, UserCheck } from 'lucide-react-native';
import LivenessCamera from '../components/LivenessCamera';
import { Modal } from 'react-native';

const CARTO_TILE_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

export default function AttendanceScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [location, setLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isWithin, setIsWithin] = useState(false);
  const [site, setSite] = useState<any>(null);
  const [showLiveness, setShowLiveness] = useState(false);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for attendance.');
        router.back();
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);

      // Check geofence via backend API
      try {
        const result = await attendanceService.checkGeofence(loc.coords.latitude, loc.coords.longitude);
        setIsWithin(result.is_within);
        setSite(result.site);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleClockIn = async () => {
    if (!isWithin) {
      Alert.alert('Out of Range', 'You must be within a registered site geofence to clock in.');
      return;
    }

    // 1. Biometric Authentication
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (hasHardware) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verify your identity for Attendance',
        fallbackLabel: 'Use Passcode',
      });
      if (!result.success) return;
    }

    // 2. Liveness Detection (Vision Camera)
    setShowLiveness(true);
  };

  const onLivenessVerified = async (blink: boolean, smile: boolean) => {
    setShowLiveness(false);
    try {
      // Validate liveness via API
      await attendanceService.validateLiveness(blink, smile);

      // Submit Attendance Log
      const attendanceData = {
        user: pb.authStore.model?.id,
        type: 'clock_in',
        timestamp: new Date().toISOString(),
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        is_biometric_verified: true,
        blink_detected: blink,
        smile_detected: smile,
        site: site?.id,
      };

      try {
        await attendanceService.submitAttendance(attendanceData);
        Alert.alert('Success', 'Clock-in successful!');
      } catch (err) {
        // Queue for offline sync if network fails
        queueAttendance(attendanceData);
        Alert.alert('Offline', 'No connection. Attendance queued and will sync automatically when online.');
      }
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit attendance.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
      >
        <UrlTile urlTemplate={CARTO_TILE_URL} maximumZ={19} flipY={false} />

        <Marker coordinate={location.coords}>
          <View style={[styles.marker, { backgroundColor: colors.primary }]}>
            <UserCheck color="#fff" size={20} />
          </View>
        </Marker>

        {site && (
          <Circle
            center={{ latitude: location.coords.latitude, longitude: location.coords.longitude }}
            radius={100} // Radius from site data
            fillColor="rgba(0, 183, 74, 0.2)"
            strokeColor={colors.success}
          />
        )}
      </MapView>

      <Modal visible={showLiveness} animationType="slide">
        <LivenessCamera
          onVerified={onLivenessVerified}
          onClose={() => setShowLiveness(false)}
        />
      </Modal>

      <View style={[styles.bottomSheet, { backgroundColor: colors.card }]}>
        <View style={styles.statusRow}>
          <MapPin color={isWithin ? colors.success : colors.error} size={24} />
          <Text style={[styles.statusText, { color: colors.text }]}>
            {isWithin ? `At ${site?.name || 'Site'}` : 'Outside registered site'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: isWithin ? colors.primary : colors.secondary }]}
          onPress={handleClockIn}
        >
          <ShieldCheck color="#fff" size={24} style={{ marginRight: 10 }} />
          <Text style={styles.actionButtonText}>Clock In Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    flex: 1,
  },
  marker: {
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
  },
  bottomSheet: {
    padding: 25,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
