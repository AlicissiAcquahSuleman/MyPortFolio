import React from 'react';
import { PortfolioData } from '../types';

interface AboutSectionProps {
  portfolioData: PortfolioData;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ portfolioData }) => {
  const { profile, education } = portfolioData;

  const careerInterestsList = profile?.career_interests
    ? profile.career_interests.split(',').map((s) => s.trim())
    : [];

  const techSpecsList = profile?.technical_specialisations
    ? profile.technical_specialisations.split(',').map((s) => s.trim())
    : [];

  return (
    <section id="about" className="py-24 bg-slate-950/60 border-t border-slate-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <i className="bi bi-person-badge"></i> Professional Biography
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            About Me &amp; Background
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            A comprehensive look at my engineering career, educational foundation, and technical disciplines.
          </p>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Column: Biography & Highlights */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Story Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <i className="bi bi-journal-text text-blue-400"></i>
                Engineering Philosophy &amp; Experience
              </h3>
              <p className="text-slate-300 leading-relaxed text-sm sm:text-base">
                {profile?.bio}
              </p>
              
              <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="flex items-center gap-2.5 text-slate-300">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                    <i className="bi bi-shield-lock-fill"></i>
                  </div>
                  <div>
                    <span className="font-semibold block text-white">Security-First Mindset</span>
                    <span className="text-slate-400">CSRF, Auth, RBAC, Data Protection</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-slate-300">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                    <i className="bi bi-cpu-fill"></i>
                  </div>
                  <div>
                    <span className="font-semibold block text-white">MVT &amp; OOP Mastery</span>
                    <span className="text-slate-400">Clean modular Django applications</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Technical Specialisations Matrix */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2 text-xs">
                <i className="bi bi-cpu text-blue-400"></i>
                Technical Specialisations
              </h3>
              <div className="flex flex-wrap gap-2">
                {techSpecsList.map((spec, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium hover:border-blue-500/50 transition-colors"
                  >
                    <i className="bi bi-check2 text-blue-400 mr-1.5"></i>
                    {spec}
                  </span>
                ))}
              </div>
            </div>

            {/* Career Interests */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2 text-xs">
                <i className="bi bi-compass text-indigo-400"></i>
                Career Interests &amp; Focus Domains
              </h3>
              <div className="flex flex-wrap gap-2">
                {careerInterestsList.map((interest, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Educational Background Credentials */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <i className="bi bi-mortarboard-fill text-blue-400"></i>
                  Educational Background
                </h3>
                <span className="text-[11px] font-mono text-slate-400">Accredited</span>
              </div>

              <div className="space-y-6">
                {education && education.map((edu) => (
                  <div
                    key={edu.id}
                    className="relative pl-6 border-l-2 border-blue-500/40 space-y-2 group"
                  >
                    {/* Timeline Node */}
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-900 border-2 border-blue-500 group-hover:scale-125 transition-transform" />

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-blue-400 font-semibold">
                        {edu.start_year} &mdash; {edu.end_year}
                      </span>
                      {edu.grade_or_honors && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[10px] font-medium">
                          {edu.grade_or_honors}
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-bold text-white">
                      {edu.degree}
                    </h4>

                    <p className="text-xs font-semibold text-slate-300">
                      {edu.institution} &bull; <span className="text-slate-400">{edu.field_of_study}</span>
                    </p>

                    {edu.description && (
                      <p className="text-xs text-slate-400 leading-relaxed pt-1">
                        {edu.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-800">
                <a
                  href="#education"
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center justify-between group transition-colors"
                >
                  <span>Explore full degree curriculum &amp; credentials</span>
                  <i className="bi bi-arrow-right group-hover:translate-x-1 transition-transform"></i>
                </a>
              </div>
            </div>

            {/* Quick Contact Card */}
            <div className="bg-gradient-to-br from-blue-900/30 to-indigo-900/30 border border-blue-500/30 rounded-2xl p-6 shadow-xl space-y-4">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <i className="bi bi-chat-quote-fill text-blue-400"></i>
                Looking for Technical Leadership or Backend Engineering?
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Whether you need a dedicated Django backend architect, a PostgreSQL schema migration expert, or a reliable full-stack developer to deliver end-to-end features, I am ready to engage.
              </p>
              <a
                href="#contact"
                className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
              >
                Schedule a Consultation &rarr;
              </a>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
