import { HOW_IT_WORKS, TECHNOLOGY_STACK, USE_CASES } from '../../config/constants';
import { Fragment, useEffect } from 'react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      document.addEventListener('keydown', onKey);
    }
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="About Pitch-Perfect"
    >
      <button
        aria-label="Close about dialog"
        className="absolute inset-0 h-full w-full bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative z-10 mx-4 w-full max-w-3xl animate-[slide-up_0.25s_ease-out] rounded-2xl border border-cv-border bg-cv-bg p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between">
          <h3 className="text-2xl font-semibold text-cv-text">About Pitch-Perfect</h3>
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

        <div className="mt-6 grid gap-6">
          <section className="rounded-lg border border-orange-300 bg-orange-50/50 p-4">
            <div className="flex items-start gap-2">
              <svg className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="text-sm font-semibold text-orange-900 mb-1">Important: Camera Angle Requirement</h4>
                <p className="text-sm text-orange-800 leading-relaxed">
                  For accurate analysis, record videos from a <strong>side angle</strong> (90° perpendicular to the batsman). 
                  The model is trained on side-view footage, so broadcast angles or front/back views may produce inaccurate results.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h4 className="text-lg font-semibold text-cv-text mb-3">How It Works</h4>
            <ol className="grid gap-3 text-sm sm:grid-cols-3">
              {HOW_IT_WORKS.map((s) => (
                <li key={s.step} className="rounded-lg border border-cv-border bg-white p-4 shadow-sm">
                  <div className="text-cv-text font-semibold mb-1">Step {s.step}</div>
                  <div className="text-cv-text font-medium mb-2">{s.title}</div>
                  <p className="text-cv-muted text-sm leading-relaxed">{s.description}</p>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h4 className="text-lg font-semibold text-cv-text mb-3">Technology</h4>
            <ul className="grid list-disc gap-2 pl-5 text-sm text-cv-muted sm:grid-cols-2">
              {TECHNOLOGY_STACK.map((t) => (
                <li key={t} className="leading-relaxed">{t}</li>
              ))}
            </ul>
          </section>

          <section>
            <h4 className="text-lg font-semibold text-cv-text mb-3">Use Cases</h4>
            <ul className="grid list-disc gap-2 pl-5 text-sm text-cv-muted sm:grid-cols-2">
              {USE_CASES.map((u) => (
                <li key={u} className="leading-relaxed">{u}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

export default AboutModal;


