import React from 'react';
import { Project } from '../types';

interface ProjectDetailModalProps {
  project: Project | null;
  onClose: () => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({ project, onClose }) => {
  if (!project) return null;

  const techList = project.technologies
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  const featuresList = project.key_features
    ? project.key_features.split(/[;,.]\s+/).filter((f) => f.trim().length > 3)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        
        {/* Modal Header */}
        <div className="relative h-48 md:h-64 w-full bg-slate-800 shrink-0 overflow-hidden">
          <img
            src={project.thumbnail_url}
            alt={project.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 backdrop-blur-sm transition-all"
            aria-label="Close"
          >
            <i className="bi bi-x-lg text-sm"></i>
          </button>

          <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between gap-4">
            <div>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2 ${
                  project.status === 'Completed'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : project.status === 'Ongoing'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-slate-600/30 text-slate-300 border border-slate-500/30'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${project.status === 'Completed' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                {project.status}
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-white drop-shadow-md">
                {project.title}
              </h2>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6 text-sm">
          
          {/* Metadata timeline banner */}
          <div className="flex flex-wrap items-center gap-6 py-3 px-4 rounded-xl bg-slate-800/60 border border-slate-750 text-xs text-slate-300">
            <div>
              <span className="text-slate-400 block mb-0.5">Commencement Date</span>
              <span className="font-semibold text-white">{project.commencement_date}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Completion Date</span>
              <span className="font-semibold text-white">{project.completion_date || 'In Active Development'}</span>
            </div>
            <div className="ml-auto flex items-center gap-3">
              {project.github_url && (
                <a
                  href={project.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium text-xs transition-colors"
                >
                  <i className="bi bi-github"></i> Repository
                </a>
              )}
              {project.live_url && (
                <a
                  href={project.live_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors shadow-sm"
                >
                  <i className="bi bi-box-arrow-up-right"></i> Live Demo
                </a>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs uppercase tracking-wider font-bold text-blue-400 mb-2">Project Overview</h4>
            <p className="text-slate-300 leading-relaxed text-sm md:text-base">
              {project.description}
            </p>
          </div>

          {/* Key Features & Functionality */}
          {featuresList.length > 0 && (
            <div>
              <h4 className="text-xs uppercase tracking-wider font-bold text-blue-400 mb-2.5">Key Architecture &amp; Features</h4>
              <ul className="space-y-2">
                {featuresList.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-slate-300">
                    <i className="bi bi-check2-circle text-blue-400 text-base shrink-0 mt-0.5"></i>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Technologies Used */}
          <div>
            <h4 className="text-xs uppercase tracking-wider font-bold text-blue-400 mb-2.5">Technologies &amp; Frameworks</h4>
            <div className="flex flex-wrap gap-2">
              {techList.map((tech, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-mono font-medium"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Close Details
          </button>
        </div>

      </div>
    </div>
  );
};
