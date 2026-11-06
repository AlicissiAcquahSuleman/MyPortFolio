import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { PortfolioData } from '../types';

interface ContactSectionProps {
  portfolioData: PortfolioData;
  prefilledSubject?: string;
}

export const ContactSection: React.FC<ContactSectionProps> = ({
  portfolioData,
  prefilledSubject = '',
}) => {
  const { profile, settings, socials } = portfolioData;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: prefilledSubject || '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Sync if prefilled subject changed
  React.useEffect(() => {
    if (prefilledSubject) {
      setFormData((prev) => ({ ...prev, subject: `Inquiry regarding: ${prefilledSubject}` }));
    }
  }, [prefilledSubject]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMsg) setErrorMsg('');
  };

  const handleCopyEmail = () => {
    if (profile?.email) {
      navigator.clipboard.writeText(profile.email);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
      setErrorMsg('Please fill in all contact fields.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message.');
      }

      setSuccessMsg(data.message || 'Your message has been sent successfully!');
      setFormData({ name: '', email: '', subject: '', message: '' });

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to deliver message at this time.');
    } finally {
      setLoading(false);
    }
  };

  const whatsappNumber = settings?.whatsapp_number?.replace(/[^0-9]/g, '') || profile?.whatsapp_number?.replace(/[^0-9]/g, '') || '233244762558';
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    `Hello ${profile?.full_name || 'Cisse'}, I found your portfolio and would like to discuss an opportunity.`
  )}`;

  return (
    <section id="contact" className="py-24 bg-slate-900/60 border-t border-slate-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <i className="bi bi-envelope-paper"></i> Get In Touch
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Contact Me &amp; Let&apos;s Build
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Have a project in mind, need software architecture advice, or want to discuss full-time or contract roles? Reach out through the form or direct channels below.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column: Direct Contact Info & Socials */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <i className="bi bi-geo-alt-fill text-blue-400"></i>
                Direct Communication Channels
              </h3>

              {/* Email item with copy button */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                    <i className="bi bi-envelope-at-fill text-lg"></i>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Official Email</span>
                    <a
                      href={`mailto:${profile?.email}`}
                      className="font-medium text-white text-xs sm:text-sm hover:text-blue-400 transition-colors break-all"
                    >
                      {profile?.email}
                    </a>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition-colors shrink-0"
                  title="Copy email to clipboard"
                >
                  <i className={`bi ${copiedEmail ? 'bi-check-lg text-emerald-400' : 'bi-clipboard'}`}></i>
                  <span className="ml-1 hidden sm:inline">{copiedEmail ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* WhatsApp Item */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                    <i className="bi bi-whatsapp text-lg"></i>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">WhatsApp Direct</span>
                    <span className="font-medium text-white text-xs sm:text-sm">{profile?.whatsapp_number || '+233 24 476 2558'}</span>
                  </div>
                </div>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-sm flex items-center gap-1 shrink-0"
                >
                  <i className="bi bi-whatsapp"></i> Chat
                </a>
              </div>

              {/* Phone item */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                  <i className="bi bi-telephone-fill text-lg"></i>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Phone Line</span>
                  <a
                    href={`tel:${profile?.phone}`}
                    className="font-medium text-white text-xs sm:text-sm hover:text-indigo-400 transition-colors"
                  >
                    {profile?.phone}
                  </a>
                </div>
              </div>

              {/* Location item */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                  <i className="bi bi-globe-americas text-lg"></i>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Current Location &amp; Remote Work</span>
                  <span className="font-medium text-white text-xs sm:text-sm">{profile?.location}</span>
                </div>
              </div>

            </div>

            {/* Social Links Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400">
                Professional Networks
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {socials?.map((social) => (
                  <a
                    key={social.id}
                    href={social.profile_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-blue-500/40 hover:bg-slate-800 transition-all flex items-center gap-2.5 text-xs text-slate-300 hover:text-white"
                  >
                    <i className={`${social.icon_class || 'bi bi-link-45deg'} text-blue-400 text-sm`}></i>
                    <span className="font-semibold">{social.platform_name}</span>
                  </a>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <i className="bi bi-send-fill text-blue-400"></i>
                Send a Message
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                All messages are recorded directly into the portfolio database and immediately logged for follow-up.
              </p>

              {successMsg && (
                <div className="p-4 mb-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
                  <i className="bi bi-check-circle-fill text-base text-emerald-400 shrink-0"></i>
                  <span>{successMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="p-4 mb-6 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                  <i className="bi bi-exclamation-triangle-fill text-base text-rose-400 shrink-0"></i>
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Your Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. John Doe"
                      required
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Email Address <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="john.doe@company.com"
                      required
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Subject <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="e.g. Senior Django Engineer Contract"
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Message Details <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={5}
                    placeholder="Describe your project, timeline, or engineering inquiry..."
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm"
                >
                  {loading ? (
                    <>
                      <i className="bi bi-arrow-repeat animate-spin text-base"></i>
                      Transmitting Message...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-send-check text-base"></i>
                      Send Message
                    </>
                  )}
                </button>
              </form>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
