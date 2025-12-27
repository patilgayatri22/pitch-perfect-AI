import { useState } from 'react';
import SidebarNavigation from '../components/landing/SidebarNavigation';
import HeroSection from '../components/landing/HeroSection';
import AboutModal from '../components/shared/AboutModal';
import AnalysisOptionsModal from '../components/shared/AnalysisOptionsModal';

export default function LandingPage() {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);

  const handleLaunchAnalysis = () => {
    setAnalysisModalOpen(true);
  };

  return (
    <div className="relative min-h-screen text-cv-text overflow-hidden">
      <SidebarNavigation onOpenAbout={() => setAboutOpen(true)} />
      <HeroSection onPrimaryAction={handleLaunchAnalysis} onSecondaryAction={() => setAboutOpen(true)} />
      <AboutModal isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />
      <AnalysisOptionsModal isOpen={analysisModalOpen} onClose={() => setAnalysisModalOpen(false)} />
    </div>
  );
}


