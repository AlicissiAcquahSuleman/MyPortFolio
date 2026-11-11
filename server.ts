import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { db, initDatabase } from './server/db.ts';
import { handleAssistantChat } from './server/aiAssistant.ts';

// Make sure DB is ready
initDatabase();

const app = express();

function getPort(): number {
  const pArg = process.argv.findIndex((arg) => arg === '--port' || arg === '-p');
  if (pArg !== -1 && process.argv[pArg + 1]) {
    const parsed = parseInt(process.argv[pArg + 1], 10);
    if (!isNaN(parsed)) return parsed;
  }
  if (process.env.PORT && process.env.PORT !== '8080') {
    const parsed = parseInt(process.env.PORT, 10);
    if (!isNaN(parsed)) return parsed;
  }
  return 3000;
}

function getHost(): string {
  const hArg = process.argv.findIndex((arg) => arg === '--host' || arg === '-h');
  if (hArg !== -1 && process.argv[hArg + 1]) {
    return process.argv[hArg + 1];
  }
  return '0.0.0.0';
}

const PORT = getPort();
const HOST = getHost();
const isProduction = process.env.NODE_ENV === 'production';

// Ensure uploads directory exists
const uploadsDir = path.resolve(process.cwd(), 'data/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded profile photos and assets statically
app.use('/uploads', express.static(uploadsDir));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// In-memory token cache for admin authentication (backed by SQLite admin_sessions)
const activeAdminTokens = new Set<string>();

// Middleware to verify admin authentication (checks memory cache and persistent SQLite sessions)
function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : (req.query.admin_token as string);

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication token missing.' });
  }

  if (activeAdminTokens.has(token)) {
    return next();
  }

  // Check persistent database session in SQLite
  try {
    const session = db.prepare("SELECT token FROM admin_sessions WHERE token = ? AND datetime(expires_at) > datetime('now')").get(token) as any;
    if (session) {
      activeAdminTokens.add(token);
      return next();
    }
  } catch (err) {
    console.error('Session check error:', err);
  }

  res.status(401).json({ error: 'Unauthorized: Admin session expired or invalid. Please sign in again.' });
}

// ----------------------------------------------------
// Public API Endpoints
// ----------------------------------------------------

// Get complete portfolio data
app.get('/api/portfolio', (_req: Request, res: Response) => {
  try {
    const profile = db.prepare('SELECT * FROM profile WHERE id = 1').get();
    const rawSettings = db.prepare('SELECT * FROM website_settings WHERE id = 1').get() as any;
    const settings = rawSettings ? {
      site_title: rawSettings.site_title,
      meta_description: rawSettings.meta_description,
      whatsapp_number: rawSettings.whatsapp_number,
      hero_headline: rawSettings.hero_headline,
      hero_subheadline: rawSettings.hero_subheadline,
      visitor_count: rawSettings.visitor_count,
      ai_assistant_enabled: rawSettings.ai_assistant_enabled !== undefined ? Number(rawSettings.ai_assistant_enabled) : 1,
      ai_assistant_name: rawSettings.ai_assistant_name || 'DevBot',
      ai_welcome_message: rawSettings.ai_welcome_message || "Hello! I am Cisse's AI Portfolio Assistant. How can I help you today?",
    } : null;
    const education = db.prepare('SELECT * FROM education ORDER BY order_index ASC, start_year DESC').all();
    const experience = db.prepare('SELECT * FROM work_experience ORDER BY order_index ASC, start_date DESC').all();
    
    const categories = db.prepare('SELECT * FROM skill_categories ORDER BY order_index ASC').all() as any[];
    const skills = db.prepare('SELECT * FROM skills ORDER BY order_index ASC, proficiency_percent DESC').all() as any[];
    
    // Nest skills into categories
    const categoriesWithSkills = categories.map((cat) => ({
      ...cat,
      skills: skills.filter((s) => s.category_id === cat.id),
    }));

    const services = db.prepare('SELECT * FROM services ORDER BY order_index ASC').all();
    const projectCategories = db.prepare('SELECT * FROM project_categories').all();
    const projects = db.prepare('SELECT * FROM projects WHERE is_draft = 0 ORDER BY order_index ASC, is_featured DESC').all();
    const activeCV = db.prepare('SELECT * FROM cv_documents WHERE is_active = 1 LIMIT 1').get();
    const cvVersions = db.prepare('SELECT * FROM cv_documents ORDER BY is_active DESC, id ASC').all();
    const socials = db.prepare('SELECT * FROM social_media WHERE is_active = 1 ORDER BY order_index ASC').all();

    res.json({
      profile,
      settings,
      education,
      experience,
      skillCategories: categoriesWithSkills,
      allSkills: skills,
      services,
      projectCategories,
      projects,
      activeCV,
      cvVersions,
      socials,
    });
  } catch (error: any) {
    console.error('Error fetching portfolio data:', error);
    res.status(500).json({ error: 'Failed to load portfolio data' });
  }
});

