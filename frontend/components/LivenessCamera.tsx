import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { Camera, useCameraDevice, useFrameProcessor } from 'react-native-vision-camera';
import { detectFaces, Face } from 'react-native-vision-camera-face-detector';
import { useTheme } from '../context/ThemeContext';
import { X, Camera as CameraIcon } from 'lucide-react-native';
import { runAtTargetFps } from 'react-native-worklets-core';
import { runOnJS } from 'react-native-reanimated';

interface LivenessCameraProps {
  onVerified: (blink: boolean, smile: boolean) => void;
  onClose: () => void;
}

export default function LivenessCamera({ onVerified, onClose }: LivenessCameraProps) {
  const { colors } = useTheme();
  const device = useCameraDevice('front');
  const [hasPermission, setHasPermission] = useState(false);
  const [blinkDetected, setBlinkDetected] = useState(false);
  const [smileDetected, setSmileDetected] = useState(false);

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    runAtTargetFps(5, () => {
      'worklet';
      const faces = detectFaces(frame);
      if (faces.length > 0) {
        const face = faces[0];

        // Use runOnJS to update React state from the worklet thread
        if (face.leftEyeOpenProbability < 0.3 && face.rightEyeOpenProbability < 0.3) {
          runOnJS(setBlinkDetected)(true);
        }
        if (face.smilingProbability > 0.7) {
          runOnJS(setSmileDetected)(true);
        }
      }
    });
  }, []);

  useEffect(() => {
    if (blinkDetected && smileDetected) {
      onVerified(true, true);
    }
  }, [blinkDetected, smileDetected]);

  // For simulation in the playground environment where camera hardware isn't available,
  // we add a simulated verify button but keep the real architecture.
  const simulateDetection = () => {
    setBlinkDetected(true);
    setSmileDetected(true);
    setTimeout(() => onVerified(true, true), 1000);
  };

  if (!hasPermission) return <Text>No Camera Permission</Text>;
  if (!device) return <Text>No Camera Device</Text>;

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        frameProcessor={frameProcessor}
      />

      <View style={styles.overlay}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <X color="#fff" size={30} />
        </TouchableOpacity>

        <View style={styles.instructions}>
          <Text style={styles.instructionText}>Please Blink and Smile</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusIndicator, { backgroundColor: blinkDetected ? colors.success : colors.error }]} />
            <Text style={styles.statusLabel}>Blink</Text>
            <View style={[styles.statusIndicator, { backgroundColor: smileDetected ? colors.success : colors.error, marginLeft: 20 }]} />
            <Text style={styles.statusLabel}>Smile</Text>
          </View>
        </View>

        {/* Simulator Button for non-real-device environments */}
        <TouchableOpacity style={[styles.simulateBtn, { backgroundColor: colors.primary }]} onPress={simulateDetection}>
          <CameraIcon color="#fff" size={24} />
          <Text style={styles.simulateText}>Simulate Secure Capture</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 30,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  closeBtn: {
    alignSelf: 'flex-end',
    marginTop: 20,
  },
  instructions: {
    alignItems: 'center',
  },
  instructionText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusLabel: {
    color: '#fff',
    fontSize: 14,
  },
  simulateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 40,
  },
  simulateText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  }
});
