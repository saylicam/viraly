import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Sparkles, Upload } from 'lucide-react-native';

import { ScreenBackground } from '../components/ui/ScreenBackground';
import { theme } from '../theme';
import TaskList from './Calendar/TaskList';
import AddTaskModal from './Calendar/AddTaskModal';
import { getTasksByDate, CalendarTask, getTasks } from '../services/calendarService';
import { useAuth } from '../hooks/useAuth';

const { width } = Dimensions.get('window');
const DAY_WIDTH = (width - 48 - 52) / 7; // Réduire pour laisser place à l'icône calendrier

export default function TimelineScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [allTasks, setAllTasks] = useState<CalendarTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadAllTasks();
  }, []);

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

  const handleDateSelect = (date: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDate(date);
  };

  const handleCalendarPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Calendar');
  };

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', "L'accès à la galerie est nécessaire pour analyser tes vidéos.");
      return false;
    }
    return true;
  };

  const handleAnalyze = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
        videoMaxDuration: 60,
      });

      if (!result.canceled && result.assets[0]) {
        navigation.navigate('VideoAnalyzing', { videoUri: result.assets[0].uri });
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger la vidéo. Réessaye plus tard.');
    }
  };

  const handleAddTask = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setModalVisible(true);
  };

  const handleTaskAdded = () => {
    setModalVisible(false);
    loadTasks();
    loadAllTasks();
  };

  // Générer les 7 jours de la semaine pour le calendrier horizontal
  const today = new Date();
  const weekDays: Date[] = [];
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Dimanche
  
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    weekDays.push(day);
  }

  const formatDayName = (date: Date) => {
    const days = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
    return days[date.getDay()];
  };

  const getDateString = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const hasTaskOnDate = (dateStr: string) => {
    return allTasks.some(task => task.date === dateStr);
  };

  const isSelected = (date: Date) => {
    return getDateString(date) === selectedDate;
  };

  // Tâche du jour sélectionné (pour PROCHAIN POST) ou prochaine tâche
  const nextTask = tasks.length > 0 
    ? tasks[0] 
    : allTasks.find(task => task.date >= selectedDate) || null;

  // Données fictives pour PROCHAIN POST si aucune tâche
  const displayNextPost = nextTask || {
    title: 'Voyage entre potes',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    hour: '19:58',
    type: 'publish' as const,
  };

  return (
    <ScreenBackground>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        className="flex-1"
      >
        {/* 1️⃣ Header réduit */}
        <View className="px-6 pt-14 pb-1">
          <Text style={styles.welcomeTitle}>Bonjour Créateur 👋</Text>
          <Text style={styles.welcomeSubtitle}>Prêt à analyser tes vidéos ?</Text>
        </View>

        {/* 2️⃣ Calendrier horizontal avec icône calendrier à droite */}
        <View className="px-6 mb-4">
          <View style={styles.calendarHeaderRow}>
            <View style={styles.calendarRow}>
              {/* Jours de la semaine */}
              <View style={styles.dayNamesRow}>
                {weekDays.map((day, index) => (
                  <View key={`day-${index}`} style={styles.dayNameContainer}>
                    <Text style={styles.dayNameText}>{formatDayName(day)}</Text>
                  </View>
                ))}
              </View>
              
              {/* Dates avec pastilles */}
              <View style={styles.datesRow}>
                {weekDays.map((day, index) => {
                  const dateStr = getDateString(day);
                  const dayNum = day.getDate();
                  const selected = isSelected(day);
                  const hasTask = hasTaskOnDate(dateStr);

                  return (
                    <TouchableOpacity
                      key={`date-${index}`}
                      style={styles.dateContainer}
                      onPress={() => handleDateSelect(dateStr)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.dateCircle, selected && styles.dateCircleSelected]}>
                        <Text style={[styles.dateText, selected && styles.dateTextSelected]}>
                          {dayNum}
                        </Text>
                      </View>
                      {hasTask && (
                        <View style={[styles.taskDot, selected && styles.taskDotSelected]} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            
            {/* Icône calendrier à droite */}
            <TouchableOpacity
              onPress={handleCalendarPress}
              activeOpacity={0.7}
              style={styles.calendarIconButton}
            >
              <BlurView intensity={20} tint="dark" style={styles.calendarIconButtonBlur}>
                <LinearGradient
                  colors={['rgba(123, 51, 247, 0.2)', 'rgba(255, 79, 249, 0.15)']}
                  style={styles.calendarIconButtonGradient}
                >
                  <Ionicons name="calendar" size={22} color="#B371FF" />
                </LinearGradient>
              </BlurView>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3️⃣ CTA Analyse IA - Carte premium avec contour néon */}
        <View className="px-6 mb-4">
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', delay: 100, damping: 15 }}
          >
            <MotiView
              from={{ scale: 1 }}
              animate={{ scale: [1, 1.01, 1] }}
              transition={{
                type: 'timing',
                duration: 2500,
                loop: true,
                repeatReverse: true,
              }}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleAnalyze}
                style={styles.analyzeCapsuleContainer}
              >
                <BlurView intensity={25} tint="dark" style={styles.analyzeCapsule}>
                  <View style={styles.analyzeCapsuleContent}>
                    {/* Badge IA en haut à droite */}
                    <View style={styles.analyzeBadge}>
                      <Text style={styles.analyzeBadgeText}>IA</Text>
                    </View>

                    {/* Icône Upload/Video centrée */}
                    <View style={styles.analyzeIconContainer}>
                      <Upload size={56} color="#FFFFFF" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                    </View>

                    {/* Titre centré */}
                    <Text style={styles.analyzeCapsuleTitle}>
                      Téléverse ta vidéo et découvre son potentiel viral
                    </Text>

                    {/* Sous-titre centré */}
                    <Text style={styles.analyzeCapsuleSubtitle}>
                      Analyse IA en 10 secondes • Score viral • Conseils IA
                    </Text>
                  </View>
                </BlurView>
              </TouchableOpacity>
            </MotiView>
          </MotiView>
        </View>

        {/* 4️⃣ Ajouter une tâche - CTA secondaire discret */}
        <View className="px-6 mb-6">
          <TouchableOpacity
            onPress={handleAddTask}
            activeOpacity={0.85}
            style={styles.addTaskButton}
          >
            <BlurView intensity={20} tint="dark" style={styles.addTaskButtonBlur}>
              <LinearGradient
                colors={['rgba(123, 51, 247, 0.1)', 'rgba(255, 79, 249, 0.08)']}
                style={styles.addTaskButtonGradient}
              >
                <Ionicons name="add" size={18} color="#B371FF" style={{ marginRight: 10 }} />
                <Text style={styles.addTaskText}>Ajouter une tâche</Text>
              </LinearGradient>
            </BlurView>
          </TouchableOpacity>
        </View>

        {/* Liste des tâches du jour sélectionné */}
        {tasks.length > 0 && (
          <View className="px-6 mb-6">
            <Text style={styles.tasksSectionTitle}>Tâches du jour</Text>
            <TaskList tasks={tasks} onTaskDeleted={loadTasks} />
          </View>
        )}

        {/* 5️⃣ Carte PROCHAIN POST */}
        <View className="px-6 mb-6">
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 150 }}
          >
            <BlurView intensity={20} tint="dark" style={styles.nextPostCard}>
              <LinearGradient
                colors={['rgba(123, 51, 247, 0.12)', 'rgba(255, 79, 249, 0.08)']}
                style={styles.nextPostCardGradient}
              >
                <View style={styles.nextPostHeader}>
                  <Text style={styles.nextPostLabel}>PROCHAIN POST</Text>
                </View>
                <View style={styles.nextPostContent}>
                  <View style={styles.nextPostIconContainer}>
                    <LinearGradient
                      colors={['#7B33F7', '#FF4FF9']}
                      style={styles.nextPostIconGradient}
                    >
                      <Ionicons 
                        name={displayNextPost.type === 'publish' ? 'rocket-outline' : displayNextPost.type === 'record' ? 'videocam-outline' : 'musical-notes-outline'} 
                        size={22} 
                        color="white" 
                      />
                    </LinearGradient>
                  </View>
                  <View style={styles.nextPostTextContainer}>
                    <Text style={styles.nextPostTitle}>{displayNextPost.title}</Text>
                    <View style={styles.nextPostMeta}>
                      <Text style={styles.nextPostDate}>
                        {new Date(displayNextPost.date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </Text>
                      <Text style={styles.nextPostTime}>{displayNextPost.hour}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.colors.text.secondary} />
                </View>
              </LinearGradient>
            </BlurView>
          </MotiView>
        </View>

        {/* 6️⃣ Objectif hebdomadaire */}
        <View className="px-6 mb-6">
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 200 }}
          >
            <BlurView intensity={20} tint="dark" style={styles.goalCard}>
              <LinearGradient
                colors={['rgba(123, 51, 247, 0.1)', 'rgba(255, 79, 249, 0.05)']}
                style={styles.goalCardGradient}
              >
                <Text style={styles.goalTitle}>Objectif hebdomadaire</Text>
                
                {/* Barre de progression */}
                <View style={styles.progressBarContainer}>
                  <LinearGradient
                    colors={['#7B33F7', '#FF4FF9']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.progressBarFill}
                  />
                </View>

                {/* Badge 2/3 + Texte */}
                <View style={styles.goalFooter}>
                  <Text style={styles.goalText}>
                    Plus que 1 vidéo(s) à publier
                  </Text>
                  <View style={styles.goalBadge}>
                    <Text style={styles.goalBadgeText}>2/3</Text>
                  </View>
                </View>
              </LinearGradient>
            </BlurView>
          </MotiView>
        </View>

        {/* Historique des vidéos - Placeholder */}
        <View className="px-6 mb-6">
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 250 }}
          >
            <BlurView intensity={20} tint="dark" style={styles.historyCard}>
              <LinearGradient
                colors={['rgba(123, 51, 247, 0.1)', 'rgba(255, 79, 249, 0.05)']}
                style={styles.historyCardGradient}
              >
                <View style={styles.historyHeader}>
                  <View style={styles.historyIconContainer}>
                    <Ionicons name="videocam-outline" size={22} color="#4FC3FF" />
                  </View>
                  <Text style={styles.historyTitle}>Historique des vidéos</Text>
                </View>
                <View style={styles.historyEmpty}>
                  <Ionicons name="film-outline" size={40} color={theme.colors.text.tertiary} />
                  <Text style={styles.historyEmptyText}>Aucune vidéo publiée</Text>
                  <Text style={styles.historyEmptySubtext}>Tes vidéos analysées apparaîtront ici</Text>
                </View>
              </LinearGradient>
            </BlurView>
          </MotiView>
        </View>
      </ScrollView>

      {/* Modal Ajouter Tâche */}
      <AddTaskModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onTaskAdded={handleTaskAdded}
        defaultDate={selectedDate}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    opacity: 0.7,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  calendarRow: {
    flex: 1,
  },
  calendarIconButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 4,
  },
  calendarIconButtonBlur: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(179, 113, 255, 0.3)',
  },
  calendarIconButtonGradient: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  dayNamesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dayNameContainer: {
    width: DAY_WIDTH,
    alignItems: 'center',
  },
  dayNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  datesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateContainer: {
    width: DAY_WIDTH,
    alignItems: 'center',
  },
  dateCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  dateCircleSelected: {
    backgroundColor: '#7B33F7',
    borderColor: '#7B33F7',
    shadowColor: '#7B33F7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text.primary,
  },
  dateTextSelected: {
    color: 'white',
  },
  taskDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#B371FF',
  },
  taskDotSelected: {
    backgroundColor: 'white',
  },
  // Carte premium Analyse IA - Style contour néon
  analyzeCapsuleContainer: {
    marginTop: 14,
  },
  analyzeCapsule: {
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: '#1B0730',
    borderWidth: 2,
    borderColor: 'rgba(255, 79, 249, 0.8)',
    shadowColor: '#FF4FF9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 22,
    elevation: 16,
  },
  analyzeCapsuleContent: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    // Ombre interne subtile pour effet 3D
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  analyzeBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 79, 249, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 79, 249, 0.5)',
    shadowColor: '#FF4FF9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  analyzeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  analyzeIconContainer: {
    marginBottom: 16,
    // Glow subtil autour de l'icône
    shadowColor: '#FF4FF9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  analyzeCapsuleTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 0.2,
    lineHeight: 28,
    paddingHorizontal: 8,
  },
  analyzeCapsuleSubtitle: {
    fontSize: 13,
    color: '#EAEAEA',
    opacity: 0.85,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  addTaskButton: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  addTaskButtonBlur: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(179, 113, 255, 0.25)',
  },
  addTaskButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
  },
  addTaskText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  tasksSectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.text.primary,
    marginBottom: 14,
    letterSpacing: 0.2,
  },
  nextPostCard: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(179, 113, 255, 0.3)',
  },
  nextPostCardGradient: {
    padding: 18,
  },
  nextPostHeader: {
    marginBottom: 12,
  },
  nextPostLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    opacity: 0.8,
  },
  nextPostContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextPostIconContainer: {
    marginRight: 14,
  },
  nextPostIconGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7B33F7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  nextPostTextContainer: {
    flex: 1,
  },
  nextPostTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  nextPostMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  nextPostDate: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  nextPostTime: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  goalCard: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(179, 113, 255, 0.3)',
  },
  goalCardGradient: {
    padding: 20,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text.primary,
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    width: '66.66%',
    height: '100%',
    borderRadius: 4,
  },
  goalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  goalBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(123, 51, 247, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(123, 51, 247, 0.5)',
  },
  goalBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#B371FF',
  },
  historyCard: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(179, 113, 255, 0.3)',
  },
  historyCardGradient: {
    padding: 20,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  historyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(79, 195, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text.primary,
    letterSpacing: 0.2,
  },
  historyEmpty: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  historyEmptyText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    marginTop: 14,
    marginBottom: 6,
  },
  historyEmptySubtext: {
    fontSize: 13,
    color: theme.colors.text.tertiary,
  },
});
