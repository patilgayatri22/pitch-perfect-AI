import { useEffect, useState } from 'react';
import { HERO_CONTENT, CTA_BUTTONS } from '../../config/constants';
import CTAButtons from './CTAButtons';

interface HeroSectionProps {
  onPrimaryAction: () => void;
  onSecondaryAction?: () => void;
}

export function HeroSection({ onPrimaryAction, onSecondaryAction }: HeroSectionProps) {
  const [typedHeading, setTypedHeading] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [showSubContent, setShowSubContent] = useState(false);

  useEffect(() => {
    const heading = HERO_CONTENT.mainHeading;
    if (!heading) {
      setTypedHeading('');
      setIsTyping(false);
      return;
    }

    let index = 0;
    const typingSpeed = 120; // ms per character

    const interval = setInterval(() => {
      index += 1;
      setTypedHeading(heading.slice(0, index));

      if (index >= heading.length) {
        clearInterval(interval);
        setTypedHeading(heading);
        setIsTyping(false);
      }
    }, typingSpeed);

    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!isTyping) {
      const timeout = setTimeout(() => {
        setShowSubContent(true);
      }, 200);
      return () => clearTimeout(timeout);
    }
    setShowSubContent(false);
  }, [isTyping]);

  return (
    <section
      className="relative h-screen w-full z-0"
      aria-label="Hero section"
    >
      {/* Background Image - Full viewport, behind everything */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/landing_page_image.jpg)',
        }}
        aria-hidden="true"
      />

      {/* Content - Above background but below navbar */}
      <div className="absolute inset-0 flex flex-col z-10">
        {/* Hero Text - Positioned in sky area (top portion) */}
        <div className="flex-1 flex items-start justify-center pt-24 sm:pt-32">
          <div className="mx-auto flex w-full max-w-4xl flex-col items-center px-6 text-center sm:px-8 animate-[slide-up_0.4s_ease-out]">
            <h1 className="text-6xl font-medium text-cv-text sm:text-7xl lg:text-8xl xl:text-9xl">
              {typedHeading}
              <span
                className={`inline-block w-[2px] ml-1 h-[0.9em] align-middle bg-cv-text transition-opacity duration-200 ${
                  isTyping ? 'opacity-100 animate-pulse' : 'opacity-0'
                }`}
                aria-hidden="true"
              />
            </h1>

            <div
              className={`mt-6 flex flex-col items-center transition-all duration-500 ease-out ${
                showSubContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <p className="text-2xl font-medium text-cv-text sm:text-3xl">
                {HERO_CONTENT.subHeading}
              </p>

              <p className="mt-4 max-w-2xl text-base text-cv-text sm:text-lg">
                {HERO_CONTENT.tagline}
              </p>
            </div>
          </div>
        </div>

        {/* CTA Buttons - Positioned in lower area */}
        <div className="flex items-center justify-center pb-16 sm:pb-20">
          <CTAButtons
            primaryLabel={CTA_BUTTONS.primary.label}
            onPrimaryClick={onPrimaryAction}
            secondaryLabel={CTA_BUTTONS.secondary.label}
            onSecondaryClick={onSecondaryAction}
          />
        </div>
      </div>
    </section>
  );
}

export default HeroSection;


