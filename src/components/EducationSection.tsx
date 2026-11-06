import React from 'react';
import { PortfolioData } from '../types';

interface EducationSectionProps {
  portfolioData: PortfolioData;
}

export const EducationSection: React.FC<EducationSectionProps> = ({ portfolioData }) => {
  const { education } = portfolioData;

  return (
    <section id="education" className="py-24 bg-slate-900/40 border-t border-slate-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <i className="bi bi-mortarboard-fill"></i> Academic Foundation
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Education &amp; Qualifications
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Formal degrees in Computer Science, software engineering theory, academic research, and accredited institutional honors.
          </p>
        </div>

        {/* Education Grid / Cards */}
        <div className="max-w-4xl mx-auto space-y-8">
          {education && education.length > 0 ? (
            education.map((edu, index) => (
              <div
                key={edu.id}
                className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-xl hover:border-blue-500/50 hover:shadow-blue-500/10 transition-all duration-300 relative group"
              >
                {/* Accent top gradient stripe */}
                <div className="absolute top-0 left-8 right-8 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-slate-800">
                  <div className="flex items-start gap-4">
                    {/* Institution Cap Icon */}
                    <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-2xl shrink-0 shadow-sm group-hover:scale-105 group-hover:bg-blue-600/20 transition-all">
                      <i className="bi bi-mortarboard"></i>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
                          {edu.degree}
                        </h3>
                        {edu.grade_or_honors && (
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-semibold">
                            {edu.grade_or_honors}
                          </span>
                        )}
                      </div>

                      <p className="text-sm font-semibold text-slate-300 mt-1 flex items-center gap-2">
                        <span className="text-white font-bold">{edu.institution}</span>
                        <span className="text-slate-500">&bull;</span>
                        <span className="text-blue-400">{edu.field_of_study}</span>
                      </p>
                    </div>
                  </div>

                  {/* Academic Period Badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 shrink-0 self-start md:self-auto">
                    <i className="bi bi-calendar-event text-blue-400"></i>
                    <span>{edu.start_year} &mdash; {edu.end_year}</span>
                  </div>
                </div>

                {/* Description and Key Focus Areas */}
                {edu.description && (
                  <div className="pt-4 text-sm text-slate-300 leading-relaxed">
                    <p>{edu.description}</p>
                  </div>
                )}

                {/* Academic Highlights / Badges */}
                <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-400">
                    <i className="bi bi-patch-check-fill text-emerald-400"></i>
                    <span className="font-medium">Verified Academic Credential</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 font-mono text-[11px]">
                      Record #{index + 1}
                    </span>
                  </div>
                </div>

              </div>
            ))
          ) : (
            <div className="text-center p-12 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400">
              <i className="bi bi-mortarboard text-3xl text-slate-600 mb-2 block"></i>
              <p>No educational records published yet.</p>
            </div>
          )}
        </div>

      </div>
    </section>
  );
};
