import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TrendItem } from './TrendItem';

interface CompactTrendsProps {
  trends: string[];
  maxItems?: number;
}

export const CompactTrends: React.FC<CompactTrendsProps> = ({
  trends,
  maxItems = 5,
}) => {
  const displayTrends = trends.slice(0, maxItems);

  return (
    <View style={styles.container}>
      <View style={styles.list}>
        {displayTrends.map((trend, index) => (
          <TrendItem key={index} trend={trend} index={index} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  list: {
    gap: 8,
  },
});

