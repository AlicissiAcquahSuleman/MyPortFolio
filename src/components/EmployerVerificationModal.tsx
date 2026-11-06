import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { PortfolioData } from '../types';
import { generateDeveloperPDF } from '../utils/cvGenerator';

interface EmployerVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolioData: PortfolioData;
}

type ModalStep = 'ASK_EMPLOYER' | 'SCENARIO_NO' | 'SCENARIO_YES_FORM' | 'SUCCESS_DOWNLOAD';

export const EmployerVerificationModal: React.FC<EmployerVerificationModalProps> = ({
  isOpen,
  onClose,
  portfolioData,
}) => {
  const [step, setStep] = useState<ModalStep>('ASK_EMPLOYER');
  const [selectedTrackId, setSelectedTrackId] = useState<number>(() => {
    return portfolioData.activeCV?.id || portfolioData.cvVersions?.[0]?.id || 1;
  });

  const [formData, setFormData] = useState({
    fullName: '',
    companyName: '',
    email: '',
    phone: '',
    position: '',
    purpose: 'Full-time Employment Opportunity',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [downloadToken, setDownloadToken] = useState('');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const handleResetAndClose = () => {
    setStep('ASK_EMPLOYER');
    setErrorMsg('');
    setLoading(false);
    onClose();
  };

  const handleNoClick = () => {
    setStep('SCENARIO_NO');
  };

  const handleYesClick = () => {
    setStep('SCENARIO_YES_FORM');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMsg) setErrorMsg('');
  };

  const triggerDownloadAction = async (token: string, targetVersionId?: number) => {
    try {
      // 1. Trigger backend protected download log
      await fetch(`/api/cv/download?token=${encodeURIComponent(token)}`);

      // Track analytics event
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'cv_download',
          targetId: targetVersionId || selectedTrackId,
          targetName: 'Official Developer CV Download',
          path: '/cv/download',
        }),
      }).catch(() => {});

      // Find selected CV version document
      const targetDoc = portfolioData.cvVersions?.find((v) => v.id === (targetVersionId || selectedTrackId)) || portfolioData.activeCV;

      // 2. Generate and download high-resolution dynamic PDF CV
      generateDeveloperPDF({
        profile: portfolioData.profile,
        education: portfolioData.education,
        experience: portfolioData.experience,
        skillCategories: portfolioData.skillCategories,
        projects: portfolioData.projects,
        cvDoc: targetDoc,
      });

      setDownloadSuccess(true);
    } catch (err) {
      console.error('Download trigger error:', err);
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Frontend validations
    if (!formData.fullName.trim() || !formData.companyName.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.position.trim()) {
      setErrorMsg('Please fill in all required employer verification fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setErrorMsg('Please enter a valid business/official email address.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/employer-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          cv_version_id: selectedTrackId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit employer verification');
      }

      setDownloadToken(data.download_token);
      setStep('SUCCESS_DOWNLOAD');

      // Throw celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      // Automatically trigger protected PDF CV download
      await triggerDownloadAction(data.download_token);
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const whatsappNumber = portfolioData.settings?.whatsapp_number?.replace(/[^0-9]/g, '') || portfolioData.profile?.whatsapp_number?.replace(/[^0-9]/g, '') || '233244762558';
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    `Hello ${portfolioData.profile?.full_name || 'Cisse'}, I am visiting your developer portfolio and would like to connect!`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        
        {/* Modal Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 rounded-full bg-blue-500 animate-pulse" />
            <h3 className="font-semibold text-slate-200 text-sm uppercase tracking-wider">
              {step === 'ASK_EMPLOYER' && 'Employer Verification Portal'}
              {step === 'SCENARIO_NO' && 'Alternative Contact'}
              {step === 'SCENARIO_YES_FORM' && 'Employer Information Form'}
              {step === 'SUCCESS_DOWNLOAD' && 'Verification Complete'}
            </h3>
          </div>
          <button
            onClick={handleResetAndClose}
            className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800"
            aria-label="Close modal"
          >
            <i className="bi bi-x-lg text-lg"></i>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 md:p-8">
          
          {/* STEP 1: INITIAL QUESTION */}
          {step === 'ASK_EMPLOYER' && (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-6">
                <i className="bi bi-shield-check text-3xl"></i>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white mb-3">
                Download Official Curriculum Vitae
              </h2>
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 mb-8 text-center">
                <p className="text-lg md:text-xl font-medium text-blue-200">
                  &ldquo;Please, are you an employer wanting to be serviced?&rdquo;
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  To protect sensitive professional history and credentials, CV downloads require verification.
                </p>
              </div>

              {/* Action Buttons: YES and NO */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={handleYesClick}
                  className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <i className="bi bi-check-circle-fill text-lg"></i>
                  YES
                </button>
                <button
                  type="button"
                  onClick={handleNoClick}
                  className="w-full py-3.5 px-6 rounded-xl font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white active:scale-[0.98] transition-all border border-slate-700 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <i className="bi bi-x-circle text-lg"></i>
                  NO
                </button>
              </div>
            </div>
          )}

          {/* SCENARIO B: VISITOR CLICKED NO */}
          {step === 'SCENARIO_NO' && (
            <div className="text-center py-4 animate-in fade-in duration-200">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-6">
                <i className="bi bi-whatsapp text-3xl"></i>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-4">
                &ldquo;Sorry! Please, contact me through the WhatsApp button.&rdquo;
              </h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto mb-8">
                If you are a student, fellow developer, curious visitor, or seeking general software discussion, feel free to drop me a quick message directly on WhatsApp.
              </p>

              <div className="space-y-3">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 px-6 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-3 text-base"
                >
                  <i className="bi bi-whatsapp text-2xl"></i>
                  Chat with Me on WhatsApp
                </a>

                <button
                  type="button"
                  onClick={() => setStep('ASK_EMPLOYER')}
                  className="w-full py-2.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  &larr; Back to employer verification
                </button>
              </div>
            </div>
          )}

          {/* SCENARIO A: VISITOR CLICKED YES (Employer Form) */}
          {step === 'SCENARIO_YES_FORM' && (
            <form onSubmit={handleSubmitForm} className="space-y-4 animate-in fade-in duration-200">
              <div className="text-left mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <i className="bi bi-building-check text-blue-400"></i>
                  Employer Verification &amp; Request Form
                </h3>
                <p className="text-xs text-slate-400">
                  Please submit your organization details to immediately unlock and download the full professional CV in PDF format.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                  <i className="bi bi-exclamation-triangle-fill text-rose-400 text-sm"></i>
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Your Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="e.g. Sarah Jenkins"
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800/90 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Company / Organisation Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    placeholder="e.g. Acme FinTech Corp"
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800/90 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Official Work Email <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="s.jenkins@company.com"
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800/90 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Contact Phone Number <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+233 24 476 2558"
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800/90 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Your Position / Job Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    placeholder="e.g. Engineering Director / Recruiter"
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800/90 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Purpose of Requesting CV <span className="text-rose-400">*</span>
                  </label>
                  <select
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800/90 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  >
                    <option value="Full-time Employment Opportunity">Full-time Senior Engineering Role</option>
                    <option value="Contract / Freelance Project">Contract / Independent Consulting</option>
                    <option value="Technical Advisory / Architecture">Technical Advisory / Fractional Lead</option>
                    <option value="Executive Recruitment">Executive Technical Search</option>
                    <option value="Other Business Service">Other Business Service</option>
                  </select>
                </div>
              </div>

              {/* CV Track Specialization Selector (Section 19) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tailored Professional CV Track <span className="text-blue-400">(Customized PDF)</span>
                </label>
                <select
                  value={selectedTrackId}
                  onChange={(e) => setSelectedTrackId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800/90 border border-blue-500/50 text-sm text-blue-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                >
                  {portfolioData.cvVersions && portfolioData.cvVersions.length > 0 ? (
                    portfolioData.cvVersions.map((ver) => (
                      <option key={ver.id} value={ver.id}>
                        {ver.version_title} {ver.is_active ? '★ (Active Default)' : ''}
                      </option>
                    ))
                  ) : (
                    <option value={1}>General Software Engineer Track</option>
                  )}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Select the engineering specialization that best aligns with your hiring pipeline.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Optional Message or Role Details
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={2}
                  placeholder="Tell me briefly about the project or role (optional)..."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800/90 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep('ASK_EMPLOYER')}
                  className="px-4 py-2.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  &larr; Back
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 px-6 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <i className="bi bi-arrow-repeat animate-spin text-lg"></i>
                      Verifying &amp; Generating CV...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-file-earmark-pdf-fill text-lg"></i>
                      Verify &amp; Download CV in PDF
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: SUCCESS AND DOWNLOAD COMPLETED */}
          {step === 'SUCCESS_DOWNLOAD' && (
            <div className="text-center py-4 animate-in fade-in duration-200">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-5">
                <i className="bi bi-check2-circle text-3xl"></i>
              </div>

              <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                Employer Verified Successfully!
              </h3>
              <p className="text-sm text-slate-300 max-w-md mx-auto mb-6">
                Thank you, <span className="font-semibold text-white">{formData.fullName}</span> from <span className="font-semibold text-blue-300">{formData.companyName}</span>. Your employer credential has been recorded in the system.
              </p>

              <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl mb-6 text-left">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>Document:</span>
                  <span className="font-semibold text-slate-200">{portfolioData.activeCV?.file_name || 'Cisse_Acquah_CV.pdf'}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>Authorized Token:</span>
                  <span className="font-mono text-emerald-400 text-[11px] truncate max-w-[200px]">{downloadToken}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Verification Status:</span>
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                    <i className="bi bi-shield-fill-check"></i> Approved &amp; Logged
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => triggerDownloadAction(downloadToken)}
                  className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
                >
                  <i className="bi bi-download text-lg"></i>
                  Download PDF Again
                </button>

                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="w-full py-2.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Close Window
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
