import { useState, useEffect } from 'react';

interface CricketLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function CricketLogo({ className = '', size = 'md' }: CricketLogoProps) {
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState('/cricket-player.png');
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16 md:w-20 md:h-20',
  };

  // Try different image formats
  const imagePaths = [
    '/cricket-player.png',
    '/cricket-player.jpg',
    '/cricket-player.jpeg',
    '/cricket-player.svg',
    '/cricket-logo.png',
    '/logo.png',
  ];

  useEffect(() => {
    // Reset error state when src changes
    setImageError(false);
  }, [imageSrc]);

  // Fallback SVG cricket bat icon - more detailed
  const FallbackIcon = () => (
    <svg
      className={`${sizeClasses[size]} ${className}`}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Cricket bat - handle */}
      <rect x="46" y="65" width="8" height="25" rx="2" fill="#10b981" />
      {/* Cricket bat - blade */}
      <rect x="43" y="15" width="14" height="50" rx="3" fill="#34d399" />
      <rect x="45" y="10" width="10" height="8" rx="2" fill="#10b981" />
      {/* Cricket ball */}
      <circle cx="62" cy="28" r="7" fill="#3b82f6" />
      <circle cx="62" cy="28" r="5" fill="#60a5fa" />
      {/* Stitch lines on ball */}
      <path d="M 57 28 L 67 28" stroke="#1e40af" strokeWidth="0.5" />
      <path d="M 62 23 L 62 33" stroke="#1e40af" strokeWidth="0.5" />
      {/* Player silhouette - body */}
      <ellipse cx="50" cy="58" rx="9" ry="14" fill="#10b981" opacity="0.4" />
      {/* Player head */}
      <circle cx="50" cy="38" r="7" fill="#10b981" opacity="0.4" />
      {/* Helmet outline */}
      <ellipse cx="50" cy="36" rx="8" ry="6" fill="none" stroke="#34d399" strokeWidth="1" opacity="0.6" />
    </svg>
  );

  const handleImageError = () => {
    const currentIndex = imagePaths.indexOf(imageSrc);
    if (currentIndex < imagePaths.length - 1) {
      // Try next image path
      setImageSrc(imagePaths[currentIndex + 1]);
    } else {
      // All paths failed, show fallback
      setImageError(true);
    }
  };

  if (imageError) {
    return <FallbackIcon />;
  }

  return (
    <img
      src={imageSrc}
      alt="Cricket Player Logo"
      className={`${sizeClasses[size]} object-contain ${className}`}
      onError={handleImageError}
      onLoad={() => setImageError(false)}
    />
  );
}

