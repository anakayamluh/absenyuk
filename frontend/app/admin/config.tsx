import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { pb } from '../../services/api';
import { Save, RotateCcw } from 'lucide-react-native';

export default function DynamicConfigScreen() {
  const { colors } = useTheme();
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const result = await pb.collection('app_config').getFullList();
      setConfigs(result);
    } catch (e) {
      Alert.alert('Error', 'Failed to fetch configurations.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id, value) => {
    try {
      let parsedValue = value;
      try {
        parsedValue = JSON.parse(value);
      } catch (e) {
        // Keep as string if not valid JSON
      }

      await pb.collection('app_config').update(id, { value: parsedValue });
      Alert.alert('Success', 'Configuration updated.');
      fetchConfigs();
    } catch (e) {
      Alert.alert('Error', 'Update failed.');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Rule Engine Config</Text>
        <Text style={[styles.subtitle, { color: colors.secondary }]}>Real-time updates to enterprise SOPs</Text>
      </View>

      {configs.map((item) => (
        <View key={item.id} style={[styles.configCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.configKey, { color: colors.text }]}>{item.key.replace(/_/g, ' ').toUpperCase()}</Text>
          <Text style={[styles.configDesc, { color: colors.secondary }]}>{item.description}</Text>

          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            defaultValue={JSON.stringify(item.value, null, 2)}
            multiline
            onSubmitEditing={(e) => handleUpdate(item.id, e.nativeEvent.text)}
          />

          <View style={styles.cardActions}>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              onPress={() => {/* Implement value capture and save */}}
            >
              <Save color="#fff" size={18} />
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 25 },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 14, marginTop: 4 },
  configCard: { margin: 20, marginTop: 0, padding: 20, borderRadius: 16, elevation: 2 },
  configKey: { fontSize: 16, fontWeight: 'bold' },
  configDesc: { fontSize: 12, marginBottom: 15, marginTop: 2 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 14, fontFamily: 'monospace', minHeight: 80 },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 15 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
});
