import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { leaveService, pb } from '../../services/api';
import { useRouter } from 'expo-router';
import { Calendar as CalendarIcon, FileText, Send } from 'lucide-react-native';

export default function LeaveRequestScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = async () => {
    if (!reason) {
      Alert.alert('Error', 'Please provide a reason for your leave.');
      return;
    }

    try {
      await leaveService.requestLeave({
        user: pb.authStore.model?.id,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        reason,
        status: 'pending',
      });

      Alert.alert('Success', 'Leave request submitted successfully.');
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit leave request.');
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.label, { color: colors.text }]}>Reason for Leave</Text>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          placeholder="e.g. Medical checkup, Family event"
          placeholderTextColor={colors.secondary}
          value={reason}
          onChangeText={setReason}
          multiline
        />

        <Text style={[styles.label, { color: colors.text }]}>Start Date (YYYY-MM-DD)</Text>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          value={startDate}
          onChangeText={setStartDate}
        />

        <Text style={[styles.label, { color: colors.text }]}>End Date (YYYY-MM-DD)</Text>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          value={endDate}
          onChangeText={setEndDate}
        />

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.primary }]}
          onPress={handleSubmit}
        >
          <Send color="#fff" size={20} style={{ marginRight: 10 }} />
          <Text style={styles.submitButtonText}>Submit Request</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <FileText color={colors.secondary} size={20} />
        <Text style={[styles.infoText, { color: colors.secondary }]}>
          Requests must be submitted at least 2 hours before your shift.
          Cancellation is allowed until H-1.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginTop: 30,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoBox: {
    flexDirection: 'row',
    marginTop: 25,
    paddingHorizontal: 10,
  },
  infoText: {
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  }
});
