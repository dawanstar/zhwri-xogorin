export enum Gender {
  MALE = 'نێر',
  FEMALE = 'مێ'
}

export interface UserMetrics {
  height: string; // stored as string for input, parsed to number later
  weight: string;
  gender: Gender;
}

export interface AppState {
  step: number;
  metrics: UserMetrics;
  faceImage: File | null;
  clothImage: File | null;
  faceImagePreview: string | null;
  clothImagePreview: string | null;
  generatedImage: string | null;
  isGenerating: boolean;
  error: string | null;
  loadingMessage: string;
  // New fields for URL handling
  clothInputMode: 'upload' | 'url';
  clothUrl: string;
  isFetchingUrl: boolean;
}

export const INITIAL_STATE: AppState = {
  step: 1,
  metrics: {
    height: '',
    weight: '',
    gender: Gender.MALE
  },
  faceImage: null,
  clothImage: null,
  faceImagePreview: null,
  clothImagePreview: null,
  generatedImage: null,
  isGenerating: false,
  error: null,
  loadingMessage: '',
  clothInputMode: 'upload',
  clothUrl: '',
  isFetchingUrl: false,
};