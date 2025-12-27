interface CTAButtonsProps {
  primaryLabel: string;
  onPrimaryClick: () => void;
  secondaryLabel: string;
  onSecondaryClick?: () => void;
}

export function CTAButtons({
  primaryLabel,
  onPrimaryClick,
  secondaryLabel,
  onSecondaryClick,
}: CTAButtonsProps) {
  return (
    <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={onPrimaryClick}
        className="w-full rounded-lg bg-black px-10 py-3 text-lg font-semibold text-white shadow-md transition-all duration-200 hover:bg-gray-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-black/30 focus:ring-offset-2 focus:ring-offset-white sm:w-auto"
      >
        {primaryLabel}
      </button>

      <button
        type="button"
        onClick={onSecondaryClick}
        className="w-full rounded-lg border-2 border-white/30 bg-white/10 backdrop-blur-sm px-10 py-3 text-lg font-semibold text-cv-text transition-all duration-200 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-transparent sm:w-auto"
      >
        {secondaryLabel}
      </button>
    </div>
  );
}

export default CTAButtons;
