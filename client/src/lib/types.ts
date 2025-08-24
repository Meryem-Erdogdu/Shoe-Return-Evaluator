export type ClassificationType = 'returnable' | 'not_returnable' | 'send_back' | 'donation' | 'disposal';

export interface ShoeAnalysisResult {
  id?: string;
  classification: ClassificationType;
  confidence: number;
  scores: {
    returnable: number;
    not_returnable: number;
    send_back: number;
    donation: number;
    disposal: number;
  };
  features: string[];
  reasoning: string;
  damageReasons: string[];
  shoeModel?: string;
  warrantyPeriod?: number;
  isUserError?: boolean;
  userErrorReason?: string;
  customerNotes?: string;
  createdAt?: string;
}

export interface DailyStats {
  returnable: number;
  not_returnable: number;
  send_back: number;
  donation: number;
  disposal: number;
  total: number;
}

export interface RecentAnalysis {
  id: string;
  classification: ClassificationType;
  confidence: number;
  createdAt: string;
}

export const CLASSIFICATION_LABELS: Record<ClassificationType, string> = {
  returnable: 'İade kabul edilebilir',
  not_returnable: 'İade kabul edilemez',
  send_back: 'İade kabul edilemez, firma üretim hatası', 
  donation: 'İade kabul edildi bağışlanacak',
  disposal: 'İade kabul edildi ama durumu kötü imha'
};

export const CLASSIFICATION_COLORS: Record<ClassificationType, string> = {
  returnable: 'bg-emerald-500',
  not_returnable: 'bg-gray-500',
  send_back: 'bg-indigo-500',
  donation: 'bg-amber-500',
  disposal: 'bg-red-500'
};

export const CLASSIFICATION_ICONS: Record<ClassificationType, string> = {
  returnable: 'fas fa-check',
  not_returnable: 'fas fa-ban',
  send_back: 'fas fa-arrow-up',
  donation: 'fas fa-heart',
  disposal: 'fas fa-times'
};
