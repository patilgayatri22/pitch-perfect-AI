export const HERO_CONTENT = {
  mainHeading: 'Pitch-Perfect',
  subHeading: 'Pose-Based Action Recognition in Cricket Players',
  tagline: 'Real-time AI-powered analysis of cricket shots and player movements',
};

export const CTA_BUTTONS = {
  primary: {
    label: 'Launch Analysis',
    route: '/app',
  },
  secondary: {
    label: 'Learn More',
    action: 'open-about-modal',
  },
};

export const BACKGROUND = {
  imagePath: '/assets/images/cricket-ground-bg.jpg',
  imageAlt: 'Cricket ground under stadium lights',
};

export const FEATURES = [
  {
    title: 'Real-time Pose Tracking',
    description:
      'Capture and analyze player movements in real time with high-precision pose estimation.',
    icon: '🎯',
  },
  {
    title: 'AI Shot Classification',
    description: 'Detect shot types (drive, sweep, pullshot, legglance_flick) and classify form quality (High/Not High) with confidence scoring.',
    icon: '🤖',
  },
  {
    title: 'Multitask Analysis',
    description: 'Detect shot types (drive, sweep, pullshot, legglance_flick) and assess form quality simultaneously with confidence scores.',
    icon: '📊',
  },
];

export const HOW_IT_WORKS = [
  {
    step: 1,
    title: 'Capture',
    description: 'Record videos from the side angle (90° perpendicular to batsman) for accurate analysis. The model is trained on side-view footage.',
  },
  {
    step: 2,
    title: 'Analyze',
    description:
      'Pitch-Perfect processes video frames with a multitask CNN + BiLSTM model to classify shot types (drive, sweep, pullshot, legglance_flick) and form quality (High/Not High).',
  },
  {
    step: 3,
    title: 'Coach',
    description:
      `Receive actionable insights with shot type detection and form quality analysis, including confidence scores for each prediction.`,
  },
];

export const TECHNOLOGY_STACK = [
  'FastAPI backend with TensorFlow 2.19 & Keras 3.10',
  'Multitask CNN + BiLSTM model (shot type + form quality)',
  'EfficientNet-B0 backbone with TimeDistributed layers',
  'Python 3.12 backend with NumPy 2.0 & OpenCV 4.12',
  'React, TypeScript, and Tailwind CSS frontend',
];

export const USE_CASES = [
  'Professional coaching sessions',
  'Grassroots cricket training programs',
  'Performance analytics for broadcasters',
  'Academy-level player development',
  'Self-paced training for aspiring players',
];

export const ANALYSIS_DASHBOARD_PLACEHOLDER = {
  title: 'Session Analysis Coming Soon',
  description:
    'Review detailed insights from completed training sessions, including action frequency, confidence trends, and timeline replays.',
};

export const NAV_LINKS = [
  { label: 'Home', route: '/' },
  { label: 'Live Analysis', route: '/app' },
  { label: 'Upload Video', route: '/upload' },
  { label: 'Session Dashboard', route: '/analysis' },
];

