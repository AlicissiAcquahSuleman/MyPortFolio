export interface Profile {
  id: number;
  full_name: string;
  professional_title: string;
  personal_intro: string;
  bio: string;
  profile_image: string;
  email: string;
  phone: string;
  location: string;
  career_interests: string;
  technical_specialisations: string;
  whatsapp_number: string;
  updated_at?: string;
}

export interface Education {
  id: number;
  degree: string;
  institution: string;
  field_of_study: string;
  start_year: string;
  end_year: string;
  grade_or_honors?: string;
  description?: string;
  order_index: number;
}

export interface WorkExperience {
  id: number;
  job_title: string;
  company: string;
  location: string;
  start_date: string;
  end_date: string;
  is_current: number;
  description: string;
  accomplishments?: string;
  order_index: number;
}

export interface SkillCategory {
  id: number;
  name: string;
  slug: string;
  order_index: number;
  skills?: Skill[];
}

export interface Skill {
  id: number;
  category_id: number;
  name: string;
  proficiency_percent: number;
  icon_class: string;
  badge_color: string;
  order_index: number;
}

export interface Service {
  id: number;
  title: string;
  icon_class: string;
  short_description: string;
  full_description: string;
  key_deliverables?: string;
  order_index: number;
}

export interface ProjectCategory {
  id: number;
  name: string;
  slug: string;
}

export interface Project {
  id: number;
  title: string;
  category_id?: number;
  description: string;
  technologies: string;
  thumbnail_url: string;
  status: 'Ongoing' | 'Completed' | 'On Hold';
  commencement_date: string;
  completion_date?: string | null;
  github_url?: string | null;
  live_url?: string | null;
  key_features: string;
  is_featured: number;
  order_index: number;
  // Case Study Extensions (Section 17)
  problem_statement?: string;
  project_objectives?: string;
  proposed_solution?: string;
  system_architecture?: string;
  database_design?: string;
  implementation_process?: string;
  challenges_encountered?: string;
  solutions_implemented?: string;
  project_outcomes?: string;
  future_improvements?: string;
  screenshots_gallery?: string; // JSON string array of { url, caption }
  is_draft?: number;
  view_count?: number;
  github_click_count?: number;
  live_demo_click_count?: number;
}

export interface ProjectScreenshot {
  url: string;
  caption: string;
}

export interface CVDocument {
  id: number;
  version_title: string;
  file_name: string;
  file_size: string;
  upload_date: string;
  is_active: number;
  notes?: string;
  summary_content?: string;
  cv_track?: 'software_engineer' | 'django_backend' | 'data_science' | 'ai_ml';
  custom_highlights?: string;
  download_count?: number;
}

export interface EmployerRequest {
  id: number;
  full_name: string;
  company_name: string;
  email: string;
  phone: string;
  position: string;
  purpose: string;
  message?: string;
  download_token?: string;
  token_expires_at?: string;
  is_downloaded: number;
  downloaded_at?: string;
  status: string;
  review_status?: 'Pending' | 'Reviewed' | 'Contacted' | 'Resolved';
  cv_version_id?: number;
  admin_notes?: string;
  created_at: string;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: number;
  created_at: string;
}

export interface SocialMedia {
  id: number;
  platform_name: string;
  profile_url: string;
  icon_class: string;
  is_active: number;
  order_index: number;
}

export interface WebsiteSettings {
  id: number;
  site_title: string;
  meta_description: string;
  whatsapp_number: string;
  hero_headline: string;
  hero_subheadline: string;
  visitor_count: number;
  ai_assistant_enabled?: number;
  ai_assistant_name?: string;
  ai_welcome_message?: string;
}

export interface ActivityLog {
  id: number;
  action_type: string;
  description: string;
  created_at: string;
}

export interface AnalyticsEvent {
  id: number;
  event_type: 'page_view' | 'project_view' | 'github_click' | 'live_demo_click' | 'cv_download' | 'chat_interaction';
  target_id?: number;
  target_name?: string;
  path?: string;
  created_at: string;
}

export interface PortfolioData {
  profile: Profile;
  settings: WebsiteSettings;
  education: Education[];
  experience: WorkExperience[];
  skillCategories: SkillCategory[];
  allSkills: Skill[];
  services: Service[];
  projectCategories: ProjectCategory[];
  projects: Project[];
  activeCV: CVDocument;
  cvVersions: CVDocument[];
  socials: SocialMedia[];
}

export interface AdminStats {
  totalProjects: number;
  completedProjects: number;
  ongoingProjects: number;
  totalEmployerRequests: number;
  totalCVDownloads: number;
  unreadMessages: number;
  totalMessages: number;
  visitorCount: number;
  activityLogs: ActivityLog[];
  // Analytics Extensions (Section 18)
  totalProjectViews?: number;
  totalGithubClicks?: number;
  totalLiveDemoClicks?: number;
  mostPopularProjects?: { id: number; title: string; views: number; clicks: number }[];
  employerStatusCounts?: { Pending: number; Reviewed: number; Contacted: number; Resolved: number };
  dailyTraffic?: { date: string; views: number; employers: number }[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestedActions?: { label: string; action: 'open_cv' | 'open_contact' | 'open_project' | 'open_whatsapp'; payload?: any }[];
}
