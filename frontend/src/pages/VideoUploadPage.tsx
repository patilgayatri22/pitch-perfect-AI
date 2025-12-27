import { useState, useRef, useCallback, useEffect } from 'react';
import SidebarNavigation from '../components/landing/SidebarNavigation';
import { ActionDisplay } from '../components/ActionDisplay';
import { VideoAnalysisCharts } from '../components/VideoAnalysisCharts';
import { predictVideo } from '../services/api';
import type { PredictionResponse } from '../types';

const formatShotLabel = (shotType: string) =>
  shotType
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export default function VideoUploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    // Validate file type
    const allowedTypes = ['video/mp4', 'video/avi', 'video/x-msvideo', 'video/quicktime'];
    const allowedExtensions = ['.mp4', '.avi', '.mov'];
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext))) {
      setError('Invalid file format. Please upload a .mp4, .avi, or .mov file.');
      return;
    }

    // Clean up previous video preview URL
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }

    setError(null);
    setSelectedFile(file);
    setPrediction(null);
    setUploadProgress(0);

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setVideoPreview(previewUrl);
  }, [videoPreview]);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // Handle upload and prediction
  const handleUpload = useCallback(async () => {
    if (!selectedFile) {
      setError('Please select a video file first.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setPrediction(null);
    setUploadProgress(0);

    try {
      // Check model status first
      try {
        const { checkModelStatus } = await import('../services/api');
        const modelStatus = await checkModelStatus();
        if (!modelStatus.model_loaded) {
          setError(
            `Model not loaded on server. ${modelStatus.message}\n\n` +
            `Available model files: ${modelStatus.available_models
              .filter(m => m.exists)
              .map(m => `${m.name} (${m.size_mb}MB)`)
              .join(', ') || 'None found'}`
          );
          setIsProcessing(false);
          return;
        }
      } catch (statusError) {
        console.warn('Could not check model status:', statusError);
        // Continue anyway - the prediction will fail with a better error
      }

      // Simulate upload progress (since we can't track actual upload progress with fetch)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Make prediction request
      const result = await predictVideo(selectedFile);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

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
    } catch (err) {
      console.error('Prediction error:', err);
      let errorMessage = 'Prediction failed';
      
      if (err instanceof Error) {
        errorMessage = err.message;
        // If it's a fetch error, try to extract the detailed message from the response
        if (err.message.includes('503') || err.message.includes('Service Unavailable')) {
          errorMessage = 'Model not loaded on server. Please check the server startup logs for model loading errors. The server may have started but the model failed to load.';
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
    }
  }, [selectedFile]);

  // Handle reset
  const handleReset = useCallback(() => {
    // Clean up video preview URL
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setSelectedFile(null);
    setVideoPreview(null);
    setPrediction(null);
    setError(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [videoPreview]);

  // Auto-play video when it's loaded
  useEffect(() => {
    if (videoRef.current && videoPreview) {
      const video = videoRef.current;
      const playPromise = video.play();
      
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // Autoplay was prevented - user interaction may be required
          console.log('Video autoplay prevented:', error);
        });
      }
    }
  }, [videoPreview]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
    };
  }, [videoPreview]);

  return (
    <div className="h-screen bg-cv-bg text-cv-text flex overflow-hidden">
      <SidebarNavigation />
      
      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden ml-0">
        {/* Error Message */}
        {error && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 bg-red-500/20 backdrop-blur-sm border border-red-400/50 rounded-xl p-4 text-red-200 shadow-lg">
            <p className="font-semibold">Error: {error}</p>
          </div>
        )}
        
        {/* Left: Video Upload and Preview Section - 50% width */}
        <div className="flex-1 h-full relative overflow-hidden flex flex-col p-6 min-h-0">
          {/* Upload Area */}
          {!videoPreview && (
            <div
              className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-400 rounded-xl bg-gray-50/50 hover:border-cricket-green transition-colors duration-200 cursor-pointer"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="text-center p-8">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <h3 className="text-xl font-semibold text-cv-text mb-2">
                  Upload Video
                </h3>
                <p className="text-cv-muted mb-4">
                  Drag and drop a video file here, or click to select
                </p>
                <p className="text-sm text-cv-muted">
                  Supported formats: .mp4, .avi, .mov
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/avi,video/x-msvideo,video/quicktime,.mp4,.avi,.mov"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* Video Preview */}
          {videoPreview && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 bg-black rounded-xl overflow-hidden relative min-h-0 max-h-[60vh]">
                <video
                  ref={videoRef}
                  src={videoPreview}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
                
                {/* Shot Type Badge */}
                {prediction && (
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

                {/* Processing Indicator */}
                {isProcessing && (
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2 border border-cricket-green/50 shadow-lg z-20">
                    <div className="w-2 h-2 bg-cricket-green rounded-full animate-pulse" />
                    <span className="text-sm text-cv-text font-medium">
                      {uploadProgress < 100 ? `Processing... ${uploadProgress}%` : 'Analyzing...'}
                    </span>
                  </div>
                )}
              </div>

              {/* Upload Progress Bar */}
              {isProcessing && uploadProgress > 0 && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-cricket-green h-full transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-4 flex flex-col gap-3 flex-shrink-0">
                <button
                  onClick={handleUpload}
                  disabled={isProcessing || !selectedFile || !!prediction}
                  className={`w-full px-6 py-3 rounded-xl font-semibold text-base transition-all duration-300 shadow-lg flex items-center justify-center gap-2 ${
                    isProcessing || !selectedFile || !!prediction
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-cricket-green text-white hover:bg-cricket-green-bright active:scale-95'
                  }`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span>{isProcessing ? 'Processing...' : prediction ? 'Analysis Complete' : 'Analyze Video'}</span>
                </button>
                <button
                  onClick={() => {
                    // Clean up previous video preview
                    if (videoPreview) {
                      URL.revokeObjectURL(videoPreview);
                    }
                    // Reset state
                    setSelectedFile(null);
                    setVideoPreview(null);
                    setPrediction(null);
                    setError(null);
                    setUploadProgress(0);
                    // Reset file input and open picker
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                      fileInputRef.current.click();
                    }
                  }}
                  disabled={isProcessing}
                  className={`w-full px-6 py-3 rounded-xl font-semibold text-base transition-all duration-300 shadow-lg flex items-center justify-center gap-2 ${
                    isProcessing
                      ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 active:scale-95'
                  }`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <span>Upload New Video</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Prediction and Charts - 50% width */}
        <div className="flex-1 h-full bg-cv-bg border-l-2 border-gray-300 flex flex-col">
          {/* Prediction Panel - Top half */}
          <div className="flex-1 p-6 min-h-0">
            <ActionDisplay 
              prediction={prediction} 
              isActive={!!prediction}
              confidenceHistory={prediction ? [{
                time: 1,
                confidence: (prediction.form_confidence ?? prediction.confidence) * 100,
                timestamp: Date.now(),
              }] : []}
            />
          </div>

          {/* Horizontal Divider */}
          <div className="border-t-2 border-gray-300"></div>

          {/* Charts Panel - Bottom half */}
          <div className="flex-1 p-6 min-h-0 flex flex-col">
            <VideoAnalysisCharts prediction={prediction} />
          </div>
        </div>
      </div>
    </div>
  );
}

