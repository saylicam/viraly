import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ScreenBackground } from '../../components/ui/ScreenBackground';
import { theme } from '../../theme';
import TaskList from './TaskList';
import AddTaskModal from './AddTaskModal';
import { getTasksByDate, getTasks, CalendarTask } from '../../services/calendarService';
import { useAuth } from '../../hooks/useAuth';

const { width } = Dimensions.get('window');

export default function CalendarScreen() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Date du jour au format YYYY-MM-DD
    return new Date().toISOString().split('T')[0];
  });
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [allTasks, setAllTasks] = useState<CalendarTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  // Charger toutes les tâches pour marquer les dates
  useEffect(() => {
    loadAllTasks();
  }, []);

  // Charger les tâches pour la date sélectionnée
  useEffect(() => {
    loadTasks();
  }, [selectedDate]);

  const loadAllTasks = async () => {
    try {
      const all = await getTasks(user?.uid || null);
      setAllTasks(all);
    } catch (error) {
      console.error('Erreur chargement toutes les tâches:', error);
      setAllTasks([]);
    }
  };

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const dateTasks = await getTasksByDate(selectedDate, user?.uid || null);
      setTasks(dateTasks);
    } catch (error) {
      console.error('Erreur chargement tâches:', error);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateSelect = (day: DateData) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDate(day.dateString);
  };

  const handleAddTask = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setModalVisible(true);
  };

  const handleTaskAdded = () => {
    setModalVisible(false);
    loadTasks(); // Recharger les tâches de la date
    loadAllTasks(); // Recharger toutes les tâches pour mettre à jour les marqueurs
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
  };

  // Créer les marqueurs pour le calendrier
  const markedDates: any = {
    [selectedDate]: {
      selected: true,
      selectedColor: theme.colors.primary,
      selectedTextColor: '#FFFFFF',
      marked: allTasks.some(task => task.date === selectedDate),
      dotColor: theme.colors.secondary,
    },
  };

  // Ajouter les marqueurs pour toutes les dates avec des tâches
  allTasks.forEach(task => {
    if (task.date !== selectedDate) {
      if (!markedDates[task.date]) {
        markedDates[task.date] = {
          marked: true,
          dotColor: theme.colors.secondary,
        };
      }
    }
  });

  // Configuration du thème du calendrier
  const calendarTheme = {
    backgroundColor: 'transparent',
    calendarBackground: 'transparent',
    textSectionTitleColor: theme.colors.text.secondary,
    selectedDayBackgroundColor: theme.colors.primary,
    selectedDayTextColor: '#FFFFFF',
    todayTextColor: theme.colors.primary,
    dayTextColor: theme.colors.text.primary,
    textDisabledColor: theme.colors.text.tertiary,
    dotColor: theme.colors.secondary,
    selectedDotColor: '#FFFFFF',
    arrowColor: theme.colors.primary,
    monthTextColor: theme.colors.text.primary,
    textDayFontWeight: '600',
    textMonthFontWeight: '900',
    textDayHeaderFontWeight: '700',
    textDayFontSize: 16,
    textMonthFontSize: 20,
    textDayHeaderFontSize: 13,
    'stylesheet.calendar.header': {
      week: {
        marginTop: 5,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
      },
    },
    'stylesheet.day.basic': {
      today: {
        backgroundColor: 'rgba(144, 19, 254, 0.2)',
        borderRadius: 16,
      },
      selected: {
        backgroundColor: theme.colors.primary,
        borderRadius: 16,
      },
    },
  };

  return (
    <ScreenBackground>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Calendrier</Text>
          <Text style={styles.subtitle}>Organise tes publications</Text>
        </View>

        {/* Calendrier */}
        <View style={styles.calendarContainer}>
          <BlurView intensity={20} tint="dark" style={styles.calendarBlur}>
            <LinearGradient
              colors={['rgba(144, 19, 254, 0.1)', 'rgba(255, 46, 240, 0.05)']}
              style={styles.calendarGradient}
            >
              <Calendar
                current={selectedDate}
                onDayPress={handleDateSelect}
                markedDates={markedDates}
                theme={calendarTheme}
                style={styles.calendar}
                markingType="multi-dot"
                firstDay={1} // Commencer par lundi
                monthFormat="MMMM yyyy"
                hideExtraDays={true}
                enableSwipeMonths={true}
                renderArrow={(direction) => (
                  <Ionicons
                    name={direction === 'left' ? 'chevron-back' : 'chevron-forward'}
                    size={24}
                    color={theme.colors.primary}
                  />
                )}
              />
            </LinearGradient>
          </BlurView>
        </View>

        {/* Date sélectionnée */}
        <View style={styles.selectedDateContainer}>
          <LinearGradient
            colors={['rgba(144, 19, 254, 0.2)', 'rgba(255, 46, 240, 0.2)']}
            style={styles.selectedDateGradient}
          >
            <Ionicons name="calendar" size={20} color={theme.colors.primary} style={styles.dateIcon} />
            <Text style={styles.selectedDateText}>{formatDate(selectedDate)}</Text>
          </LinearGradient>
        </View>

        {/* Liste des tâches */}
        <ScrollView
          style={styles.tasksContainer}
          contentContainerStyle={styles.tasksContent}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Chargement...</Text>
            </View>
          ) : tasks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={48} color={theme.colors.text.tertiary} />
              <Text style={styles.emptyText}>Aucune tâche ce jour</Text>
              <Text style={styles.emptySubtext}>Ajoute une tâche pour commencer</Text>
            </View>
          ) : (
            <TaskList tasks={tasks} onTaskDeleted={handleTaskAdded} />
          )}
        </ScrollView>

        {/* Bouton Ajouter */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddTask}
          activeOpacity={0.85}
        >
          <BlurView intensity={20} tint="dark" style={styles.addButtonBlur}>
            <LinearGradient
              colors={theme.colors.gradient.primary}
              style={styles.addButtonGradient}
            >
              <Ionicons name="add" size={24} color="white" />
              <Text style={styles.addButtonText}>Ajouter une tâche</Text>
            </LinearGradient>
          </BlurView>
        </TouchableOpacity>

        {/* Modal Ajouter Tâche */}
        <AddTaskModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onTaskAdded={handleTaskAdded}
          defaultDate={selectedDate}
        />
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  calendarContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  calendarBlur: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(144, 19, 254, 0.2)',
  },
  calendarGradient: {
    borderRadius: 24,
    padding: 12,
  },
  calendar: {
    borderRadius: 20,
  },
  selectedDateContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  selectedDateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(144, 19, 254, 0.3)',
  },
  dateIcon: {
    marginRight: 12,
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  tasksContainer: {
    flex: 1,
  },
  tasksContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.text.tertiary,
    marginTop: 8,
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    left: 24,
    right: 24,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  addButtonBlur: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
});
