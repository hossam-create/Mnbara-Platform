import React from 'react';
import { Text, StyleSheet } from 'react-native';

interface TabBarIconProps {
  name: 'home' | 'search' | 'gavel' | 'receipt' | 'person';
  color: string;
  size: number;
}

// Simple icon mapping using unicode characters
// In production, replace with react-native-vector-icons
const iconMap: Record<TabBarIconProps['name'], string> = {
  home: '🏠',
  search: '🔍',
  gavel: '🔨',
  receipt: '📋',
  person: '👤',
};

export const TabBarIcon: React.FC<TabBarIconProps> = ({ name, size }) => {
  return (
    <Text style={[styles.icon, { fontSize: size }]}>
      {iconMap[name]}
    </Text>
  );
};

const styles = StyleSheet.create({
  icon: {
    textAlign: 'center',
  },
});
