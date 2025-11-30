import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

interface TrendItemProps {
  trend: string;
  index?: number;
}

export const TrendItem: React.FC<TrendItemProps> = ({ trend, index = 0 }) => {
  return (
    <MotiView
      from={{ opacity: 0, translateX: -20 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'timing', duration: 400, delay: index * 100 }}
      style={styles.item}
    >
      <Ionicons name="flame" size={20} color={colors.warning} style={styles.icon} />
      <Text style={styles.text}>{trend}</Text>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  icon: {
    marginRight: 12,
  },
  text: {
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '500',
  },
});


