import React from 'react';
import { Text, TouchableOpacity, TouchableOpacityProps, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { LucideIcon } from 'lucide-react-native';

interface NeonButtonProps extends TouchableOpacityProps {
  title: string;
  icon?: LucideIcon;
  size?: 'default' | 'large';
  fullWidth?: boolean;
  loading?: boolean;
}

export const NeonButton: React.FC<NeonButtonProps> = ({
  title,
  icon: Icon,
  size = 'default',
  fullWidth = false,
  loading = false,
  style,
  ...props
}) => {
  const height = size === 'large' ? 64 : 56;
  const fontSize = size === 'large' ? 18 : 16;
  const iconSize = size === 'large' ? 28 : 24;

  return (
    <MotiView
      animate={{ scale: 1 }}
      from={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      style={{ width: fullWidth ? '100%' : undefined }}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        style={[style]}
        disabled={loading}
        {...props}
      >
        <View
          style={{
            shadowColor: '#8F5BFF',
            shadowOpacity: 0.4,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 8 },
            borderRadius: 28,
          }}
        >
          <LinearGradient
            colors={['#8F5BFF', '#D946EF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              height,
              width: fullWidth ? '100%' : undefined,
              paddingHorizontal: size === 'large' ? 32 : 24,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 28,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.2)',
            }}
          >
            {/* Glow interne subtil */}
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '40%',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
              }}
            />

            {Icon && !loading && (
              <Icon size={iconSize} color="white" style={{ marginRight: 12 }} />
            )}
            {loading ? (
              <Text style={{ color: 'white', fontSize, fontWeight: '700', letterSpacing: 1 }}>
                CHARGEMENT...
              </Text>
            ) : (
              <Text
                style={{
                  color: 'white',
                  fontSize,
                  fontWeight: '700',
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                }}
              >
                {title}
              </Text>
            )}
          </LinearGradient>
        </View>
      </TouchableOpacity>
    </MotiView>
  );
};
