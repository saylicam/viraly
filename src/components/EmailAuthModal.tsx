import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { registerWithEmail, loginWithEmail } from '../services/authService';
import { theme } from '../theme';
import * as Haptics from 'expo-haptics';

interface EmailAuthModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type AuthMode = 'login' | 'register';

export const EmailAuthModal: React.FC<EmailAuthModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<AuthMode>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    setError(null);

    if (!email.trim()) {
      setError('L\'adresse email est requise');
      return false;
    }

    if (!validateEmail(email)) {
      setError('Veuillez entrer une adresse email valide');
      return false;
    }

    if (!password.trim()) {
      setError('Le mot de passe est requis');
      return false;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }

    if (mode === 'register') {
      if (!confirmPassword.trim()) {
        setError('Veuillez confirmer votre mot de passe');
        return false;
      }

      if (password !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (mode === 'register') {
        await registerWithEmail(email.trim(), password);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        resetForm();
        onSuccess();
      } else {
        await loginWithEmail(email.trim(), password);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        resetForm();
        onSuccess();
      }
    } catch (err: any) {
      console.error('Erreur auth email:', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      // Messages d'erreur personnalisés
      let errorMessage = 'Une erreur est survenue';
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'Cette adresse email est déjà utilisée';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Adresse email invalide';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Le mot de passe est trop faible';
      } else if (err.code === 'auth/user-not-found') {
        errorMessage = 'Aucun compte trouvé avec cette adresse email';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Mot de passe incorrect';
      } else if (err.code === 'auth/invalid-credential') {
        errorMessage = 'Email ou mot de passe incorrect';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFillObject} />
        <View style={styles.modalContent}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={28} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.title}>
                {mode === 'register' ? 'Créer un compte' : 'Se connecter'}
              </Text>
              <Text style={styles.subtitle}>
                {mode === 'register'
                  ? 'Rejoins la communauté Viraly'
                  : 'Connecte-toi à ton compte'}
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <BlurView intensity={20} tint="dark" style={styles.inputBlur}>
                  <TextInput
                    style={styles.input}
                    placeholder="ton@email.com"
                    placeholderTextColor={theme.colors.text.tertiary}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      setError(null);
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                </BlurView>
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Mot de passe</Text>
                <BlurView intensity={20} tint="dark" style={styles.inputBlur}>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={theme.colors.text.tertiary}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setError(null);
                    }}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                </BlurView>
              </View>

              {/* Confirm Password (Register only) */}
              {mode === 'register' && (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Confirmer le mot de passe</Text>
                  <BlurView intensity={20} tint="dark" style={styles.inputBlur}>
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor={theme.colors.text.tertiary}
                      value={confirmPassword}
                      onChangeText={(text) => {
                        setConfirmPassword(text);
                        setError(null);
                      }}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!loading}
                    />
                  </BlurView>
                </View>
              )}

              {/* Error Message */}
              {error && (
                <View style={styles.errorContainer}>
                  <Ionicons
                    name="alert-circle"
                    size={20}
                    color={theme.colors.error}
                  />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
                style={styles.submitButton}
              >
                <LinearGradient
                  colors={theme.colors.gradient.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.submitButtonGradient}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {mode === 'register' ? 'Créer mon compte' : 'Se connecter'}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Switch Mode */}
              <View style={styles.switchContainer}>
                <Text style={styles.switchText}>
                  {mode === 'register'
                    ? 'Tu as déjà un compte ? '
                    : 'Tu n\'as pas encore de compte ? '}
                </Text>
                <TouchableOpacity onPress={switchMode} disabled={loading}>
                  <Text style={styles.switchLink}>
                    {mode === 'register' ? 'Se connecter' : 'S\'inscrire'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'rgba(10, 11, 16, 0.95)',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '90%',
    paddingBottom: 40,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginLeft: 4,
  },
  inputBlur: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  input: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#FFFFFF',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
    borderRadius: 12,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.error,
    lineHeight: 20,
  },
  submitButton: {
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  submitButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  switchText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  switchLink: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
});


