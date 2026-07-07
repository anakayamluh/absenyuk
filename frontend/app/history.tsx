import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { leaveService, pb } from '../services/api';
import { format } from 'date-fns';
import { Clock, MapPin, CheckCircle, XCircle, AlertCircle } from 'lucide-react-native';

export default function HistoryScreen() {
  const { colors } = useTheme();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const userId = pb.authStore.model?.id;
        if (userId) {
          const result = await leaveService.getHistory(userId);
          setHistory(result.items);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const renderItem = ({ item }) => {
    const isLate = item.status === 'late';
    const isOnTime = item.status === 'on_time';

    return (
      <View style={[styles.itemCard, { backgroundColor: colors.card }]}>
        <View style={styles.itemHeader}>
          <Text style={[styles.itemType, { color: colors.text }]}>
            {item.type === 'clock_in' ? 'Clock In' : 'Clock Out'}
          </Text>
          <View style={styles.statusBadge}>
            {isOnTime ? <CheckCircle color={colors.success} size={16} /> :
             isLate ? <AlertCircle color={colors.error} size={16} /> :
             <Clock color={colors.secondary} size={16} />}
            <Text style={[styles.statusText, { color: isOnTime ? colors.success : isLate ? colors.error : colors.secondary }]}>
              {item.status?.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.itemDetail}>
          <Clock color={colors.secondary} size={14} />
          <Text style={[styles.detailText, { color: colors.secondary }]}>
            {format(new Date(item.timestamp), 'PPP p')}
          </Text>
        </View>

        <View style={styles.itemDetail}>
          <MapPin color={colors.secondary} size={14} />
          <Text style={[styles.detailText, { color: colors.secondary }]}>
            {item.is_within_geofence ? 'Within Geofence' : 'Outside Geofence'}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.secondary }]}>No attendance history found.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 20,
  },
  itemCard: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemType: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  itemDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  detailText: {
    fontSize: 14,
    marginLeft: 8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  }
});
