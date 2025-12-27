import type { Keypoint } from '../types';

interface PoseOverlayProps {
  keypoints?: Keypoint[];
  videoWidth: number;
  videoHeight: number;
  containerWidth: number;
  containerHeight: number;
}

// Define skeleton connections (pairs of keypoint indices)
// Based on MediaPipe pose model structure (33 keypoints)
// MediaPipe Pose uses named keypoints, so we'll use a mapping approach
const SKELETON_CONNECTIONS: Array<[string, string]> = [
  // Face
  ['nose', 'left_eye_inner'],
  ['nose', 'right_eye_inner'],
  ['left_eye_inner', 'left_eye'],
  ['left_eye', 'left_eye_outer'],
  ['right_eye_inner', 'right_eye'],
  ['right_eye', 'right_eye_outer'],
  ['left_eye_outer', 'left_ear'],
  ['right_eye_outer', 'right_ear'],
  ['mouth_left', 'mouth_right'],
  // Torso
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'],
  ['right_shoulder', 'right_elbow'],
  ['left_elbow', 'left_wrist'],
  ['right_elbow', 'right_wrist'],
  ['left_wrist', 'left_index'],
  ['left_wrist', 'left_pinky'],
  ['right_wrist', 'right_index'],
  ['right_wrist', 'right_pinky'],
  ['left_index', 'left_thumb'],
  ['right_index', 'right_thumb'],
  ['left_shoulder', 'left_hip'],
  ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
  // Legs
  ['left_hip', 'left_knee'],
  ['right_hip', 'right_knee'],
  ['left_knee', 'left_ankle'],
  ['right_knee', 'right_ankle'],
  ['left_ankle', 'left_heel'],
  ['right_ankle', 'right_heel'],
  ['left_heel', 'left_foot_index'],
  ['right_heel', 'right_foot_index'],
];

// Helper function to get keypoint index by name
function getKeypointIndex(keypoints: Array<{ name?: string }>, name: string): number {
  return keypoints.findIndex((kp) => kp.name === name);
}

// Alternative: Use simplified 17-keypoint connections if MediaPipe names don't match
const SIMPLIFIED_CONNECTIONS: Array<[number, number]> = [
  // Face
  [0, 2], [0, 5], [2, 4], [5, 7],
  // Torso
  [11, 12], [11, 13], [12, 14], [13, 15],
  // Arms
  [11, 13], [13, 15], [12, 14], [14, 16],
  // Legs
  [23, 25], [24, 26], [25, 27], [26, 28],
];

