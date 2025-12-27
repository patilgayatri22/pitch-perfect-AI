import SidebarNavigation from '../components/landing/SidebarNavigation';
import { ANALYSIS_DASHBOARD_PLACEHOLDER } from '../config/constants';

export default function AnalysisPage() {
  return (
    <div className="min-h-screen bg-cv-bg text-cv-text flex">
      <SidebarNavigation />
      
      {/* Main content area */}
      <div className="flex-1 ml-0 p-8 md:p-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <header className="mb-8">
            <h1 className="text-4xl md:text-5xl font-semibold text-cv-text mb-3">
              Session Dashboard
            </h1>
            <p className="text-cv-muted text-lg">
              {ANALYSIS_DASHBOARD_PLACEHOLDER.description}
            </p>
          </header>

          {/* Placeholder Content */}
          <div className="bg-white border border-cv-border rounded-xl p-8 md:p-12 shadow-sm">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cv-border mb-4">
                <svg
                  className="w-8 h-8 text-cv-muted"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-cv-text mb-3">
                {ANALYSIS_DASHBOARD_PLACEHOLDER.title}
              </h2>
              <p className="text-cv-muted max-w-md mx-auto">
                {ANALYSIS_DASHBOARD_PLACEHOLDER.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

