import React, { useState } from 'react';
import { PortfolioData, SkillCategory } from '../types';

interface SkillsSectionProps {
  portfolioData: PortfolioData;
}

export const SkillsSection: React.FC<SkillsSectionProps> = ({ portfolioData }) => {
  const { skillCategories } = portfolioData;
  const [activeCategorySlug, setActiveCategorySlug] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Collect all skills
  const allSkills = skillCategories?.flatMap((cat) =>
    (cat.skills || []).map((s) => ({ ...s, categoryName: cat.name }))
  ) || [];

  const filteredCategories = (skillCategories || []).filter((cat) => {
    if (activeCategorySlug === 'all') return true;
    return cat.slug === activeCategorySlug;
  });

  return (
    <section id="skills" className="py-24 bg-slate-900/50 border-t border-slate-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <i className="bi bi-stack"></i> Technical Arsenal
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Skills &amp; Technologies
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Categorised technical proficiencies across backend architecture, frontend interfaces, relational databases, AI tooling, and cloud infrastructure.
          </p>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-12">
          
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 bg-slate-950/70 p-1.5 rounded-2xl border border-slate-800 w-full md:w-auto">
            <button
              onClick={() => setActiveCategorySlug('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeCategorySlug === 'all'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              All Skills ({allSkills.length})
            </button>
            {skillCategories?.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategorySlug(cat.slug)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeCategorySlug === cat.slug
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <i className="bi bi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input
              type="text"
              placeholder="Search technology..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

        </div>

        {/* Categories Grid */}
        <div className="space-y-10">
          {filteredCategories.map((category) => {
            const visibleSkills = (category.skills || []).filter((s) =>
              s.name.toLowerCase().includes(searchTerm.toLowerCase())
            );

            if (visibleSkills.length === 0 && searchTerm) return null;

            return (
              <div
                key={category.id}
                className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-xl"
              >
                {/* Category Header */}
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    {category.name}
                  </h3>
                  <span className="text-xs font-mono text-slate-400">
                    {visibleSkills.length} competencies
                  </span>
                </div>

                {/* Skills Grid with Progress Indicators */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {visibleSkills.map((skill) => (
                    <div
                      key={skill.id}
                      className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-950/90 transition-all space-y-2.5 group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm"
                            style={{ backgroundColor: `${skill.badge_color || '#3b82f6'}25`, color: skill.badge_color || '#60a5fa' }}
                          >
                            <i className={skill.icon_class || 'bi bi-check-circle'}></i>
                          </div>
                          <span className="font-semibold text-white text-xs sm:text-sm group-hover:text-blue-300 transition-colors">
                            {skill.name}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-300">
                          {skill.proficiency_percent}%
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${skill.proficiency_percent}%`,
                            backgroundColor: skill.badge_color || '#3b82f6',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
