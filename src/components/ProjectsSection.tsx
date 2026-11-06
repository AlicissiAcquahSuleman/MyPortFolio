import React, { useState } from 'react';
import { PortfolioData, Project } from '../types';

interface ProjectsSectionProps {
  portfolioData: PortfolioData;
  onSelectProject: (project: Project) => void;
}

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({
  portfolioData,
  onSelectProject,
}) => {
  const { projects, projectCategories } = portfolioData;

  const [statusFilter, setStatusFilter] = useState<'All' | 'Completed' | 'Ongoing'>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtering logic
  const filteredProjects = (projects || []).filter((project) => {
    // Status filter
    if (statusFilter !== 'All' && project.status !== statusFilter) {
      return false;
    }

    // Category filter
    if (selectedCategory !== 'all') {
      const matchCat = projectCategories?.find((c) => c.slug === selectedCategory);
      if (matchCat && project.category_id !== matchCat.id) {
        return false;
      }
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inTitle = project.title.toLowerCase().includes(q);
      const inDesc = project.description.toLowerCase().includes(q);
      const inTech = project.technologies.toLowerCase().includes(q);
      if (!inTitle && !inDesc && !inTech) return false;
    }

    return true;
  });

  return (
    <section id="projects" className="py-24 bg-slate-900/40 border-t border-slate-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <i className="bi bi-code-square"></i> Proven Deliverables
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Featured Software Projects
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Real-world backend architectures, high-scale platforms, AI tools, and full-stack software systems in active development and production.
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="space-y-4 mb-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            
            {/* Status Filter Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2 bg-slate-950/70 p-1.5 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setStatusFilter('All')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'All'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                All Projects ({projects?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('Completed')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'Completed'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Completed Projects
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('Ongoing')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'Ongoing'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Ongoing Projects
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full lg:w-72">
              <i className="bi bi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input
                type="text"
                placeholder="Search by title or tech stack..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

          </div>

          {/* Categories Sub-filter */}
          {projectCategories && projectCategories.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold mr-1">Category:</span>
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-slate-800 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Categories
              </button>
              {projectCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    selectedCategory === cat.slug
                      ? 'bg-slate-800 text-blue-400 border border-blue-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800 p-8">
            <i className="bi bi-folder2-open text-4xl text-slate-500 mb-3 block"></i>
            <h3 className="text-lg font-bold text-white mb-1">No Projects Found</h3>
            <p className="text-xs text-slate-400">
              Try adjusting your search criteria or resetting the active status filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const techChips = project.technologies
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean);

              return (
                <div
                  key={project.id}
                  className="rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 shadow-xl overflow-hidden flex flex-col justify-between group transition-all duration-300"
                >
                  <div>
                    {/* Thumbnail Image with status badge */}
                    <div className="relative h-48 w-full bg-slate-950 overflow-hidden cursor-pointer" onClick={() => onSelectProject(project)}>
                      <img
                        src={project.thumbnail_url}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />

                      {/* Status Tag */}
                      <div className="absolute top-3 left-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-md shadow-sm ${
                            project.status === 'Completed'
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                              : project.status === 'Ongoing'
                              ? 'bg-amber-950/80 text-amber-400 border border-amber-500/30'
                              : 'bg-slate-900/80 text-slate-400 border border-slate-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              project.status === 'Completed' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                            }`}
                          />
                          {project.status}
                        </span>
                      </div>

                      {/* Featured Star */}
                      {Boolean(project.is_featured) && (
                        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-blue-600/90 text-white text-[10px] font-semibold flex items-center gap-1 backdrop-blur-sm">
                          <i className="bi bi-star-fill text-[9px]"></i> Featured
                        </div>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="p-6 space-y-3">
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
                        <span>Started: {project.commencement_date}</span>
                        {project.completion_date && <span>&bull; Finished: {project.completion_date}</span>}
                      </div>

                      <h3
                        onClick={() => onSelectProject(project)}
                        className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors cursor-pointer leading-snug"
                      >
                        {project.title}
                      </h3>

                      <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                        {project.description}
                      </p>

                      {/* Tech stack chips */}
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {techChips.slice(0, 4).map((tech, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-750 text-[10px] font-mono text-blue-300"
                          >
                            {tech}
                          </span>
                        ))}
                        {techChips.length > 4 && (
                          <span className="px-1.5 py-0.5 text-[10px] text-slate-500 font-mono">
                            +{techChips.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="p-4 px-6 border-t border-slate-800/80 bg-slate-900/50 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => onSelectProject(project)}
                      className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      View Details &rarr;
                    </button>

                    <div className="flex items-center gap-2">
                      {project.github_url && (
                        <a
                          href={project.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="View Source Code on GitHub"
                        >
                          <i className="bi bi-github text-sm"></i>
                        </a>
                      )}
                      {project.live_url && (
                        <a
                          href={project.live_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white transition-colors"
                          title="Open Live Deployment"
                        >
                          <i className="bi bi-box-arrow-up-right text-xs"></i>
                        </a>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
};
