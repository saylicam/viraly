import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

interface RisksPanelProps {
  risks: string[];
}

export const RisksPanel: React.FC<RisksPanelProps> = ({ risks }) => {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 50 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 15, stiffness: 150, delay: 1200 }}
      style={styles.container}
    >
      <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
        <View style={styles.header}>
          <Ionicons name="warning" size={24} color={colors.warning} />
          <Text style={styles.title}>RISQUES IDENTIFIÉS</Text>
        </View>

        {risks.map((risk, index) => (
          <MotiView
            key={index}
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 400, delay: 1300 + index * 100 }}
            style={styles.riskItem}
          >
            <Ionicons name="alert" size={20} color={colors.warning} style={styles.riskIcon} />
            <Text style={styles.riskText}>{risk}</Text>
          </MotiView>
        ))}
      </BlurView>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  blurContainer: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    shadowColor: colors.glow.warning,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.warning,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginLeft: 8,
  },
  riskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: 12,
  },
  riskIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  riskText: {
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
  },
});


