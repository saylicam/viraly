import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react-native';
import { GlassCard } from '../ui/GlassCard';
import { MotiView } from 'moti';

interface StrengthsWeaknessesProps {
  strengths: string[];
  weaknesses: string[];
}

export const StrengthsWeaknesses: React.FC<StrengthsWeaknessesProps> = ({
  strengths,
  weaknesses,
}) => {
  return (
    <>
      {/* Points Forts */}
      {strengths.length > 0 && (
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 700 }}
        >
          <GlassCard variant="highlight" style={styles.container}>
            <View style={styles.header}>
              <CheckCircle2 size={18} color="#10B981" />
              <Text style={styles.title}>Points forts</Text>
            </View>
            {strengths.map((item, index) => (
              <MotiView
                key={`str-${index}`}
                from={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 800 + index * 60 }}
                style={styles.item}
              >
                <View style={styles.itemContent}>
                  <View style={styles.checkIcon}>
                    <CheckCircle2 size={14} color="#10B981" />
                  </View>
                  <Text style={styles.itemText}>{item}</Text>
                </View>
              </MotiView>
            ))}
          </GlassCard>
        </MotiView>
      )}

      {/* Points Faibles */}
      {weaknesses.length > 0 && (
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 900 }}
        >
          <GlassCard variant="default" style={styles.container}>
            <View style={styles.header}>
              <AlertTriangle size={18} color="#F59E0B" />
              <Text style={styles.title}>Points à améliorer</Text>
            </View>
            {weaknesses.map((item, index) => (
              <MotiView
                key={`weak-${index}`}
                from={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1000 + index * 60 }}
                style={styles.item}
              >
                <View style={styles.itemContent}>
                  <View style={[styles.checkIcon, styles.warningIcon]}>
                    <XCircle size={14} color="#F59E0B" />
                  </View>
                  <Text style={styles.itemText}>{item}</Text>
                </View>
              </MotiView>
            ))}
          </GlassCard>
        </MotiView>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  item: {
    marginBottom: 12,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  warningIcon: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  itemText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.9)',
  },
});















