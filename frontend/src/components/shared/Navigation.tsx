import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_LINKS } from '../../config/constants';

interface NavigationProps {
  onOpenAbout?: () => void;
  accent?: 'green' | 'teal';
  hideLinks?: boolean;
}

export function Navigation({ hideLinks = false }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  // All nav links use same color, active has underline
  const navLinkBaseClass = 'text-cv-text font-medium transition-colors duration-200 relative';
  const navLinkActiveClass = 'text-cv-text font-semibold';
  const navLinkInactiveClass = 'text-cv-text';
  const navLinkStyle = {};

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-transparent">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-center px-4 sm:px-6 lg:px-8 relative">
        {!hideLinks && (
          <nav className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.route}
                to={link.route}
                className={({ isActive }) =>
                  `${navLinkBaseClass} text-sm pb-1 ${
                    isActive 
                      ? navLinkActiveClass + ' border-b-2 border-cv-text' 
                      : navLinkInactiveClass
                  }`
                }
                style={navLinkStyle}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-3 md:hidden absolute right-4">
          {!hideLinks && (
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-cv-border text-cv-text hover:bg-cv-border"
              aria-label="Toggle navigation menu"
            >
              <span className="sr-only">Toggle navigation</span>
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {!hideLinks && isMenuOpen && (
        <div className="border-t border-cv-border bg-cv-bg/95 backdrop-blur-sm shadow-lg md:hidden">
          <nav className="flex flex-col space-y-2 px-6 py-4">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.route}
                to={link.route}
                onClick={closeMenu}
                className={({ isActive }) =>
                  `${navLinkBaseClass} text-base py-2 ${
                    isActive 
                      ? navLinkActiveClass + ' border-l-4 border-cv-text pl-2' 
                      : navLinkInactiveClass + ' pl-2'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

export default Navigation;
