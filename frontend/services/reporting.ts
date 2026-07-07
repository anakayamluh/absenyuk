import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';

export const generateAttendanceReport = async (userName: string, month: string, logs: any[]) => {
  const html = `
    <html>
      <head>
        <style>
          body { font-family: 'Helvetica', sans-serif; padding: 20px; }
          h1 { color: #0056b3; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #f8f9fa; }
          .late { color: #f93154; font-weight: bold; }
          .on-time { color: #00b74a; }
          .footer { margin-top: 50px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <h1>Absenlah - Attendance Report</h1>
        <p><strong>Employee:</strong> ${userName}</p>
        <p><strong>Period:</strong> ${month}</p>

        <table>
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Type</th>
              <th>Status</th>
              <th>Geofence</th>
            </tr>
          </thead>
          <tbody>
            ${logs.map(log => `
              <tr>
                <td>${format(new Date(log.timestamp), 'PPP p')}</td>
                <td>${log.type === 'clock_in' ? 'Clock In' : 'Clock Out'}</td>
                <td class="${log.status === 'late' ? 'late' : 'on-time'}">${log.status.toUpperCase()}</td>
                <td>${log.is_within_geofence ? 'YES' : 'NO'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          Generated on ${format(new Date(), 'PPP p')} | Absenlah Enterprise Edition
        </div>
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
};