// Increment and record visitor
app.post('/api/visitor', (_req: Request, res: Response) => {
  try {
    db.prepare('UPDATE website_settings SET visitor_count = visitor_count + 1 WHERE id = 1').run();
    const settings = db.prepare('SELECT visitor_count FROM website_settings WHERE id = 1').get() as { visitor_count: number };
    res.json({ visitor_count: settings?.visitor_count || 0 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to increment visitor counter' });
  }
});

// AI-Powered Virtual Portfolio Assistant Chat Endpoint (Section 16)
app.post('/api/assistant/chat', async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message text is required.' });
    }

    const settings = db.prepare('SELECT * FROM website_settings WHERE id = 1').get() as any;
    if (settings && settings.ai_assistant_enabled !== undefined && Number(settings.ai_assistant_enabled) === 0) {
      return res.json({
        reply: "The AI Portfolio Assistant is currently paused by the administrator. Please connect with Cisse directly through the Contact Me form or WhatsApp.",
        actions: [
          { label: 'Contact Me Form', action: 'open_contact' },
          { label: 'Chat on WhatsApp', action: 'open_whatsapp' }
        ],
      });
    }

    const result = await handleAssistantChat(message.trim(), history || []);

    // Record interaction in analytics events
    try {
      db.prepare(`
        INSERT INTO analytics_events (event_type, target_name)
        VALUES ('chat_interaction', ?)
      `).run(message.slice(0, 80));
    } catch (e) {}

    res.json(result);
  } catch (error: any) {
    console.error('AI Assistant Error:', error);
    res.status(500).json({ error: 'Failed to process AI conversation.' });
  }
});

// Event Analytics Tracking Endpoint (Section 18)
app.post('/api/analytics/track', (req: Request, res: Response) => {
  try {
    const { eventType, targetId, targetName, path } = req.body;
    if (!eventType) return res.status(400).json({ error: 'eventType is required' });

    db.prepare(`
      INSERT INTO analytics_events (event_type, target_id, target_name, path)
      VALUES (?, ?, ?, ?)
    `).run(eventType, targetId || null, targetName || null, path || null);

    // Update target project view or click counts if applicable
    if (eventType === 'project_view' && targetId) {
      db.prepare('UPDATE projects SET view_count = view_count + 1 WHERE id = ?').run(targetId);
    } else if (eventType === 'github_click' && targetId) {
      db.prepare('UPDATE projects SET github_click_count = github_click_count + 1 WHERE id = ?').run(targetId);
    } else if (eventType === 'live_demo_click' && targetId) {
      db.prepare('UPDATE projects SET live_demo_click_count = live_demo_click_count + 1 WHERE id = ?').run(targetId);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to track event' });
  }
});

// Submit contact message
app.post('/api/contact', (req: Request, res: Response) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields (Name, Email, Subject, Message) are required.' });
    }

    // Simple email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    const stmt = db.prepare(`
      INSERT INTO contact_messages (name, email, subject, message)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(name.trim(), email.trim(), subject.trim(), message.trim());

    // Log activity
    db.prepare(`
      INSERT INTO activity_logs (action_type, description)
      VALUES (?, ?)
    `).run('Contact', `New message received from ${name.trim()} (${email.trim()}): "${subject.trim()}".`);

    res.json({
      success: true,
      message: 'Thank you for reaching out! Your message has been received, and I will get back to you shortly.',
      id: Number(result.lastInsertRowid),
    });
  } catch (error: any) {
    console.error('Contact submission error:', error);
    res.status(500).json({ error: 'Failed to send message. Please try again.' });
  }
});

