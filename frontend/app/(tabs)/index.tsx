import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'expo-router';
import {
  Calendar,
  Clock,
  History,
  FileText,
  Settings,
  LogOut,
  MapPin,
  CheckCircle,
  AlertCircle
} from 'lucide-react-native';

export default function Dashboard() {
  const { colors, themeName, setTheme } = useTheme();
  const router = useRouter();

  const SummaryCard = ({ label, value, icon: Icon, color }) => (
    <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
      <Icon color={color} size={24} />
      <Text style={[styles.summaryValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.summaryLabel, { color: colors.secondary }]}>{label}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.welcomeText, { color: colors.secondary }]}>Welcome back,</Text>
            <Text style={[styles.userName, { color: colors.text }]}>Pekerja Absenlah</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/settings')}>
            <Settings color={colors.primary} size={28} />
          </TouchableOpacity>
        </View>

        {/* Shift Info */}
        <View style={[styles.shiftCard, { backgroundColor: colors.primary }]}>
          <View>
            <Text style={styles.shiftLabel}>Current Shift</Text>
            <Text style={styles.shiftTime}>10:00 AM - 08:00 PM</Text>
          </View>
          <TouchableOpacity
            style={[styles.clockButton, { backgroundColor: colors.card }]}
            onPress={() => router.push('/attendance')}
          >
            <Text style={[styles.clockButtonText, { color: colors.primary }]}>Clock In</Text>
          </TouchableOpacity>
        </View>

        {/* Monthly Summary */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Monthly Summary</Text>
        <View style={styles.summaryGrid}>
          <SummaryCard label="On-Time" value="18" icon={CheckCircle} color={colors.success} />
          <SummaryCard label="Late" value="2" icon={AlertCircle} color={colors.error} />
          <SummaryCard label="Leave" value="1" icon={Calendar} color={colors.warning} />
          <SummaryCard label="Bonus" value="Rp360k" icon={FileText} color={colors.success} />
        </View>

        {/* Action Menu */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Actions</Text>
        <View style={styles.menuGrid}>
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.card }]} onPress={() => router.push('/history')}>
            <History color={colors.primary} size={32} />
            <Text style={[styles.menuLabel, { color: colors.text }]}>My History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.card }]} onPress={() => router.push('/leave/request')}>
            <FileText color={colors.primary} size={32} />
            <Text style={[styles.menuLabel, { color: colors.text }]}>Leave Request</Text>
          </TouchableOpacity>
        </View>

        {/* Theme Picker */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.themeScroll}>
          {['Light', 'Dark', 'Enterprise Gold', 'Matrix Green'].map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                styles.themeButton,
                {
                  backgroundColor: colors.card,
                  borderColor: themeName === t ? colors.primary : colors.border,
                  borderWidth: 2
                }
              ]}
              onPress={() => setTheme(t as any)}
            >
              <Text style={{ color: colors.text }}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  welcomeText: {
    fontSize: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  shiftCard: {
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  shiftLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  shiftTime: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  clockButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  clockButtonText: {
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  summaryCard: {
    width: '48%',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 2,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
  },
  menuGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  menuItem: {
    width: '48%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  menuLabel: {
    marginTop: 10,
    fontWeight: '500',
  },
  themeScroll: {
    marginBottom: 30,
  },
  themeButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginRight: 10,
  }
});
