import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../../theme';
import { CalendarTask, deleteTask } from '../../services/calendarService';
import { useAuth } from '../../hooks/useAuth';

interface TaskListProps {
  tasks: CalendarTask[];
  onTaskDeleted: () => void;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'publish':
      return 'rocket-outline';
    case 'record':
      return 'videocam-outline';
    case 'idea':
      return 'bulb-outline';
    default:
      return 'calendar-outline';
  }
};

const getTypeColor = (type: string): string[] => {
  switch (type) {
    case 'publish':
      return ['#8B5CF6', '#EC4899'];
    case 'record':
      return ['#3B82F6', '#8B5CF6'];
    case 'idea':
      return ['#F59E0B', '#EC4899'];
    default:
      return theme.colors.gradient.primary;
  }
};

const getTypeLabel = (type: string): string => {
  switch (type) {
    case 'publish':
      return 'Publication';
    case 'record':
      return 'Enregistrement';
    case 'idea':
      return 'Idée';
    default:
      return 'Tâche';
  }
};

export default function TaskList({ tasks, onTaskDeleted }: TaskListProps) {
  const { user } = useAuth();

  const handleDelete = async (taskId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await deleteTask(taskId, user?.uid || null);
      onTaskDeleted();
    } catch (error) {
      console.error('Erreur suppression tâche:', error);
    }
  };

  return (
    <View style={styles.container}>
      {tasks.map((task) => {
        const typeColors = getTypeColor(task.type);
        const isAIGenerated = task.createdBy === 'ai';

        return (
          <View key={task.id} style={styles.taskCard}>
            <BlurView intensity={20} tint="dark" style={styles.taskBlur}>
              <LinearGradient
                colors={['rgba(139, 92, 246, 0.1)', 'rgba(236, 72, 153, 0.05)']}
                style={styles.taskGradient}
              >
                {/* Icône type */}
                <View style={styles.iconContainer}>
                  <LinearGradient
                    colors={typeColors}
                    style={styles.iconGradient}
                  >
                    <Ionicons
                      name={getTypeIcon(task.type) as any}
                      size={20}
                      color="white"
                    />
                  </LinearGradient>
                </View>

                {/* Contenu */}
                <View style={styles.taskContent}>
                  <View style={styles.taskHeader}>
                    <Text style={styles.taskType}>{getTypeLabel(task.type)}</Text>
                    {isAIGenerated && (
                      <View style={styles.aiBadge}>
                        <Ionicons name="sparkles" size={12} color={theme.colors.primary} />
                        <Text style={styles.aiBadgeText}>IA</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <View style={styles.taskTime}>
                    <Ionicons name="time-outline" size={14} color={theme.colors.text.secondary} />
                    <Text style={styles.taskTimeText}>{task.hour}</Text>
                  </View>
                </View>

                {/* Bouton supprimer */}
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(task.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
                </TouchableOpacity>
              </LinearGradient>
            </BlurView>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  taskCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  taskBlur: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  taskGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    marginRight: 16,
  },
  iconGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  taskContent: {
    flex: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  taskType: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginRight: 8,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 6,
  },
  taskTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taskTimeText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
});

