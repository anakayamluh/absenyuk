import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

export type ThemeType = 'Light' | 'Dark' | 'Enterprise Gold' | 'Matrix Green';

interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  card: string;
  text: string;
  border: string;
  notification: string;
  success: string;
  error: string;
  warning: string;
}

const Themes: Record<ThemeType, ThemeColors> = {
  'Light': {
    primary: '#0056b3',
    secondary: '#6c757d',
    background: '#f8f9fa',
    card: '#ffffff',
    text: '#212529',
    border: '#dee2e6',
    notification: '#f93154',
    success: '#00b74a',
    error: '#f93154',
    warning: '#ffa900',
  },
  'Dark': {
    primary: '#3b71ca',
    secondary: '#9fa6b2',
    background: '#121212',
    card: '#1e1e1e',
    text: '#fbfbfb',
    border: '#333333',
    notification: '#ef5350',
    success: '#00c851',
    error: '#ff4444',
    warning: '#ffbb33',
  },
  'Enterprise Gold': {
    primary: '#D4AF37', // Gold
    secondary: '#1B263B', // Dark Blue
    background: '#0D1B2A', // Deep Navy
    card: '#1B263B',
    text: '#E0E1DD',
    border: '#D4AF37',
    notification: '#FFD700',
    success: '#4CAF50',
    error: '#F44336',
    warning: '#FFEB3B',
  },
  'Matrix Green': {
    primary: '#00FF41', // Matrix Green
    secondary: '#0D0D0D',
    background: '#000000',
    card: '#0D0D0D',
    text: '#00FF41',
    border: '#003B00',
    notification: '#FF3131',
    success: '#00FF41',
    error: '#FF0000',
    warning: '#FFFF00',
  },
};

interface ThemeContextType {
  themeName: ThemeType;
  colors: ThemeColors;
  setTheme: (name: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeName, setThemeName] = useState<ThemeType>('Light');

  useEffect(() => {
    if (systemColorScheme === 'dark') {
      setThemeName('Dark');
    }
  }, [systemColorScheme]);

  const value = {
    themeName,
    colors: Themes[themeName],
    setTheme: (name: ThemeType) => setThemeName(name),
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
