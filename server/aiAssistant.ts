import { GoogleGenAI } from '@google/genai';
import { db } from './db.ts';

interface ChatHistoryItem {
  role: 'user' | 'assistant' | 'model';
  content: string;
}

export async function handleAssistantChat(userMessage: string, history: ChatHistoryItem[] = []) {
  // 1. Gather live grounding context from SQLite
  const profile = db.prepare('SELECT * FROM profile WHERE id = 1').get() as any;
  const settings = db.prepare('SELECT * FROM website_settings WHERE id = 1').get() as any;
  const skills = db.prepare(`
    SELECT s.name, s.proficiency_percent, c.name as category_name
    FROM skills s
    JOIN skill_categories c ON s.category_id = c.id
    ORDER BY c.order_index ASC, s.proficiency_percent DESC
  `).all() as any[];
  const services = db.prepare('SELECT title, short_description, key_deliverables FROM services ORDER BY order_index ASC').all() as any[];
  const projects = db.prepare(`
    SELECT id, title, technologies, status, description, problem_statement, system_architecture, project_outcomes, github_url, live_url
    FROM projects
    WHERE is_draft = 0
    ORDER BY order_index ASC
  `).all() as any[];
  const experience = db.prepare('SELECT job_title, company, start_date, end_date, is_current, description, accomplishments FROM work_experience ORDER BY order_index ASC').all() as any[];
  const education = db.prepare('SELECT degree, institution, field_of_study, start_year, end_year, grade_or_honors FROM education ORDER BY order_index ASC').all() as any[];
  const cvVersions = db.prepare('SELECT id, version_title, file_name, cv_track, custom_highlights FROM cv_documents WHERE is_active = 1').all() as any[];

  // 2. Synthesize structured ground-truth text
  const skillsSummary = skills.map((s) => `${s.name} (${s.category_name}, ${s.proficiency_percent}%)`).join('; ');
  const servicesSummary = services.map((s) => `* ${s.title}: ${s.short_description}. Key deliverables: ${s.key_deliverables}`).join('\n');
  const projectsSummary = projects.map((p) => `* [ID ${p.id}] ${p.title} (${p.status}, Stack: ${p.technologies})\n  Overview: ${p.description}\n  Problem: ${p.problem_statement || 'N/A'}\n  Architecture: ${p.system_architecture || 'N/A'}\n  Outcomes: ${p.project_outcomes || 'N/A'}\n  GitHub: ${p.github_url || 'N/A'}, Live Demo: ${p.live_url || 'N/A'}`).join('\n\n');
  const expSummary = experience.map((e) => `* ${e.job_title} at ${e.company} (${e.start_date} to ${e.is_current ? 'Present' : e.end_date}): ${e.description}. Accomplishments: ${e.accomplishments}`).join('\n');
  const eduSummary = education.map((ed) => `* ${ed.degree} in ${ed.field_of_study} from ${ed.institution} (${ed.start_year}-${ed.end_year}) - ${ed.grade_or_honors}`).join('\n');

  const systemInstruction = `You are ${settings?.ai_assistant_name || 'DevBot'}, the verified AI Portfolio Assistant for Cisse Acquah, a Senior Software Engineer and Full-Stack Architect.
Your role is to assist prospective employers, recruiters, engineering managers, and clients in learning about Cisse's qualifications, technical stack, architecture philosophy, projects, and availability.

VERIFIED PORTFOLIO KNOWLEDGE BASE (ABSOLUTE GROUND TRUTH):
- Candidate Name: ${profile?.full_name}
- Professional Title: ${profile?.professional_title}
- Current Address / Location: ${profile?.location}
- Official Email: ${profile?.email}
- Contact Phone: ${profile?.phone}
- Direct WhatsApp Contact: ${profile?.whatsapp_number}
- Personal Biography: ${profile?.bio}
- Technical Specialisations: ${profile?.technical_specialisations}
- Career Interests: ${profile?.career_interests}

SKILLS & PROFICIENCIES:
${skillsSummary}

SOFTWARE SERVICES OFFERED:
${servicesSummary}

ENGINEERING PROJECTS & CASE STUDIES:
${projectsSummary}

PROFESSIONAL EXPERIENCE:
${expSummary}

EDUCATION:
${eduSummary}

CV & EMPLOYER VERIFICATION POLICY:
To protect sensitive credentials, Cisse's CV download is protected. Visitors wanting his CV must click the "Download My CV" button on the portfolio to verify their organization details. If they are not an employer, they are invited to chat via WhatsApp (${profile?.whatsapp_number}).

STRICT GUIDELINES:
1. ONLY provide facts present in the knowledge base above. Never invent, hallucinate, or exaggerate qualifications, past companies, or projects.
2. If asked about technologies Cisse knows, cite his verified skills (Python, Django, PostgreSQL, SQLite, React, Docker, Celery, Redis, etc.).
3. If an employer or recruiter asks how to hire Cisse or get his CV, clearly explain the Employer Verification workflow and encourage them to click "Download My CV".
4. If a client needs software consulting or application development, summarize his relevant services and invite them to reach out through the Contact form or WhatsApp.
5. Provide relevant project links (GitHub or Live Demo) when discussing his work.
6. Keep answers concise, professional, courteous, and formatted with clean bullet points.`;

  // 3. Detect intent for contextual action buttons
  const actions: { label: string; action: 'open_cv' | 'open_contact' | 'open_project' | 'open_whatsapp'; payload?: any }[] = [];
  const lowerMsg = userMessage.toLowerCase();

  if (lowerMsg.includes('cv') || lowerMsg.includes('resume') || lowerMsg.includes('hire') || lowerMsg.includes('recruiting') || lowerMsg.includes('job')) {
    actions.push({ label: 'Verify & Download CV', action: 'open_cv' });
  }
  if (lowerMsg.includes('contact') || lowerMsg.includes('email') || lowerMsg.includes('message') || lowerMsg.includes('consult')) {
    actions.push({ label: 'Contact Me', action: 'open_contact' });
    actions.push({ label: 'Chat on WhatsApp', action: 'open_whatsapp' });
  }
  if (lowerMsg.includes('apexfleet') || lowerMsg.includes('telemetry') || lowerMsg.includes('fleet')) {
    actions.push({ label: 'View ApexFleet Case Study', action: 'open_project', payload: { projectId: 1 } });
  } else if (lowerMsg.includes('payshield') || lowerMsg.includes('fraud') || lowerMsg.includes('payment')) {
    actions.push({ label: 'View PayShield Case Study', action: 'open_project', payload: { projectId: 2 } });
  } else if (lowerMsg.includes('documind') || lowerMsg.includes('rag') || lowerMsg.includes('ai') || lowerMsg.includes('llm')) {
    actions.push({ label: 'View DocuMind AI Case Study', action: 'open_project', payload: { projectId: 3 } });
  }

  // 4. Try Gemini API first
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = new GoogleGenAI();

      // Format contents with history
      const contents: any[] = [];
      history.slice(-6).forEach((h) => {
        contents.push({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.content }],
        });
      });
      contents.push({
        role: 'user',
        parts: [{ text: userMessage }],
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.25,
        },
      });

      if (response && response.text) {
        return {
          reply: response.text,
          actions,
        };
      }
    } catch (apiError: any) {
      console.warn('Gemini API call failed, falling back to grounded heuristic answer:', apiError?.message);
    }
  }

  // 5. Intelligent Grounded Knowledge Base Fallback
  return {
    reply: generateKnowledgeBaseFallback(lowerMsg, profile, skills, services, projects, expSummary),
    actions,
  };
}

