import React, { useState, useEffect } from 'react';
import { PortfolioData, AdminStats, Project, Skill, Service, WorkExperience, Education, SocialMedia } from '../../types';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  portfolioData: PortfolioData;
  onRefreshData: () => void;
  initialTab?: AdminTab;
}

type AdminTab =
  | 'overview'
  | 'analytics'
  | 'profile'
  | 'education'
  | 'experience'
  | 'skills'
  | 'services'
  | 'projects'
  | 'cv'
  | 'employers'
  | 'messages'
  | 'socials'
  | 'settings';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  portfolioData,
  onRefreshData,
  initialTab = 'overview',
}) => {
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('dev_admin_token'));
  const [usernameInput, setUsernameInput] = useState('admin');
  const [passwordInput, setPasswordInput] = useState('admin123');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);

  useEffect(() => {
    if (initialTab && isOpen) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  // Centralized authenticated fetch with automatic 401 expiration handling
  const authenticatedFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const token = authToken || localStorage.getItem('dev_admin_token');
    const headers = new Headers(init?.headers);
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    const response = await fetch(input, { ...init, headers });
    if (response.status === 401) {
      console.warn('Unauthorized request detected. Clearing stale admin session.');
      setAuthToken(null);
      localStorage.removeItem('dev_admin_token');
      showNotification('Admin session expired or required. Please log in with admin / admin123.', true);
    }
    return response;
  };

  // Validate authentication whenever the dashboard opens
  useEffect(() => {
    if (isOpen && authToken) {
      fetch('/api/admin/check-auth', {
        headers: { Authorization: `Bearer ${authToken}` },
      })
        .then((res) => {
          if (!res.ok) {
            console.warn('Admin token check failed. Clearing stale credentials.');
            setAuthToken(null);
            localStorage.removeItem('dev_admin_token');
            setLoginError('Your previous session expired. Please sign in below.');
          }
        })
        .catch(() => {});
    }
  }, [isOpen, authToken]);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Forms / editing states
  const [profileForm, setProfileForm] = useState({ ...portfolioData.profile });
  const [settingsForm, setSettingsForm] = useState({
    site_title: portfolioData.settings?.site_title || '',
    meta_description: portfolioData.settings?.meta_description || '',
    whatsapp_number: portfolioData.settings?.whatsapp_number || '',
    hero_headline: portfolioData.settings?.hero_headline || '',
    hero_subheadline: portfolioData.settings?.hero_subheadline || '',
    admin_password: '',
    ai_assistant_enabled: portfolioData.settings?.ai_assistant_enabled !== undefined ? Number(portfolioData.settings.ai_assistant_enabled) === 1 : true,
    ai_assistant_name: portfolioData.settings?.ai_assistant_name || 'DevBot',
    ai_welcome_message: portfolioData.settings?.ai_welcome_message || "Hello! I am Cisse's AI Portfolio Assistant. How can I help you today?",
  });

  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Employer requests & contact messages list
  const [employerRequests, setEmployerRequests] = useState<any[]>([]);
  const [contactMessages, setContactMessages] = useState<any[]>([]);
  const [cvDocuments, setCvDocuments] = useState<any[]>([]);
  const [socialsList, setSocialsList] = useState<SocialMedia[]>(() => portfolioData.socials || []);

  useEffect(() => {
    if (portfolioData.socials) {
      setSocialsList(portfolioData.socials);
    }
  }, [portfolioData.socials]);

  // Project Modal State
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);
  // Skill Modal State
  const [editingSkill, setEditingSkill] = useState<Partial<Skill> | null>(null);
  const [adminSkillCategoryFilter, setAdminSkillCategoryFilter] = useState<number | 'all'>('all');
  const [isAddingSkillCategory, setIsAddingSkillCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  // Service Modal State
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null);
  // Experience Modal State
  const [editingExp, setEditingExp] = useState<Partial<WorkExperience> | null>(null);
  // Education Modal State
  const [editingEdu, setEditingEdu] = useState<Partial<Education> | null>(null);
  // Social Media Modal State
  const [editingSocial, setEditingSocial] = useState<Partial<SocialMedia> | null>(null);

  // Picture Upload State
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
  const [showUrlFallback, setShowUrlFallback] = useState(false);

  const processProfilePhotoFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showNotification('Please select a valid image file (PNG, JPG, WEBP, GIF).', true);
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      showNotification('Image file size must be less than 25MB.', true);
      return;
    }

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        // Preview immediately
        setProfileForm((prev) => ({ ...prev, profile_image: base64 }));

        const res = await authenticatedFetch('/api/admin/upload-profile-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageBase64: base64,
            filename: file.name,
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Failed to upload profile picture');

        setProfileForm((prev) => ({ ...prev, profile_image: data.imageUrl }));
        showNotification('Profile picture uploaded and saved successfully!');
        onRefreshData();
      } catch (err: any) {
        showNotification(err.message || 'Image upload failed', true);
      } finally {
        setUploadingImage(false);
      }
    };
    reader.onerror = () => {
      setUploadingImage(false);
      showNotification('Could not read image file from local device.', true);
    };
    reader.readAsDataURL(file);
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processProfilePhotoFile(file);
    e.target.value = '';
  };

  const handlePhotoDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingPhoto(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processProfilePhotoFile(file);
  };

  // Sync profile when portfolioData changes
  useEffect(() => {
    if (portfolioData.profile) {
      setProfileForm({ ...portfolioData.profile });
    }
    if (portfolioData.settings) {
      setSettingsForm((prev) => ({
        ...prev,
        site_title: portfolioData.settings.site_title,
        meta_description: portfolioData.settings.meta_description,
        whatsapp_number: portfolioData.settings.whatsapp_number,
        hero_headline: portfolioData.settings.hero_headline,
        hero_subheadline: portfolioData.settings.hero_subheadline,
      }));
    }
  }, [portfolioData]);

  // Fetch admin stats when logged in
  const fetchStats = async (token: string) => {
    setStatsLoading(true);
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Stats error:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch employer requests
  const fetchEmployerRequests = async (token: string) => {
    try {
      const res = await fetch('/api/admin/employer-requests', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEmployerRequests(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch contact messages
  const fetchContactMessages = async (token: string) => {
    try {
      const res = await fetch('/api/admin/contact-messages', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setContactMessages(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch CV documents
  const fetchCVDocuments = async (token: string) => {
    try {
      const res = await fetch('/api/admin/cv-documents', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCvDocuments(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Social Media links
  const fetchSocials = async (token: string) => {
    try {
      const res = await fetch('/api/admin/socials', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSocialsList(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (authToken && isOpen) {
      fetchStats(authToken);
      fetchEmployerRequests(authToken);
      fetchContactMessages(authToken);
      fetchCVDocuments(authToken);
      fetchSocials(authToken);
    }
  }, [authToken, isOpen, activeTab]);

  if (!isOpen) return null;

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setActionError(msg);
      setTimeout(() => setActionError(''), 4000);
    } else {
      setActionSuccess(msg);
      setTimeout(() => setActionSuccess(''), 4000);
    }
  };

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: passwordInput }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      setAuthToken(data.token);
      localStorage.setItem('dev_admin_token', data.token);
      fetchStats(data.token);
      fetchSocials(data.token);
      showNotification('Administrator authenticated successfully!');
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  // 1-Click Quick Login with default credentials
  const handleQuickLogin = async (usr = 'admin', pwd = 'admin123') => {
    setUsernameInput(usr);
    setPasswordInput(pwd);
    setLoginError('');
    setLoginLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usr, password: pwd }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      setAuthToken(data.token);
      localStorage.setItem('dev_admin_token', data.token);
      fetchStats(data.token);
      fetchSocials(data.token);
      showNotification('Signed in as Administrator!');
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    if (authToken) {
      try {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` },
        });
      } catch (e) {}
    }
    setAuthToken(null);
    localStorage.removeItem('dev_admin_token');
  };

  // Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authenticatedFetch('/api/admin/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileForm),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');
      showNotification('Profile updated successfully!');
      onRefreshData();
    } catch (err: any) {
      showNotification(err.message, true);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authenticatedFetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingsForm),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to update settings');
      showNotification('Website settings updated successfully!');
      onRefreshData();
    } catch (err: any) {
      showNotification(err.message, true);
    }
  };

  // Project CRUD
  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    try {
      const isNew = !editingProject.id;
      const url = isNew ? '/api/admin/projects' : `/api/admin/projects/${editingProject.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await authenticatedFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingProject),
      });

      if (!res.ok) throw new Error('Failed to save project');
      const projectData = await res.json();
      const targetId = editingProject.id || projectData.id;

      if (targetId) {
        await authenticatedFetch(`/api/admin/projects/${targetId}/case-study`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(editingProject),
        });
      }

      showNotification(`Project & Case Study ${isNew ? 'created' : 'updated'} successfully!`);
      setEditingProject(null);
      onRefreshData();
    } catch (err: any) {
      showNotification(err.message, true);
    }
  };

  const handleDeleteProject = async (id: number) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await authenticatedFetch(`/api/admin/projects/${id}`, {
        method: 'DELETE',
      });
      showNotification('Project deleted.');
      onRefreshData();
    } catch (err) {
      showNotification('Failed to delete project', true);
    }
  };

  // Mark message read/unread
  const handleToggleMessageRead = async (id: number, currentRead: number) => {
    try {
      await authenticatedFetch(`/api/admin/contact-messages/${id}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_read: currentRead ? 0 : 1 }),
      });
      if (authToken) {
        fetchContactMessages(authToken);
        fetchStats(authToken);
      }
    } catch (err) {}
  };

  // Activate CV Version
  const handleActivateCV = async (id: number) => {
    try {
      await authenticatedFetch(`/api/admin/cv-documents/${id}/activate`, {
        method: 'PUT',
      });
      showNotification('Active CV version updated!');
      if (authToken) {
        fetchCVDocuments(authToken);
      }
      onRefreshData();
    } catch (err) {
      showNotification('Failed to activate CV', true);
    }
  };

  // CSV Export for Employer Inquiries & Analytics (Section 18)
  const handleExportAnalyticsCSV = async () => {
    try {
      const res = await authenticatedFetch('/api/admin/analytics/export');
      if (!res.ok) throw new Error('Failed to export CSV report');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `employer_inquiries_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showNotification('Employer inquiries report downloaded as CSV successfully!');
    } catch (err: any) {
      showNotification(err.message, true);
    }
  };

  // Update Employer Review Status & Admin Notes (Section 18)
  const handleUpdateEmployerReviewStatus = async (id: number, review_status: string, admin_notes?: string) => {
    try {
      const res = await authenticatedFetch(`/api/admin/employer-requests/${id}/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ review_status, admin_notes }),
      });
      if (!res.ok) throw new Error('Failed to update review status');
      showNotification(`Employer request status marked as "${review_status}".`);
      if (authToken) {
        fetchEmployerRequests(authToken);
        fetchStats(authToken);
      }
    } catch (err: any) {
      showNotification(err.message, true);
    }
  };

  // Social Media Management Handlers
  const handleSaveSocial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSocial) return;

    try {
      const isNew = !editingSocial.id;
      const url = isNew ? '/api/admin/socials' : `/api/admin/socials/${editingSocial.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const payload = {
        platform_name: editingSocial.platform_name || 'Social Link',
        profile_url: editingSocial.profile_url || '',
        icon_class: editingSocial.icon_class || 'bi bi-link-45deg',
        is_active: editingSocial.is_active !== undefined ? (editingSocial.is_active ? 1 : 0) : 1,
        order_index: editingSocial.order_index || 0,
      };

      const res = await authenticatedFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save social media profile');
      showNotification(`Social media link "${payload.platform_name}" ${isNew ? 'added' : 'updated'} successfully!`);
      setEditingSocial(null);
      if (authToken) {
        fetchSocials(authToken);
      }
      onRefreshData();
    } catch (err: any) {
      showNotification(err.message, true);
    }
  };

  const handleDeleteSocial = async (id: number) => {
    if (!confirm('Are you sure you want to remove this social media link?')) return;
    try {
      const res = await authenticatedFetch(`/api/admin/socials/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to delete social link');
      showNotification('Social media link removed successfully.');
      if (authToken) {
        fetchSocials(authToken);
      }
      onRefreshData();
    } catch (err: any) {
      showNotification(err.message, true);
    }
  };

  const handleToggleSocialActive = async (social: SocialMedia) => {
    try {
      const updatedActive = social.is_active ? 0 : 1;
      const res = await authenticatedFetch(`/api/admin/socials/${social.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform_name: social.platform_name,
          profile_url: social.profile_url,
          icon_class: social.icon_class,
          is_active: updatedActive,
          order_index: social.order_index,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to update status');
      showNotification(`${social.platform_name} visibility ${updatedActive ? 'enabled' : 'hidden'}.`);
      if (authToken) {
        fetchSocials(authToken);
      }
      onRefreshData();
    } catch (err: any) {
      showNotification(err.message, true);
    }
  };

  // Skills CRUD Handlers
  const handleSaveSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSkill) return;

    try {
      const isNew = !editingSkill.id;
      const url = isNew ? '/api/admin/skills' : `/api/admin/skills/${editingSkill.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const payload = {
        category_id: Number(editingSkill.category_id) || 1,
        name: editingSkill.name || '',
        proficiency_percent: Number(editingSkill.proficiency_percent) || 80,
        icon_class: editingSkill.icon_class || 'bi bi-check-circle',
        badge_color: editingSkill.badge_color || '#3b82f6',
        order_index: Number(editingSkill.order_index) || 0,
      };

      const res = await authenticatedFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save skill');
      showNotification(`Skill "${payload.name}" ${isNew ? 'created' : 'updated'} successfully!`);
      setEditingSkill(null);
      onRefreshData();
    } catch (err: any) {
      showNotification(err.message, true);
    }
  };

  const handleDeleteSkill = async (id: number) => {
    if (!confirm('Are you sure you want to delete this technical skill?')) return;
    try {
      const res = await authenticatedFetch(`/api/admin/skills/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to delete skill');
      showNotification('Skill removed successfully.');
      onRefreshData();
    } catch (err: any) {
      showNotification(err.message, true);
    }
  };

  const handleCreateSkillCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      const res = await authenticatedFetch('/api/admin/skill-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          order_index: (portfolioData.skillCategories?.length || 0) + 1,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to create category');
      showNotification(`Category "${newCategoryName}" created successfully!`);
      setNewCategoryName('');
      setIsAddingSkillCategory(false);
      onRefreshData();
    } catch (err: any) {
      showNotification(err.message, true);
    }
  };

  // Services CRUD Handlers
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    try {
      const isNew = !editingService.id;
      const url = isNew ? '/api/admin/services' : `/api/admin/services/${editingService.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const payload = {
        title: editingService.title || '',
        icon_class: editingService.icon_class || 'bi bi-gear-fill',
        short_description: editingService.short_description || '',
        full_description: editingService.full_description || '',
        key_deliverables: editingService.key_deliverables || '',
        order_index: Number(editingService.order_index) || 0,
      };

      const res = await authenticatedFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save service');
      showNotification(`Service "${payload.title}" ${isNew ? 'created' : 'updated'} successfully!`);
      setEditingService(null);
      onRefreshData();
    } catch (err: any) {
      showNotification(err.message, true);
    }
  };

  const handleDeleteService = async (id: number) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    try {
      const res = await authenticatedFetch(`/api/admin/services/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to delete service');
      showNotification('Service removed successfully.');
      onRefreshData();
    } catch (err: any) {
      showNotification(err.message, true);
    }
  };

  // Work Experience CRUD Handlers
  const handleSaveExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExp) return;

    try {
      const isNew = !editingExp.id;
      const url = isNew ? '/api/admin/experience' : `/api/admin/experience/${editingExp.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const payload = {
        job_title: editingExp.job_title || '',
        company: editingExp.company || '',
        location: editingExp.location || 'Accra, Ghana',
        start_date: editingExp.start_date || '',
        end_date: editingExp.is_current ? 'Present' : (editingExp.end_date || 'Present'),
        is_current: editingExp.is_current ? 1 : 0,
        description: editingExp.description || '',
        accomplishments: editingExp.accomplishments || '',
        order_index: Number(editingExp.order_index) || 0,
      };

      const res = await authenticatedFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save work experience');
      showNotification(`Experience "${payload.job_title}" ${isNew ? 'created' : 'updated'} successfully!`);
      setEditingExp(null);
      onRefreshData();
    } catch (err: any) {
      showNotification(err.message, true);
    }
  };

  const handleDeleteExperience = async (id: number) => {
    if (!confirm('Are you sure you want to delete this work experience entry?')) return;
    try {
      const res = await authenticatedFetch(`/api/admin/experience/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to delete experience');
      showNotification('Work experience entry removed successfully.');
      onRefreshData();
    } catch (err: any) {
      showNotification(err.message, true);
    }
  };

  // Education CRUD Handlers
  const handleSaveEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEdu) return;

    try {
      const isNew = !editingEdu.id;
      const url = isNew ? '/api/admin/education' : `/api/admin/education/${editingEdu.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const payload = {
        degree: editingEdu.degree || '',
        institution: editingEdu.institution || '',
        field_of_study: editingEdu.field_of_study || '',
        start_year: editingEdu.start_year || '',
        end_year: editingEdu.end_year || '',
        grade_or_honors: editingEdu.grade_or_honors || '',
        description: editingEdu.description || '',
        order_index: Number(editingEdu.order_index) || 0,
      };

      const res = await authenticatedFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save education record');
      showNotification(`Education "${payload.degree}" ${isNew ? 'created' : 'updated'} successfully!`);
      setEditingEdu(null);
      onRefreshData();
    } catch (err: any) {
      showNotification(err.message, true);
    }
  };

  const handleDeleteEducation = async (id: number) => {
    if (!confirm('Are you sure you want to delete this education record?')) return;
    try {
      const res = await authenticatedFetch(`/api/admin/education/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to delete education record');
      showNotification('Education record removed successfully.');
      onRefreshData();
    } catch (err: any) {
      showNotification(err.message, true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl h-[94vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md">
              <i className="bi bi-speedometer2 text-base"></i>
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                DevPortfolio Administration Portal
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono">
                  SQLite / Django MVT Live
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Full CRUD management for projects, skills, employer verifications, and CV versions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {authToken && (
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all flex items-center gap-1.5"
              >
                <i className="bi bi-box-arrow-right"></i> Log Out
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <i className="bi bi-x-lg text-sm"></i>
            </button>
          </div>
        </div>

        {/* NOT LOGGED IN: LOGIN SCREEN */}
        {!authToken ? (
          <div className="flex-1 flex items-center justify-center p-6 bg-slate-950/60">
            <div className="w-full max-w-md p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mx-auto text-2xl">
                  <i className="bi bi-shield-lock-fill"></i>
                </div>
                <h3 className="text-xl font-bold text-white">Administrator Login</h3>
                <p className="text-xs text-slate-400">
                  Authenticate to access portfolio data management and CV request logs.
                </p>
              </div>

              {loginError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                  <i className="bi bi-exclamation-circle-fill text-rose-400"></i>
                  {loginError}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Admin Username
                  </label>
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span>Credentials: <code className="text-blue-400">admin</code> / <code className="text-blue-400">admin123</code></span>
                    <button
                      type="button"
                      onClick={() => handleQuickLogin()}
                      className="text-blue-400 hover:text-blue-300 underline font-semibold cursor-pointer"
                    >
                      Fill Credentials
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer text-sm"
                  >
                    {loginLoading ? 'Authenticating...' : 'Sign In to Dashboard'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin()}
                    disabled={loginLoading}
                    className="w-full py-2.5 rounded-xl font-semibold text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <i className="bi bi-lightning-charge-fill text-amber-400"></i>
                    1-Click Admin Quick Sign-In
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          /* LOGGED IN: MAIN DASHBOARD LAYOUT */
          <div className="flex-1 flex overflow-hidden">
            
            {/* Sidebar Navigation */}
            <div className="w-56 bg-slate-950/80 border-r border-slate-800 p-4 space-y-1 shrink-0 overflow-y-auto text-xs">
              
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-all text-left ${
                  activeTab === 'overview' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <i className="bi bi-grid-fill text-sm"></i>
                Overview Stats
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-all text-left ${
                  activeTab === 'analytics' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <i className="bi bi-graph-up-arrow text-sm text-emerald-400"></i>
                  Analytics &amp; Traffic
                </span>
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  Live
                </span>
              </button>

              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-all text-left ${
                  activeTab === 'profile' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <i className="bi bi-person-circle text-sm"></i>
                Profile &amp; Biography
              </button>

              <button
                onClick={() => setActiveTab('projects')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-all text-left ${
                  activeTab === 'projects' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <i className="bi bi-code-square text-sm"></i>
                Projects ({portfolioData.projects?.length || 0})
              </button>

              <button
                onClick={() => setActiveTab('skills')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-all text-left ${
                  activeTab === 'skills' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <i className="bi bi-stack text-sm"></i>
                Technical Skills
              </button>

              <button
                onClick={() => setActiveTab('services')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-all text-left ${
                  activeTab === 'services' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <i className="bi bi-briefcase-fill text-sm"></i>
                Services ({portfolioData.services?.length || 0})
              </button>

              <button
                onClick={() => setActiveTab('experience')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-all text-left ${
                  activeTab === 'experience' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <i className="bi bi-clock-history text-sm"></i>
                Work Experience
              </button>

              <button
                onClick={() => setActiveTab('education')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-all text-left ${
                  activeTab === 'education' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <i className="bi bi-mortarboard-fill text-sm"></i>
                Education
              </button>

              <div className="pt-3 pb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Requests &amp; Workflow
              </div>

              <button
                onClick={() => setActiveTab('employers')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-all text-left ${
                  activeTab === 'employers' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <span className="flex items-center gap-2">
                  <i className="bi bi-building-check text-sm"></i>
                  Employer Requests
                </span>
                {employerRequests.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px]">
                    {employerRequests.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('cv')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-all text-left ${
                  activeTab === 'cv' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <i className="bi bi-file-earmark-pdf-fill text-sm"></i>
                CV Documents
              </button>

              <button
                onClick={() => setActiveTab('messages')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-all text-left ${
                  activeTab === 'messages' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <span className="flex items-center gap-2">
                  <i className="bi bi-inbox-fill text-sm"></i>
                  Contact Messages
                </span>
                {(stats?.unreadMessages || 0) > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                    {stats?.unreadMessages}
                  </span>
                )}
              </button>

              <div className="pt-3 pb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Configuration
              </div>

              <button
                onClick={() => setActiveTab('socials')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-all text-left ${
                  activeTab === 'socials' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <i className="bi bi-share-fill text-sm"></i>
                Social Media Links
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-all text-left ${
                  activeTab === 'settings' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <i className="bi bi-gear-fill text-sm"></i>
                Website Settings
              </button>

            </div>

            {/* Main Content Area */}
            <div className="flex-1 bg-slate-900 p-6 overflow-y-auto space-y-6">
              
              {/* Feedback alerts */}
              {actionSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                  <i className="bi bi-check-circle-fill text-emerald-400"></i>
                  {actionSuccess}
                </div>
              )}
              {actionError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                  <i className="bi bi-exclamation-triangle-fill text-rose-400"></i>
                  {actionError}
                </div>
              )}

              {/* TAB 1: OVERVIEW & STATS */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-white">System &amp; Portfolio Analytics</h3>
                    <p className="text-xs text-slate-400">Real-time metrics from SQLite database tables</p>
                  </div>

                  {/* Metrics Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-xs text-slate-400 block mb-1">Total Projects</span>
                      <span className="text-2xl font-extrabold text-white">{stats?.totalProjects ?? portfolioData.projects?.length}</span>
                      <span className="text-[10px] text-blue-400 block mt-1">
                        {stats?.completedProjects ?? 0} Completed &bull; {stats?.ongoingProjects ?? 0} Ongoing
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-xs text-slate-400 block mb-1">Employer Requests</span>
                      <span className="text-2xl font-extrabold text-blue-400">{stats?.totalEmployerRequests ?? employerRequests.length}</span>
                      <span className="text-[10px] text-slate-400 block mt-1">Via Verification Portal</span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-xs text-slate-400 block mb-1">CV Downloads Logged</span>
                      <span className="text-2xl font-extrabold text-emerald-400">{stats?.totalCVDownloads ?? 0}</span>
                      <span className="text-[10px] text-slate-400 block mt-1">Protected token downloads</span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-xs text-slate-400 block mb-1">Verified Visits</span>
                      <span className="text-2xl font-extrabold text-purple-400">{stats?.visitorCount ?? portfolioData.settings?.visitor_count}</span>
                      <span className="text-[10px] text-slate-400 block mt-1">Unique page loads</span>
                    </div>
                  </div>

                  {/* Activity Logs Table */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-sm flex items-center gap-2">
                        <i className="bi bi-clock-history text-blue-400"></i>
                        Administrative Activity Logs
                      </h4>
                      <span className="text-xs text-slate-500">Audit Trail</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400">
                            <th className="pb-2">Action</th>
                            <th className="pb-2">Details</th>
                            <th className="pb-2">Timestamp</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {stats?.activityLogs?.map((log) => (
                            <tr key={log.id} className="text-slate-300">
                              <td className="py-2.5 font-semibold text-blue-300">{log.action_type}</td>
                              <td className="py-2.5">{log.description}</td>
                              <td className="py-2.5 text-slate-500 font-mono text-[11px]">{log.created_at}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: ANALYTICS & PERFORMANCE (Section 18) */}
              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2.5">
                        <i className="bi bi-graph-up-arrow text-emerald-400"></i>
                        Employer Analytics &amp; Performance Dashboard
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Visitor engagement, project case study metrics, and employer inquiry pipeline.
                      </p>
                    </div>

                    <button
                      onClick={handleExportAnalyticsCSV}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 cursor-pointer shrink-0"
                    >
                      <i className="bi bi-file-earmark-spreadsheet-fill text-sm"></i>
                      Export CSV Report
                    </button>
                  </div>

                  {/* High-Level Engagement Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[11px] text-slate-400 block mb-1">Total Page Visits</span>
                      <span className="text-2xl font-extrabold text-purple-400">
                        {stats?.visitorCount ?? portfolioData.settings?.visitor_count ?? 0}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-1">Unique visitor sessions</span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[11px] text-slate-400 block mb-1">Case Study Views</span>
                      <span className="text-2xl font-extrabold text-blue-400">
                        {stats?.totalProjectViews ?? 0}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-1">17-point case views</span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[11px] text-slate-400 block mb-1">GitHub Repo Clicks</span>
                      <span className="text-2xl font-extrabold text-indigo-400">
                        {stats?.totalGithubClicks ?? 0}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-1">Source inspections</span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[11px] text-slate-400 block mb-1">Live Demo Launches</span>
                      <span className="text-2xl font-extrabold text-teal-400">
                        {stats?.totalLiveDemoClicks ?? 0}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-1">Interactive prototype runs</span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[11px] text-slate-400 block mb-1">Verified CV Downloads</span>
                      <span className="text-2xl font-extrabold text-emerald-400">
                        {stats?.totalCVDownloads ?? 0}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-1">PDF tracks released</span>
                    </div>
                  </div>

                  {/* Employer Review Pipeline Status */}
                  <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-sm flex items-center gap-2">
                        <i className="bi bi-kanban-fill text-blue-400"></i>
                        Employer Inquiries Review Workflow Pipeline
                      </h4>
                      <span className="text-xs text-slate-500">
                        {employerRequests.length} Total Registered Inquiries
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: 'Pending Review', status: 'Pending', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
                        { label: 'Reviewed', status: 'Reviewed', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
                        { label: 'Contacted', status: 'Contacted', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
                        { label: 'Resolved / Closed', status: 'Resolved', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
                      ].map((pipe) => {
                        const count = (stats?.employerStatusCounts as Record<string, number> | undefined)?.[pipe.status] ??
                          employerRequests.filter((r) => (r.review_status || 'Pending') === pipe.status).length;
                        return (
                          <div
                            key={pipe.status}
                            className={`p-3.5 rounded-xl border ${pipe.color} flex flex-col justify-between`}
                          >
                            <span className="text-xs font-semibold">{pipe.label}</span>
                            <span className="text-2xl font-extrabold mt-1">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Top Projects Performance Ranking */}
                  <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <i className="bi bi-trophy-fill text-amber-400"></i>
                      Project Showcase Performance &amp; Traffic Ranking
                    </h4>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400">
                            <th className="pb-2.5">Project Title</th>
                            <th className="pb-2.5">Status</th>
                            <th className="pb-2.5">Case Views</th>
                            <th className="pb-2.5">GitHub Clicks</th>
                            <th className="pb-2.5">Live Demo</th>
                            <th className="pb-2.5 text-right">Engagement Score</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {portfolioData.projects?.map((proj) => {
                            const views = proj.view_count || 0;
                            const gh = proj.github_click_count || 0;
                            const demo = proj.live_demo_click_count || 0;
                            const score = views + gh * 2 + demo * 3;
                            return (
                              <tr key={proj.id} className="text-slate-300">
                                <td className="py-2.5 font-bold text-white flex items-center gap-2">
                                  <img src={proj.thumbnail_url} alt="" className="w-6 h-6 rounded-md object-cover" />
                                  {proj.title}
                                </td>
                                <td className="py-2.5">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    proj.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                                  }`}>
                                    {proj.status}
                                  </span>
                                </td>
                                <td className="py-2.5 font-semibold text-blue-400">{views}</td>
                                <td className="py-2.5 font-semibold text-indigo-400">{gh}</td>
                                <td className="py-2.5 font-semibold text-teal-400">{demo}</td>
                                <td className="py-2.5 text-right font-mono font-bold text-emerald-400">
                                  {score} pts
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* CV Downloads by Track */}
                  <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <i className="bi bi-file-earmark-pdf-fill text-rose-400"></i>
                      Curriculum Vitae Tracks Download Distribution
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      {portfolioData.cvVersions && portfolioData.cvVersions.length > 0 ? (
                        portfolioData.cvVersions.map((ver) => (
                          <div key={ver.id} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                            <span className="text-[10px] font-mono text-blue-400 uppercase tracking-wider block">
                              {ver.cv_track || 'general'}
                            </span>
                            <span className="text-xs font-bold text-white block mt-0.5 truncate">
                              {ver.version_title}
                            </span>
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[11px]">
                              <span className="text-slate-400">Downloads</span>
                              <span className="font-bold text-emerald-400">{ver.download_count || 0}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500">No tracked CV versions available.</p>
                      )}
                    </div>
                  </div>

                  {/* Privacy & Compliance Notice */}
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-3">
                    <i className="bi bi-shield-lock-fill text-blue-400 text-base shrink-0 mt-0.5"></i>
                    <div>
                      <span className="font-bold text-white block mb-0.5">Privacy &amp; Data Ethics Notice</span>
                      Interaction telemetry (case views, repository visits, demo launches) uses aggregate counters. Contact inquiry details and organization data are safeguarded with strict admin-authenticated access and exportable exclusively in encrypted or authenticated sessions.
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PROFILE & BIOGRAPHY */}
              {activeTab === 'profile' && (
                <form onSubmit={handleSaveProfile} className="space-y-4 bg-slate-950/70 p-6 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <h3 className="font-bold text-white text-base">Edit Professional Profile &amp; Biography</h3>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs"
                    >
                      Save Profile Changes
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={profileForm.full_name}
                        onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Professional Title</label>
                      <input
                        type="text"
                        value={profileForm.professional_title}
                        onChange={(e) => setProfileForm({ ...profileForm, professional_title: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Email Address</label>
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Location</label>
                      <input
                        type="text"
                        value={profileForm.location}
                        onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">WhatsApp Number</label>
                      <input
                        type="text"
                        value={profileForm.whatsapp_number}
                        onChange={(e) => setProfileForm({ ...profileForm, whatsapp_number: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                  </div>

                  {/* Picture Upload Based Profile Photo */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-750 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block font-bold text-white text-xs flex items-center gap-2">
                          <i className="bi bi-camera-fill text-blue-400"></i>
                          Profile Picture (Direct Picture Upload)
                        </label>
                        <p className="text-[11px] text-slate-400">
                          Upload an image file directly from your computer or phone (JPG, PNG, WEBP, GIF up to 15MB)
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowUrlFallback(!showUrlFallback)}
                        className="text-[11px] text-blue-400 hover:text-blue-300 underline underline-offset-2"
                      >
                        {showUrlFallback ? 'Hide URL input' : 'Or use image URL'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                      {/* Image Preview Avatar */}
                      <div className="sm:col-span-4 flex flex-col items-center justify-center p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                        <div className="relative w-28 h-28 rounded-2xl overflow-hidden border-2 border-blue-500/50 shadow-lg bg-slate-900 group">
                          {profileForm.profile_image ? (
                            <img
                              src={profileForm.profile_image}
                              alt="Profile Preview"
                              className="w-full h-full object-cover object-center"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600">
                              <i className="bi bi-person-bounding-box text-3xl"></i>
                            </div>
                          )}

                          {uploadingImage && (
                            <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-1 text-blue-400">
                              <i className="bi bi-arrow-repeat animate-spin text-xl"></i>
                              <span className="text-[10px] font-bold">Uploading...</span>
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-2 font-medium">Current Profile Picture</span>
                        <button
                          type="button"
                          onClick={() => {
                            const defaultPhoto = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';
                            setProfileForm((prev) => ({ ...prev, profile_image: defaultPhoto }));
                            authenticatedFetch('/api/admin/profile', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ ...profileForm, profile_image: defaultPhoto }),
                            }).then(() => {
                              showNotification('Profile picture reset to default portrait!');
                              onRefreshData();
                            });
                          }}
                          className="mt-1 text-[10px] text-slate-400 hover:text-blue-300 underline cursor-pointer"
                        >
                          Reset to Default
                        </button>
                      </div>

                      {/* Drag & Drop Upload Zone */}
                      <div className="sm:col-span-8">
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/png,image/jpeg,image/webp,image/gif"
                          onChange={handleProfileImageChange}
                          className="hidden"
                        />

                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDraggingPhoto(true);
                          }}
                          onDragLeave={() => setIsDraggingPhoto(false)}
                          onDrop={handlePhotoDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                            isDraggingPhoto
                              ? 'border-blue-400 bg-blue-500/10 scale-[1.01]'
                              : 'border-slate-700 bg-slate-950/70 hover:border-blue-500 hover:bg-slate-950'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center text-lg">
                            <i className="bi bi-cloud-arrow-up-fill"></i>
                          </div>

                          <div>
                            <span className="font-bold text-white text-xs block">
                              Click to Choose Picture or Drag &amp; Drop Here
                            </span>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              Supports JPG, PNG, WEBP, GIF (Max 25MB)
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                fileInputRef.current?.click();
                              }}
                              disabled={uploadingImage}
                              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30 active:scale-95 transition-all cursor-pointer"
                            >
                              <i className="bi bi-folder2-open"></i>
                              {uploadingImage ? 'Uploading Picture...' : 'Browse Computer / Phone'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Secondary URL input if needed */}
                    {showUrlFallback && (
                      <div className="pt-2 border-t border-slate-800 text-xs">
                        <label className="block font-semibold text-slate-400 mb-1">
                          Manual Image URL Override:
                        </label>
                        <input
                          type="text"
                          value={profileForm.profile_image}
                          onChange={(e) => setProfileForm({ ...profileForm, profile_image: e.target.value })}
                          placeholder="https://..."
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                        />
                      </div>
                    )}
                  </div>

                  <div className="text-xs">
                    <label className="block font-semibold text-slate-300 mb-1">Personal Introduction</label>
                    <textarea
                      rows={2}
                      value={profileForm.personal_intro}
                      onChange={(e) => setProfileForm({ ...profileForm, personal_intro: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>

                  <div className="text-xs">
                    <label className="block font-semibold text-slate-300 mb-1">Detailed Biography</label>
                    <textarea
                      rows={4}
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>

                  <div className="text-xs">
                    <label className="block font-semibold text-slate-300 mb-1">Technical Specialisations (comma separated)</label>
                    <input
                      type="text"
                      value={profileForm.technical_specialisations}
                      onChange={(e) => setProfileForm({ ...profileForm, technical_specialisations: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>

                  <div className="text-xs">
                    <label className="block font-semibold text-slate-300 mb-1">Career Interests (comma separated)</label>
                    <input
                      type="text"
                      value={profileForm.career_interests}
                      onChange={(e) => setProfileForm({ ...profileForm, career_interests: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                </form>
              )}

              {/* TAB 3: PROJECTS MANAGEMENT */}
              {activeTab === 'projects' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <h3 className="font-bold text-white text-base">Projects Management</h3>
                      <p className="text-xs text-slate-400">Create, edit, or delete portfolio software projects</p>
                    </div>
                    <button
                      onClick={() =>
                        setEditingProject({
                          title: '',
                          category_id: 1,
                          description: '',
                          technologies: '',
                          thumbnail_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
                          status: 'Ongoing',
                          commencement_date: new Date().toISOString().split('T')[0],
                          key_features: '',
                          is_featured: 1,
                          order_index: 0,
                        })
                      }
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5"
                    >
                      <i className="bi bi-plus-lg"></i> Add New Project
                    </button>
                  </div>

                  {/* Project Edit / Create Modal in Dashboard */}
                  {editingProject && (
                    <form onSubmit={handleSaveProject} className="p-5 rounded-2xl bg-slate-950 border border-blue-500/50 space-y-3 text-xs">
                      <h4 className="font-bold text-white text-sm">
                        {editingProject.id ? 'Edit Project' : 'Create New Project'}
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-slate-300 mb-1">Project Title</label>
                          <input
                            type="text"
                            required
                            value={editingProject.title || ''}
                            onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-300 mb-1">Status</label>
                          <select
                            value={editingProject.status || 'Completed'}
                            onChange={(e) => setEditingProject({ ...editingProject, status: e.target.value as any })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                          >
                            <option value="Ongoing">Ongoing</option>
                            <option value="Completed">Completed</option>
                            <option value="On Hold">On Hold</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-300 mb-1">Commencement Date</label>
                          <input
                            type="date"
                            required
                            value={editingProject.commencement_date || ''}
                            onChange={(e) => setEditingProject({ ...editingProject, commencement_date: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-300 mb-1">Completion Date (optional)</label>
                          <input
                            type="date"
                            value={editingProject.completion_date || ''}
                            onChange={(e) => setEditingProject({ ...editingProject, completion_date: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">Technologies (comma separated)</label>
                        <input
                          type="text"
                          required
                          value={editingProject.technologies || ''}
                          onChange={(e) => setEditingProject({ ...editingProject, technologies: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-slate-300 mb-1">GitHub URL</label>
                          <input
                            type="url"
                            value={editingProject.github_url || ''}
                            onChange={(e) => setEditingProject({ ...editingProject, github_url: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-300 mb-1">Live URL</label>
                          <input
                            type="url"
                            value={editingProject.live_url || ''}
                            onChange={(e) => setEditingProject({ ...editingProject, live_url: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">Description</label>
                        <textarea
                          rows={2}
                          required
                          value={editingProject.description || ''}
                          onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">Key Features &amp; Architecture</label>
                        <textarea
                          rows={2}
                          required
                          value={editingProject.key_features || ''}
                          onChange={(e) => setEditingProject({ ...editingProject, key_features: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        />
                      </div>

                      {/* Case Study Details (Section 17) */}
                      <div className="pt-3 border-t border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-blue-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                            <i className="bi bi-journal-richtext"></i>
                            17-Point Detailed Case Study Fields
                          </h4>
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                            <input
                              type="checkbox"
                              checked={Boolean(editingProject.is_draft)}
                              onChange={(e) => setEditingProject({ ...editingProject, is_draft: e.target.checked ? 1 : 0 })}
                              className="rounded bg-slate-900 text-amber-500 focus:ring-amber-400"
                            />
                            Save as Draft (Hide from public portfolio)
                          </label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 mb-1">2. Problem Statement</label>
                            <textarea
                              rows={2}
                              value={editingProject.problem_statement || ''}
                              onChange={(e) => setEditingProject({ ...editingProject, problem_statement: e.target.value })}
                              placeholder="Problem and business context..."
                              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-white text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 mb-1">3. Project Objectives</label>
                            <textarea
                              rows={2}
                              value={editingProject.project_objectives || ''}
                              onChange={(e) => setEditingProject({ ...editingProject, project_objectives: e.target.value })}
                              placeholder="Key engineering targets..."
                              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-white text-xs"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 mb-1">4. Proposed Solution</label>
                            <textarea
                              rows={2}
                              value={editingProject.proposed_solution || ''}
                              onChange={(e) => setEditingProject({ ...editingProject, proposed_solution: e.target.value })}
                              placeholder="Architectural solution rationale..."
                              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-white text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 mb-1">5 &amp; 7. System Architecture</label>
                            <textarea
                              rows={2}
                              value={editingProject.system_architecture || ''}
                              onChange={(e) => setEditingProject({ ...editingProject, system_architecture: e.target.value })}
                              placeholder="MVT pattern, caching, services..."
                              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-white text-xs"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 mb-1">9. Database Design Strategy</label>
                            <textarea
                              rows={2}
                              value={editingProject.database_design || ''}
                              onChange={(e) => setEditingProject({ ...editingProject, database_design: e.target.value })}
                              placeholder="Entity relations, indexing, transactions..."
                              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-white text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 mb-1">14. Outcomes &amp; Achievements</label>
                            <textarea
                              rows={2}
                              value={editingProject.project_outcomes || ''}
                              onChange={(e) => setEditingProject({ ...editingProject, project_outcomes: e.target.value })}
                              placeholder="Quantifiable speed, reliability, user impact..."
                              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-white text-xs"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 mb-1">12 &amp; 13. Challenges &amp; Solutions</label>
                            <textarea
                              rows={2}
                              value={editingProject.challenges_encountered || ''}
                              onChange={(e) => setEditingProject({ ...editingProject, challenges_encountered: e.target.value })}
                              placeholder="Technical obstacles faced..."
                              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-white text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 mb-1">15. Future Enhancements</label>
                            <textarea
                              rows={2}
                              value={editingProject.future_improvements || ''}
                              onChange={(e) => setEditingProject({ ...editingProject, future_improvements: e.target.value })}
                              placeholder="Planned roadmap..."
                              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-white text-xs"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingProject(null)}
                          className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-blue-600 text-white font-bold rounded-lg"
                        >
                          Save Project
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Projects List */}
                  <div className="grid grid-cols-1 gap-3">
                    {portfolioData.projects?.map((proj) => (
                      <div
                        key={proj.id}
                        className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={proj.thumbnail_url}
                            alt=""
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-white text-sm">{proj.title}</h4>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  proj.status === 'Completed'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-amber-500/20 text-amber-400'
                                }`}
                              >
                                {proj.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 font-mono mt-0.5">{proj.technologies}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingProject(proj)}
                            className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                            title="Edit project"
                          >
                            <i className="bi bi-pencil-square"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteProject(proj.id)}
                            className="p-2 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                            title="Delete project"
                          >
                            <i className="bi bi-trash-fill"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: TECHNICAL SKILLS MANAGEMENT */}
              {activeTab === 'skills' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div>
                      <h3 className="font-bold text-white text-base flex items-center gap-2">
                        <i className="bi bi-stack text-blue-400"></i>
                        Technical Skills &amp; Competencies Management
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Add, update, or remove technical skills across programming languages, backend frameworks, databases, and DevOps tools.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setIsAddingSkillCategory(!isAddingSkillCategory)}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <i className="bi bi-folder-plus"></i> New Category
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setEditingSkill({
                            category_id: (portfolioData.skillCategories?.[0]?.id || 1),
                            name: '',
                            proficiency_percent: 85,
                            icon_class: 'bi bi-check-circle',
                            badge_color: '#3b82f6',
                            order_index: (portfolioData.allSkills?.length || 0) + 1,
                          })
                        }
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all cursor-pointer"
                      >
                        <i className="bi bi-plus-lg"></i> Add New Skill
                      </button>
                    </div>
                  </div>

                  {/* Add New Skill Category Form */}
                  {isAddingSkillCategory && (
                    <form
                      onSubmit={handleCreateSkillCategory}
                      className="p-4 rounded-xl bg-slate-950 border border-blue-500/40 flex flex-col sm:flex-row items-center gap-3 text-xs animate-in fade-in"
                    >
                      <div className="flex-1 w-full">
                        <label className="block text-slate-400 font-semibold mb-1">New Category Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Cloud &amp; Microservices, Testing &amp; QA"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        />
                      </div>
                      <div className="flex items-center gap-2 self-end pt-2 sm:pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingSkillCategory(false);
                            setNewCategoryName('');
                          }}
                          className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold"
                        >
                          Create Category
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Add / Edit Skill Modal Form */}
                  {editingSkill && (
                    <form
                      onSubmit={handleSaveSkill}
                      className="p-5 rounded-2xl bg-slate-950 border border-blue-500/50 shadow-xl space-y-4 text-xs animate-in fade-in duration-200"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <h4 className="font-bold text-white text-sm flex items-center gap-2">
                          <i className="bi bi-pencil-square text-blue-400"></i>
                          {editingSkill.id ? `Edit Skill: ${editingSkill.name}` : 'Add New Technical Skill'}
                        </h4>
                        <button
                          type="button"
                          onClick={() => setEditingSkill(null)}
                          className="text-slate-400 hover:text-white"
                        >
                          <i className="bi bi-x-lg"></i>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block font-semibold text-slate-300 mb-1">
                            Skill Category <span className="text-rose-400">*</span>
                          </label>
                          <select
                            value={editingSkill.category_id || 1}
                            onChange={(e) =>
                              setEditingSkill({
                                ...editingSkill,
                                category_id: parseInt(e.target.value, 10),
                              })
                            }
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                          >
                            {portfolioData.skillCategories?.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-300 mb-1">
                            Skill Name <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Python, Django, PostgreSQL, Docker"
                            value={editingSkill.name || ''}
                            onChange={(e) => setEditingSkill({ ...editingSkill, name: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="font-semibold text-slate-300">
                              Proficiency Level (%):
                            </label>
                            <span className="font-mono font-bold text-blue-400">
                              {editingSkill.proficiency_percent || 85}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="100"
                            step="1"
                            value={editingSkill.proficiency_percent || 85}
                            onChange={(e) =>
                              setEditingSkill({
                                ...editingSkill,
                                proficiency_percent: parseInt(e.target.value, 10),
                              })
                            }
                            className="w-full accent-blue-600 bg-slate-900 rounded-lg h-2 cursor-pointer"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-300 mb-1">
                            Bootstrap Icon Class
                          </label>
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-blue-400 text-lg shrink-0">
                              <i className={editingSkill.icon_class || 'bi bi-check-circle'}></i>
                            </div>
                            <input
                              type="text"
                              placeholder="bi bi-cpu"
                              value={editingSkill.icon_class || 'bi bi-check-circle'}
                              onChange={(e) =>
                                setEditingSkill({ ...editingSkill, icon_class: e.target.value })
                              }
                              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-300 mb-1">
                            Badge Accent Color
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={editingSkill.badge_color || '#3b82f6'}
                              onChange={(e) =>
                                setEditingSkill({ ...editingSkill, badge_color: e.target.value })
                              }
                              className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-700 cursor-pointer p-0.5 shrink-0"
                            />
                            <input
                              type="text"
                              value={editingSkill.badge_color || '#3b82f6'}
                              onChange={(e) =>
                                setEditingSkill({ ...editingSkill, badge_color: e.target.value })
                              }
                              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => setEditingSkill(null)}
                          className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-md"
                        >
                          {editingSkill.id ? 'Save Updates' : 'Add Skill'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Category Filter Tabs */}
                  <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
                    <button
                      type="button"
                      onClick={() => setAdminSkillCategoryFilter('all')}
                      className={`px-3 py-1 rounded-lg font-medium transition-all ${
                        adminSkillCategoryFilter === 'all'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      All Skills ({portfolioData.allSkills?.length || 0})
                    </button>
                    {portfolioData.skillCategories?.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setAdminSkillCategoryFilter(cat.id)}
                        className={`px-3 py-1 rounded-lg font-medium transition-all ${
                          adminSkillCategoryFilter === cat.id
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white hover:bg-slate-900'
                        }`}
                      >
                        {cat.name} ({cat.skills?.length || 0})
                      </button>
                    ))}
                  </div>

                  {/* Skills Table */}
                  <div className="overflow-x-auto bg-slate-950/80 rounded-2xl border border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="p-3.5">Skill &amp; Icon</th>
                          <th className="p-3.5">Category</th>
                          <th className="p-3.5">Proficiency Meter</th>
                          <th className="p-3.5">Order</th>
                          <th className="p-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {(portfolioData.allSkills || [])
                          .filter((s) =>
                            adminSkillCategoryFilter === 'all'
                              ? true
                              : s.category_id === adminSkillCategoryFilter
                          )
                          .map((skill) => {
                            const cat = portfolioData.skillCategories?.find((c) => c.id === skill.category_id);
                            return (
                              <tr key={skill.id} className="text-slate-300 hover:bg-slate-900/40 transition-colors">
                                <td className="p-3.5">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shadow-sm"
                                      style={{
                                        backgroundColor: `${skill.badge_color || '#3b82f6'}20`,
                                        color: skill.badge_color || '#60a5fa',
                                      }}
                                    >
                                      <i className={skill.icon_class || 'bi bi-check-circle'}></i>
                                    </div>
                                    <span className="font-bold text-white text-sm">{skill.name}</span>
                                  </div>
                                </td>

                                <td className="p-3.5">
                                  <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-[11px] font-medium">
                                    {cat?.name || 'General'}
                                  </span>
                                </td>

                                <td className="p-3.5 min-w-[140px]">
                                  <div className="flex items-center gap-2.5">
                                    <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                                      <div
                                        className="h-full rounded-full"
                                        style={{
                                          width: `${skill.proficiency_percent}%`,
                                          backgroundColor: skill.badge_color || '#3b82f6',
                                        }}
                                      />
                                    </div>
                                    <span className="font-mono font-bold text-xs text-white">
                                      {skill.proficiency_percent}%
                                    </span>
                                  </div>
                                </td>

                                <td className="p-3.5 text-slate-400 font-mono text-xs">
                                  #{skill.order_index}
                                </td>

                                <td className="p-3.5 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setEditingSkill(skill)}
                                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-blue-600 hover:text-white text-slate-300 border border-slate-800 transition-colors cursor-pointer"
                                      title="Edit skill"
                                    >
                                      <i className="bi bi-pencil-square"></i>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSkill(skill.id)}
                                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-600 hover:text-white text-rose-400 border border-slate-800 transition-colors cursor-pointer"
                                      title="Delete skill"
                                    >
                                      <i className="bi bi-trash-fill"></i>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB: SERVICES MANAGEMENT */}
              {activeTab === 'services' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div>
                      <h3 className="font-bold text-white text-base flex items-center gap-2">
                        <i className="bi bi-briefcase-fill text-blue-400"></i>
                        Software Development Services Management
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Define and manage client offerings, scopes of work, and key deliverables displayed in the Services section.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setEditingService({
                          title: '',
                          icon_class: 'bi bi-laptop',
                          short_description: '',
                          full_description: '',
                          key_deliverables: 'Architecture blueprint, Clean code repository, Deployment automation',
                          order_index: (portfolioData.services?.length || 0) + 1,
                        })
                      }
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all cursor-pointer self-start sm:self-auto"
                    >
                      <i className="bi bi-plus-lg"></i> Add New Service
                    </button>
                  </div>

                  {/* Add / Edit Service Form */}
                  {editingService && (
                    <form
                      onSubmit={handleSaveService}
                      className="p-5 rounded-2xl bg-slate-950 border border-blue-500/50 shadow-xl space-y-4 text-xs animate-in fade-in duration-200"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <h4 className="font-bold text-white text-sm flex items-center gap-2">
                          <i className="bi bi-pencil-square text-blue-400"></i>
                          {editingService.id ? `Edit Service: ${editingService.title}` : 'Add New Service Offering'}
                        </h4>
                        <button
                          type="button"
                          onClick={() => setEditingService(null)}
                          className="text-slate-400 hover:text-white"
                        >
                          <i className="bi bi-x-lg"></i>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block font-semibold text-slate-300 mb-1">
                            Service Title <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Django Application Development, Cloud &amp; Microservices"
                            value={editingService.title || ''}
                            onChange={(e) => setEditingService({ ...editingService, title: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-300 mb-1">
                            Bootstrap Icon Class
                          </label>
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-blue-400 text-lg shrink-0">
                              <i className={editingService.icon_class || 'bi bi-laptop'}></i>
                            </div>
                            <input
                              type="text"
                              placeholder="bi bi-laptop or bi bi-server"
                              value={editingService.icon_class || 'bi bi-laptop'}
                              onChange={(e) =>
                                setEditingService({ ...editingService, icon_class: e.target.value })
                              }
                              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">
                          Short Description (Displayed on card front) <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Building responsive, scalable, and cross-browser compliant applications."
                          value={editingService.short_description || ''}
                          onChange={(e) =>
                            setEditingService({ ...editingService, short_description: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">
                          Full Scope Description (Displayed when user expands service) <span className="text-rose-400">*</span>
                        </label>
                        <textarea
                          rows={3}
                          required
                          placeholder="Detailed engineering scope, methodologies, frameworks, and architecture standards..."
                          value={editingService.full_description || ''}
                          onChange={(e) =>
                            setEditingService({ ...editingService, full_description: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <label className="block font-semibold text-slate-300 mb-1">
                            Key Deliverables (Comma-separated)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Architecture blueprint, Production deployment, Automated CI/CD, Documentation"
                            value={editingService.key_deliverables || ''}
                            onChange={(e) =>
                              setEditingService({ ...editingService, key_deliverables: e.target.value })
                            }
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-300 mb-1">
                            Display Order Index
                          </label>
                          <input
                            type="number"
                            value={editingService.order_index ?? 0}
                            onChange={(e) =>
                              setEditingService({
                                ...editingService,
                                order_index: parseInt(e.target.value, 10) || 0,
                              })
                            }
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => setEditingService(null)}
                          className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-md"
                        >
                          {editingService.id ? 'Save Updates' : 'Add Service'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Services Grid in Admin */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {portfolioData.services?.map((service) => (
                      <div
                        key={service.id}
                        className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between gap-3 hover:border-slate-700 transition-all"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-lg">
                                <i className={service.icon_class || 'bi bi-laptop'}></i>
                              </div>
                              <h4 className="font-bold text-white text-sm">{service.title}</h4>
                            </div>
                            <span className="text-[11px] font-mono text-slate-500">#{service.order_index}</span>
                          </div>

                          <p className="text-xs text-slate-400 leading-relaxed mb-3">
                            {service.short_description}
                          </p>

                          {service.key_deliverables && (
                            <div className="flex flex-wrap gap-1.5">
                              {service.key_deliverables.split(',').map((deliv, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-medium"
                                >
                                  {deliv.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800/80">
                          <button
                            type="button"
                            onClick={() => setEditingService(service)}
                            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-blue-600 hover:text-white text-slate-300 border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <i className="bi bi-pencil-square"></i> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteService(service.id)}
                            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-rose-600 hover:text-white text-rose-400 border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <i className="bi bi-trash-fill"></i> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: WORK EXPERIENCE MANAGEMENT */}
              {activeTab === 'experience' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div>
                      <h3 className="font-bold text-white text-base flex items-center gap-2">
                        <i className="bi bi-clock-history text-blue-400"></i>
                        Work Experience &amp; Career Milestones Management
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Manage professional positions, companies, tenures, job responsibilities, and achievements.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setEditingExp({
                          job_title: '',
                          company: '',
                          location: 'Accra, Ghana (or Remote)',
                          start_date: 'Jan 2024',
                          end_date: 'Present',
                          is_current: 1,
                          description: '',
                          accomplishments: '',
                          order_index: (portfolioData.experience?.length || 0) + 1,
                        })
                      }
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all cursor-pointer self-start sm:self-auto"
                    >
                      <i className="bi bi-plus-lg"></i> Add Work Experience
                    </button>
                  </div>

                  {/* Add / Edit Experience Form */}
                  {editingExp && (
                    <form
                      onSubmit={handleSaveExperience}
                      className="p-5 rounded-2xl bg-slate-950 border border-blue-500/50 shadow-xl space-y-4 text-xs animate-in fade-in duration-200"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <h4 className="font-bold text-white text-sm flex items-center gap-2">
                          <i className="bi bi-pencil-square text-blue-400"></i>
                          {editingExp.id ? `Edit Role: ${editingExp.job_title}` : 'Add Work Experience Entry'}
                        </h4>
                        <button
                          type="button"
                          onClick={() => setEditingExp(null)}
                          className="text-slate-400 hover:text-white"
                        >
                          <i className="bi bi-x-lg"></i>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block font-semibold text-slate-300 mb-1">
                            Job Title <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Lead Backend Software Engineer"
                            value={editingExp.job_title || ''}
                            onChange={(e) => setEditingExp({ ...editingExp, job_title: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-300 mb-1">
                            Company / Organization <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. FinEdge Technologies"
                            value={editingExp.company || ''}
                            onChange={(e) => setEditingExp({ ...editingExp, company: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-300 mb-1">
                            Location
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Accra, Ghana &bull; Remote"
                            value={editingExp.location || ''}
                            onChange={(e) => setEditingExp({ ...editingExp, location: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                        <div>
                          <label className="block font-semibold text-slate-300 mb-1">
                            Start Date <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Jan 2023 or 2022"
                            value={editingExp.start_date || ''}
                            onChange={(e) => setEditingExp({ ...editingExp, start_date: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-300 mb-1">
                            End Date
                          </label>
                          <input
                            type="text"
                            disabled={Boolean(editingExp.is_current)}
                            placeholder="e.g. Dec 2024 or Present"
                            value={editingExp.is_current ? 'Present' : (editingExp.end_date || '')}
                            onChange={(e) => setEditingExp({ ...editingExp, end_date: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white disabled:opacity-50 focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div className="pt-4">
                          <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-semibold">
                            <input
                              type="checkbox"
                              checked={Boolean(editingExp.is_current)}
                              onChange={(e) =>
                                setEditingExp({
                                  ...editingExp,
                                  is_current: e.target.checked ? 1 : 0,
                                  end_date: e.target.checked ? 'Present' : '',
                                })
                              }
                              className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 focus:ring-blue-500"
                            />
                            <span>Current Ongoing Employment</span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">
                          Role Overview &amp; Engineering Responsibilities <span className="text-rose-400">*</span>
                        </label>
                        <textarea
                          rows={3}
                          required
                          placeholder="Summarize daily responsibilities, architecture design, team mentoring..."
                          value={editingExp.description || ''}
                          onChange={(e) => setEditingExp({ ...editingExp, description: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">
                          Key Achievements &amp; Measurable Impacts
                        </label>
                        <textarea
                          rows={2}
                          placeholder="e.g. Reduced API latency by 45%, migrated 100K+ users to PostgreSQL with zero downtime..."
                          value={editingExp.accomplishments || ''}
                          onChange={(e) => setEditingExp({ ...editingExp, accomplishments: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => setEditingExp(null)}
                          className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-md"
                        >
                          {editingExp.id ? 'Save Updates' : 'Add Experience'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Experience List in Admin */}
                  <div className="space-y-3">
                    {portfolioData.experience?.map((exp) => (
                      <div
                        key={exp.id}
                        className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row md:items-start justify-between gap-4 hover:border-slate-700 transition-all"
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-white text-base">{exp.job_title}</h4>
                            {Boolean(exp.is_current) && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold">
                                Current Role
                              </span>
                            )}
                          </div>

                          <p className="text-xs font-semibold text-blue-400 flex items-center gap-2">
                            <span>{exp.company}</span>
                            <span className="text-slate-600">&bull;</span>
                            <span className="text-slate-400">{exp.location}</span>
                            <span className="text-slate-600">&bull;</span>
                            <span className="text-slate-400 font-mono">
                              {exp.start_date} &mdash; {exp.is_current ? 'Present' : exp.end_date}
                            </span>
                          </p>

                          <p className="text-xs text-slate-300 leading-relaxed pt-1">
                            {exp.description}
                          </p>

                          {exp.accomplishments && (
                            <p className="text-[11px] text-slate-400 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                              <strong className="text-amber-400 font-semibold">Impact:</strong> {exp.accomplishments}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end md:self-start">
                          <button
                            type="button"
                            onClick={() => setEditingExp(exp)}
                            className="p-2 rounded-lg bg-slate-900 hover:bg-blue-600 hover:text-white text-slate-300 border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Edit experience"
                          >
                            <i className="bi bi-pencil-square"></i> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteExperience(exp.id)}
                            className="p-2 rounded-lg bg-slate-900 hover:bg-rose-600 hover:text-white text-rose-400 border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Delete experience"
                          >
                            <i className="bi bi-trash-fill"></i> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: EDUCATION MANAGEMENT */}
              {activeTab === 'education' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div>
                      <h3 className="font-bold text-white text-base flex items-center gap-2">
                        <i className="bi bi-mortarboard-fill text-blue-400"></i>
                        Education &amp; Qualifications Management
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Manage university degrees, accredited institutions, academic honors, and coursework records.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setEditingEdu({
                          degree: 'Master of Science (MSc)',
                          institution: '',
                          field_of_study: 'Advanced Computer Science',
                          start_year: '2022',
                          end_year: '2024',
                          grade_or_honors: 'Distinction',
                          description: 'Focus on distributed algorithms, compiler optimization, and high-performance computing.',
                          order_index: (portfolioData.education?.length || 0) + 1,
                        })
                      }
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all cursor-pointer self-start sm:self-auto"
                    >
                      <i className="bi bi-plus-lg"></i> Add Education Record
                    </button>
                  </div>

                  {/* Add / Edit Education Form */}
                  {editingEdu && (
                    <form
                      onSubmit={handleSaveEducation}
                      className="p-5 rounded-2xl bg-slate-950 border border-blue-500/50 shadow-xl space-y-4 text-xs animate-in fade-in duration-200"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <h4 className="font-bold text-white text-sm flex items-center gap-2">
                          <i className="bi bi-pencil-square text-blue-400"></i>
                          {editingEdu.id ? `Edit Degree: ${editingEdu.degree}` : 'Add Academic Qualification'}
                        </h4>
                        <button
                          type="button"
                          onClick={() => setEditingEdu(null)}
                          className="text-slate-400 hover:text-white"
                        >
                          <i className="bi bi-x-lg"></i>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block font-semibold text-slate-300 mb-1">
                            Degree Title <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Master of Science (MSc) in Software Engineering"
                            value={editingEdu.degree || ''}
                            onChange={(e) => setEditingEdu({ ...editingEdu, degree: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-300 mb-1">
                            Institution / University <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. University of Oxford"
                            value={editingEdu.institution || ''}
                            onChange={(e) => setEditingEdu({ ...editingEdu, institution: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block font-semibold text-slate-300 mb-1">
                            Field of Study <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Computer Science"
                            value={editingEdu.field_of_study || ''}
                            onChange={(e) => setEditingEdu({ ...editingEdu, field_of_study: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-300 mb-1">
                            Start Year &mdash; End Year <span className="text-rose-400">*</span>
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              required
                              placeholder="2020"
                              value={editingEdu.start_year || ''}
                              onChange={(e) => setEditingEdu({ ...editingEdu, start_year: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                            />
                            <span className="text-slate-500">&mdash;</span>
                            <input
                              type="text"
                              required
                              placeholder="2024"
                              value={editingEdu.end_year || ''}
                              onChange={(e) => setEditingEdu({ ...editingEdu, end_year: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-300 mb-1">
                            Grade / Academic Honors
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. First Class Honours, Distinction"
                            value={editingEdu.grade_or_honors || ''}
                            onChange={(e) => setEditingEdu({ ...editingEdu, grade_or_honors: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">
                          Academic Description (Thesis, Research &amp; Core Coursework)
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Specialized coursework, thesis title, published research, academic projects..."
                          value={editingEdu.description || ''}
                          onChange={(e) => setEditingEdu({ ...editingEdu, description: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => setEditingEdu(null)}
                          className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-md"
                        >
                          {editingEdu.id ? 'Save Updates' : 'Add Education Record'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Education Records in Admin */}
                  <div className="space-y-3">
                    {portfolioData.education?.map((edu) => (
                      <div
                        key={edu.id}
                        className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row md:items-start justify-between gap-4 hover:border-slate-700 transition-all"
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-white text-base">{edu.degree}</h4>
                            {edu.grade_or_honors && (
                              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-[10px] font-semibold">
                                {edu.grade_or_honors}
                              </span>
                            )}
                          </div>

                          <p className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                            <span className="text-white font-bold">{edu.institution}</span>
                            <span className="text-slate-600">&bull;</span>
                            <span className="text-blue-400">{edu.field_of_study}</span>
                            <span className="text-slate-600">&bull;</span>
                            <span className="text-slate-400 font-mono">
                              {edu.start_year} &mdash; {edu.end_year}
                            </span>
                          </p>

                          {edu.description && (
                            <p className="text-xs text-slate-300 leading-relaxed pt-1">
                              {edu.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end md:self-start">
                          <button
                            type="button"
                            onClick={() => setEditingEdu(edu)}
                            className="p-2 rounded-lg bg-slate-900 hover:bg-blue-600 hover:text-white text-slate-300 border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Edit education"
                          >
                            <i className="bi bi-pencil-square"></i> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEducation(edu.id)}
                            className="p-2 rounded-lg bg-slate-900 hover:bg-rose-600 hover:text-white text-rose-400 border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Delete education"
                          >
                            <i className="bi bi-trash-fill"></i> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: EMPLOYER REQUESTS (Verification tracking & Review Workflow) */}
              {activeTab === 'employers' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
                    <div>
                      <h3 className="font-bold text-white text-base flex items-center gap-2">
                        <i className="bi bi-building-check text-blue-400"></i>
                        Employer Verification Requests &amp; Review Workflow
                      </h3>
                      <p className="text-xs text-slate-400">
                        Manage prospective employers, track CV access, and update candidate engagement status.
                      </p>
                    </div>

                    <button
                      onClick={handleExportAnalyticsCSV}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition-all self-start sm:self-auto"
                    >
                      <i className="bi bi-download"></i> Export Inquiries CSV
                    </button>
                  </div>

                  <div className="overflow-x-auto bg-slate-950/80 rounded-xl border border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="p-3">Employer / Company</th>
                          <th className="p-3">Official Email &amp; Phone</th>
                          <th className="p-3">Role / Purpose</th>
                          <th className="p-3">CV Status</th>
                          <th className="p-3">Review Pipeline</th>
                          <th className="p-3">Requested Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {employerRequests.map((req) => (
                          <tr key={req.id} className="text-slate-300">
                            <td className="p-3">
                              <span className="font-bold text-white block">{req.full_name}</span>
                              <span className="text-blue-400 text-[11px]">{req.company_name}</span>
                            </td>
                            <td className="p-3">
                              <a href={`mailto:${req.email}`} className="text-blue-400 hover:underline block">
                                {req.email}
                              </a>
                              <span className="text-slate-500">{req.phone}</span>
                            </td>
                            <td className="p-3">
                              <span className="font-medium text-slate-200 block">{req.position}</span>
                              <span className="text-slate-400 text-[11px]">{req.purpose}</span>
                            </td>
                            <td className="p-3">
                              {req.is_downloaded ? (
                                <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                                  <i className="bi bi-check-circle-fill"></i> Downloaded
                                </span>
                              ) : (
                                <span className="text-amber-400 font-medium">Authorized (Pending)</span>
                              )}
                            </td>
                            <td className="p-3">
                              <select
                                value={req.review_status || 'Pending'}
                                onChange={(e) => handleUpdateEmployerReviewStatus(req.id, e.target.value)}
                                className={`px-2 py-1 rounded text-[11px] font-bold border focus:outline-none cursor-pointer ${
                                  (req.review_status || 'Pending') === 'Pending'
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                    : (req.review_status || 'Pending') === 'Reviewed'
                                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                                    : (req.review_status || 'Pending') === 'Contacted'
                                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                }`}
                              >
                                <option value="Pending" className="bg-slate-900 text-amber-300">Pending</option>
                                <option value="Reviewed" className="bg-slate-900 text-blue-300">Reviewed</option>
                                <option value="Contacted" className="bg-slate-900 text-indigo-300">Contacted</option>
                                <option value="Resolved" className="bg-slate-900 text-emerald-300">Resolved</option>
                              </select>
                            </td>
                            <td className="p-3 text-slate-500 font-mono text-[11px]">{req.created_at}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 5: CONTACT MESSAGES */}
              {activeTab === 'messages' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-white text-base">Contact Enquiries Inbox</h3>
                    <p className="text-xs text-slate-400">Incoming visitor and client messages</p>
                  </div>

                  <div className="space-y-3">
                    {contactMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-4 rounded-xl border transition-all ${
                          msg.is_read
                            ? 'bg-slate-950/60 border-slate-800 text-slate-300'
                            : 'bg-slate-950 border-blue-500/40 shadow-md text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{msg.name}</span>
                            <span className="text-slate-400">({msg.email})</span>
                          </div>
                          <span className="text-slate-500 font-mono text-[11px]">{msg.created_at}</span>
                        </div>

                        <h4 className="font-semibold text-blue-300 text-sm mb-1">{msg.subject}</h4>
                        <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-850">
                          {msg.message}
                        </p>

                        <div className="flex items-center justify-end gap-3 pt-3">
                          <button
                            onClick={() => handleToggleMessageRead(msg.id, msg.is_read)}
                            className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                          >
                            <i className={`bi ${msg.is_read ? 'bi-envelope' : 'bi-envelope-open'}`}></i>
                            {msg.is_read ? 'Mark as Unread' : 'Mark as Read'}
                          </button>
                          <a
                            href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold flex items-center gap-1"
                          >
                            <i className="bi bi-reply-fill"></i> Reply
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 6: CV DOCUMENTS (Multiple Specialized Tracks) */}
              {activeTab === 'cv' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <h3 className="font-bold text-white text-base flex items-center gap-2">
                        <i className="bi bi-file-earmark-pdf-fill text-blue-400"></i>
                        Curriculum Vitae Specialized Tracks &amp; Documents
                      </h3>
                      <p className="text-xs text-slate-400">
                        Manage dynamic CV tracks (Software Engineer, Django Backend, Data Science, AI/ML) and download logs.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {cvDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                          doc.is_active ? 'bg-blue-950/25 border-blue-500/60 shadow-lg' : 'bg-slate-950 border-slate-800'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-bold text-white text-sm">{doc.version_title}</h4>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-blue-400 border border-slate-700">
                              Track: {doc.cv_track || 'software_engineer'}
                            </span>
                            {Boolean(doc.is_active) && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                                <i className="bi bi-check-circle-fill"></i> Active Default Track
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 font-mono">
                            {doc.file_name} &bull; {doc.file_size} &bull; {doc.download_count || 0} Downloads Logged
                          </p>
                          {doc.custom_highlights && (
                            <p className="text-[11px] text-slate-400 bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-850 mt-1 max-w-xl italic">
                              Focus: {doc.custom_highlights}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {!doc.is_active && (
                            <button
                              onClick={() => handleActivateCV(doc.id)}
                              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors"
                            >
                              Set As Active Default
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: SOCIAL MEDIA LINKS MANAGEMENT & UPDATE */}
              {activeTab === 'socials' && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div>
                      <h3 className="font-bold text-white text-base flex items-center gap-2">
                        <i className="bi bi-share-fill text-blue-400"></i>
                        Social Media &amp; Professional Links Management
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Manage professional profiles, GitHub repositories, and direct chat links displayed in the website header and footer.
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        setEditingSocial({
                          platform_name: '',
                          profile_url: '',
                          icon_class: 'bi bi-github',
                          is_active: 1,
                          order_index: (socialsList?.length || 0) + 1,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all self-start sm:self-auto cursor-pointer"
                    >
                      <i className="bi bi-plus-lg"></i>
                      Add New Social Link
                    </button>
                  </div>

                  {/* Form to Add or Edit Social Profile */}
                  {editingSocial && (
                    <form
                      onSubmit={handleSaveSocial}
                      className="p-5 rounded-2xl bg-slate-950 border border-blue-500/50 shadow-xl space-y-4 text-xs animate-in fade-in duration-200"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <h4 className="font-bold text-white text-sm flex items-center gap-2">
                          <i className="bi bi-pencil-square text-blue-400"></i>
                          {editingSocial.id ? `Edit ${editingSocial.platform_name || 'Social Link'}` : 'Add New Social Profile'}
                        </h4>
                        <button
                          type="button"
                          onClick={() => setEditingSocial(null)}
                          className="text-slate-400 hover:text-white"
                        >
                          <i className="bi bi-x-lg"></i>
                        </button>
                      </div>

                      {/* Quick Preset Chips */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                          Quick Platform Presets (Click to autofill platform and icon):
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { name: 'GitHub', icon: 'bi bi-github', defaultUrl: 'https://github.com/' },
                            { name: 'LinkedIn', icon: 'bi bi-linkedin', defaultUrl: 'https://linkedin.com/in/' },
                            { name: 'WhatsApp', icon: 'bi bi-whatsapp', defaultUrl: 'https://wa.me/233244762558' },
                            { name: 'Twitter/X', icon: 'bi bi-twitter-x', defaultUrl: 'https://x.com/' },
                            { name: 'Email Direct', icon: 'bi bi-envelope-at-fill', defaultUrl: 'mailto:acquah.cisse1980@gmail.com' },
                            { name: 'YouTube', icon: 'bi bi-youtube', defaultUrl: 'https://youtube.com/@' },
                            { name: 'Stack Overflow', icon: 'bi bi-stack-overflow', defaultUrl: 'https://stackoverflow.com/users/' },
                            { name: 'Discord', icon: 'bi bi-discord', defaultUrl: 'https://discord.gg/' },
                            { name: 'Telegram', icon: 'bi bi-telegram', defaultUrl: 'https://t.me/' },
                            { name: 'Personal Website', icon: 'bi bi-globe', defaultUrl: 'https://' },
                          ].map((preset) => (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() => {
                                setEditingSocial((prev) => ({
                                  ...prev,
                                  platform_name: preset.name,
                                  icon_class: preset.icon,
                                  profile_url: prev?.profile_url || preset.defaultUrl,
                                }));
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-blue-600 hover:text-white border border-slate-800 text-slate-300 text-[11px] font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <i className={preset.icon}></i>
                              {preset.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-slate-300 mb-1">
                            Platform Name <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. GitHub, LinkedIn, WhatsApp"
                            value={editingSocial.platform_name || ''}
                            onChange={(e) =>
                              setEditingSocial({ ...editingSocial, platform_name: e.target.value })
                            }
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-300 mb-1">
                            Profile or Direct URL <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="https://... or mailto:..."
                            value={editingSocial.profile_url || ''}
                            onChange={(e) =>
                              setEditingSocial({ ...editingSocial, profile_url: e.target.value })
                            }
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-2">
                          <label className="block font-semibold text-slate-300 mb-1">
                            Bootstrap Icon Class
                          </label>
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-blue-400 text-base shrink-0">
                              <i className={editingSocial.icon_class || 'bi bi-link-45deg'}></i>
                            </div>
                            <input
                              type="text"
                              value={editingSocial.icon_class || 'bi bi-link-45deg'}
                              onChange={(e) =>
                                setEditingSocial({ ...editingSocial, icon_class: e.target.value })
                              }
                              placeholder="bi bi-github"
                              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-300 mb-1">
                            Display Order Index
                          </label>
                          <input
                            type="number"
                            value={editingSocial.order_index ?? 0}
                            onChange={(e) =>
                              setEditingSocial({
                                ...editingSocial,
                                order_index: parseInt(e.target.value, 10) || 0,
                              })
                            }
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="checkbox"
                          id="social_is_active"
                          checked={editingSocial.is_active !== undefined ? Boolean(editingSocial.is_active) : true}
                          onChange={(e) =>
                            setEditingSocial({ ...editingSocial, is_active: e.target.checked ? 1 : 0 })
                          }
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-700"
                        />
                        <label htmlFor="social_is_active" className="text-slate-300 cursor-pointer font-medium">
                          Active &amp; Visible publicly on website (Navbar &amp; Footer)
                        </label>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => setEditingSocial(null)}
                          className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-md"
                        >
                          {editingSocial.id ? 'Save Updates' : 'Add Social Link'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Social Media Links Table & Cards */}
                  <div className="overflow-x-auto bg-slate-950/80 rounded-2xl border border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="p-3.5">Platform &amp; Icon</th>
                          <th className="p-3.5">Target URL</th>
                          <th className="p-3.5">Order</th>
                          <th className="p-3.5">Status</th>
                          <th className="p-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {socialsList && socialsList.length > 0 ? (
                          socialsList.map((social) => (
                            <tr key={social.id} className="text-slate-300 hover:bg-slate-900/40 transition-colors">
                              <td className="p-3.5">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-400 text-lg shadow-sm">
                                    <i className={social.icon_class || 'bi bi-link-45deg'}></i>
                                  </div>
                                  <div>
                                    <span className="font-bold text-white text-sm block">
                                      {social.platform_name}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-mono">
                                      {social.icon_class}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              <td className="p-3.5 max-w-xs">
                                <div className="flex items-center gap-1.5">
                                  <span className="truncate text-slate-400 font-mono text-[11px]">
                                    {social.profile_url}
                                  </span>
                                  <a
                                    href={social.profile_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded"
                                    title="Test link in new tab"
                                  >
                                    <i className="bi bi-box-arrow-up-right text-xs"></i>
                                  </a>
                                </div>
                              </td>

                              <td className="p-3.5">
                                <span className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-400 font-mono text-[11px] border border-slate-800">
                                  #{social.order_index}
                                </span>
                              </td>

                              <td className="p-3.5">
                                <button
                                  type="button"
                                  onClick={() => handleToggleSocialActive(social)}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                                    social.is_active
                                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30'
                                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                                  }`}
                                  title="Click to toggle public visibility"
                                >
                                  <span
                                    className={`w-2 h-2 rounded-full ${
                                      social.is_active ? 'bg-emerald-400' : 'bg-slate-500'
                                    }`}
                                  />
                                  {social.is_active ? 'Active' : 'Hidden'}
                                </button>
                              </td>

                              <td className="p-3.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => setEditingSocial(social)}
                                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-blue-600 hover:text-white text-slate-300 border border-slate-800 transition-colors cursor-pointer"
                                    title="Edit social profile"
                                  >
                                    <i className="bi bi-pencil-square"></i>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSocial(social.id)}
                                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-600 hover:text-white text-rose-400 border border-slate-800 transition-colors cursor-pointer"
                                    title="Delete social profile"
                                  >
                                    <i className="bi bi-trash-fill"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-500">
                              <i className="bi bi-share text-3xl mb-2 block"></i>
                              No social media profiles added yet. Click &ldquo;Add New Social Link&rdquo; above.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Informational Guidance */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-3">
                    <i className="bi bi-info-circle-fill text-blue-400 text-base shrink-0 mt-0.5"></i>
                    <div>
                      <span className="font-bold text-white block mb-0.5">Public Display Synchronization</span>
                      Active links are automatically rendered on the top header navigation bar and the main website footer. Toggle the status button to temporarily hide any profile without deleting it.
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: SETTINGS */}
              {activeTab === 'settings' && (
                <form onSubmit={handleSaveSettings} className="space-y-4 bg-slate-950/70 p-6 rounded-2xl border border-slate-800 text-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <h3 className="font-bold text-white text-base">Website Settings &amp; Security</h3>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg"
                    >
                      Save Settings
                    </button>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Site Title</label>
                    <input
                      type="text"
                      value={settingsForm.site_title}
                      onChange={(e) => setSettingsForm({ ...settingsForm, site_title: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">WhatsApp Redirect Number</label>
                    <input
                      type="text"
                      value={settingsForm.whatsapp_number}
                      onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp_number: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Hero Main Headline</label>
                    <input
                      type="text"
                      value={settingsForm.hero_headline}
                      onChange={(e) => setSettingsForm({ ...settingsForm, hero_headline: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">SEO Meta Description</label>
                    <textarea
                      rows={2}
                      value={settingsForm.meta_description}
                      onChange={(e) => setSettingsForm({ ...settingsForm, meta_description: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>

                  {/* AI Assistant Settings (Section 16) */}
                  <div className="pt-3 border-t border-slate-800 space-y-3">
                    <h4 className="font-bold text-white text-xs flex items-center gap-2">
                      <i className="bi bi-robot text-blue-400"></i>
                      AI-Powered Portfolio Assistant (DevBot)
                    </h4>

                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <input
                        type="checkbox"
                        id="ai_assistant_toggle"
                        checked={settingsForm.ai_assistant_enabled}
                        onChange={(e) => setSettingsForm({ ...settingsForm, ai_assistant_enabled: e.target.checked })}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-950 border-slate-700"
                      />
                      <label htmlFor="ai_assistant_toggle" className="font-medium text-slate-200 cursor-pointer">
                        Enable Floating AI Assistant for Portfolio Visitors
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">Assistant Display Name</label>
                        <input
                          type="text"
                          value={settingsForm.ai_assistant_name}
                          onChange={(e) => setSettingsForm({ ...settingsForm, ai_assistant_name: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">AI Assistant Model</label>
                        <input
                          type="text"
                          disabled
                          value="Google Gemini Flash (DB Grounding Enabled)"
                          className="w-full px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-lg text-slate-400 font-mono text-[11px]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Welcome Salutation Message</label>
                      <textarea
                        rows={2}
                        value={settingsForm.ai_welcome_message}
                        onChange={(e) => setSettingsForm({ ...settingsForm, ai_welcome_message: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <label className="block font-semibold text-slate-300 mb-1">
                      Change Admin Password (leave blank to keep current)
                    </label>
                    <input
                      type="password"
                      placeholder="Enter new admin password..."
                      value={settingsForm.admin_password}
                      onChange={(e) => setSettingsForm({ ...settingsForm, admin_password: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                </form>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
