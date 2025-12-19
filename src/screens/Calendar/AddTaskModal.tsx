import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../../theme';
import { saveTask, CalendarTask } from '../../services/calendarService';
import { useAuth } from '../../hooks/useAuth';

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onTaskAdded: () => void;
  defaultDate?: string;
}

const TASK_TYPES: { key: CalendarTask['type']; label: string; icon: string; gradient: string[] }[] = [
  { key: 'publish', label: 'Publication', icon: 'rocket-outline', gradient: ['#8B5CF6', '#EC4899'] },
  { key: 'record', label: 'Enregistrement', icon: 'videocam-outline', gradient: ['#3B82F6', '#8B5CF6'] },
  { key: 'idea', label: 'Idée', icon: 'bulb-outline', gradient: ['#F59E0B', '#EC4899'] },
];

export default function AddTaskModal({ visible, onClose, onTaskAdded, defaultDate }: AddTaskModalProps) {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<CalendarTask['type']>('publish');
  const [title, setTitle] = useState('');
  const [hour, setHour] = useState('19:00');
  const [date, setDate] = useState(defaultDate || new Date().toISOString().split('T')[0]);

  const handleSave = async () => {
    if (!title.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      await saveTask({
        date,
        hour,
        type: selectedType,
        title: title.trim(),
        createdBy: 'user',
      }, user?.uid || null);

      // Reset form
      setTitle('');
      setHour('19:00');
      setSelectedType('publish');
      
      onTaskAdded();
    } catch (error) {
      console.error('Erreur sauvegarde tâche:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={50} tint="dark" style={styles.overlay}>
        <View style={styles.modalContainer}>
          <BlurView intensity={30} tint="dark" style={styles.modalContent}>
            <LinearGradient
              colors={['rgba(15, 5, 29, 0.95)', 'rgba(26, 11, 46, 0.95)']}
              style={styles.modalGradient}
            >
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Nouvelle tâche</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Type Selection */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Type de tâche</Text>
                  <View style={styles.typeContainer}>
                    {TASK_TYPES.map((type) => (
                      <TouchableOpacity
                        key={type.key}
                        style={[
                          styles.typeCard,
                          selectedType === type.key && styles.typeCardSelected,
                        ]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSelectedType(type.key);
                        }}
                        activeOpacity={0.85}
                      >
                        <LinearGradient
                          colors={type.gradient}
                          style={styles.typeIcon}
                        >
                          <Ionicons name={type.icon as any} size={20} color="white" />
                        </LinearGradient>
                        <Text style={[
                          styles.typeLabel,
                          selectedType === type.key && styles.typeLabelSelected,
                        ]}>
                          {type.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Title Input */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Titre</Text>
                  <BlurView intensity={20} tint="dark" style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Ex: Publier ma vidéo de comédie"
                      placeholderTextColor={theme.colors.text.tertiary}
                      value={title}
                      onChangeText={setTitle}
                      maxLength={100}
                    />
                  </BlurView>
                </View>

                {/* Date & Time */}
                <View style={styles.row}>
                  <View style={[styles.section, styles.halfSection]}>
                    <Text style={styles.sectionTitle}>Date</Text>
                    <BlurView intensity={20} tint="dark" style={styles.inputContainer}>
                      <TextInput
                        style={styles.input}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={theme.colors.text.tertiary}
                        value={date}
                        onChangeText={setDate}
                      />
                    </BlurView>
                  </View>

                  <View style={[styles.section, styles.halfSection]}>
                    <Text style={styles.sectionTitle}>Heure</Text>
                    <BlurView intensity={20} tint="dark" style={styles.inputContainer}>
                      <TextInput
                        style={styles.input}
                        placeholder="19:00"
                        placeholderTextColor={theme.colors.text.tertiary}
                        value={hour}
                        onChangeText={setHour}
                      />
                    </BlurView>
                  </View>
                </View>
              </ScrollView>

              {/* Save Button */}
              <View style={styles.footer}>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSave}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={theme.colors.gradient.primary}
                    style={styles.saveButtonGradient}
                  >
                    <Text style={styles.saveButtonText}>Enregistrer</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </BlurView>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalContent: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  modalGradient: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    maxHeight: 400,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  typeCardSelected: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  typeLabelSelected: {
    color: theme.colors.primary,
  },
  inputContainer: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  input: {
    padding: 16,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfSection: {
    flex: 1,
  },
  footer: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  saveButton: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
});
