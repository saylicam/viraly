// User types
export interface User {
  id: string;
  name: string;
  email?: string;
  type: string;
  goal: string;
  level: string;
  frequency: string;
  niche: string;
  createdAt: string;
}

// ============================================
// NOUVEAU FORMAT PREMIUM - STRUCTURE STRICTE
// ============================================

export interface PremiumAnalysisResult {
  summary: {
    score: number; // 0-100
    retention: number; // 0-100
    hook_strength: number; // 0-100
    clarity: number; // 0-100
    shareability: number; // 0-100
    category: string; // "Aesthetic", "Gym Humor", "Storytime", etc.
    format: string; // "Facecam", "Montage rapide", "POV", etc.
    verdict: string; // "✨ Excellent", "🔥 Très Bien", "👍 Bien", "⚠️ À améliorer"
  };

  timeline: Array<{
    timestamp: string; // "00:00", "00:05", etc.
    label: string;
    detail: string;
    impact: "+10" | "+5" | "0" | "-5" | "-10";
  }>;

  critical_moments: Array<{
    timestamp: string;
    reason: string;
    importance: number; // 1-10
  }>;

  strengths: string[];
  weaknesses: string[];
  risks: string[];

  recommendations: Array<{
    id: number;
    text: string;
    impact: "faible" | "moyen" | "fort";
  }>;

  emotions_detected: string[]; // ["joie", "amusement", "effort"]
  public_target: string;
  hashtags: string[];
  trends: string[];
  next_video_ideas: string[];
}

// Analysis types
export interface AnalysisResult {
  // NOUVEAU FORMAT PREMIUM (prioritaire)
  premium?: PremiumAnalysisResult;
  
  // Nouveau format complet
  description?: {
    resume?: string;
    ambiance?: string;
    ton?: string;
    emotions?: string[];
    sujetPrincipal?: string;
    personnes?: string[];
    contexte?: string;
    structureNarrative?: string;
  };
  analyseTechnique?: {
    qualiteHook?: number;
    rythme?: string;
    luminosite?: string;
    contraste?: string;
    cadrage?: string;
    lisibiliteTexte?: string;
    sousTitres?: string;
    musique?: {
      type?: string;
      mood?: string;
    };
  };
  analyseAlgorithmique?: {
    potentielViralite?: number;
    raisonsPrincipales?: string[];
    pointsFaibles?: string[];
    recommandations?: string[];
  };
  extraction?: {
    hashtags?: string[];
    niche?: string;
    motsCles?: string[];
    styleVideo?: string;
  };
  conseils?: {
    ameliorerHook?: string[];
    augmenterRetention?: string[];
    suggestionsMontage?: string[];
    recommandationFormat?: string;
    nouvelleVersionScript?: string;
  };
  
  // Champs simplifiés pour compatibilité
  pointsForts?: string[];
  ameliorations?: string[];
  hashtags: string[];
  planningSuggeré?: string[];
  potentielViral?: number; // 0-100
  niche?: string;
  ton?: string;
  rythme?: string;
  emotions?: string[];
  styleMontage?: string;
  publicCible?: string;
  tendances?: string[];
  
  // Legacy fields for backward compatibility (snake_case)
  points_forts?: string[];
  potentiel_viral?: number; // 0-100
  style_montage?: string;
  public_cible?: string;
  
  // Legacy fields for backward compatibility
  engagement: number;
  viralPotential: string;
  suggestions: string[];
  trends: string[];
  contentDescription?: string;
  targetAudience?: string;
  strengths?: string[];
  improvements?: string[];
  videoUrl?: string;
  timestamp: string;
}

export interface VideoAnalysis {
  // New comprehensive fields
  description?: string;
  points_forts?: string[];
  ameliorations?: string[];
  hashtags: string[];
  tendances?: string[];
  potentiel_viral?: number; // 0-100
  niche?: string;
  ton?: string;
  rythme?: string;
  emotions?: string[];
  style_montage?: string;
  public_cible?: string;
  
  // Legacy fields for backward compatibility
  viralPotential: 'Élevé' | 'Moyen' | 'Faible';
  engagementScore: number;
  viralScore: number;
  suggestions: string[];
  trends: string[];
  contentDescription: string;
  targetAudience: string;
  strengths: string[];
  improvements: string[];
}

export interface VideoUploadData {
  fileName: string;
  fileSize: number;
  mimeType: string;
  analysis: VideoAnalysis;
  timestamp: string;
  warning?: string;
}

export interface VideoUploadResponse {
  success: boolean;
  data: VideoUploadData;
  timestamp?: string;
}

// Navigation types
export interface RootStackParamList {
  Intro: undefined;
  Splash: undefined;
  Welcome: undefined;
  Questionnaire: undefined;
  Calculating: { answers: Record<string, string[]> };
  Recommendation: { answers: Record<string, string[]> };
  Main: undefined;
  Analyze: undefined;
  VideoAnalyzing: { videoUri: string };
  AnalysisResult: { videoUri: string; result: AnalysisResult };
  Profile: undefined;
  Settings: undefined;
  Paywall: undefined;
}

export interface MainTabParamList {
  Timeline: undefined;
  Analyze: undefined;
  Profile: undefined;
  Settings: undefined;
}

// API types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Subscription types
export interface Subscription {
  id: string;
  status: 'active' | 'inactive' | 'cancelled';
  plan: string;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
}

// Theme types
export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    highlight: string;
    bg: {
      primary: string;
      secondary: string;
      tertiary: string;
      card: string;
    };
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
      inverse: string;
    };
    success: string;
    warning: string;
    error: string;
    info: string;
    gradient: {
      primary: string[];
      secondary: string[];
      accent: string[];
      dark: string[];
      success: string[];
      danger: string[];
    };
    border: {
      primary: string;
      secondary: string;
      accent: string;
    };
    overlay: {
      light: string;
      medium: string;
      dark: string;
    };
  };
}
