import React, { useState, useEffect } from 'react';
import { PortfolioData, Project } from './types';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { AboutSection } from './components/AboutSection';
import { SkillsSection } from './components/SkillsSection';
import { ServicesSection } from './components/ServicesSection';
import { ProjectsSection } from './components/ProjectsSection';
import { ExperienceSection } from './components/ExperienceSection';
import { EducationSection } from './components/EducationSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { EmployerVerificationModal } from './components/EmployerVerificationModal';
import { ProjectCaseStudyModal } from './components/ProjectCaseStudyModal';
import { DjangoGuideModal } from './components/DjangoGuideModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AIAssistantChatbot } from './components/AIAssistantChatbot';

export default function App() {
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isCVModalOpen, setIsCVModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDjangoGuideOpen, setIsDjangoGuideOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminInitialTab, setAdminInitialTab] = useState<'overview' | 'profile' | 'projects' | 'skills' | 'services' | 'experience' | 'education' | 'cv' | 'employers' | 'analytics' | 'messages' | 'socials' | 'settings'>('overview');

  // Contact subject prefill
  const [contactSubject, setContactSubject] = useState('');

  // Fetch portfolio data
  const loadPortfolioData = async () => {
    try {
      const res = await fetch('/api/portfolio');
      if (!res.ok) throw new Error('Failed to load portfolio database');
      const data: PortfolioData = await res.json();
      setPortfolioData(data);
    } catch (err: any) {
      console.error('Data load error:', err);
      setError(err.message || 'Unable to connect to portfolio database');
    } finally {
      setLoading(false);
    }
  };

  // Record visitor count and analytics on mount
  useEffect(() => {
    loadPortfolioData();

    // Increment visitor count once per session
    const hasVisited = sessionStorage.getItem('visited_portfolio');
    if (!hasVisited) {
      fetch('/api/visitor', { method: 'POST' })
        .then(() => sessionStorage.setItem('visited_portfolio', 'true'))
        .catch(() => {});

      // Track page view event
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'page_view',
          targetName: 'Home Landing Page',
          path: window.location.pathname,
        }),
      }).catch(() => {});
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 animate-pulse text-2xl">
          <i className="bi bi-terminal-fill"></i>
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold text-white tracking-wide">Initializing Portfolio Engine</h2>
          <p className="text-xs font-mono text-slate-500">Connecting to SQLite &amp; Loading Models...</p>
        </div>
      </div>
    );
  }

  if (error || !portfolioData) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 p-6">
        <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center max-w-md space-y-4">
          <i className="bi bi-exclamation-triangle-fill text-3xl text-rose-400"></i>
          <h2 className="text-lg font-bold text-white">Database Connection Issue</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {error || 'Could not retrieve data from the backend.'}
          </p>
          <button
            onClick={() => {
              setLoading(true);
              setError(null);
              loadPortfolioData();
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500 selection:text-white">
      
      {/* Fixed Navigation Bar */}
      <Navbar
        portfolioData={portfolioData}
        onOpenCVModal={() => setIsCVModalOpen(true)}
        onOpenAdmin={() => {
          setAdminInitialTab('overview');
          setIsAdminOpen(true);
        }}
        onOpenDjangoGuide={() => setIsDjangoGuideOpen(true)}
      />

      {/* Main Landing Sections */}
      <main>
        {/* 1. Home / Landing Hero */}
        <HeroSection
          portfolioData={portfolioData}
          onOpenCVModal={() => setIsCVModalOpen(true)}
          onOpenAdminProfile={() => {
            setAdminInitialTab('profile');
            setIsAdminOpen(true);
          }}
        />

        {/* 2. About Me Section */}
        <AboutSection portfolioData={portfolioData} />

        {/* 3. Skills & Technologies Section */}
        <SkillsSection portfolioData={portfolioData} />

        {/* 4. Services Offered Section */}
        <ServicesSection
          portfolioData={portfolioData}
          onSelectServiceForContact={(serviceTitle) => setContactSubject(serviceTitle)}
        />

        {/* 5. Projects Showcase Section */}
        <ProjectsSection
          portfolioData={portfolioData}
          onSelectProject={(project) => {
            setSelectedProject(project);
            // Track project view event (Section 18)
            fetch('/api/analytics/track', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                eventType: 'project_view',
                targetId: project.id,
                targetName: project.title,
                path: `/projects/${project.id}`,
              }),
            }).catch(() => {});
          }}
        />

        {/* 6. Work Experience & Career Timeline */}
        <ExperienceSection portfolioData={portfolioData} />

        {/* 7. Education & Academic Qualifications */}
        <EducationSection portfolioData={portfolioData} />

        {/* 8. Contact Me Section */}
        <ContactSection
          portfolioData={portfolioData}
          prefilledSubject={contactSubject}
        />
      </main>

      {/* Footer */}
      <Footer
        portfolioData={portfolioData}
        onOpenAdmin={() => {
          setAdminInitialTab('overview');
          setIsAdminOpen(true);
        }}
        onOpenDjangoGuide={() => setIsDjangoGuideOpen(true)}
        onOpenCVModal={() => setIsCVModalOpen(true)}
      />

      {/* Modal 1: Employer Verification & CV Download Workflow (YES/NO & Protected CV) */}
      <EmployerVerificationModal
        isOpen={isCVModalOpen}
        onClose={() => setIsCVModalOpen(false)}
        portfolioData={portfolioData}
      />

      {/* Modal 2: 17-Point Detailed Project Case Study (Section 17) */}
      <ProjectCaseStudyModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />

      {/* Modal 3: Django Framework Code Inspector & PowerShell Setup Guide */}
      <DjangoGuideModal
        isOpen={isDjangoGuideOpen}
        onClose={() => setIsDjangoGuideOpen(false)}
      />

      {/* Modal 4: Full Administrative Dashboard with Analytics & Settings */}
      <AdminDashboard
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        portfolioData={portfolioData}
        onRefreshData={loadPortfolioData}
        initialTab={adminInitialTab}
      />

      {/* Floating AI-Powered Portfolio Assistant (Section 16) */}
      <AIAssistantChatbot
        settings={portfolioData.settings}
        whatsappNumber={portfolioData.profile?.whatsapp_number || portfolioData.settings?.whatsapp_number}
        onOpenCVModal={() => setIsCVModalOpen(true)}
        onOpenContact={() => {
          const contactSec = document.getElementById('contact');
          contactSec?.scrollIntoView({ behavior: 'smooth' });
        }}
        onSelectProject={(projId) => {
          const match = portfolioData.projects.find((p) => p.id === projId);
          if (match) setSelectedProject(match);
        }}
      />

    </div>
  );
}
