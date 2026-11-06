import React from 'react';
import { PortfolioData } from '../types';

interface HeroSectionProps {
  portfolioData: PortfolioData;
  onOpenCVModal: () => void;
  onOpenAdminProfile?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  portfolioData,
  onOpenCVModal,
  onOpenAdminProfile,
}) => {
  const { profile, settings, socials } = portfolioData;

  const quickStack = [
    { name: 'Python', icon: 'bi bi-code-slash', color: 'text-yellow-400' },
    { name: 'Django 5.0', icon: 'bi bi-layers-fill', color: 'text-emerald-400' },
    { name: 'PostgreSQL / SQLite', icon: 'bi bi-database-fill', color: 'text-blue-400' },
    { name: 'TypeScript / React', icon: 'bi bi-filetype-tsx', color: 'text-cyan-400' },
    { name: 'REST & GraphQL APIs', icon: 'bi bi-bezier2', color: 'text-purple-400' },
    { name: 'Docker & Linux', icon: 'bi bi-box-seam', color: 'text-blue-300' },
  ];

  const whatsappSocial = socials.find((s) => s.platform_name.toLowerCase().includes('whatsapp'));
  const githubSocial = socials.find((s) => s.platform_name.toLowerCase().includes('github'));
  const linkedinSocial = socials.find((s) => s.platform_name.toLowerCase().includes('linkedin'));

  return (
    <section id="home" className="relative min-h-[92vh] flex items-center justify-center pt-28 pb-16 overflow-hidden">
      
      {/* Background Decorative Gradient Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[380px] bg-blue-600/15 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[350px] h-[350px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Headlines & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            {/* Availability Pill */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs font-medium text-slate-300 shadow-inner">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="w-2 h-2 rounded-full bg-emerald-400 -ml-4.5" />
              <span>Available for Senior Engineering Roles &amp; Contracts</span>
            </div>

            {/* Main Title & Headline */}
            <div>
              <p className="text-sm font-semibold tracking-wider uppercase text-blue-400 mb-2">
                Hello, I am {profile?.full_name || 'Cisse Acquah'}
              </p>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.12]">
                {settings?.hero_headline || 'Engineering Resilient, Scalable & Clean Software Systems'}
              </h1>
            </div>

            {/* Subheadline / Intro */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              {profile?.personal_intro ||
                'Dedicated Software Engineer with 6+ years of experience crafting high-throughput Python/Django APIs, distributed database schemas, and modern responsive user interfaces.'}
            </p>

            {/* Tech Stack Pills */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1">
              {quickStack.map((item, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-750 text-xs font-mono text-slate-300 shadow-sm"
                >
                  <i className={`${item.icon} ${item.color} text-xs`}></i>
                  <span>{item.name}</span>
                </div>
              ))}
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4">
              
              {/* Download My CV (Triggers verification modal) */}
              <button
                type="button"
                onClick={onOpenCVModal}
                className="py-3.5 px-6 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-600/30 active:scale-98 transition-all flex items-center gap-2 cursor-pointer text-sm"
              >
                <i className="bi bi-file-earmark-arrow-down-fill text-lg"></i>
                Download My CV
              </button>

              {/* View Projects Button */}
              <a
                href="#projects"
                className="py-3.5 px-6 rounded-xl font-bold text-slate-200 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 active:scale-98 transition-all flex items-center gap-2 text-sm"
              >
                <i className="bi bi-grid-3x3-gap-fill text-blue-400"></i>
                Explore Projects
              </a>

              {/* Contact Me Button */}
              <a
                href="#contact"
                className="py-3.5 px-5 rounded-xl font-semibold text-slate-400 hover:text-white transition-colors text-sm"
              >
                Get in Touch &rarr;
              </a>
            </div>

            {/* Social Links Row */}
            <div className="flex items-center justify-center lg:justify-start gap-4 pt-3 text-slate-400 text-sm">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">Connect:</span>
              {githubSocial && (
                <a
                  href={githubSocial.profile_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-1 text-xs"
                >
                  <i className="bi bi-github text-base"></i> GitHub
                </a>
              )}
              {linkedinSocial && (
                <a
                  href={linkedinSocial.profile_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-400 transition-colors flex items-center gap-1 text-xs"
                >
                  <i className="bi bi-linkedin text-base"></i> LinkedIn
                </a>
              )}
              {whatsappSocial && (
                <a
                  href={whatsappSocial.profile_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1 text-xs"
                >
                  <i className="bi bi-whatsapp text-base"></i> WhatsApp
                </a>
              )}
            </div>

          </div>

          {/* Right Column: Profile Picture Card & Quick Stats */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-full max-w-sm">
              
              {/* Outer Glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur-xl opacity-30 animate-pulse" />

              {/* Main Card */}
              <div className="relative rounded-2xl bg-slate-900/90 border border-slate-750 p-6 shadow-2xl backdrop-blur-xl space-y-6">
                
                {/* Profile Image with Border */}
                <div
                  className="relative w-44 h-44 mx-auto rounded-2xl overflow-hidden border-2 border-blue-500/40 shadow-xl group cursor-pointer"
                  onClick={onOpenAdminProfile}
                  title="Click to upload/change profile picture"
                >
                  <img
                    src={profile?.profile_image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'}
                    alt={profile?.full_name || 'Software Engineer'}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent group-hover:bg-slate-950/40 transition-colors" />

                  {/* Hover upload badge */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-600/90 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-sm">
                      <i className="bi bi-camera-fill"></i> Upload Picture
                    </span>
                  </div>
                  
                  {/* Verified badge */}
                  <div className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700 text-[10px] text-emerald-400 font-semibold backdrop-blur-sm">
                    <i className="bi bi-patch-check-fill text-blue-400"></i> Verified Engineer
                  </div>
                </div>

                {/* Identity Text */}
                <div className="text-center space-y-1">
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    {profile?.full_name}
                  </h3>
                  <p className="text-xs font-mono text-blue-400 font-medium">
                    {profile?.professional_title}
                  </p>
                  <p className="text-xs text-slate-400 flex items-center justify-center gap-1 pt-1">
                    <i className="bi bi-geo-alt-fill text-rose-400 text-xs"></i>
                    {profile?.location}
                  </p>
                </div>

                {/* Quick Impact Stats Grid */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-750 text-center">
                    <div className="text-xl font-extrabold text-white">6+</div>
                    <div className="text-[11px] text-slate-400 font-medium">Years Experience</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-750 text-center">
                    <div className="text-xl font-extrabold text-blue-400">18+</div>
                    <div className="text-[11px] text-slate-400 font-medium">Deployed Projects</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-750 text-center">
                    <div className="text-xl font-extrabold text-emerald-400">99.4%</div>
                    <div className="text-[11px] text-slate-400 font-medium">Reliability Uptime</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-750 text-center">
                    <div className="text-xl font-extrabold text-indigo-400">100%</div>
                    <div className="text-[11px] text-slate-400 font-medium">OOP Clean Code</div>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
