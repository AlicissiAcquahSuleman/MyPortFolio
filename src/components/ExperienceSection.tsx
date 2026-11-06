import React from 'react';
import { PortfolioData } from '../types';

interface ExperienceSectionProps {
  portfolioData: PortfolioData;
}

export const ExperienceSection: React.FC<ExperienceSectionProps> = ({ portfolioData }) => {
  const { experience, education } = portfolioData;

  return (
    <section id="experience" className="py-24 bg-slate-950/80 border-t border-slate-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <i className="bi bi-clock-history"></i> Career Path
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Work Experience &amp; Milestones
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            A chronological timeline of engineering responsibilities, production deployments, and leadership impacts.
          </p>
        </div>

        {/* Experience Timeline */}
        <div className="max-w-4xl mx-auto relative">
          
          {/* Vertical Connecting Line */}
          <div className="absolute left-4 md:left-8 top-3 bottom-3 w-0.5 bg-gradient-to-b from-blue-500 via-indigo-500 to-slate-800" />

          <div className="space-y-10">
            {experience?.map((item) => (
              <div key={item.id} className="relative pl-12 md:pl-20 group">
                
                {/* Timeline Pin Node */}
                <div className="absolute left-2.5 md:left-6.5 top-1.5 w-4 h-4 rounded-full bg-slate-950 border-2 border-blue-500 group-hover:scale-125 group-hover:bg-blue-500 transition-all shadow-md shadow-blue-500/20" />

                {/* Card */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl space-y-4 hover:border-slate-700 transition-all">
                  
                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg md:text-xl font-bold text-white">
                          {item.job_title}
                        </h3>
                        {Boolean(item.is_current) && (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
                            Current Role
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-blue-400 mt-0.5 flex items-center gap-1.5">
                        <i className="bi bi-building"></i>
                        {item.company} &bull; <span className="text-slate-400 text-xs font-normal">{item.location}</span>
                      </p>
                    </div>

                    <div className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 shrink-0 self-start sm:self-center">
                      <i className="bi bi-calendar3 mr-1.5 text-blue-400"></i>
                      {item.start_date} &mdash; {item.is_current ? 'Present' : item.end_date}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Key Impact / Accomplishments */}
                  {item.accomplishments && (
                    <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/20 text-xs text-slate-300 space-y-1">
                      <span className="font-bold text-blue-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
                        <i className="bi bi-trophy-fill text-yellow-400"></i> Key Achievements:
                      </span>
                      <p className="leading-relaxed">
                        {item.accomplishments}
                      </p>
                    </div>
                  )}

                  {/* Footer metadata & verification */}
                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <i className="bi bi-shield-check text-blue-400"></i> Verified Work Experience
                    </span>
                    <span>Role Index #{item.order_index || item.id}</span>
                  </div>

                </div>
              </div>
            ))}
          </div>

          {/* Jump to Education Banner */}
          <div className="mt-14 p-6 rounded-2xl bg-gradient-to-r from-blue-900/20 via-slate-900 to-indigo-900/20 border border-slate-800 text-center space-y-3">
            <h4 className="text-white font-bold text-sm sm:text-base">
              Explore Academic Qualifications &amp; University Honors
            </h4>
            <p className="text-xs text-slate-400 max-w-xl mx-auto">
              Formal computer science foundations, accredited degrees from University of Oxford and Imperial College London.
            </p>
            <div className="pt-2">
              <a
                href="#education"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all cursor-pointer"
              >
                <span>View Education &amp; Qualifications</span>
                <i className="bi bi-mortarboard-fill"></i>
              </a>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
