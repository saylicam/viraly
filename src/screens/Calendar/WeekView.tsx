import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

const { width } = Dimensions.get('window');
const DAY_WIDTH = (width - 48) / 7;

interface WeekViewProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
}

export default function WeekView({ selectedDate, onDateSelect }: WeekViewProps) {
  const today = new Date();
  const selected = new Date(selectedDate + 'T00:00:00');
  
  // Générer les 7 jours de la semaine
  const weekDays: Date[] = [];
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Dimanche
  
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    weekDays.push(day);
  }

  const formatDay = (date: Date) => {
    return date.getDate().toString();
  };

  const formatDayName = (date: Date) => {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return days[date.getDay()];
  };

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selected.toDateString();
  };

  const getDateString = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {weekDays.map((day, index) => {
          const dayStr = formatDay(day);
          const dayName = formatDayName(day);
          const dateStr = getDateString(day);
          const todayFlag = isToday(day);
          const selectedFlag = isSelected(day);

          return (
            <TouchableOpacity
              key={index}
              style={styles.dayContainer}
              onPress={() => onDateSelect(dateStr)}
              activeOpacity={0.7}
            >
              <BlurView
                intensity={selectedFlag ? 30 : 10}
                tint="dark"
                style={[
                  styles.dayCard,
                  selectedFlag && styles.dayCardSelected,
                ]}
              >
                {selectedFlag ? (
                  <LinearGradient
                    colors={theme.colors.gradient.primary}
                    style={styles.dayGradient}
                  >
                    <Text style={styles.dayName}>{dayName}</Text>
                    <Text style={styles.dayNumber}>{dayStr}</Text>
                    {todayFlag && (
                      <View style={styles.todayIndicator}>
                        <Ionicons name="ellipse" size={4} color="white" />
                      </View>
                    )}
                  </LinearGradient>
                ) : (
                  <View style={styles.dayContent}>
                    <Text style={[styles.dayName, !selectedFlag && styles.dayNameInactive]}>
                      {dayName}
                    </Text>
                    <Text style={[styles.dayNumber, !selectedFlag && styles.dayNumberInactive]}>
                      {dayStr}
                    </Text>
                    {todayFlag && (
                      <View style={styles.todayIndicator}>
                        <Ionicons name="ellipse" size={4} color={theme.colors.primary} />
                      </View>
                    )}
                  </View>
                )}
              </BlurView>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  scrollContent: {
    gap: 8,
  },
  dayContainer: {
    width: DAY_WIDTH,
  },
  dayCard: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  dayCardSelected: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  dayGradient: {
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  dayContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayName: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  dayNameInactive: {
    color: theme.colors.text.secondary,
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  dayNumberInactive: {
    color: theme.colors.text.primary,
  },
  todayIndicator: {
    marginTop: 4,
  },
});

