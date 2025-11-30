import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

interface StrengthsWeaknessesV1Props {
  strengths: string[];
  weaknesses: string[];
  risks: string[];
}

export const StrengthsWeaknessesV1: React.FC<StrengthsWeaknessesV1Props> = ({
  strengths,
  weaknesses,
  risks,
}) => {
  return (
    <>
      {/* Points Forts */}
      <View style={styles.container}>
        <View style={styles.contentContainer}>
          <LinearGradient
            colors={['rgba(16, 185, 129, 0.1)', 'rgba(52, 211, 153, 0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientOverlay}
          />
          
          <View style={styles.header}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text style={[styles.title, { color: '#10B981' }]}>POINTS FORTS</Text>
          </View>

          <View style={styles.list}>
            {strengths.slice(0, 5).map((strength, index) => (
              <MotiView
                key={index}
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: 'timing', duration: 400, delay: 900 + index * 100 }}
                style={styles.listItem}
              >
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                  <Ionicons name="checkmark" size={20} color="#10B981" />
                </View>
                <Text style={styles.listText}>{strength}</Text>
              </MotiView>
            ))}
          </View>
        </View>
      </View>

      {/* Points Faibles */}
      <View style={styles.container}>
        <View style={styles.contentContainer}>
          <LinearGradient
            colors={['rgba(244, 63, 94, 0.1)', 'rgba(251, 146, 60, 0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientOverlay}
          />
          
          <View style={styles.header}>
            <Ionicons name="close-circle" size={24} color="#F43F5E" />
            <Text style={[styles.title, { color: '#F43F5E' }]}>POINTS FAIBLES</Text>
          </View>

          <View style={styles.list}>
            {weaknesses.slice(0, 5).map((weakness, index) => (
              <MotiView
                key={index}
                from={{ opacity: 0, translateX: 20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: 'timing', duration: 400, delay: 1100 + index * 100 }}
                style={styles.listItem}
              >
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(244, 63, 94, 0.2)' }]}>
                  <Ionicons name="close" size={20} color="#F43F5E" />
                </View>
                <Text style={styles.listText}>{weakness}</Text>
              </MotiView>
            ))}
          </View>
        </View>
      </View>

      {/* Risques Identifiés */}
      {risks.length > 0 && (
        <View style={styles.container}>
          <View style={styles.risksContainer}>
            <LinearGradient
              colors={['rgba(251, 146, 60, 0.15)', 'rgba(244, 63, 94, 0.1)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientOverlay}
            />
            
            <View style={styles.header}>
              <Ionicons name="warning" size={24} color="#FB923C" />
              <Text style={[styles.title, { color: '#FB923C' }]}>RISQUES IDENTIFIÉS</Text>
            </View>

            <View style={styles.list}>
              {risks.map((risk, index) => (
                <MotiView
                  key={index}
                  from={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'timing', duration: 400, delay: 1300 + index * 100 }}
                  style={styles.riskItem}
                >
                  <Ionicons name="alert" size={18} color="#FB923C" style={styles.riskIcon} />
                  <Text style={styles.riskText}>{risk}</Text>
                </MotiView>
              ))}
            </View>
          </View>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  contentContainer: {
    position: 'relative',
  },
  risksContainer: {
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
    zIndex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 3,
    marginLeft: 12,
  },
  list: {
    position: 'relative',
    zIndex: 1,
    gap: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  listText: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  riskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(251, 146, 60, 0.2)',
  },
  riskIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  riskText: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 22,
  },
});

