export const colors = {
  // Brand Colors - Style V1 Rose/Violet Néon
  primary: '#9013FE', // Violet néon
  secondary: '#FF2EF0', // Rose néon
  accent: '#4F7BFF', // Bleu électrique
  highlight: '#42FFB0', // Vert succès
  
  // Background Colors - Style V1
  bg: {
    primary: '#0D0017', // Fond principal V1
    secondary: '#140026', // Fond secondaire V1
    tertiary: '#1A0033', // Fond tertiaire
    card: 'rgba(144, 19, 254, 0.1)', // Cards violet foncé
  },
  
  // Text Colors
  text: {
    primary: '#FFFFFF',
    secondary: '#A1A1AA',
    tertiary: '#71717A',
    inverse: '#0B0B10',
  },
  
  // Status Colors - Neon
  success: '#42FFB0', // Vert succès
  warning: '#FFB85C', // Orange warning
  error: '#FF6B6B', // Rouge critique
  info: '#4F7BFF', // Bleu électrique
  
  // Gradient Colors - Style V1
  gradient: {
    primary: ['#9013FE', '#FF2EF0'], // Violet ➜ Rose néon
    secondary: ['#FF2EF0', '#9013FE'],
    accent: ['#4F7BFF', '#42FFB0'],
    dark: ['#0D0017', '#140026'],
    success: ['#42FFB0', '#10B981'],
    danger: ['#FF6B6B', '#EF4444'],
    // Premium gradients
    premium: ['#9013FE', '#FF2EF0'],
    violet: ['#9013FE', '#B84DFF', '#D084FF'],
    magenta: ['#FF2EF0', '#FF5DF5', '#FF8DFA'],
    cyan: ['#4F7BFF', '#60A5FA', '#93C5FD'],
    neon: ['#9013FE', '#FF2EF0'],
    // Gradient pour bouton "Nouvelle Analyse"
    button: ['#FF2EF0', '#9013FE'], // Rose/Violet flashy V1
  },
  
  // Border Colors - Style V1
  border: {
    primary: 'rgba(255, 255, 255, 0.15)',
    secondary: 'rgba(255, 255, 255, 0.08)',
    accent: 'rgba(144, 19, 254, 0.4)', // Violet néon V1
    neon: 'rgba(255, 46, 240, 0.5)', // Rose néon V1
  },
  
  // Overlay Colors
  overlay: {
    light: 'rgba(0, 0, 0, 0.3)',
    medium: 'rgba(0, 0, 0, 0.5)',
    dark: 'rgba(0, 0, 0, 0.7)',
  },
  
  // Premium Glow Colors - Style V1
  glow: {
    violet: 'rgba(144, 19, 254, 0.5)', // Violet néon V1
    magenta: 'rgba(255, 46, 240, 0.5)', // Rose néon V1
    cyan: 'rgba(79, 123, 255, 0.5)', // Bleu électrique
    success: 'rgba(66, 255, 176, 0.4)', // Vert succès
    warning: 'rgba(255, 184, 92, 0.4)', // Orange warning
    error: 'rgba(255, 107, 107, 0.4)', // Rouge critique
  },
  
  // Impact Colors
  impact: {
    positive10: '#42FFB0',
    positive5: '#66FFC4',
    neutral: '#6B7280',
    negative5: '#FFB85C',
    negative10: '#FF6B6B',
  },
} as const;