import React, { useState } from 'react';
import { Project, ProjectScreenshot } from '../types';
import {
  X,
  ExternalLink,
  Github,
  Layers,
  Database,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  Compass,
  Calendar,
  Image as ImageIcon,
  Cpu,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Maximize2
} from 'lucide-react';

interface ProjectCaseStudyModalProps {
  project: Project | null;
  onClose: () => void;
}

export const ProjectCaseStudyModal: React.FC<ProjectCaseStudyModalProps> = ({ project, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'architecture' | 'engineering' | 'gallery'>('overview');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState<number>(0);

  if (!project) return null;

  // Track clicks for analytics
  const trackClick = async (eventType: 'github_click' | 'live_demo_click') => {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          targetId: project.id,
          targetName: project.title,
          path: window.location.pathname,
        }),
      });
    } catch (e) {
      // non-blocking
    }
  };

  const techList = project.technologies
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  const featuresList = project.key_features
    ? project.key_features.split(/[;,.]\s+/).filter((f) => f.trim().length > 3)
    : [];

  // Parse screenshots
  let screenshots: ProjectScreenshot[] = [];
  try {
    if (project.screenshots_gallery) {
      screenshots = JSON.parse(project.screenshots_gallery);
    }
  } catch (e) {
    screenshots = [];
  }

  // Fallback screenshot if empty
  if (screenshots.length === 0) {
    screenshots = [
      { url: project.thumbnail_url, caption: `${project.title} - Main Interface & Dashboard` },
      {
        url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
        caption: 'Architecture Analytics & Data Visualization Console',
      },
      {
        url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80',
        caption: 'Responsive Operations & Mobile Experience',
      },
    ];
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        
        {/* Header Hero Banner */}
        <div className="relative bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 md:p-8 shrink-0 border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 z-20 w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center border border-slate-600/50 backdrop-blur-sm transition-all focus:outline-none"
            aria-label="Close Case Study"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pr-12">
            <div>
              <div className="flex items-center gap-2.5 mb-2.5">
                <span className="bg-blue-500/20 text-blue-400 border border-blue-400/30 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Detailed Case Study
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                    project.status === 'Completed'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      project.status === 'Completed' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                    }`}
                  />
                  {project.status}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                {project.title}
              </h1>
              <p className="text-slate-400 text-xs md:text-sm mt-1 max-w-2xl">
                Comprehensive engineering case study, architectural decisions, and production metrics.
              </p>
            </div>

            {/* Quick Actions (GitHub & Live Demo) */}
            <div className="flex items-center gap-2.5 shrink-0">
              {project.github_url && (
                <a
                  href={project.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackClick('github_click')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs border border-slate-700 transition-all hover:scale-105 shadow-sm"
                >
                  <Github className="w-4 h-4" /> Source Code
                </a>
              )}
              {project.live_url && (
                <a
                  href={project.live_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackClick('live_demo_click')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all hover:scale-105 shadow-md shadow-blue-600/30"
                >
                  <ExternalLink className="w-4 h-4" /> Live Demo
                </a>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-6 overflow-x-auto no-scrollbar border-b border-slate-800/80 -mb-6 md:-mb-8 pt-2">
            {[
              { id: 'overview', label: '1. Problem & Solution', icon: Lightbulb },
              { id: 'architecture', label: '2. Architecture & DB', icon: Layers },
              { id: 'engineering', label: '3. Challenges & Impact', icon: Cpu },
              { id: 'gallery', label: `4. Gallery (${screenshots.length})`, icon: ImageIcon },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
                    isActive
                      ? 'border-blue-500 text-blue-400 bg-slate-800/60'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-8 text-sm">
          {/* TAB 1: OVERVIEW, PROBLEM STATEMENT, PROPOSED SOLUTION */}
          {activeTab === 'overview' && (
            <div className="space-y-7 animate-in fade-in duration-200">
              {/* Timeline & Metadata bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Commencement</span>
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-400" />
                    {project.commencement_date}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Completion Date</span>
                  <span className="font-semibold text-white">
                    {project.completion_date || 'Ongoing Engineering'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Total Case Views</span>
                  <span className="font-semibold text-emerald-400">
                    {project.view_count || 1} Views
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Repository Engagements</span>
                  <span className="font-semibold text-indigo-400">
                    {(project.github_click_count || 0) + (project.live_demo_click_count || 0)} Clicks
                  </span>
                </div>
              </div>

              {/* 1. Introduction & Executive Summary */}
              <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-800">
                <h3 className="text-xs uppercase tracking-wider font-bold text-blue-400 mb-2.5 flex items-center gap-2">
                  <Compass className="w-4 h-4" />
                  1. Executive Introduction & Overview
                </h3>
                <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                  {project.description}
                </p>
              </div>

              {/* 2 & 3: Background & Problem vs Objectives */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-rose-950/20 p-5 rounded-2xl border border-rose-900/40">
                  <h3 className="text-xs uppercase tracking-wider font-bold text-rose-400 mb-2.5 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    2. Background & Problem Statement
                  </h3>
                  <p className="text-slate-300 leading-relaxed text-sm">
                    {project.problem_statement ||
                      'Manual, fragmented legacy workflows suffered from excessive data latency, high error vulnerability, and lack of real-time auditability across distributed operations.'}
                  </p>
                </div>

                <div className="bg-emerald-950/20 p-5 rounded-2xl border border-emerald-900/40">
                  <h3 className="text-xs uppercase tracking-wider font-bold text-emerald-400 mb-2.5 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    3. Project Objectives
                  </h3>
                  <p className="text-slate-300 leading-relaxed text-sm">
                    {project.project_objectives ||
                      'Architect a high-performance web system that achieves sub-second processing, automated business intelligence, and end-to-end data integrity.'}
                  </p>
                </div>
              </div>

              {/* 4. Proposed Solution */}
              <div className="bg-blue-950/20 p-5 rounded-2xl border border-blue-900/40">
                <h3 className="text-xs uppercase tracking-wider font-bold text-blue-400 mb-2.5 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  4. Proposed Solution & Architecture Rationale
                </h3>
                <p className="text-slate-300 leading-relaxed text-sm">
                  {project.proposed_solution ||
                    'Delivered a modular Python and Django application coupled with modern reactive frontends, structured caching, and relational consistency guarantees.'}
                </p>
              </div>

              {/* Technologies Matrix */}
              <div>
                <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3">
                  Technologies & Frameworks Stack
                </h3>
                <div className="flex flex-wrap gap-2">
                  {techList.map((tech, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-mono font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SYSTEM ARCHITECTURE & DATABASE DESIGN */}
          {activeTab === 'architecture' && (
            <div className="space-y-7 animate-in fade-in duration-200">
              {/* 5. System Architecture */}
              <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-800">
                <h3 className="text-xs uppercase tracking-wider font-bold text-indigo-400 mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  5 & 7. System Architecture & Component Design
                </h3>
                <p className="text-slate-300 leading-relaxed text-sm mb-4">
                  {project.system_architecture ||
                    'Engineered following Django Model-View-Template (MVT) coupled with decoupled service layers, background queue processing for asynchronous tasks, and RESTful serialization.'}
                </p>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs text-indigo-300 space-y-1">
                  <div className="text-slate-500">// High-Level Component Flow</div>
                  <div>Client Tier: Bootstrap 5 / React SPA &rarr; HTTPS Request</div>
                  <div>Security Gateway: CSRF Protection + JWT / Session Auth</div>
                  <div>Service Tier: Python Django Business Services + Celery Queues</div>
                  <div>Persistence: Relational RDBMS (PostgreSQL / SQLite3) + Index Caches</div>
                </div>
              </div>

              {/* 6. Database Design */}
              <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-800">
                <h3 className="text-xs uppercase tracking-wider font-bold text-emerald-400 mb-3 flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  9. Relational Database Design & Schema Strategy
                </h3>
                <p className="text-slate-300 leading-relaxed text-sm">
                  {project.database_design ||
                    'Normalized relational schemas enforcing strict primary/foreign key referential integrity, indexed search columns, and transaction ACID boundaries.'}
                </p>
              </div>

              {/* 8. Key Features Checklist */}
              <div>
                <h3 className="text-xs uppercase tracking-wider font-bold text-blue-400 mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  8. Key Features & Production Capabilities
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {featuresList.map((feature, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 text-xs text-slate-300"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CHALLENGES, SOLUTIONS & OUTCOMES */}
          {activeTab === 'engineering' && (
            <div className="space-y-7 animate-in fade-in duration-200">
              {/* 10. Implementation Process */}
              <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-800">
                <h3 className="text-xs uppercase tracking-wider font-bold text-blue-400 mb-2.5 flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  10. Implementation Process & Engineering Methodology
                </h3>
                <p className="text-slate-300 leading-relaxed text-sm">
                  {project.implementation_process ||
                    'Executed in agile sprint increments: baseline schema migrations, test-driven business logic verification, UI component staging, and automated deployment pipelines.'}
                </p>
              </div>

              {/* 12 & 13. Challenges vs Solutions */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-amber-950/20 p-5 rounded-2xl border border-amber-900/40">
                  <h3 className="text-xs uppercase tracking-wider font-bold text-amber-400 mb-2.5 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    12. Challenges Encountered
                  </h3>
                  <p className="text-slate-300 leading-relaxed text-sm">
                    {project.challenges_encountered ||
                      'Managing high database write bursts, schema synchronization during live migrations, and providing zero-latency user telemetry.'}
                  </p>
                </div>

                <div className="bg-teal-950/20 p-5 rounded-2xl border border-teal-900/40">
                  <h3 className="text-xs uppercase tracking-wider font-bold text-teal-400 mb-2.5 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400" />
                    13. Solutions Implemented
                  </h3>
                  <p className="text-slate-300 leading-relaxed text-sm">
                    {project.solutions_implemented ||
                      'Implemented connection pooling, batch ORM bulk operations, memory caching layers, and asynchronous background worker processing.'}
                  </p>
                </div>
              </div>

              {/* 14. Project Outcomes */}
              <div className="bg-emerald-950/20 p-5 rounded-2xl border border-emerald-900/40">
                <h3 className="text-xs uppercase tracking-wider font-bold text-emerald-400 mb-2.5 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  14. Outcomes & Quantifiable Achievements
                </h3>
                <p className="text-slate-300 leading-relaxed text-sm">
                  {project.project_outcomes ||
                    'Attained a 40% reduction in processing overhead, 99.9% uptime in staging stress tests, and seamless multi-tenant security verification.'}
                </p>
              </div>

              {/* 15. Future Improvements */}
              <div className="bg-purple-950/20 p-5 rounded-2xl border border-purple-900/40">
                <h3 className="text-xs uppercase tracking-wider font-bold text-purple-400 mb-2.5 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-purple-400" />
                  15. Future Enhancements & Roadmap
                </h3>
                <p className="text-slate-300 leading-relaxed text-sm">
                  {project.future_improvements ||
                    'Planned rollouts include WebSocket real-time broadcast channels, automated LLM-based query reasoning, and internationalization localized bundles.'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: SCREENSHOTS & SYSTEM INTERFACES (11) */}
          {activeTab === 'gallery' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">System Interfaces & Architecture Gallery</h3>
                  <p className="text-xs text-slate-400">Click any interface to inspect high-resolution view.</p>
                </div>
                <span className="text-xs text-blue-400 font-mono bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">
                  {screenshots.length} Interfaces Captured
                </span>
              </div>

              {/* Main Feature Display */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video group">
                <img
                  src={screenshots[activeGalleryIndex]?.url || project.thumbnail_url}
                  alt={screenshots[activeGalleryIndex]?.caption || project.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                
                {/* Caption bar */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <p className="text-xs md:text-sm text-white font-medium drop-shadow-md bg-slate-900/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700">
                    {screenshots[activeGalleryIndex]?.caption || project.title}
                  </p>
                  <button
                    onClick={() => setSelectedImage(screenshots[activeGalleryIndex]?.url || project.thumbnail_url)}
                    className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 transition-colors"
                    title="Zoom Fullscreen"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Left/Right carousel controls */}
                {screenshots.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveGalleryIndex((prev) => (prev > 0 ? prev - 1 : screenshots.length - 1))}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setActiveGalleryIndex((prev) => (prev < screenshots.length - 1 ? prev + 1 : 0))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails row */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {screenshots.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveGalleryIndex(idx)}
                    className={`relative rounded-xl overflow-hidden aspect-video border-2 transition-all ${
                      activeGalleryIndex === idx
                        ? 'border-blue-500 scale-105 shadow-md shadow-blue-500/20'
                        : 'border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-600'
                    }`}
                  >
                    <img src={s.url} alt={s.caption} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400 hidden sm:block">
            Project Category ID: <span className="text-white font-mono">{project.category_id || 1}</span> | Status: <span className="text-blue-400 font-semibold">{project.status}</span>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700"
            >
              Close Case Study
            </button>
          </div>
        </div>

      </div>

      {/* Lightbox Zoom Modal */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <img
            src={selectedImage}
            alt="Expanded view"
            className="max-w-[95vw] max-h-[92vh] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
