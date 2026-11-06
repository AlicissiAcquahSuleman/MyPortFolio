import React, { useState, useEffect } from 'react';
import { PortfolioData } from '../types';

interface NavbarProps {
  portfolioData: PortfolioData;
  onOpenCVModal: () => void;
  onOpenAdmin: () => void;
  onOpenDjangoGuide: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  portfolioData,
  onOpenCVModal,
  onOpenAdmin,
  onOpenDjangoGuide,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', href: '#home' },
    { label: 'About Me', href: '#about' },
    { label: 'Technical Skills', href: '#skills' },
    { label: 'Services', href: '#services' },
    { label: 'Projects', href: '#projects' },
    { label: 'Work Experience', href: '#experience' },
    { label: 'Education', href: '#education' },
    { label: 'Contact Me', href: '#contact' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-slate-950/90 backdrop-blur-md border-b border-slate-800 shadow-xl py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Brand Logo & Name */}
          <a href="#home" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <i className="bi bi-terminal-fill text-xl"></i>
            </div>
            <div>
              <span className="font-bold text-white text-base tracking-tight flex items-center gap-1.5">
                {portfolioData.profile?.full_name || 'Cisse Acquah'}
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" title="Available for hire"></span>
              </span>
              <span className="text-[11px] font-mono text-blue-400 block -mt-0.5">
                Software Engineer
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-full border border-slate-800/80 backdrop-blur-sm">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            
            {/* Django Architecture Inspector Button */}
            <button
              onClick={onOpenDjangoGuide}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Inspect Django MVT Code & PowerShell commands"
            >
              <i className="bi bi-filetype-py text-emerald-400 text-sm"></i>
              Django Project
            </button>

            {/* Admin Dashboard Entry */}
            <button
              onClick={onOpenAdmin}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Open Admin Management Dashboard"
            >
              <i className="bi bi-speedometer2 text-blue-400 text-sm"></i>
              Admin
            </button>

            {/* Primary Action: Download My CV */}
            <button
              onClick={onOpenCVModal}
              className="py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <i className="bi bi-file-earmark-arrow-down-fill text-sm"></i>
              Download My CV
            </button>
          </div>

          {/* Mobile Menu Trigger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onOpenCVModal}
              className="py-1.5 px-3 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 flex items-center gap-1"
            >
              <i className="bi bi-download"></i> CV
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
              aria-label="Toggle menu"
            >
              <i className={`bi ${mobileMenuOpen ? 'bi-x-lg' : 'bi-list'} text-lg`}></i>
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-950 border-b border-slate-800 px-4 pt-3 pb-6 space-y-2 mt-2">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-850"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenDjangoGuide();
              }}
              className="w-full py-2.5 px-3 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 text-left flex items-center gap-2"
            >
              <i className="bi bi-filetype-py text-emerald-400"></i>
              Django MVT Architecture &amp; PowerShell Guide
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAdmin();
              }}
              className="w-full py-2.5 px-3 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 text-left flex items-center gap-2"
            >
              <i className="bi bi-speedometer2 text-blue-400"></i>
              Administrative Dashboard
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