// Employer Verification & Request CV access (Scenario A workflow)
app.post('/api/employer-request', (req: Request, res: Response) => {
  try {
    const { fullName, companyName, email, phone, position, purpose, message } = req.body;

    // Strict validation
    if (!fullName || !companyName || !email || !phone || !position || !purpose) {
      return res.status(400).json({
        error: 'Please complete all required fields: Full Name, Company, Email, Phone, Position, and Purpose.',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid business/official email address.' });
    }

    // Generate secure download token
    const token = `emp_token_${crypto.randomUUID()}`;
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(); // 48 hours validity

    const stmt = db.prepare(`
      INSERT INTO employer_requests (
        full_name, company_name, email, phone, position, purpose, message, download_token, token_expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      fullName.trim(),
      companyName.trim(),
      email.trim(),
      phone.trim(),
      position.trim(),
      purpose.trim(),
      message ? message.trim() : null,
      token,
      expiresAt
    );

    // Log activity
    db.prepare(`
      INSERT INTO activity_logs (action_type, description)
      VALUES (?, ?)
    `).run(
      'Employer Verified',
      `Employer verification approved for ${fullName.trim()} (${position.trim()} at ${companyName.trim()}). CV download authorized.`
    );

    const activeCV = db.prepare('SELECT id, version_title, file_name, file_size FROM cv_documents WHERE is_active = 1 LIMIT 1').get();

    res.json({
      success: true,
      download_token: token,
      expires_at: expiresAt,
      requestId: Number(result.lastInsertRowid),
      activeCV,
      message: 'Employer verification successful! You have been granted immediate access to download the official CV.',
    });
  } catch (error: any) {
    console.error('Employer request error:', error);
    res.status(500).json({ error: 'Failed to process employer verification. Please check your details.' });
  }
});

// Protected CV Download endpoint (checks authorization token)
app.get('/api/cv/download', (req: Request, res: Response) => {
  try {
    const { token, admin_token } = req.query;

    let isAuthorized = false;
    let employerReq: any = null;

    if (admin_token && activeAdminTokens.has(admin_token as string)) {
      isAuthorized = true;
    } else if (token) {
      employerReq = db.prepare('SELECT * FROM employer_requests WHERE download_token = ?').get(token as string);
      if (employerReq) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({
        error: 'Access Denied: You must complete the employer verification process before downloading the CV.',
      });
    }

    // If an employer token was used, update download statistics
    if (employerReq) {
      db.prepare(`
        UPDATE employer_requests 
        SET is_downloaded = 1, downloaded_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(employerReq.id);

      db.prepare(`
        INSERT INTO activity_logs (action_type, description)
        VALUES (?, ?)
      `).run(
        'CV Downloaded',
        `CV downloaded by employer: ${employerReq.full_name} (${employerReq.company_name}).`
      );
    }

    const activeCV = db.prepare('SELECT * FROM cv_documents WHERE is_active = 1 LIMIT 1').get() as any;
    const profile = db.prepare('SELECT * FROM profile WHERE id = 1').get() as any;

    res.json({
      success: true,
      status: 'authorized',
      activeCV: activeCV || {
        version_title: 'Software Engineer CV',
        file_name: 'Cisse_Acquah_Senior_Software_Engineer_CV.pdf',
        file_size: '248 KB',
      },
      profile,
    });
  } catch (error) {
    console.error('CV download error:', error);
    res.status(500).json({ error: 'Failed to authorize download' });
  }
});

// ----------------------------------------------------
// Admin API Endpoints (Secured)
// ----------------------------------------------------

// Admin Login
app.post('/api/admin/login', (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const settings = db.prepare('SELECT admin_username, admin_password FROM website_settings WHERE id = 1').get() as any;

    if (!settings || username !== settings.admin_username || password !== settings.admin_password) {
      return res.status(401).json({ error: 'Invalid admin username or password.' });
    }

    const token = `admin_session_${crypto.randomBytes(24).toString('hex')}`;
    activeAdminTokens.add(token);

    // Persist session for 30 days in SQLite so restarts never log the user out
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    try {
      db.prepare(`
        INSERT INTO admin_sessions (token, username, expires_at)
        VALUES (?, ?, ?)
      `).run(token, username, expiresAt);
    } catch (e) {
      console.error('Error inserting admin session:', e);
    }

    db.prepare('INSERT INTO activity_logs (action_type, description) VALUES (?, ?)').run(
      'Admin Login',
      `Admin user "${username}" logged in to the management dashboard.`
    );

    res.json({
      success: true,
      token,
      username,
      message: 'Admin authentication successful.',
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Admin Logout
app.post('/api/admin/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : (req.body?.token as string);

  if (token) {
    activeAdminTokens.delete(token);
    try {
      db.prepare('DELETE FROM admin_sessions WHERE token = ?').run(token);
    } catch (e) {}
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

// Check Admin Auth Status
app.get('/api/admin/check-auth', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : (req.query.token as string);

  if (!token) {
    return res.status(401).json({ authenticated: false, error: 'No token provided' });
  }

  if (activeAdminTokens.has(token)) {
    return res.json({ authenticated: true, token });
  }

  try {
    const session = db.prepare("SELECT token FROM admin_sessions WHERE token = ? AND datetime(expires_at) > datetime('now')").get(token) as any;
    if (session) {
      activeAdminTokens.add(token);
      return res.json({ authenticated: true, token });
    }
  } catch (e) {}

  res.status(401).json({ authenticated: false, error: 'Session invalid or expired' });
});

// Admin Stats & Analytics Summary (Section 18)
app.get('/api/admin/stats', requireAdminAuth, (_req: Request, res: Response) => {
  try {
    const totalProjects = (db.prepare('SELECT COUNT(*) as count FROM projects').get() as any).count;
    const completedProjects = (db.prepare("SELECT COUNT(*) as count FROM projects WHERE status = 'Completed'").get() as any).count;
    const ongoingProjects = (db.prepare("SELECT COUNT(*) as count FROM projects WHERE status = 'Ongoing'").get() as any).count;
    const totalEmployerRequests = (db.prepare('SELECT COUNT(*) as count FROM employer_requests').get() as any).count;
    const totalCVDownloads = (db.prepare('SELECT COUNT(*) as count FROM employer_requests WHERE is_downloaded = 1').get() as any).count;
    const unreadMessages = (db.prepare('SELECT COUNT(*) as count FROM contact_messages WHERE is_read = 0').get() as any).count;
    const totalMessages = (db.prepare('SELECT COUNT(*) as count FROM contact_messages').get() as any).count;
    const settings = db.prepare('SELECT visitor_count FROM website_settings WHERE id = 1').get() as any;
    const activityLogs = db.prepare('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 20').all();

    // Aggregated interaction counters from projects
    const projectAggs = db.prepare(`
      SELECT 
        SUM(COALESCE(view_count, 0)) as total_views,
        SUM(COALESCE(github_click_count, 0)) as total_github,
        SUM(COALESCE(live_demo_click_count, 0)) as total_demo
      FROM projects
    `).get() as any;

    const mostPopularProjects = db.prepare(`
      SELECT id, title, view_count as views, (COALESCE(github_click_count, 0) + COALESCE(live_demo_click_count, 0)) as clicks
      FROM projects
      ORDER BY view_count DESC
      LIMIT 5
    `).all();

    // Status breakdown for employer inquiries
    const statusCountsRaw = db.prepare(`
      SELECT review_status, COUNT(*) as count
      FROM employer_requests
      GROUP BY review_status
    `).all() as any[];

    const employerStatusCounts: Record<string, number> = {
      Pending: 0,
      Reviewed: 0,
      Contacted: 0,
      Resolved: 0
    };
    statusCountsRaw.forEach(item => {
      const key = item.review_status || 'Pending';
      employerStatusCounts[key] = item.count;
    });

    // Recent 7 days traffic trend
    const dailyTraffic = db.prepare(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as views
      FROM analytics_events
      WHERE event_type IN ('page_view', 'project_view')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 7
    `).all();

    res.json({
      totalProjects,
      completedProjects,
      ongoingProjects,
      totalEmployerRequests,
      totalCVDownloads,
      unreadMessages,
      totalMessages,
      visitorCount: settings?.visitor_count || 0,
      activityLogs,
      totalProjectViews: projectAggs?.total_views || 0,
      totalGithubClicks: projectAggs?.total_github || 0,
      totalLiveDemoClicks: projectAggs?.total_demo || 0,
      mostPopularProjects,
      employerStatusCounts,
      dailyTraffic: dailyTraffic.reverse(),
    });
  } catch (error) {
    console.error('Error in /api/admin/stats:', error);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// Comprehensive Analytics Endpoint (Section 18)
app.get('/api/admin/analytics', requireAdminAuth, (_req: Request, res: Response) => {
  try {
    const totalEvents = (db.prepare('SELECT COUNT(*) as count FROM analytics_events').get() as any).count;
    const pageViews = (db.prepare("SELECT COUNT(*) as count FROM analytics_events WHERE event_type = 'page_view'").get() as any).count;
    const projectViews = (db.prepare("SELECT COUNT(*) as count FROM analytics_events WHERE event_type = 'project_view'").get() as any).count;
    const chatInteractions = (db.prepare("SELECT COUNT(*) as count FROM analytics_events WHERE event_type = 'chat_interaction'").get() as any).count;
    const cvDownloads = (db.prepare("SELECT COUNT(*) as count FROM analytics_events WHERE event_type = 'cv_download'").get() as any).count;

    const recentEvents = db.prepare(`
      SELECT id, event_type, target_name, path, created_at
      FROM analytics_events
      ORDER BY created_at DESC
      LIMIT 50
    `).all();

    const projectsPerformance = db.prepare(`
      SELECT id, title, view_count, github_click_count, live_demo_click_count, is_draft
      FROM projects
      ORDER BY view_count DESC
    `).all();

    const cvDownloadsByTrack = db.prepare(`
      SELECT cv_track, version_title, download_count
      FROM cv_documents
      ORDER BY download_count DESC
    `).all();

    res.json({
      summary: {
        totalEvents,
        pageViews,
        projectViews,
        chatInteractions,
        cvDownloads,
      },
      projectsPerformance,
      cvDownloadsByTrack,
      recentEvents,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});

// CSV Export for Employer Inquiries & Analytics (Section 18)
app.get('/api/admin/analytics/export', requireAdminAuth, (_req: Request, res: Response) => {
  try {
    const records = db.prepare(`
      SELECT 
        e.id,
        e.created_at,
        e.full_name,
        e.company_name,
        e.email,
        e.phone,
        e.position,
        e.purpose,
        e.status,
        e.review_status,
        e.is_downloaded,
        e.downloaded_at,
        e.admin_notes,
        c.version_title as cv_track
      FROM employer_requests e
      LEFT JOIN cv_documents c ON e.cv_version_id = c.id
      ORDER BY e.created_at DESC
    `).all() as any[];

    // Build CSV text
    const headers = [
      'Request ID',
      'Date Created',
      'Contact Name',
      'Organization / Company',
      'Email Address',
      'Phone Number',
      'Role / Position',
      'Inquiry Purpose',
      'CV Track Requested',
      'Review Status',
      'CV Downloaded',
      'Downloaded At',
      'Admin Notes'
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = records.map(r => [
      r.id,
      r.created_at,
      escapeCsv(r.full_name),
      escapeCsv(r.company_name),
      escapeCsv(r.email),
      escapeCsv(r.phone),
      escapeCsv(r.position),
      escapeCsv(r.purpose),
      escapeCsv(r.cv_track || 'General Software Engineer'),
      escapeCsv(r.review_status || 'Pending'),
      r.is_downloaded ? 'Yes' : 'No',
      escapeCsv(r.downloaded_at || 'N/A'),
      escapeCsv(r.admin_notes || '')
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="employer_inquiries_${new Date().toISOString().slice(0, 10)}.csv"`);
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('CSV Export Error:', error);
    res.status(500).json({ error: 'Failed to export CSV report' });
  }
});

// Profile Photo Upload Endpoint (Picture upload based)
app.post('/api/admin/upload-profile-image', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { imageBase64, filename } = req.body;
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ error: 'No image data provided for upload.' });
    }

    let ext = 'jpg';
    let cleanBase64 = imageBase64.trim();

    // Parse Data URL header if present
    if (cleanBase64.includes(';base64,')) {
      const parts = cleanBase64.split(';base64,');
      const header = parts[0];
      cleanBase64 = parts[1];

      const mimeMatch = header.match(/image\/([a-zA-Z0-9.+_-]+)/i);
      if (mimeMatch) {
        ext = mimeMatch[1].toLowerCase().replace('jpeg', 'jpg').replace('svg+xml', 'svg');
      }
    } else if (cleanBase64.startsWith('data:')) {
      const commaIdx = cleanBase64.indexOf(',');
      if (commaIdx !== -1) {
        cleanBase64 = cleanBase64.substring(commaIdx + 1);
      }
    }

    if (filename && typeof filename === 'string' && filename.includes('.')) {
      const extractedExt = filename.split('.').pop()?.toLowerCase();
      if (extractedExt && ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(extractedExt)) {
        ext = extractedExt === 'jpeg' ? 'jpg' : extractedExt;
      }
    }

    // Strip any residual whitespace, quotes or linebreaks from base64 data
    cleanBase64 = cleanBase64.replace(/\s+/g, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    if (!buffer || buffer.length === 0) {
      return res.status(400).json({ error: 'Failed to decode image data. Please ensure the file is a valid image.' });
    }

    const safeFilename = `profile_${Date.now()}.${ext}`;
    const destinationPath = path.join(uploadsDir, safeFilename);

    fs.writeFileSync(destinationPath, buffer);
    const publicUrl = `/uploads/${safeFilename}`;

    // Update database profile image
    db.prepare('UPDATE profile SET profile_image = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1').run(publicUrl);

    // Audit log
    db.prepare('INSERT INTO activity_logs (action_type, description) VALUES (?, ?)').run(
      'Profile Photo Upload',
      `Profile picture updated via picture upload (${safeFilename}, ${(buffer.length / 1024).toFixed(1)} KB).`
    );

    res.json({
      success: true,
      imageUrl: publicUrl,
      message: 'Profile picture uploaded and updated successfully!',
    });
  } catch (error: any) {
    console.error('Image upload failed:', error);
    res.status(500).json({ error: error?.message || 'Failed to process uploaded picture.' });
  }
});

// Profile Update
app.put('/api/admin/profile', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const {
      full_name,
      professional_title,
      personal_intro,
      bio,
      profile_image,
      email,
      phone,
      location,
      career_interests,
      technical_specialisations,
      whatsapp_number,
    } = req.body;

    db.prepare(`
      UPDATE profile SET
        full_name = ?,
        professional_title = ?,
        personal_intro = ?,
        bio = ?,
        profile_image = ?,
        email = ?,
        phone = ?,
        location = ?,
        career_interests = ?,
        technical_specialisations = ?,
        whatsapp_number = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(
      full_name,
      professional_title,
      personal_intro,
      bio,
      profile_image,
      email,
      phone,
      location,
      career_interests,
      technical_specialisations,
      whatsapp_number
    );

    // Also sync whatsapp number in settings if provided
    if (whatsapp_number) {
      db.prepare('UPDATE website_settings SET whatsapp_number = ? WHERE id = 1').run(whatsapp_number);
    }

    db.prepare('INSERT INTO activity_logs (action_type, description) VALUES (?, ?)').run(
      'Profile Update',
      'Personal profile information updated via admin dashboard.'
    );

    const updatedProfile = db.prepare('SELECT * FROM profile WHERE id = 1').get();
    res.json({ success: true, profile: updatedProfile });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Education CRUD
app.post('/api/admin/education', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { degree, institution, field_of_study, start_year, end_year, grade_or_honors, description, order_index } = req.body;
    const stmt = db.prepare(`
      INSERT INTO education (degree, institution, field_of_study, start_year, end_year, grade_or_honors, description, order_index)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(degree, institution, field_of_study, start_year, end_year, grade_or_honors || null, description || null, order_index || 0);
    res.json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create education record' });
  }
});

app.put('/api/admin/education/:id', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { degree, institution, field_of_study, start_year, end_year, grade_or_honors, description, order_index } = req.body;
    db.prepare(`
      UPDATE education SET
        degree = ?, institution = ?, field_of_study = ?, start_year = ?, end_year = ?,
        grade_or_honors = ?, description = ?, order_index = ?
      WHERE id = ?
    `).run(degree, institution, field_of_study, start_year, end_year, grade_or_honors || null, description || null, order_index || 0, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update education record' });
  }
});

app.delete('/api/admin/education/:id', requireAdminAuth, (req: Request, res: Response) => {
  try {
    db.prepare('DELETE FROM education WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete education record' });
  }
});

