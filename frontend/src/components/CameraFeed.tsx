import { useEffect, useRef } from 'react';
import type { Keypoint } from '../types';

interface CameraFeedProps {
  onFrameCapture?: (video: HTMLVideoElement) => void;
  isActive: boolean;
  onCameraReady?: () => void;
  onCameraError?: (error: Error) => void;
  onPoseDetected?: (keypoints: Keypoint[]) => void;
  enablePoseDetection?: boolean;
}

export function CameraFeed({
  onFrameCapture,
  isActive,
  onCameraReady,
  onCameraError,
  onPoseDetected,
  enablePoseDetection = true,
}: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const poseDetectionRef = useRef(false);
  const lastPoseDetectionTime = useRef<number>(0);
  const POSE_DETECTION_INTERVAL = 100; // Detect pose every 100ms (10 FPS for pose)

  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isActive]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;

        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          onCameraReady?.();
          startFrameCapture();
        };
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to access camera');
      console.error('Camera access error:', err);
      onCameraError?.(err);
    }
  };

  const stopCamera = async () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Clean up pose detector
    if (poseDetectionRef.current) {
      try {
        const { disposePoseDetector } = await import('../services/poseDetection');
        disposePoseDetector();
      } catch (error) {
        console.error('Error disposing pose detector:', error);
      }
      poseDetectionRef.current = false;
    }
  };

  const startFrameCapture = async () => {
    // Initialize pose detection if enabled
    if (enablePoseDetection) {
      try {
        const { initializePoseDetector } = await import('../services/poseDetection');
        await initializePoseDetector();
        poseDetectionRef.current = true;
      } catch (error) {
        console.error('Failed to initialize pose detection:', error);
        // Continue without pose detection
        poseDetectionRef.current = false;
      }
    }

    const captureFrame = async () => {
      if (videoRef.current && isActive) {
        // Frame capture for predictions
        if (onFrameCapture) {
          onFrameCapture(videoRef.current);
        }

        // Pose detection (throttled)
        if (enablePoseDetection && poseDetectionRef.current && onPoseDetected) {
          const now = Date.now();
          if (now - lastPoseDetectionTime.current >= POSE_DETECTION_INTERVAL) {
            lastPoseDetectionTime.current = now;
            try {
              const { detectPose } = await import('../services/poseDetection');
              const keypoints = await detectPose(videoRef.current);
              if (keypoints && keypoints.length > 0) {
                onPoseDetected(keypoints);
              }
            } catch (error) {
              // Silently fail pose detection to avoid disrupting the main flow
              console.debug('Pose detection error:', error);
            }
          }
        }
      }
      if (isActive) {
        animationFrameRef.current = requestAnimationFrame(captureFrame);
      }
    };

    captureFrame();
  };

  return (
    <div className="absolute inset-0 w-full h-full bg-cv-bg">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }}
      />
      {!isActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-cv-bg">
          <div className="text-center p-8">
            <p className="text-gray-700 text-lg font-medium">Camera feed will appear here</p>
            <p className="text-sm text-gray-600 mt-2">Click Start to begin</p>
          </div>
        </div>
      )}
    </div>
  );
}

