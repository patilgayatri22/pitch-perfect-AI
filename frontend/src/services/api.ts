/**
 * API service for communicating with the FastAPI backend
 */

import type { ShotType } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const SHOT_TYPES: ShotType[] = ['drive', 'sweep', 'pullshot', 'legglance_flick'];

export interface BackendPredictionResponse {
  shot_type: ShotType;
  shot_confidence: number;
  form_quality: 'High' | 'Not High';
  form_confidence: number;
  prediction: 'High' | 'Not High';
  confidence: number;
  message: string;
}

export interface BackendAudioResponse {
  message: string;
  audio_base64: string;
}

/**
 * Check if backend is healthy and available
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) return false;
    const data = await response.json();
    return data.status === 'ok';
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
}

/**
 * Check model status and availability
 */
export async function checkModelStatus(): Promise<{
  model_loaded: boolean;
  inference_ready: boolean;
  available_models: Array<{ name: string; exists: boolean; size_mb?: number }>;
  message: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/model-status`);
    if (!response.ok) {
      throw new Error(`Model status check failed: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Model status check failed:', error);
    throw error;
  }
}

/**
 * Predict action from live camera frames
 * Sends frames to backend /predict-live endpoint
 * @param frames Array of base64-encoded frame strings (should be 8 frames)
 */
export async function predictLive(
  frames: string[]
): Promise<BackendPredictionResponse> {
  // Ensure we have at least 8 frames (pad with last frame if needed)
  const framesToSend = [...frames];
  if (framesToSend.length < 8 && framesToSend.length > 0) {
    const lastFrame = framesToSend[framesToSend.length - 1];
    while (framesToSend.length < 8) {
      framesToSend.push(lastFrame);
    }
  }

  if (framesToSend.length === 0) {
    throw new Error('No frames provided for prediction');
  }

  // Send to backend
  const response = await fetch(`${API_BASE_URL}/predict-live`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      frames: framesToSend,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Prediction failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();

  const formQuality = (data.form_quality ?? data.prediction ?? 'Not High') as 'High' | 'Not High';
  const formConfidence =
    typeof data.form_confidence === 'number'
      ? data.form_confidence
      : typeof data.confidence === 'number'
      ? data.confidence
      : 0;

  const shotTypeValue = typeof data.shot_type === 'string' ? data.shot_type.toLowerCase() : '';
  const shotType = (SHOT_TYPES.includes(shotTypeValue as ShotType)
    ? shotTypeValue
    : 'drive') as ShotType;

  const shotConfidence =
    typeof data.shot_confidence === 'number'
      ? data.shot_confidence
      : typeof data.confidence === 'number'
      ? data.confidence
      : 0;

  return {
    shot_type: shotType,
    shot_confidence: shotConfidence,
    form_quality: formQuality,
    form_confidence: formConfidence,
    prediction: formQuality,
    confidence: formConfidence,
    message: typeof data.message === 'string' ? data.message : '',
  };
}

/**
 * Predict action from uploaded video file
 * Sends video file to backend /predict endpoint
 * @param videoFile The video file to upload (should be .mp4, .avi, or .mov)
 */
export async function predictVideo(
  videoFile: File
): Promise<BackendPredictionResponse> {
  // Validate file type
  const allowedTypes = ['video/mp4', 'video/avi', 'video/x-msvideo', 'video/quicktime'];
  const allowedExtensions = ['.mp4', '.avi', '.mov'];
  const fileExtension = videoFile.name.toLowerCase().slice(videoFile.name.lastIndexOf('.'));
  
  if (!allowedTypes.includes(videoFile.type) && !allowedExtensions.some(ext => videoFile.name.toLowerCase().endsWith(ext))) {
    throw new Error('Invalid file format. Allowed formats: .mp4, .avi, .mov');
  }

  // Create FormData for file upload
  const formData = new FormData();
  formData.append('video', videoFile);

  // Send to backend
  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errorData = await response.json();
      errorDetail = errorData.detail || errorData.message || '';
    } catch {
      // If JSON parsing fails, try text
      errorDetail = await response.text();
    }
    throw new Error(errorDetail || `Prediction failed: ${response.status}`);
  }

  const data = await response.json();

  const formQuality = (data.form_quality ?? data.prediction ?? 'Not High') as 'High' | 'Not High';
  const formConfidence =
    typeof data.form_confidence === 'number'
      ? data.form_confidence
      : typeof data.confidence === 'number'
      ? data.confidence
      : 0;

  const shotTypeValue = typeof data.shot_type === 'string' ? data.shot_type.toLowerCase() : '';
  const shotType = (SHOT_TYPES.includes(shotTypeValue as ShotType)
    ? shotTypeValue
    : 'drive') as ShotType;

  const shotConfidence =
    typeof data.shot_confidence === 'number'
      ? data.shot_confidence
      : typeof data.confidence === 'number'
      ? data.confidence
      : 0;

  return {
    shot_type: shotType,
    shot_confidence: shotConfidence,
    form_quality: formQuality,
    form_confidence: formConfidence,
    prediction: formQuality,
    confidence: formConfidence,
    message: typeof data.message === 'string' ? data.message : '',
  };
}

/**
 * Generate audio feedback from backend
 * Uses backend /generate-audio endpoint
 */
export async function generateAudio(
  prediction: 'High' | 'Not High',
  confidence: number,
  options?: {
    shotType?: ShotType;
    shotConfidence?: number;
    formConfidence?: number;
    message?: string;
  }
): Promise<BackendAudioResponse> {
  const payload: Record<string, unknown> = {
    prediction,
    confidence,
  };

  if (options?.shotType) {
    payload.shot_type = options.shotType;
  }
  if (typeof options?.shotConfidence === 'number') {
    payload.shot_confidence = options.shotConfidence;
  }
  if (typeof options?.formConfidence === 'number') {
    payload.form_confidence = options.formConfidence;
  }
  if (options?.message) {
    payload.message = options.message;
  }

  const response = await fetch(`${API_BASE_URL}/generate-audio`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Audio generation failed: ${response.status} ${errorText}`);
  }

  const data: BackendAudioResponse = await response.json();
  return data;
}