// Experience CRUD
app.post('/api/admin/experience', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { job_title, company, location, start_date, end_date, is_current, description, accomplishments, order_index } = req.body;
    const stmt = db.prepare(`
      INSERT INTO work_experience (job_title, company, location, start_date, end_date, is_current, description, accomplishments, order_index)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(job_title, company, location, start_date, end_date || 'Present', is_current ? 1 : 0, description, accomplishments || null, order_index || 0);
    res.json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create experience record' });
  }
});

app.put('/api/admin/experience/:id', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { job_title, company, location, start_date, end_date, is_current, description, accomplishments, order_index } = req.body;
    db.prepare(`
      UPDATE work_experience SET
        job_title = ?, company = ?, location = ?, start_date = ?, end_date = ?,
        is_current = ?, description = ?, accomplishments = ?, order_index = ?
      WHERE id = ?
    `).run(job_title, company, location, start_date, end_date || 'Present', is_current ? 1 : 0, description, accomplishments || null, order_index || 0, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update experience record' });
  }
});

app.delete('/api/admin/experience/:id', requireAdminAuth, (req: Request, res: Response) => {
  try {
    db.prepare('DELETE FROM work_experience WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete experience record' });
  }
});

// Skills CRUD
app.post('/api/admin/skills', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { category_id, name, proficiency_percent, icon_class, badge_color, order_index } = req.body;
    const stmt = db.prepare(`
      INSERT INTO skills (category_id, name, proficiency_percent, icon_class, badge_color, order_index)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(category_id, name, proficiency_percent, icon_class || 'bi bi-check-circle', badge_color || '#3b82f6', order_index || 0);
    res.json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create skill' });
  }
});

