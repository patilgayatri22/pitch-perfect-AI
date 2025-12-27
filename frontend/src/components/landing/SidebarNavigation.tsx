import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_LINKS } from '../../config/constants';

interface SidebarNavigationProps {
  onOpenAbout?: () => void;
}

export function SidebarNavigation({ onOpenAbout }: SidebarNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Hamburger Menu Button - Only show when sidebar is closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-50 w-10 h-10 flex items-center justify-center bg-white/90 backdrop-blur-sm border border-cv-border/50 rounded-lg shadow-sm hover:bg-white transition-colors duration-200"
          aria-label="Open navigation menu"
        >
          <svg
            className="w-6 h-6 text-cv-text"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-white/95 backdrop-blur-md border-r border-cv-border/50 shadow-lg z-40 flex flex-col py-8 px-6 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Close Button - Top Right Corner */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-cv-text hover:text-cv-black transition-colors duration-200"
          aria-label="Close navigation menu"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Main Navigation */}
        <nav className="flex flex-col space-y-4">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.route}
              to={link.route}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `group flex items-center gap-3 text-cv-text font-medium transition-all duration-200 py-2 ${
                  isActive ? 'font-semibold text-cv-black' : 'hover:text-cv-black'
                }`
              }
            >
              {/* Home Icon */}
              {link.route === '/' && (
                <svg
                  className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity duration-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
              )}
              {/* Live Analysis Icon */}
              {link.route === '/app' && (
                <svg
                  className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity duration-200"
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
              )}
              {/* Upload Video Icon */}
              {link.route === '/upload' && (
                <svg
                  className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity duration-200"
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
              )}
              {/* Session Dashboard Icon */}
              {link.route === '/analysis' && (
                <svg
                  className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity duration-200"
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
              )}
              <span>{link.label}</span>
            </NavLink>
          ))}

          {/* About Link */}
          {onOpenAbout && (
            <button
              onClick={() => {
                onOpenAbout();
                setIsOpen(false);
              }}
              className="group flex items-center gap-3 text-cv-text font-medium transition-all duration-200 py-2 hover:text-cv-black text-left"
            >
              <svg
                className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity duration-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span>About</span>
            </button>
          )}
        </nav>

        {/* Socials removed for class project */}
      </aside>
    </>
  );
}

export default SidebarNavigation;
