import React from 'react';
import { PortfolioData } from '../types';

interface FooterProps {
  portfolioData: PortfolioData;
  onOpenAdmin: () => void;
  onOpenDjangoGuide: () => void;
  onOpenCVModal: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  portfolioData,
  onOpenAdmin,
  onOpenDjangoGuide,
  onOpenCVModal,
}) => {
  const { profile, settings, socials } = portfolioData;
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 py-12 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-slate-800/80 items-center">
          
          {/* Col 1: Identity */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                <i className="bi bi-terminal-fill text-lg"></i>
              </div>
              <span className="font-bold text-white text-base">
                {profile?.full_name || 'Cisse Acquah'}
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              {profile?.professional_title} specialising in Python/Django backend systems, SQLite/PostgreSQL architecture, and reactive web applications.
            </p>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="md:col-span-4 flex flex-wrap gap-4 text-xs font-medium">
            <a href="#home" className="hover:text-white transition-colors">Home</a>
            <a href="#about" className="hover:text-white transition-colors">About</a>
            <a href="#skills" className="hover:text-white transition-colors">Skills</a>
            <a href="#services" className="hover:text-white transition-colors">Services</a>
            <a href="#projects" className="hover:text-white transition-colors">Projects</a>
            <a href="#experience" className="hover:text-white transition-colors">Experience</a>
            <a href="#education" className="hover:text-white transition-colors">Education</a>
            <a href="#contact" className="hover:text-white transition-colors">Contact</a>
          </div>

          {/* Col 3: Quick Action Badges */}
          <div className="md:col-span-3 flex flex-wrap items-center md:justify-end gap-2">
            <button
              onClick={onOpenCVModal}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <i className="bi bi-file-earmark-arrow-down-fill"></i> Download CV
            </button>
            <button
              onClick={onOpenDjangoGuide}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <i className="bi bi-filetype-py text-emerald-400"></i> Django Source
            </button>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Live Visitor Counter */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          
          <div className="flex items-center gap-2">
            <span>&copy; {currentYear} {profile?.full_name}. All rights reserved.</span>
            <span>&bull;</span>
            <button
              onClick={onOpenAdmin}
              className="hover:text-blue-400 transition-colors flex items-center gap-1"
            >
              <i className="bi bi-lock-fill text-[10px]"></i> Admin Dashboard
            </button>
          </div>

          {/* Visitor Counter */}
          <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-full border border-slate-800 text-[11px] text-slate-400">
            <i className="bi bi-eye-fill text-blue-400"></i>
            <span>Verified Portfolio Visits:</span>
            <span className="font-mono font-bold text-white px-1.5 py-0.5 rounded bg-slate-800">
              {settings?.visitor_count || 142}
            </span>
          </div>

        </div>

      </div>
    </footer>
  );
};