app.put('/api/admin/skills/:id', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { category_id, name, proficiency_percent, icon_class, badge_color, order_index } = req.body;
    db.prepare(`
      UPDATE skills SET
        category_id = ?, name = ?, proficiency_percent = ?, icon_class = ?, badge_color = ?, order_index = ?
      WHERE id = ?
    `).run(category_id, name, proficiency_percent, icon_class, badge_color, order_index || 0, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update skill' });
  }
});

app.delete('/api/admin/skills/:id', requireAdminAuth, (req: Request, res: Response) => {
  try {
    db.prepare('DELETE FROM skills WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete skill' });
  }
});

// Skill Categories CRUD
app.post('/api/admin/skill-categories', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { name, slug, order_index } = req.body;
    const stmt = db.prepare('INSERT INTO skill_categories (name, slug, order_index) VALUES (?, ?, ?)');
    const result = stmt.run(name, slug || name.toLowerCase().replace(/\s+/g, '-'), order_index || 0);
    res.json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create skill category' });
  }
});

// Services CRUD
app.post('/api/admin/services', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { title, icon_class, short_description, full_description, key_deliverables, order_index } = req.body;
    const stmt = db.prepare(`
      INSERT INTO services (title, icon_class, short_description, full_description, key_deliverables, order_index)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(title, icon_class || 'bi bi-gear-fill', short_description, full_description, key_deliverables || null, order_index || 0);
    res.json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create service' });
  }
});

app.put('/api/admin/services/:id', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { title, icon_class, short_description, full_description, key_deliverables, order_index } = req.body;
    db.prepare(`
      UPDATE services SET
        title = ?, icon_class = ?, short_description = ?, full_description = ?, key_deliverables = ?, order_index = ?
      WHERE id = ?
    `).run(title, icon_class, short_description, full_description, key_deliverables || null, order_index || 0, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update service' });
  }
});

app.delete('/api/admin/services/:id', requireAdminAuth, (req: Request, res: Response) => {
  try {
    db.prepare('DELETE FROM services WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

// Projects CRUD
app.post('/api/admin/projects', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const {
      title,
      category_id,
      description,
      technologies,
      thumbnail_url,
      status,
      commencement_date,
      completion_date,
      github_url,
      live_url,
      key_features,
      is_featured,
      order_index,
    } = req.body;

    const stmt = db.prepare(`
      INSERT INTO projects (
        title, category_id, description, technologies, thumbnail_url, status,
        commencement_date, completion_date, github_url, live_url, key_features, is_featured, order_index
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      title,
      category_id || 1,
      description,
      technologies,
      thumbnail_url || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
      status || 'Completed',
      commencement_date,
      completion_date || null,
      github_url || null,
      live_url || null,
      key_features,
      is_featured ? 1 : 0,
      order_index || 0
    );

    db.prepare('INSERT INTO activity_logs (action_type, description) VALUES (?, ?)').run(
      'Project Added',
      `New project "${title}" was published to portfolio.`
    );

    res.json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (error) {
    console.error('Project insert error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

app.put('/api/admin/projects/:id', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const {
      title,
      category_id,
      description,
      technologies,
      thumbnail_url,
      status,
      commencement_date,
      completion_date,
      github_url,
      live_url,
      key_features,
      is_featured,
      order_index,
    } = req.body;

    db.prepare(`
      UPDATE projects SET
        title = ?, category_id = ?, description = ?, technologies = ?, thumbnail_url = ?, status = ?,
        commencement_date = ?, completion_date = ?, github_url = ?, live_url = ?, key_features = ?,
        is_featured = ?, order_index = ?
      WHERE id = ?
    `).run(
      title,
      category_id,
      description,
      technologies,
      thumbnail_url,
      status,
      commencement_date,
      completion_date || null,
      github_url || null,
      live_url || null,
      key_features,
      is_featured ? 1 : 0,
      order_index || 0,
      req.params.id
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project' });
  }
});

app.delete('/api/admin/projects/:id', requireAdminAuth, (req: Request, res: Response) => {
  try {
    db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Update Project Case Study (Section 17)
app.put('/api/admin/projects/:id/case-study', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const {
      problem_statement,
      project_objectives,
      proposed_solution,
      system_architecture,
      database_design,
      implementation_process,
      challenges_encountered,
      solutions_implemented,
      project_outcomes,
      future_improvements,
      screenshots_gallery,
      is_draft,
    } = req.body;

    const screenshotsJson = typeof screenshots_gallery === 'string' ? screenshots_gallery : JSON.stringify(screenshots_gallery || []);

    db.prepare(`
      UPDATE projects SET
        problem_statement = ?,
        project_objectives = ?,
        proposed_solution = ?,
        system_architecture = ?,
        database_design = ?,
        implementation_process = ?,
        challenges_encountered = ?,
        solutions_implemented = ?,
        project_outcomes = ?,
        future_improvements = ?,
        screenshots_gallery = ?,
        is_draft = ?
      WHERE id = ?
    `).run(
      problem_statement || null,
      project_objectives || null,
      proposed_solution || null,
      system_architecture || null,
      database_design || null,
      implementation_process || null,
      challenges_encountered || null,
      solutions_implemented || null,
      project_outcomes || null,
      future_improvements || null,
      screenshotsJson,
      is_draft ? 1 : 0,
      req.params.id
    );

    db.prepare('INSERT INTO activity_logs (action_type, description) VALUES (?, ?)').run(
      'Case Study Updated',
      `Comprehensive case study updated for project ID #${req.params.id}.`
    );

    res.json({ success: true, message: 'Case study saved successfully.' });
  } catch (error) {
    console.error('Case study update error:', error);
    res.status(500).json({ error: 'Failed to update case study' });
  }
});

// CV Documents CRUD
app.get('/api/admin/cv-documents', requireAdminAuth, (_req: Request, res: Response) => {
  try {
    const docs = db.prepare('SELECT * FROM cv_documents ORDER BY upload_date DESC').all();
    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch CV documents' });
  }
});

app.post('/api/admin/cv-documents', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { version_title, file_name, file_size, is_active, notes, summary_content, cv_track, custom_highlights } = req.body;

    if (is_active) {
      db.prepare('UPDATE cv_documents SET is_active = 0').run();
    }

    const stmt = db.prepare(`
      INSERT INTO cv_documents (version_title, file_name, file_size, is_active, notes, summary_content, cv_track, custom_highlights)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      version_title,
      file_name,
      file_size || '250 KB',
      is_active ? 1 : 0,
      notes || null,
      summary_content || null,
      cv_track || 'software_engineer',
      custom_highlights || null
    );

    db.prepare('INSERT INTO activity_logs (action_type, description) VALUES (?, ?)').run(
      'CV Updated',
      `New CV version "${version_title}" registered.`
    );

    res.json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add CV document' });
  }
});

app.put('/api/admin/cv-documents/:id', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { version_title, file_name, file_size, notes, summary_content, cv_track, custom_highlights, is_active } = req.body;

    if (is_active) {
      db.prepare('UPDATE cv_documents SET is_active = 0').run();
    }

    db.prepare(`
      UPDATE cv_documents SET
        version_title = ?,
        file_name = ?,
        file_size = ?,
        notes = ?,
        summary_content = ?,
        cv_track = ?,
        custom_highlights = ?,
        is_active = COALESCE(?, is_active)
      WHERE id = ?
    `).run(
      version_title,
      file_name,
      file_size || '250 KB',
      notes || null,
      summary_content || null,
      cv_track || 'software_engineer',
      custom_highlights || null,
      is_active !== undefined ? (is_active ? 1 : 0) : null,
      req.params.id
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update CV document' });
  }
});

app.put('/api/admin/cv-documents/:id/activate', requireAdminAuth, (req: Request, res: Response) => {
  try {
    db.prepare('UPDATE cv_documents SET is_active = 0').run();
    db.prepare('UPDATE cv_documents SET is_active = 1 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to activate CV version' });
  }
});

app.delete('/api/admin/cv-documents/:id', requireAdminAuth, (req: Request, res: Response) => {
  try {
    db.prepare('DELETE FROM cv_documents WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete CV document' });
  }
});

// Employer Requests Management
app.get('/api/admin/employer-requests', requireAdminAuth, (_req: Request, res: Response) => {
  try {
    const requests = db.prepare('SELECT * FROM employer_requests ORDER BY created_at DESC').all();
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employer requests' });
  }
});

app.put('/api/admin/employer-requests/:id/status', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    db.prepare('UPDATE employer_requests SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update request status' });
  }
});

// Review status & notes workflow (Section 18)
app.put('/api/admin/employer-requests/:id/review', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { review_status, admin_notes } = req.body;
    db.prepare(`
      UPDATE employer_requests SET
        review_status = COALESCE(?, review_status),
        admin_notes = COALESCE(?, admin_notes)
      WHERE id = ?
    `).run(review_status || null, admin_notes !== undefined ? admin_notes : null, req.params.id);

    db.prepare('INSERT INTO activity_logs (action_type, description) VALUES (?, ?)').run(
      'Employer Request Reviewed',
      `Inquiry #${req.params.id} review status updated to "${review_status}".`
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update review status' });
  }
});

app.delete('/api/admin/employer-requests/:id', requireAdminAuth, (req: Request, res: Response) => {
  try {
    db.prepare('DELETE FROM employer_requests WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete employer request' });
  }
});

// Contact Messages Management
app.get('/api/admin/contact-messages', requireAdminAuth, (_req: Request, res: Response) => {
  try {
    const messages = db.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC').all();
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contact messages' });
  }
});

app.put('/api/admin/contact-messages/:id/read', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { is_read } = req.body;
    db.prepare('UPDATE contact_messages SET is_read = ? WHERE id = ?').run(is_read ? 1 : 0, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update message status' });
  }
});

app.delete('/api/admin/contact-messages/:id', requireAdminAuth, (req: Request, res: Response) => {
  try {
    db.prepare('DELETE FROM contact_messages WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// Social Media Links CRUD
app.get('/api/admin/socials', requireAdminAuth, (_req: Request, res: Response) => {
  try {
    const socials = db.prepare('SELECT * FROM social_media ORDER BY order_index ASC, id ASC').all();
    res.json(socials);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch social links' });
  }
});

app.post('/api/admin/socials', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { platform_name, profile_url, icon_class, is_active, order_index } = req.body;

    if (!platform_name || !profile_url) {
      return res.status(400).json({ error: 'Platform Name and Profile URL are required.' });
    }

    const cleanPlatform = String(platform_name).trim();
    let cleanUrl = String(profile_url).trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://') && !cleanUrl.startsWith('mailto:') && !cleanUrl.startsWith('tel:') && !cleanUrl.startsWith('#')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    const cleanIcon = (icon_class && String(icon_class).trim()) || 'bi bi-link-45deg';
    const activeVal = is_active !== undefined ? (is_active ? 1 : 0) : 1;
    const orderVal = Number(order_index) || 0;

    const stmt = db.prepare('INSERT INTO social_media (platform_name, profile_url, icon_class, is_active, order_index) VALUES (?, ?, ?, ?, ?)');
    const result = stmt.run(cleanPlatform, cleanUrl, cleanIcon, activeVal, orderVal);

    db.prepare('INSERT INTO activity_logs (action_type, description) VALUES (?, ?)').run(
      'Social Media Added',
      `Added social link for "${cleanPlatform}" (${cleanUrl}).`
    );

    res.json({ success: true, id: Number(result.lastInsertRowid), message: 'Social link created successfully.' });
  } catch (error: any) {
    console.error('Add social link error:', error);
    res.status(500).json({ error: error?.message || 'Failed to add social link' });
  }
});

app.put('/api/admin/socials/:id', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { platform_name, profile_url, icon_class, is_active, order_index } = req.body;
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ error: 'Invalid social link ID.' });
    }

    if (!platform_name || !profile_url) {
      return res.status(400).json({ error: 'Platform Name and Profile URL are required.' });
    }

    const cleanPlatform = String(platform_name).trim();
    let cleanUrl = String(profile_url).trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://') && !cleanUrl.startsWith('mailto:') && !cleanUrl.startsWith('tel:') && !cleanUrl.startsWith('#')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    const cleanIcon = (icon_class && String(icon_class).trim()) || 'bi bi-link-45deg';
    const activeVal = is_active !== undefined ? (is_active ? 1 : 0) : 1;
    const orderVal = Number(order_index) || 0;

    db.prepare('UPDATE social_media SET platform_name = ?, profile_url = ?, icon_class = ?, is_active = ?, order_index = ? WHERE id = ?')
      .run(cleanPlatform, cleanUrl, cleanIcon, activeVal, orderVal, id);

    db.prepare('INSERT INTO activity_logs (action_type, description) VALUES (?, ?)').run(
      'Social Media Updated',
      `Updated social link for "${cleanPlatform}" (ID: ${id}).`
    );

    res.json({ success: true, message: 'Social link updated successfully.' });
  } catch (error: any) {
    console.error('Update social link error:', error);
    res.status(500).json({ error: error?.message || 'Failed to update social link' });
  }
});

