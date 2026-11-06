import { jsPDF } from 'jspdf';
import { Profile, Education, WorkExperience, SkillCategory, Project, CVDocument } from '../types';

export function generateDeveloperPDF({
  profile,
  education,
  experience,
  skillCategories,
  projects,
  cvDoc,
}: {
  profile: Profile;
  education: Education[];
  experience: WorkExperience[];
  skillCategories: SkillCategory[];
  projects: Project[];
  cvDoc?: CVDocument;
}) {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = 40;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 110, 'F');

  // Top accent bar
  doc.setFillColor(59, 130, 246); // blue-500
  doc.rect(0, 0, pageWidth, 6, 'F');

  // Candidate Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(profile.full_name || 'Software Engineer', margin, 46);

  // Candidate Title based on track
  let trackTitle = profile.professional_title || 'Senior Software Engineer';
  if (cvDoc?.cv_track === 'django_backend') {
    trackTitle = 'Senior Python & Django Backend Engineer';
  } else if (cvDoc?.cv_track === 'ai_ml') {
    trackTitle = 'Artificial Intelligence & Machine Learning Systems Engineer';
  } else if (cvDoc?.cv_track === 'data_science') {
    trackTitle = 'Data Science & Enterprise Analytics Engineer';
  }

  doc.setTextColor(147, 197, 253); // blue-300
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(trackTitle, margin, 65);

  // Contact line in header
  doc.setTextColor(203, 213, 225); // slate-300
  doc.setFontSize(8.5);
  const contactText = `${profile.email}  |  ${profile.phone}  |  ${profile.location}`;
  doc.text(contactText, margin, 85);

  const verificationNote = `Verified Official CV  *  Auth Token Protected  *  Track: ${cvDoc?.version_title || 'Comprehensive Software Engineer'}`;
  doc.setTextColor(148, 163, 184); // slate-400
  doc.setFontSize(7.5);
  doc.text(verificationNote, margin, 99);

  y = 125;

  // Helper function to draw Section Headers
  const drawSectionHeader = (title: string) => {
    if (y > pageHeight - 60) {
      doc.addPage();
      y = 40;
    }
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(title.toUpperCase(), margin, y);

    // underline accent
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(1.5);
    doc.line(margin, y + 4, margin + contentWidth, y + 4);
    y += 18;
  };

  // Track Specialization Highlights Callout (Section 19)
  if (cvDoc?.custom_highlights) {
    if (y > pageHeight - 70) {
      doc.addPage();
      y = 40;
    }
    doc.setFillColor(241, 245, 249); // slate-100
    doc.roundedRect(margin, y, contentWidth, 38, 3, 3, 'F');
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(2);
    doc.line(margin, y, margin, y + 38);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 64, 175);
    doc.text(`TRACK FOCUS: ${cvDoc.version_title.toUpperCase()}`, margin + 10, y + 14);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const highlightLines = doc.splitTextToSize(cvDoc.custom_highlights, contentWidth - 20);
    doc.text(highlightLines, margin + 10, y + 27);
    y += 48;
  }

  // Section 1: Professional Summary
  drawSectionHeader('Professional Summary');
  doc.setTextColor(51, 65, 85); // slate-700
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const bioLines = doc.splitTextToSize(cvDoc?.summary_content || profile.bio || profile.personal_intro, contentWidth);
  doc.text(bioLines, margin, y);
  y += bioLines.length * 12 + 12;

  // Section 2: Technical Skills Matrix
  drawSectionHeader('Technical Skills & Competencies');
  doc.setFontSize(8.5);
  if (skillCategories && skillCategories.length > 0) {
    skillCategories.slice(0, 6).forEach((cat) => {
      const skillsList = cat.skills?.map((s) => s.name).join(', ') || '';
      if (skillsList) {
        if (y > pageHeight - 40) {
          doc.addPage();
          y = 40;
        }
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text(`${cat.name}: `, margin, y);
        const prefixWidth = doc.getTextWidth(`${cat.name}: `);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        const skillTextLines = doc.splitTextToSize(skillsList, contentWidth - prefixWidth);
        doc.text(skillTextLines, margin + prefixWidth, y);
        y += skillTextLines.length * 11 + 3;
      }
    });
  }
  y += 10;

  // Section 3: Work Experience
  drawSectionHeader('Work Experience');
  experience.forEach((exp) => {
    if (y > pageHeight - 75) {
      doc.addPage();
      y = 40;
    }

    // Role and Company
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(exp.job_title, margin, y);

    // Duration & Location on the right
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    const dateRange = `${exp.start_date} - ${exp.is_current ? 'Present' : exp.end_date} | ${exp.location}`;
    const dateWidth = doc.getTextWidth(dateRange);
    doc.text(dateRange, margin + contentWidth - dateWidth, y);
    y += 13;

    // Company Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(37, 99, 235); // blue-600
    doc.text(exp.company, margin, y);
    y += 12;

    // Role description
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    const descLines = doc.splitTextToSize(exp.description, contentWidth);
    doc.text(descLines, margin, y);
    y += descLines.length * 11 + 4;

    // Key Accomplishments
    if (exp.accomplishments) {
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(71, 85, 105);
      const accLines = doc.splitTextToSize(`Key Impact: ${exp.accomplishments}`, contentWidth);
      doc.text(accLines, margin, y);
      y += accLines.length * 11 + 6;
    }

    y += 6;
  });

  // Section 4: Featured Engineering Projects
  drawSectionHeader('Featured Software Projects');
  projects.slice(0, 3).forEach((proj) => {
    if (y > pageHeight - 65) {
      doc.addPage();
      y = 40;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(proj.title, margin, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    const statusText = `Status: ${proj.status}`;
    const statusWidth = doc.getTextWidth(statusText);
    doc.text(statusText, margin + contentWidth - statusWidth, y);
    y += 12;

    // Tech stack
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(37, 99, 235);
    doc.text(`Stack: ${proj.technologies}`, margin, y);
    y += 11;

    // Description
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    const projDesc = doc.splitTextToSize(proj.description, contentWidth);
    doc.text(projDesc, margin, y);
    y += projDesc.length * 11 + 10;
  });

  // Section 5: Educational Background
  drawSectionHeader('Education & Credentials');
  education.forEach((edu) => {
    if (y > pageHeight - 50) {
      doc.addPage();
      y = 40;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(edu.degree, margin, y);

    const yearText = `${edu.start_year} - ${edu.end_year}`;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    const yrWidth = doc.getTextWidth(yearText);
    doc.text(yearText, margin + contentWidth - yrWidth, y);
    y += 12;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(`${edu.institution} - ${edu.field_of_study} (${edu.grade_or_honors || 'Honours'})`, margin, y);
    y += 16;
  });

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 25, margin + contentWidth, pageHeight - 25);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Confidential Developer Portfolio CV - ${profile.full_name} - Generated via Verified Employer Portal`,
      margin,
      pageHeight - 15
    );
    doc.text(`Page ${i} of ${totalPages}`, margin + contentWidth - 45, pageHeight - 15);
  }

  // Trigger download
  const filename = cvDoc?.file_name || `${profile.full_name.replace(/\s+/g, '_')}_Senior_Software_Engineer_CV.pdf`;
  doc.save(filename);
}
