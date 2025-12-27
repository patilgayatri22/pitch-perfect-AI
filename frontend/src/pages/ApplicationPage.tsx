import { useState, useRef, useCallback, useEffect } from 'react';
import SidebarNavigation from '../components/landing/SidebarNavigation';
import { CameraFeed } from '../components/CameraFeed';
import { ActionDisplay } from '../components/ActionDisplay';
import { PoseOverlay } from '../components/PoseOverlay';
import { predictLive } from '../services/api';
import { getActionFeedback, speakActionFeedback, stopAudio } from '../services/ttsService';
import { FrameBuffer } from '../utils/frameBuffer';
import type { PredictionResponse, Keypoint, ShotType } from '../types';

interface ConfidenceDataPoint {
  time: number;
  confidence: number;
  timestamp: number;
}

const formatShotLabel = (shotType: ShotType) =>
  shotType
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export default function ApplicationPage() {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioTranscript, setAudioTranscript] = useState<string>('');
  const [confidenceHistory, setConfidenceHistory] = useState<ConfidenceDataPoint[]>([]);
  const [keypoints, setKeypoints] = useState<Keypoint[]>([]);
  const [videoDimensions, setVideoDimensions] = useState({ width: 640, height: 480 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  
  const processingRef = useRef(false);
  const lastProcessTimeRef = useRef<number>(0);
  const lastActionRef = useRef<string | null>(null);
  const frameBufferRef = useRef(new FrameBuffer(8, 200));
  const timeCounterRef = useRef(0);
  const FRAME_INTERVAL_MS = 200; // Process every 200ms (5 FPS for predictions)
  const MAX_HISTORY_POINTS = 50; // Keep last 50 data points for ECG chart

  // Handle frame capture and prediction
  const handleFrameCapture = useCallback(async (video: HTMLVideoElement) => {
    if (processingRef.current || !isCameraActive) return;
    
    // Update video dimensions if available
    if (video.videoWidth > 0 && video.videoHeight > 0) {
      setVideoDimensions({ width: video.videoWidth, height: video.videoHeight });
    }
    
    // Throttle predictions to avoid excessive API calls
    const now = Date.now();
    if (now - lastProcessTimeRef.current < FRAME_INTERVAL_MS) {
      return;
    }

    // Add frame to buffer
    const bufferReady = frameBufferRef.current.addFrame(video);
    
    // Only make API call if buffer is ready (has 8 frames AND motion detected)
    if (!bufferReady) {
      return;
    }

    processingRef.current = true;
    setIsProcessing(true);
    lastProcessTimeRef.current = now;

    try {
      // Get buffered frames
      const frames = frameBufferRef.current.getFrames();
      
      // Real API call to backend
      const result = await predictLive(frames);
      
      // Map backend response to frontend format
      const predictionResponse: PredictionResponse = {
        shot_type: result.shot_type,
        shot_confidence: result.shot_confidence,
        form_quality: result.form_quality,
        form_confidence: result.form_confidence,
        prediction: result.prediction,
        confidence: result.confidence,
        message: result.message,
      };
      
      setPrediction(predictionResponse);

      // Add confidence to history for ECG chart
      timeCounterRef.current += 1;
      setConfidenceHistory((prev) => {
        const newPoint: ConfidenceDataPoint = {
          time: timeCounterRef.current,
          confidence: result.form_confidence * 100, // Convert to percentage
          timestamp: Date.now(),
        };
        const updated = [...prev, newPoint];
        // Keep only last MAX_HISTORY_POINTS points
        return updated.slice(-MAX_HISTORY_POINTS);
      });

      // Reset motion flag after successful prediction
      frameBufferRef.current.resetMotionFlag();

      // Voice feedback - only speak when action changes
      const feedback = getActionFeedback(predictionResponse);
      const feedbackKey = `${result.shot_type}-${result.form_quality}`;
      if (lastActionRef.current !== feedbackKey) {
        lastActionRef.current = feedbackKey;
        setAudioTranscript(feedback.message);
        speakActionFeedback(predictionResponse).catch((err) => {
          console.error('TTS Error:', err);
        });
      } else {
        setAudioTranscript(feedback.message);
      }
    } catch (err) {
      console.error('Prediction error:', err);
      setError(err instanceof Error ? err.message : 'Prediction failed');
      // Reset motion flag even on error to allow retry
      frameBufferRef.current.resetMotionFlag();
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  }, [isCameraActive]);

  // Update container dimensions for pose overlay
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Handle pose detection
  const handlePoseDetected = useCallback((detectedKeypoints: Keypoint[]) => {
    setKeypoints(detectedKeypoints);
  }, []);

  // Handle camera ready - get video dimensions
  const handleCameraReady = useCallback(() => {
    // Video dimensions will be updated when frame capture starts
  }, []);

  // Handle camera start/stop
  const handleStart = () => {
    setError(null);
    setPrediction(null);
    setAudioTranscript('');
    setConfidenceHistory([]);
    setKeypoints([]);
    lastActionRef.current = null;
    timeCounterRef.current = 0;
    frameBufferRef.current.clear();
    setIsCameraActive(true);
  };

  const handleStop = () => {
    setIsCameraActive(false);
    stopAudio();
    setPrediction(null);
    setAudioTranscript('');
    setConfidenceHistory([]);
    setKeypoints([]);
    lastActionRef.current = null;
    timeCounterRef.current = 0;
    frameBufferRef.current.clear();
  };

  const handleCameraError = (err: Error) => {
    setError(err.message);
    setIsCameraActive(false);
  };

  return (
    <div className="h-screen bg-cv-bg text-cv-text flex overflow-hidden">
      <SidebarNavigation />
      
      {/* Main content area - fills remaining viewport height */}
      <div className="flex-1 flex overflow-hidden ml-0">
        {/* Error Message */}
        {error && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 bg-red-500/20 backdrop-blur-sm border border-red-400/50 rounded-xl p-4 text-red-200 shadow-lg">
            <p className="font-semibold">Error: {error}</p>
          </div>
        )}
        
        {/* Left: Camera Feed Section - ~67% width (2/3) */}
        <div ref={containerRef} className="flex-[2] h-full relative overflow-hidden">
          {/* Camera Feed - Fills entire left section */}
          <CameraFeed
            isActive={isCameraActive}
            onFrameCapture={handleFrameCapture}
            onCameraError={handleCameraError}
            onCameraReady={handleCameraReady}
            onPoseDetected={handlePoseDetected}
            enablePoseDetection={true}
          />

          {/* Shot Type Badge */}
          {isCameraActive && prediction && (
            <div className="absolute top-4 left-4 z-30 bg-black/60 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-3 shadow-lg text-white">
              <span className="text-xs uppercase tracking-widest text-white/80">Detected Shot</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-lg font-semibold">
                  {formatShotLabel(prediction.shot_type)}
                </span>
                <span className="text-xs font-semibold text-white/80">
                  {Math.round(prediction.shot_confidence * 100)}%
                </span>
              </div>
            </div>
          )}
          
          {/* Pose Overlay - Overlaid on video feed */}
          {isCameraActive && keypoints.length > 0 && containerDimensions.width > 0 && (
            <PoseOverlay
              keypoints={keypoints}
              videoWidth={videoDimensions.width}
              videoHeight={videoDimensions.height}
              containerWidth={containerDimensions.width}
              containerHeight={containerDimensions.height}
            />
          )}
          
          {/* Processing Indicator - Overlaid */}
          {isProcessing && (
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2 border border-cricket-green/50 shadow-lg z-20">
              <div className="w-2 h-2 bg-cricket-green rounded-full animate-pulse" />
              <span className="text-sm text-cv-text font-medium">Processing...</span>
            </div>
          )}
          
          {/* Camera Controls - Overlaid at bottom with z-index */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex justify-center gap-4 z-30">
            <button
              onClick={handleStart}
              disabled={isCameraActive}
              className={`px-6 py-3 rounded-xl font-semibold text-base transition-all duration-300 shadow-lg flex items-center gap-2 ${
                isCameraActive
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-gray-800 active:scale-95'
              }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span>Start Camera</span>
            </button>
            <button
              onClick={handleStop}
              disabled={!isCameraActive}
              className={`px-6 py-3 rounded-xl font-semibold text-base transition-all duration-300 shadow-lg flex items-center gap-2 ${
                !isCameraActive
                  ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 active:scale-95'
              }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h12v12H6z" />
              </svg>
              <span>Stop Camera</span>
            </button>
          </div>
        </div>

        {/* Right: Prediction and Audio Transcript - ~33% width (1/3) */}
        <div className="flex-[1] h-full bg-cv-bg border-l-2 border-gray-300 flex flex-col">
          {/* Prediction Panel - Top half */}
          <div className="flex-1 p-6 min-h-0">
            <ActionDisplay 
              prediction={prediction} 
              isActive={isCameraActive}
              confidenceHistory={confidenceHistory}
            />
          </div>

          {/* Horizontal Divider */}
          <div className="border-t-2 border-gray-300"></div>

          {/* Audio Transcript Panel - Bottom half */}
          <div className="flex-1 p-6 min-h-0 flex flex-col">
            <h2 className="text-xl font-bold mb-4 text-cv-text">Audio transcript</h2>
            <div className="flex-1 overflow-y-auto">
              {audioTranscript ? (
                <p className="text-cv-text text-sm leading-relaxed whitespace-pre-wrap">
                  {audioTranscript}
                </p>
              ) : (
                <p className="text-cv-muted text-center py-8 text-sm">No audio generated yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
