export type ShotType = 'drive' | 'sweep' | 'pullshot' | 'legglance_flick';

export interface PredictionResponse {
  shot_type: ShotType;
  shot_confidence: number;
  form_quality: 'High' | 'Not High';
  form_confidence: number;
  prediction: 'High' | 'Not High';
  confidence: number;
  message: string;
  keypoints?: Keypoint[];
  /** @deprecated legacy field used by mock data */
  action?: string;
}

export interface ActionFeedback {
  action: 'High' | 'Not High';
  message: string;
}

export interface Keypoint {
  x: number;
  y: number;
  visibility?: number;
  name?: string;
}

