import { Stack } from 'expo-router';
import { ThemeProvider } from '../context/ThemeContext';
import { useTheme } from '../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';

function RootLayoutNav() {
  const { colors } = useTheme();

  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.card,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="attendance" options={{ title: 'Clock In / Out' }} />
        <Stack.Screen name="leave/request" options={{ title: 'Request Leave' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutNav />
    </ThemeProvider>
  );
}
