import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { pb } from '../../services/api';
import { generateAttendanceReport } from '../../services/reporting';
import { FileDown, User } from 'lucide-react-native';

export default function AdminReportsScreen() {
  const { colors } = useTheme();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const result = await pb.collection('users').getFullList({ filter: 'role = "pekerja"' });
        setUsers(result);
      } catch (e) {
        Alert.alert('Error', 'Failed to fetch workers.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleExport = async (user) => {
    try {
      const logs = await pb.collection('attendance_logs').getFullList({
        filter: `user = "${user.id}"`,
        sort: '-timestamp',
      });

      if (logs.length === 0) {
        Alert.alert('No Data', 'No attendance logs found for this worker.');
        return;
      }

      const month = new Date().toISOString().slice(0, 7);
      await generateAttendanceReport(user.name || user.username, month, logs);
    } catch (e) {
      Alert.alert('Error', 'Failed to generate report.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Export Reports</Text>
        <Text style={[styles.subtitle, { color: colors.secondary }]}>Select a worker to generate a monthly PDF summary</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.userCard, { backgroundColor: colors.card }]}>
              <View style={styles.userInfo}>
                <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
                  <User color={colors.primary} size={20} />
                </View>
                <View>
                  <Text style={[styles.userName, { color: colors.text }]}>{item.name || item.username}</Text>
                  <Text style={[styles.userMeta, { color: colors.secondary }]}>{item.position || 'Worker'}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.exportBtn, { borderColor: colors.primary }]}
                onPress={() => handleExport(item)}
              >
                <FileDown color={colors.primary} size={20} />
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={{ padding: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 25 },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 14, marginTop: 4 },
  userCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderRadius: 16, marginBottom: 15, elevation: 1 },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { padding: 10, borderRadius: 25, marginRight: 15 },
  userName: { fontSize: 16, fontWeight: 'bold' },
  userMeta: { fontSize: 12 },
  exportBtn: { borderWidth: 1, padding: 10, borderRadius: 10 },
});