app.delete('/api/admin/socials/:id', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid social link ID.' });
    }

    const existing = db.prepare('SELECT platform_name FROM social_media WHERE id = ?').get(id) as any;
    db.prepare('DELETE FROM social_media WHERE id = ?').run(id);

    db.prepare('INSERT INTO activity_logs (action_type, description) VALUES (?, ?)').run(
      'Social Media Deleted',
      `Removed social link "${existing?.platform_name || id}".`
    );

    res.json({ success: true, message: 'Social link removed successfully.' });
  } catch (error: any) {
    console.error('Delete social link error:', error);
    res.status(500).json({ error: error?.message || 'Failed to delete social link' });
  }
});

// Settings Update (with AI Assistant controls)
app.put('/api/admin/settings', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const {
      site_title,
      meta_description,
      whatsapp_number,
      admin_password,
      hero_headline,
      hero_subheadline,
      ai_assistant_enabled,
      ai_assistant_name,
      ai_welcome_message
    } = req.body;

    const aiEnabledNum = ai_assistant_enabled !== undefined ? (ai_assistant_enabled ? 1 : 0) : 1;
    const aiName = ai_assistant_name || 'DevBot';
    const aiWelcome = ai_welcome_message || "Hello! I am Cisse's AI Portfolio Assistant. How can I help you today?";

    if (admin_password && admin_password.trim().length > 0) {
      db.prepare(`
        UPDATE website_settings SET
          site_title = ?, meta_description = ?, whatsapp_number = ?, admin_password = ?,
          hero_headline = ?, hero_subheadline = ?,
          ai_assistant_enabled = ?, ai_assistant_name = ?, ai_welcome_message = ?
        WHERE id = 1
      `).run(
        site_title,
        meta_description,
        whatsapp_number,
        admin_password.trim(),
        hero_headline,
        hero_subheadline,
        aiEnabledNum,
        aiName,
        aiWelcome
      );
    } else {
      db.prepare(`
        UPDATE website_settings SET
          site_title = ?, meta_description = ?, whatsapp_number = ?,
          hero_headline = ?, hero_subheadline = ?,
          ai_assistant_enabled = ?, ai_assistant_name = ?, ai_welcome_message = ?
        WHERE id = 1
      `).run(
        site_title,
        meta_description,
        whatsapp_number,
        hero_headline,
        hero_subheadline,
        aiEnabledNum,
        aiName,
        aiWelcome
      );
    }

    db.prepare('INSERT INTO activity_logs (action_type, description) VALUES (?, ?)').run(
      'Settings Updated',
      'Website settings and AI assistant configuration updated.'
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// ----------------------------------------------------
// Frontend Serving & Vite Middleware
// ----------------------------------------------------

async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : undefined,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, HOST, () => {
    console.log(`Portfolio Server running at http://${HOST}:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
