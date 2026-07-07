import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, FlatList } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { pb } from '../../services/api';
import { useRouter } from 'expo-router';
import {
  Users,
  Settings as SettingsIcon,
  Map as MapIcon,
  Unlock,
  FileBarChart,
  ChevronRight
} from 'lucide-react-native';

export default function AdminDashboard() {
  const { colors } = useTheme();
  const router = useRouter();
  const [stats, setStats] = useState({ workers: 0, sites: 0, pendingLeaves: 0 });

  useEffect(() => {
    (async () => {
      try {
        const workers = await pb.collection('users').getList(1, 1, { filter: 'role = "pekerja"' });
        const sites = await pb.collection('sites').getList(1, 1);
        const leaves = await pb.collection('leave_requests').getList(1, 1, { filter: 'status = "pending"' });
        setStats({
          workers: workers.totalItems,
          sites: sites.totalItems,
          pendingLeaves: leaves.totalItems
        });
      } catch (e) {}
    })();
  }, []);

  const AdminItem = ({ title, subtitle, icon: Icon, onPress }) => (
    <TouchableOpacity style={[styles.item, { backgroundColor: colors.card }]} onPress={onPress}>
      <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
        <Icon color={colors.primary} size={24} />
      </View>
      <View style={styles.itemContent}>
        <Text style={[styles.itemTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.itemSubtitle, { color: colors.secondary }]}>{subtitle}</Text>
      </View>
      <ChevronRight color={colors.border} size={20} />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Admin Console</Text>
        <Text style={[styles.headerSubtitle, { color: colors.secondary }]}>Manage enterprise rules & staff</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statBox, { backgroundColor: colors.card }]}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{stats.workers}</Text>
          <Text style={[styles.statLabel, { color: colors.secondary }]}>Workers</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: colors.card }]}>
          <Text style={[styles.statValue, { color: colors.warning }]}>{stats.pendingLeaves}</Text>
          <Text style={[styles.statLabel, { color: colors.secondary }]}>Pending Leaves</Text>
        </View>
      </View>

      <View style={styles.section}>
        <AdminItem
          title="Dynamic Rule Engine"
          subtitle="Themes, fines, and overtime rates"
          icon={SettingsIcon}
          onPress={() => router.push('/admin/config')}
        />
        <AdminItem
          title="Geofence Management"
          subtitle="Manage office & site locations"
          icon={MapIcon}
          onPress={() => Alert.alert('Sites', 'Site management UI')}
        />
        <AdminItem
          title="Device Unbinding"
          subtitle="Reset hardware IDs for workers"
          icon={Unlock}
          onPress={() => Alert.alert('Unbind', 'Device unbinding UI')}
        />
        <AdminItem
          title="Enterprise Reports"
          subtitle="Export PDF attendance summaries"
          icon={FileBarChart}
          onPress={() => router.push('/admin/reports')}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 25 },
  headerTitle: { fontSize: 28, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 16, marginTop: 5 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, justifyContent: 'space-between', marginBottom: 20 },
  statBox: { width: '47%', padding: 20, borderRadius: 16, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { fontSize: 12, marginTop: 4 },
  section: { paddingHorizontal: 20 },
  item: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 16, marginBottom: 15 },
  iconContainer: { padding: 12, borderRadius: 12, marginRight: 15 },
  itemContent: { flex: 1 },
  itemTitle: { fontSize: 16, fontWeight: 'bold' },
  itemSubtitle: { fontSize: 13, marginTop: 2 },
});
