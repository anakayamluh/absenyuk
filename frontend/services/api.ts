import PocketBase from 'pocketbase';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

const PB_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8080';
export const pb = new PocketBase(PB_URL);

export const getDeviceId = () => {
  return Device.osInternalBuildId || Device.deviceName || 'unknown_device';
};

export const authService = {
  login: async (username, password) => {
    const deviceId = getDeviceId();
    try {
      // In PocketBase, custom auth logic can be handled via beforeAuth hooks (already implemented)
      // or we can pass custom data in the request.
      const authData = await pb.collection('users').authWithPassword(username, password, {
        device_id: deviceId, // This is caught by our auth.pb.js hook
      });
      return authData;
    } catch (error) {
      throw error;
    }
  },
  logout: () => {
    pb.authStore.clear();
  },
  isAuthenticated: () => {
    return pb.authStore.isValid;
  }
};

export const attendanceService = {
  checkGeofence: async (latitude, longitude) => {
    return await pb.send('/api/absenlah/geofence-check', {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude }),
    });
  },
  validateLiveness: async (blinkDetected, smileDetected) => {
    return await pb.send('/api/absenlah/validate-liveness', {
      method: 'POST',
      body: JSON.stringify({ blink_detected: blinkDetected, smile_detected: smileDetected }),
    });
  },
  submitAttendance: async (data) => {
    return await pb.collection('attendance_logs').create(data);
  }
};

export const leaveService = {
  requestLeave: async (data) => {
    return await pb.collection('leave_requests').create(data);
  },
  getHistory: async (userId) => {
    return await pb.collection('attendance_logs').getList(1, 50, {
      filter: `user = "${userId}"`,
      sort: '-timestamp',
    });
  }
};
