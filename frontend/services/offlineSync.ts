import * as SQLite from 'expo-sqlite';
import NetInfo from '@react-native-community/netinfo';
import { attendanceService } from './api';

const db = SQLite.openDatabaseSync('absenlah.db');

export const initOfflineDb = () => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS attendance_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

export const queueAttendance = (data: any) => {
  const dataStr = JSON.stringify(data);
  db.runSync('INSERT INTO attendance_queue (data) VALUES (?);', [dataStr]);
};

export const syncOfflineData = async () => {
  const state = await NetInfo.fetch();
  if (!state.isConnected) return;

  const rows: any[] = db.getAllSync('SELECT * FROM attendance_queue;');

  for (const row of rows) {
    try {
      const data = JSON.parse(row.data);
      await attendanceService.submitAttendance(data);
      db.runSync('DELETE FROM attendance_queue WHERE id = ?;', [row.id]);
      console.log(`Synced offline record ${row.id}`);
    } catch (error) {
      console.error(`Failed to sync record ${row.id}`, error);
    }
  }
};

// Auto-sync on reconnection
NetInfo.addEventListener(state => {
  if (state.isConnected) {
    syncOfflineData();
  }
});