export function PoseOverlay({
  keypoints = [],
  videoWidth,
  videoHeight,
  containerWidth,
  containerHeight,
}: PoseOverlayProps) {
  if (!keypoints || keypoints.length === 0) {
    return null;
  }

  // Calculate scaling factors
  // Handle both normalized (0-1) and pixel coordinates
  const maxX = keypoints.length > 0 ? Math.max(...keypoints.map(kp => kp.x)) : 1;
  const maxY = keypoints.length > 0 ? Math.max(...keypoints.map(kp => kp.y)) : 1;
  // Assume normalized if max values are <= 1.0 (allowing some tolerance)
  const isNormalized = maxX <= 1.0 && maxY <= 1.0 && maxX > 0 && maxY > 0;

  const scaleX = isNormalized 
    ? containerWidth  // If normalized, multiply by container width
    : containerWidth / videoWidth; // If pixels, scale by ratio
  const scaleY = isNormalized
    ? containerHeight  // If normalized, multiply by container height
    : containerHeight / videoHeight; // If pixels, scale by ratio

  // Scale keypoints to container size
  const scaledKeypoints = keypoints.map((kp) => ({
    x: kp.x * scaleX,
    y: kp.y * scaleY,
    visibility: kp.visibility || 1,
  }));

  // Filter connections based on visibility
  // Try to use named keypoints first, fall back to index-based if names aren't available
  const visibleConnections: Array<[number, number]> = [];
  
  if (keypoints.length > 0 && keypoints[0].name) {
    // Use named keypoints
    SKELETON_CONNECTIONS.forEach(([name1, name2]) => {
      const idx1 = getKeypointIndex(keypoints, name1);
      const idx2 = getKeypointIndex(keypoints, name2);
      if (idx1 >= 0 && idx2 >= 0) {
        const kp1 = scaledKeypoints[idx1];
        const kp2 = scaledKeypoints[idx2];
        if (kp1 && kp2 && kp1.visibility > 0.5 && kp2.visibility > 0.5) {
          visibleConnections.push([idx1, idx2]);
        }
      }
    });
  } else {
    // Fall back to index-based connections based on MoveNet keypoint order
    // MoveNet Thunder keypoint order (17 keypoints):
    // 0: nose, 1: left_eye, 2: right_eye, 3: left_ear, 4: right_ear,
    // 5: left_shoulder, 6: right_shoulder, 7: left_elbow, 8: right_elbow,
    // 9: left_wrist, 10: right_wrist, 11: left_hip, 12: right_hip,
    // 13: left_knee, 14: right_knee, 15: left_ankle, 16: right_ankle
    
    // Standard MoveNet connections
    const movenetConnections: Array<[number, number]> = [
      // Face connections
      [0, 1], [0, 2], [1, 3], [2, 4], // Nose to eyes, eyes to ears
      // Torso
      [5, 6], // Left shoulder to right shoulder
      [5, 11], [6, 12], // Shoulders to hips
      [11, 12], // Left hip to right hip
      // Left arm
      [5, 7], // Left shoulder to left elbow
      [7, 9], // Left elbow to left wrist
      // Right arm
      [6, 8], // Right shoulder to right elbow
      [8, 10], // Right elbow to right wrist
      // Left leg
      [11, 13], // Left hip to left knee
      [13, 15], // Left knee to left ankle
      // Right leg
      [12, 14], // Right hip to right knee
      [14, 16], // Right knee to right ankle
    ];
    
    // Use MoveNet connections if we have 17 keypoints (MoveNet)
    // or adapt based on keypoint count
    const connectionsToUse = keypoints.length === 17 
      ? movenetConnections
      : keypoints.length === 33
      ? [
          // BlazePose connections (33 keypoints) - main body connections
          [0, 2], [0, 5], [2, 7], [5, 11], [11, 13], [13, 15],
          [0, 4], [4, 8], [8, 12], [12, 14], [14, 16],
          [11, 12], [11, 23], [12, 24], [23, 24],
          [23, 25], [25, 27], [24, 26], [26, 28],
        ]
      : movenetConnections; // Default to MoveNet
    
    // Apply connections
    connectionsToUse.forEach(([i, j]) => {
      if (i < scaledKeypoints.length && j < scaledKeypoints.length) {
        const kp1 = scaledKeypoints[i];
        const kp2 = scaledKeypoints[j];
        if (kp1 && kp2 && kp1.visibility > 0.3 && kp2.visibility > 0.3) {
          visibleConnections.push([i, j]);
        }
      }
    });
  }

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={containerWidth}
      height={containerHeight}
      style={{ zIndex: 10 }}
    >
      {/* Draw skeleton connections */}
      <g stroke="#10b981" strokeWidth="3" fill="none" strokeLinecap="round">
        {visibleConnections.map(([i, j], index) => {
          const kp1 = scaledKeypoints[i];
          const kp2 = scaledKeypoints[j];
          if (!kp1 || !kp2) return null;

          return (
            <line
              key={`connection-${index}`}
              x1={kp1.x}
              y1={kp1.y}
              x2={kp2.x}
              y2={kp2.y}
              strokeOpacity={Math.min(kp1.visibility, kp2.visibility) * 0.9}
              style={{
                filter: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.6))',
              }}
            />
          );
        })}
      </g>

      {/* Draw keypoints */}
      <g fill="#3b82f6">
        {scaledKeypoints.map((kp, index) => {
          if (!kp || kp.visibility < 0.5) return null;

          return (
            <circle
              key={`keypoint-${index}`}
              cx={kp.x}
              cy={kp.y}
              r="5"
              fillOpacity={kp.visibility}
              style={{
                filter: 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.8))',
              }}
            />
          );
        })}
      </g>
    </svg>
  );
}