function generateKnowledgeBaseFallback(
  lowerMsg: string,
  profile: any,
  skills: any[],
  services: any[],
  projects: any[],
  expSummary: string
): string {
  if (lowerMsg.includes('who are you') || lowerMsg.includes('about') || lowerMsg.includes('who is cisse')) {
    return `**${profile.full_name}** is a **${profile.professional_title}** based at ${profile.location}. With over 6+ years of engineering experience, he specialises in high-scale Python/Django backends, relational databases (PostgreSQL/SQLite), distributed architectures, and modern React interfaces.\n\nHe holds degrees from University of Oxford (MSc) and Imperial College London (BSc).`;
  }

  if (lowerMsg.includes('skill') || lowerMsg.includes('technology') || lowerMsg.includes('stack') || lowerMsg.includes('language')) {
    const topLangs = skills.filter((s) => s.category_name.toLowerCase().includes('programming')).map((s) => s.name).join(', ');
    const topBackend = skills.filter((s) => s.category_name.toLowerCase().includes('backend')).map((s) => s.name).join(', ');
    const topDB = skills.filter((s) => s.category_name.toLowerCase().includes('database')).map((s) => s.name).join(', ');

    return `Here is a summary of Cisse's core technical stack:\n\n* **Languages:** ${topLangs}\n* **Backend Frameworks:** ${topBackend}\n* **Databases:** ${topDB}\n* **DevOps & Cloud:** Docker, Linux Ubuntu, Redis, Celery, CI/CD Actions.\n\nAll skills follow strict OOP paradigms and security hardening practices.`;
  }

  if (lowerMsg.includes('project') || lowerMsg.includes('work') || lowerMsg.includes('portfolio') || lowerMsg.includes('case study')) {
    const projList = projects.slice(0, 3).map((p) => `* **${p.title}** (${p.status})\n  *Stack:* ${p.technologies}\n  *Key Achievement:* ${p.description.slice(0, 110)}...`).join('\n');
    return `Cisse has engineered several production-grade systems. Highlights include:\n\n${projList}\n\nYou can click on any project on the portfolio to read the full **17-point Case Study**!`;
  }

  if (lowerMsg.includes('cv') || lowerMsg.includes('resume') || lowerMsg.includes('hire') || lowerMsg.includes('download')) {
    return `To review or download Cisse's official Curriculum Vitae, please click the **"Download My CV"** button on the navbar. You will be prompted with a quick employer verification form to ensure security. Once verified, you will immediately receive access to download his comprehensive PDF CV!`;
  }

  if (lowerMsg.includes('service') || lowerMsg.includes('offer') || lowerMsg.includes('consult')) {
    const sList = services.slice(0, 4).map((s) => `* **${s.title}:** ${s.short_description}`).join('\n');
    return `Cisse offers specialized engineering services including:\n\n${sList}\n\nFeel free to reach out via the Contact section to discuss timelines and deliverables!`;
  }

  if (lowerMsg.includes('contact') || lowerMsg.includes('email') || lowerMsg.includes('phone') || lowerMsg.includes('whatsapp') || lowerMsg.includes('location') || lowerMsg.includes('address')) {
    return `You can connect with Cisse through multiple direct channels:\n\n* **Location/Address:** ${profile.location}\n* **Email:** ${profile.email}\n* **Phone:** ${profile.phone}\n* **WhatsApp:** [Chat on WhatsApp](https://wa.me/${profile.whatsapp_number.replace(/[^0-9]/g, '')})\n* **GitHub:** https://github.com/acquah-cisse\n* **LinkedIn:** https://linkedin.com/in/cisse-acquah`;
  }

  return `I am here to help you learn about Cisse Acquah's software engineering background! You can ask me about:\n\n* His **technical skills** (Python, Django, PostgreSQL, React, AI/LLMs)\n* His **featured software projects & case studies**\n* His **educational background** (Oxford & Imperial)\n* His **services & consulting**\n* How to **request and download his official CV**`;
}
