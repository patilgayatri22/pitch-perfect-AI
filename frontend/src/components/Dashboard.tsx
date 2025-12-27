import { useState, useEffect, useRef, useCallback } from 'react';
import { CameraFeed } from './CameraFeed';
import { PoseOverlay } from './PoseOverlay';
import { ActionDisplay } from './ActionDisplay';
import { mockPredict } from '../services/mockApi';
import { speakActionFeedback, stopAudio } from '../services/ttsService';
import type { PredictionResponse } from '../types';

export function Dashboard() {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [videoDimensions, setVideoDimensions] = useState({ width: 1280, height: 720 });
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionHistory, setActionHistory] = useState<Array<PredictionResponse & { timestamp: number }>>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const lastActionRef = useRef<string | null>(null);
  const processingRef = useRef(false);
  const lastProcessTimeRef = useRef<number>(0);
  const FRAME_INTERVAL_MS = 200; // Process every 200ms (5 FPS for predictions)

  // Update container dimensions
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

  // Handle frame capture and prediction
  const handleFrameCapture = useCallback(async (video: HTMLVideoElement) => {
    if (processingRef.current || !isCameraActive) return;
    
    // Throttle predictions to avoid excessive API calls
    const now = Date.now();
    if (now - lastProcessTimeRef.current < FRAME_INTERVAL_MS) {
      return;
    }

    processingRef.current = true;
    setIsProcessing(true);
    lastProcessTimeRef.current = now;

    try {
      // Get video dimensions (use defaults if not available yet)
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        setVideoDimensions({ width: video.videoWidth, height: video.videoHeight });
      }

      // Mock prediction (replace with real API call later)
      const result = await mockPredict(video);

      setPrediction(result);

      // Add to action history
      setActionHistory((prev) => {
        const newHistory = [...prev, { ...result, timestamp: Date.now() }];
        // Keep only last 50 predictions
        return newHistory.slice(-50);
      });

      // Voice feedback - only speak when action changes
      if (lastActionRef.current !== result.action) {
        lastActionRef.current = result.action;
        speakActionFeedback(result.action).catch((err) => {
          console.error('TTS Error:', err);
        });
      }
    } catch (err) {
      console.error('Prediction error:', err);
      setError(err instanceof Error ? err.message : 'Prediction failed');
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  }, [isCameraActive]);

  // Handle camera start/stop
  const handleStart = () => {
    setError(null);
    setPrediction(null);
    setActionHistory([]);
    lastActionRef.current = null;
    setIsCameraActive(true);
  };

  const handleStop = () => {
    setIsCameraActive(false);
    stopAudio();
    setPrediction(null);
    lastActionRef.current = null;
  };

  const handleCameraError = (err: Error) => {
    setError(err.message);
    setIsCameraActive(false);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-3 bg-gradient-to-r from-cricket-green-bright via-cricket-blue-bright to-cricket-purple bg-clip-text text-transparent animate-pulse-glow">
            Pitch-Perfect
          </h1>
          <p className="text-cricket-text-muted text-lg font-medium">Pose-Based Action Recognition in Cricket Players</p>
        </header>

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-500/20 backdrop-blur-sm border border-red-400/50 rounded-xl p-4 text-red-200 shadow-lg">
            <p className="font-semibold">Error: {error}</p>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Video Feed with Overlay - Takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            <div
              ref={containerRef}
              className="relative aspect-video card-glass rounded-2xl overflow-hidden border-2 border-slate-600/50 shadow-2xl card-hover"
            >
              <CameraFeed
                isActive={isCameraActive}
                onFrameCapture={handleFrameCapture}
                onCameraError={handleCameraError}
              />
              {isCameraActive && prediction?.keypoints && (
                <PoseOverlay
                  keypoints={prediction.keypoints}
                  videoWidth={videoDimensions.width}
                  videoHeight={videoDimensions.height}
                  containerWidth={containerDimensions.width}
                  containerHeight={containerDimensions.height}
                />
              )}
              {isProcessing && (
                <div className="absolute top-4 right-4 bg-cricket-green/20 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2 border border-cricket-green/30 shadow-lg">
                  <div className="w-2 h-2 bg-cricket-green rounded-full animate-pulse" />
                  <span className="text-sm text-cricket-text font-medium">Processing...</span>
                </div>
              )}
            </div>

            {/* Camera Controls */}
            <div className="mt-4 flex justify-center gap-4">
              <button
                onClick={handleStart}
                disabled={isCameraActive}
                className={`px-8 py-3 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg ${
                  isCameraActive
                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cricket-green to-cricket-green-bright text-white hover:glow-green-strong active:scale-95 hover:scale-105'
                }`}
              >
                ▶ Start Camera
              </button>
              <button
                onClick={handleStop}
                disabled={!isCameraActive}
                className={`px-8 py-3 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg ${
                  !isCameraActive
                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 active:scale-95 hover:scale-105'
                }`}
              >
                ⏹ Stop Camera
              </button>
            </div>
          </div>

          {/* Action Display - Takes 1 column */}
          <div className="lg:col-span-1">
            <ActionDisplay prediction={prediction} isActive={isCameraActive} />
          </div>
        </div>

        {/* Bottom Section: Player Visualization and History */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Player Pose section removed per redesign */}

          {/* Action History Timeline */}
          <div className="card-glass rounded-2xl p-6 shadow-xl card-hover">
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-cricket-blue to-cricket-blue-bright bg-clip-text text-transparent">
              Action History
            </h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {actionHistory.length === 0 ? (
                <p className="text-cricket-text-muted text-center py-8">No actions detected yet</p>
              ) : (
                actionHistory
                  .slice()
                  .reverse()
                  .slice(0, 10)
                  .map((item, index) => (
                    <div
                      key={`${item.timestamp}-${index}`}
                      className="flex items-center justify-between bg-slate-800/50 backdrop-blur-sm rounded-xl p-3 border border-slate-600/30 hover:border-cricket-green/50 transition-all duration-200 hover:bg-slate-700/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl animate-float" style={{ animationDelay: `${index * 0.1}s` }}>
                          {item.action === 'Batting' ? '🏏' : item.action === 'Bowling' ? '⚾' : '🧤'}
                        </span>
                        <div>
                          <span className="font-bold text-cricket-text">{item.action}</span>
                          <span className="text-sm text-cricket-text-muted ml-2">
                            {Math.round(item.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-cricket-text-muted">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <footer className="mt-8 text-center text-cricket-text-muted text-sm">
          <p className="font-medium">Real-time pose estimation and action recognition for cricket players</p>
          <p className="mt-2">
            {isCameraActive ? (
              <span className="inline-flex items-center gap-2 text-cricket-green font-semibold">
                <span className="w-2 h-2 bg-cricket-green rounded-full animate-pulse" /> Live Detection Active
              </span>
            ) : (
              <span>Camera inactive</span>
            )}
          </p>
        </footer>
      </div>
    </div>
  );
}

