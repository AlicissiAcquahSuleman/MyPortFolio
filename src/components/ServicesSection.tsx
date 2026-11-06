import React, { useState } from 'react';
import { PortfolioData, Service } from '../types';

interface ServicesSectionProps {
  portfolioData: PortfolioData;
  onSelectServiceForContact?: (serviceTitle: string) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  portfolioData,
  onSelectServiceForContact,
}) => {
  const { services } = portfolioData;
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleInquire = (serviceTitle: string) => {
    if (onSelectServiceForContact) {
      onSelectServiceForContact(serviceTitle);
    }
    const contactElem = document.getElementById('contact');
    if (contactElem) {
      contactElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="services" className="py-24 bg-slate-950/70 border-t border-slate-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <i className="bi bi-briefcase"></i> Professional Offerings
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Software Development Services
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            High-caliber technical solutions tailored for startups, expanding enterprises, and specialized software operations.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services?.map((service) => {
            const isExpanded = expandedId === service.id;
            const deliverables = service.key_deliverables
              ? service.key_deliverables.split(',').map((d) => d.trim())
              : [];

            return (
              <div
                key={service.id}
                className={`flex flex-col justify-between rounded-2xl bg-slate-900/90 border transition-all duration-300 p-6 ${
                  isExpanded
                    ? 'border-blue-500 shadow-xl shadow-blue-500/10'
                    : 'border-slate-800 hover:border-slate-700 hover:shadow-lg'
                }`}
              >
                <div>
                  {/* Service Icon */}
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xl mb-5">
                    <i className={service.icon_class || 'bi bi-laptop'}></i>
                  </div>

                  {/* Title & Short Description */}
                  <h3 className="text-lg font-bold text-white mb-2 leading-snug">
                    {service.title}
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    {service.short_description}
                  </p>

                  {/* Expandable full details */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-slate-800 space-y-3 text-xs text-slate-300 animate-in fade-in duration-200">
                      <p className="leading-relaxed">
                        {service.full_description}
                      </p>

                      {deliverables.length > 0 && (
                        <div>
                          <span className="font-semibold text-blue-400 block mb-1.5 uppercase text-[10px] tracking-wider">
                            Key Deliverables:
                          </span>
                          <ul className="space-y-1">
                            {deliverables.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <i className="bi bi-check-lg text-emerald-400 shrink-0 mt-0.5"></i>
                                <span className="text-slate-300">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => toggleExpand(service.id)}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {isExpanded ? 'Less info' : 'View scope'}
                    <i className={`bi ${isExpanded ? 'bi-chevron-up' : 'bi-chevron-down'} text-[10px]`}></i>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleInquire(service.title)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-300 text-xs font-medium transition-all"
                  >
                    Inquire
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
