import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface AnalysisOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AnalysisOptionsModal({ isOpen, onClose }: AnalysisOptionsModalProps) {
  const navigate = useNavigate();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      document.addEventListener('keydown', onKey);
    }
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const handleLiveAnalysis = () => {
    onClose();
    navigate('/app');
  };

  const handleVideoUpload = () => {
    onClose();
    navigate('/upload');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Choose Analysis Type"
    >
      <button
        aria-label="Close dialog"
        className="absolute inset-0 h-full w-full bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative z-10 mx-4 w-full max-w-2xl animate-[slide-up_0.25s_ease-out] rounded-2xl border border-cv-border bg-cv-bg p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between mb-6">
          <h3 className="text-2xl font-semibold text-cv-text">Choose Analysis Type</h3>
          <button
            onClick={onClose}
            className="rounded-full border border-cv-border p-2 text-cv-text transition-colors hover:border-cv-muted hover:bg-cv-border hover:text-cv-black"
          >
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Live Analysis Option */}
          <button
            onClick={handleLiveAnalysis}
            className="group relative flex flex-col items-center justify-center rounded-xl border-2 border-cv-border bg-white p-8 text-center transition-all duration-200 hover:border-cricket-green hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-cricket-green focus:ring-offset-2"
          >
            <div className="mb-4 rounded-full bg-cricket-green/10 p-4 transition-colors group-hover:bg-cricket-green/20">
              <svg
                className="h-12 w-12 text-cricket-green"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h4 className="text-xl font-semibold text-cv-text mb-2">Live Analysis</h4>
            <p className="text-sm text-cv-muted leading-relaxed">
              Real-time analysis using your camera. Get instant feedback as you perform cricket shots.
            </p>
          </button>

          {/* Video Upload Option */}
          <button
            onClick={handleVideoUpload}
            className="group relative flex flex-col items-center justify-center rounded-xl border-2 border-cv-border bg-white p-8 text-center transition-all duration-200 hover:border-cricket-green hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-cricket-green focus:ring-offset-2"
          >
            <div className="mb-4 rounded-full bg-cricket-green/10 p-4 transition-colors group-hover:bg-cricket-green/20">
              <svg
                className="h-12 w-12 text-cricket-green"
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
            </div>
            <h4 className="text-xl font-semibold text-cv-text mb-2">Video Upload</h4>
            <p className="text-sm text-cv-muted leading-relaxed">
              Upload a video file for analysis. Perfect for reviewing recorded practice sessions.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}

export default AnalysisOptionsModal;

