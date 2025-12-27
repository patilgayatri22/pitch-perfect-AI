import type { ActionFeedback, PredictionResponse, ShotType } from '../types';
import { generateAudio } from './api';

// Track current audio playback to prevent overlap
let currentAudio: HTMLAudioElement | null = null;
let isPlaying = false;

const formatShotLabel = (shotType: ShotType): string =>
  shotType
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const buildDefaultMessage = (prediction: PredictionResponse): string => {
  const shotText = formatShotLabel(prediction.shot_type);
  if (prediction.form_quality === 'High') {
    return `Beautiful ${shotText} — excellent form!`;
  }
  return `${shotText} needs better timing. Let's tighten the form next attempt.`;
};

/**
 * Get feedback message for an action.
 * Prefers backend message but falls back to synthesized messaging.
 */
export function getActionFeedback(prediction: PredictionResponse): ActionFeedback {
  const message =
    (prediction.message && prediction.message.trim().length > 0
      ? prediction.message
      : buildDefaultMessage(prediction));

  return {
    action: prediction.form_quality,
    message,
  };
}

/**
 * Play audio from base64 string
 */
function playAudioFromBase64(audioBase64: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Stop current audio if playing
    if (currentAudio && isPlaying) {
      currentAudio.pause();
      currentAudio = null;
    }

    try {
      // Decode base64 to binary
      const binaryString = atob(audioBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        isPlaying = false;
        currentAudio = null;
        URL.revokeObjectURL(audioUrl);
        resolve();
      };

      audio.onerror = (error) => {
        isPlaying = false;
        currentAudio = null;
        URL.revokeObjectURL(audioUrl);
        reject(error);
      };

      currentAudio = audio;
      isPlaying = true;
      audio.play().catch(reject);
    } catch (error) {
      reject(error);
    }
  });
}


/**
 * Fallback to browser TTS if ElevenLabs is not available
 */
function fallbackTTS(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => resolve();
      utterance.onerror = (error) => reject(error);
      speechSynthesis.speak(utterance);
    } else {
      reject(new Error('Text-to-speech not supported'));
    }
  });
}

/**
 * Speak action feedback with voice
 * Uses backend /generate-audio endpoint, falls back to browser TTS if backend fails
 */
export async function speakActionFeedback(prediction: PredictionResponse): Promise<void> {
  const feedback = getActionFeedback(prediction);
  try {
    // Try backend audio generation first
    const audioResponse = await generateAudio(prediction.form_quality, prediction.form_confidence, {
      shotType: prediction.shot_type,
      shotConfidence: prediction.shot_confidence,
      formConfidence: prediction.form_confidence,
      message: feedback.message,
    });
    await playAudioFromBase64(audioResponse.audio_base64);
  } catch (error) {
    console.error('Backend audio generation failed:', error);
    // Fallback to browser TTS
    try {
      await fallbackTTS(feedback.message);
    } catch (fallbackError) {
      console.error('Fallback TTS also failed:', fallbackError);
    }
  }
}

/**
 * Stop any currently playing audio
 */
export function stopAudio(): void {
  if (currentAudio && isPlaying) {
    currentAudio.pause();
    currentAudio = null;
    isPlaying = false;
  }
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();
  }
}

