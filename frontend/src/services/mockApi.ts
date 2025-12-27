import type { PredictionResponse, ShotType } from '../types';

const formatShotLabel = (shotType: ShotType): string =>
  shotType
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

/**
 * Mock API function that simulates the FastAPI /predict endpoint
 * Returns random actions and confidence values for testing
 */
export async function mockPredict(
  _imageData?: ImageData | HTMLVideoElement
): Promise<PredictionResponse> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  const shotTypes: ShotType[] = ['drive', 'sweep', 'pullshot', 'legglance_flick'];
  const shotType = shotTypes[Math.floor(Math.random() * shotTypes.length)];
  const shotConfidence = 0.6 + Math.random() * 0.35; // 0.6 - 0.95

  const formIsHigh = Math.random() > 0.4;
  const formConfidence = formIsHigh
    ? 0.75 + Math.random() * 0.2
    : 0.55 + Math.random() * 0.15;

  // Generate mock keypoints for skeleton overlay
  const mockKeypoints = generateMockKeypoints();

  const message = formIsHigh
    ? `Great ${shotType.replace('_', ' ')} — form looking solid!`
    : `Your ${shotType.replace('_', ' ')} could use a bit more refinement.`;

  return {
    shot_type: shotType,
    shot_confidence: Math.round(shotConfidence * 100) / 100,
    form_quality: formIsHigh ? 'High' : 'Not High',
    form_confidence: Math.round(formConfidence * 100) / 100,
    prediction: formIsHigh ? 'High' : 'Not High',
    confidence: Math.round(formConfidence * 100) / 100,
    message,
    keypoints: mockKeypoints,
    action: formatShotLabel(shotType),
  };
}

/**
 * Generate mock keypoints for skeleton visualization
 * This will be replaced with real keypoints from the model later
 * Returns normalized coordinates (0-1 range) as expected by pose estimation models
 */
function generateMockKeypoints(): Array<{ x: number; y: number; visibility?: number; name?: string }> {
  // Simplified keypoint structure for pose estimation
  // Typical pose estimation has 17-33 keypoints (MediaPipe has 33)
  // MediaPipe pose returns normalized coordinates (0-1)
  const keypointNames = [
    'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
    'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
    'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
    'left_knee', 'right_knee', 'left_ankle', 'right_ankle'
  ];

  // Generate a more realistic pose with normalized coordinates (0-1)
  // Center the pose around the middle of the frame with some variation
  const baseX = 0.5 + (Math.random() - 0.5) * 0.3; // 0.35 to 0.65
  const baseY = 0.4 + (Math.random() - 0.5) * 0.2; // 0.3 to 0.5

  return keypointNames.map((name, index) => {
    // Create a more structured pose layout
    let x = baseX;
    let y = baseY;

    // Head region (0-4)
    if (index === 0) { // nose
      x = baseX;
      y = baseY - 0.15;
    } else if (index === 1) { // left_eye
      x = baseX - 0.02;
      y = baseY - 0.18;
    } else if (index === 2) { // right_eye
      x = baseX + 0.02;
      y = baseY - 0.18;
    } else if (index === 3) { // left_ear
      x = baseX - 0.04;
      y = baseY - 0.16;
    } else if (index === 4) { // right_ear
      x = baseX + 0.04;
      y = baseY - 0.16;
    }
    // Shoulders (5-6)
    else if (index === 5) { // left_shoulder
      x = baseX - 0.08;
      y = baseY - 0.05;
    } else if (index === 6) { // right_shoulder
      x = baseX + 0.08;
      y = baseY - 0.05;
    }
    // Arms (7-10)
    else if (index === 7) { // left_elbow
      x = baseX - 0.12;
      y = baseY + 0.05;
    } else if (index === 8) { // right_elbow
      x = baseX + 0.12;
      y = baseY + 0.05;
    } else if (index === 9) { // left_wrist
      x = baseX - 0.15;
      y = baseY + 0.15;
    } else if (index === 10) { // right_wrist
      x = baseX + 0.15;
      y = baseY + 0.15;
    }
    // Hips (11-12)
    else if (index === 11) { // left_hip
      x = baseX - 0.06;
      y = baseY + 0.12;
    } else if (index === 12) { // right_hip
      x = baseX + 0.06;
      y = baseY + 0.12;
    }
    // Legs (13-16)
    else if (index === 13) { // left_knee
      x = baseX - 0.05;
      y = baseY + 0.25;
    } else if (index === 14) { // right_knee
      x = baseX + 0.05;
      y = baseY + 0.25;
    } else if (index === 15) { // left_ankle
      x = baseX - 0.04;
      y = baseY + 0.38;
    } else if (index === 16) { // right_ankle
      x = baseX + 0.04;
      y = baseY + 0.38;
    }

    // Add small random variation
    x += (Math.random() - 0.5) * 0.02;
    y += (Math.random() - 0.5) * 0.02;

    // Ensure coordinates stay within 0-1 range
    x = Math.max(0, Math.min(1, x));
    y = Math.max(0, Math.min(1, y));

    return {
      x,
      y,
      visibility: 0.85 + Math.random() * 0.15,
      name,
    };
  });
}

/**
 * Real API function - to be used when backend is ready
 * Uncomment and modify this when connecting to FastAPI backend
 */
/*
export async function predictFromBackend(
  imageData: ImageData | HTMLVideoElement
): Promise<PredictionResponse> {
  const formData = new FormData();
  // Convert video frame or image to blob and append to formData
  
  const response = await fetch('http://localhost:8000/predict', {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error('Prediction failed');
  }
  
  return response.json();
}
*/

