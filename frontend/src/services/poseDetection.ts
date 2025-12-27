/**
 * Pose detection service using TensorFlow.js Pose Detection
 * Uses MoveNet (lightweight, fast, browser-friendly) or BlazePose
 */
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs';

// Set TensorFlow.js backend to WebGL for better performance
import '@tensorflow/tfjs-backend-webgl';

import type { Keypoint } from '../types';

let detector: poseDetection.PoseDetector | null = null;
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

/**
 * Initialize the pose detector
 * Uses MoveNet Thunder for best performance in browsers
 */
export async function initializePoseDetector(): Promise<void> {
  if (isInitialized && detector) {
    return;
  }

  // If initialization is already in progress, wait for it
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      console.log('Initializing pose detector...');
      
      // Initialize TensorFlow.js backend if not already done
      await tf.ready();
      console.log('TensorFlow.js backend:', tf.getBackend());
      
      // Use MoveNet Lightning - faster and lighter than Thunder
      // Lightning is better for real-time video processing
      const model = poseDetection.SupportedModels.MoveNet;
      detector = await poseDetection.createDetector(model, {
        modelType: poseDetection.movenet.modelType.LIGHTNING,
        enableSmoothing: true,
        minPoseScore: 0.25,
      });
      
      isInitialized = true;
      console.log('Pose detector initialized successfully (MoveNet Lightning)');
      initializationPromise = null;
    } catch (error) {
      console.error('Failed to initialize MoveNet Lightning, trying MoveNet Thunder...', error);
      initializationPromise = null;
      
      // Fallback to MoveNet Thunder
      try {
        const model = poseDetection.SupportedModels.MoveNet;
        detector = await poseDetection.createDetector(model, {
          modelType: poseDetection.movenet.modelType.THUNDER,
          enableSmoothing: true,
          minPoseScore: 0.25,
        });
        isInitialized = true;
        console.log('Pose detector initialized successfully (MoveNet Thunder)');
        initializationPromise = null;
      } catch (thunderError) {
        console.error('Failed to initialize MoveNet Thunder, trying BlazePose...', thunderError);
        initializationPromise = null;
        
        // Final fallback to BlazePose
        try {
          const blazeModel = poseDetection.SupportedModels.BlazePose;
          detector = await poseDetection.createDetector(blazeModel, {
            runtime: 'tfjs',
            modelType: 'lite',
            enableSmoothing: true,
          });
          isInitialized = true;
          console.log('Pose detector initialized successfully (BlazePose Lite)');
        } catch (fallbackError) {
          console.error('Failed to initialize pose detector:', fallbackError);
          throw new Error('Failed to initialize pose detector. Please check your internet connection and try refreshing the page.');
        }
      }
    }
  })();

  return initializationPromise;
}

/**
 * Detect poses in a video frame
 */
export async function detectPose(video: HTMLVideoElement): Promise<Keypoint[] | null> {
  if (!detector || !isInitialized) {
    try {
      await initializePoseDetector();
    } catch (error) {
      console.error('Pose detector initialization failed:', error);
      return null;
    }
  }

  if (!detector) {
    return null;
  }

  try {
    // Estimate poses in the video frame
    // flipHorizontal: true to match the mirrored video display
    const poses = await detector.estimatePoses(video, {
      flipHorizontal: true,
      maxPoses: 1, // Only detect one person
    });

    // Return keypoints from the first (primary) pose
    if (poses.length > 0 && poses[0].keypoints && poses[0].keypoints.length > 0) {
      const keypoints: Keypoint[] = poses[0].keypoints.map((kp) => {
        // Keypoints are already in pixel coordinates, normalize them
        const normalizedX = video.videoWidth > 0 ? kp.x / video.videoWidth : kp.x;
        const normalizedY = video.videoHeight > 0 ? kp.y / video.videoHeight : kp.y;
        
        return {
          x: normalizedX,
          y: normalizedY,
          visibility: kp.score ?? 1.0,
          name: kp.name,
        };
      });

      return keypoints;
    }

    return null;
  } catch (error) {
    console.error('Pose detection error:', error);
    return null;
  }
}

/**
 * Clean up the pose detector
 */
export function disposePoseDetector(): void {
  if (detector) {
    try {
      detector.dispose();
    } catch (error) {
      console.error('Error disposing pose detector:', error);
    }
    detector = null;
    isInitialized = false;
    initializationPromise = null;
  }
}

