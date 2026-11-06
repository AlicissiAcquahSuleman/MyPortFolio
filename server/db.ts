import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'portfolio.sqlite3');
export const db = new DatabaseSync(dbPath);

// Helper for safe column addition in SQLite migrations
function safeAddColumn(table: string, columnDef: string) {
  try {
    const colName = columnDef.trim().split(/\s+/)[0];
    const columns = db.prepare(`PRAGMA table_info(${table})`).all() as any[];
    const exists = columns.some((c) => c.name.toLowerCase() === colName.toLowerCase());
    if (!exists) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${columnDef}`);
    }
  } catch (e: any) {
    console.error(`Migration warning on ${table} (${columnDef}):`, e?.message);
  }
}

// Initialize schema
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      professional_title TEXT NOT NULL,
      personal_intro TEXT NOT NULL,
      bio TEXT NOT NULL,
      profile_image TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      location TEXT NOT NULL,
      career_interests TEXT NOT NULL,
      technical_specialisations TEXT NOT NULL,
      whatsapp_number TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS education (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      degree TEXT NOT NULL,
      institution TEXT NOT NULL,
      field_of_study TEXT NOT NULL,
      start_year TEXT NOT NULL,
      end_year TEXT NOT NULL,
      grade_or_honors TEXT,
      description TEXT,
      order_index INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS work_experience (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_title TEXT NOT NULL,
      company TEXT NOT NULL,
      location TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      is_current INTEGER DEFAULT 0,
      description TEXT NOT NULL,
      accomplishments TEXT,
      order_index INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS skill_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      order_index INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      proficiency_percent INTEGER NOT NULL,
      icon_class TEXT,
      badge_color TEXT,
      order_index INTEGER DEFAULT 0,
      FOREIGN KEY(category_id) REFERENCES skill_categories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      icon_class TEXT NOT NULL,
      short_description TEXT NOT NULL,
      full_description TEXT NOT NULL,
      key_deliverables TEXT,
      order_index INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS project_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category_id INTEGER,
      description TEXT NOT NULL,
      technologies TEXT NOT NULL,
      thumbnail_url TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('Ongoing', 'Completed', 'On Hold')),
      commencement_date TEXT NOT NULL,
      completion_date TEXT,
      github_url TEXT,
      live_url TEXT,
      key_features TEXT NOT NULL,
      is_featured INTEGER DEFAULT 0,
      order_index INTEGER DEFAULT 0,
      problem_statement TEXT,
      project_objectives TEXT,
      proposed_solution TEXT,
      system_architecture TEXT,
      database_design TEXT,
      implementation_process TEXT,
      challenges_encountered TEXT,
      solutions_implemented TEXT,
      project_outcomes TEXT,
      future_improvements TEXT,
      screenshots_gallery TEXT,
      is_draft INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      github_click_count INTEGER DEFAULT 0,
      live_demo_click_count INTEGER DEFAULT 0,
      FOREIGN KEY(category_id) REFERENCES project_categories(id)
    );

    CREATE TABLE IF NOT EXISTS cv_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version_title TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_size TEXT NOT NULL,
      upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_active INTEGER DEFAULT 0,
      notes TEXT,
      summary_content TEXT,
      cv_track TEXT DEFAULT 'software_engineer',
      custom_highlights TEXT,
      download_count INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS employer_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      company_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      position TEXT NOT NULL,
      purpose TEXT NOT NULL,
      message TEXT,
      download_token TEXT UNIQUE,
      token_expires_at DATETIME,
      is_downloaded INTEGER DEFAULT 0,
      downloaded_at DATETIME,
      status TEXT DEFAULT 'Approved',
      review_status TEXT DEFAULT 'Pending',
      cv_version_id INTEGER DEFAULT 1,
      admin_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS social_media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform_name TEXT NOT NULL,
      profile_url TEXT NOT NULL,
      icon_class TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      order_index INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS website_settings (
      id INTEGER PRIMARY KEY,
      site_title TEXT NOT NULL,
      meta_description TEXT NOT NULL,
      whatsapp_number TEXT NOT NULL,
      admin_username TEXT NOT NULL,
      admin_password TEXT NOT NULL,
      hero_headline TEXT NOT NULL,
      hero_subheadline TEXT NOT NULL,
      visitor_count INTEGER DEFAULT 0,
      ai_assistant_enabled INTEGER DEFAULT 1,
      ai_assistant_name TEXT DEFAULT 'DevBot',
      ai_welcome_message TEXT DEFAULT 'Hello! I am Cisse Acquah\\''s virtual AI assistant. Ask me about his software projects, technical skills, background, or CV request workflow!'
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action_type TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS analytics_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      target_id INTEGER,
      target_name TEXT,
      path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admin_sessions (
      token TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL
    );
  `);

  // Migrate any existing columns for pre-existing databases
  safeAddColumn('projects', 'problem_statement TEXT');
  safeAddColumn('projects', 'project_objectives TEXT');
  safeAddColumn('projects', 'proposed_solution TEXT');
  safeAddColumn('projects', 'system_architecture TEXT');
  safeAddColumn('projects', 'database_design TEXT');
  safeAddColumn('projects', 'implementation_process TEXT');
  safeAddColumn('projects', 'challenges_encountered TEXT');
  safeAddColumn('projects', 'solutions_implemented TEXT');
  safeAddColumn('projects', 'project_outcomes TEXT');
  safeAddColumn('projects', 'future_improvements TEXT');
  safeAddColumn('projects', 'screenshots_gallery TEXT');
  safeAddColumn('projects', 'is_draft INTEGER DEFAULT 0');
  safeAddColumn('projects', 'view_count INTEGER DEFAULT 0');
  safeAddColumn('projects', 'github_click_count INTEGER DEFAULT 0');
  safeAddColumn('projects', 'live_demo_click_count INTEGER DEFAULT 0');

  safeAddColumn('website_settings', 'ai_assistant_enabled INTEGER DEFAULT 1');
  safeAddColumn('website_settings', "ai_assistant_name TEXT DEFAULT 'DevBot'");
  safeAddColumn('website_settings', "ai_welcome_message TEXT DEFAULT 'Hello! How can I assist you with Cisse Acquah''s software projects or career credentials?'");

  try {
    db.prepare(`
      UPDATE website_settings SET
        ai_assistant_enabled = COALESCE(ai_assistant_enabled, 1),
        ai_assistant_name = COALESCE(ai_assistant_name, 'DevBot'),
        ai_welcome_message = COALESCE(ai_welcome_message, 'Hello! I am Cisse Acquah''s virtual AI assistant. Ask me about his software projects, technical skills, background, or CV request workflow!')
      WHERE id = 1
    `).run();
  } catch (e) {}

  safeAddColumn('cv_documents', "cv_track TEXT DEFAULT 'software_engineer'");
  safeAddColumn('cv_documents', 'custom_highlights TEXT');
  safeAddColumn('cv_documents', 'download_count INTEGER DEFAULT 0');

  safeAddColumn('employer_requests', "review_status TEXT DEFAULT 'Pending'");
  safeAddColumn('employer_requests', 'cv_version_id INTEGER DEFAULT 1');
  safeAddColumn('employer_requests', 'admin_notes TEXT');

  // Seed default data if profile is empty
  const profileCount = db.prepare('SELECT COUNT(*) as count FROM profile').get() as { count: number };
  if (profileCount.count === 0) {
    seedInitialData();
  } else {
    // Ensure case studies and CV tracks are populated for existing databases
    seedCaseStudiesIfMissing();
    seedCVTracksIfMissing();
  }
}

function seedCaseStudiesIfMissing() {
  const p1 = db.prepare('SELECT problem_statement FROM projects WHERE id = 1').get() as any;
  if (!p1 || !p1.problem_statement) {
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
        view_count = 184,
        github_click_count = 42,
        live_demo_click_count = 68
      WHERE id = 1
    `).run(
      'Logistics fleets operating across multiple distribution hubs faced high latency in real-time GPS tracking, vehicle breakdown reporting, and fuel waste. Disjointed telematics resulted in reconciliation delays averaging 4.2 hours daily.',
      '1. Ingest GPS telematics at 10,000+ points/minute with sub-100ms latency.\n2. Provide dispatchers with real-time geospatial map rendering and geofence alerts.\n3. Automate route optimization reducing fuel expenditure by at least 15%.\n4. Produce automated PDF regulatory compliance and driver shift summaries.',
      'A decoupled, distributed telemetry pipeline using Django Channels over WebSockets, PostGIS for geospatial indexing, Redis for hot-cache telemetry, and a reactive dashboard with real-time vector map rendering.',
      'Microservice-inspired architecture: Ingestion gateway -> Celery background processing queue -> Redis spatial cache -> PostgreSQL/PostGIS database -> WebSocket dispatch layer -> Reactive frontend dashboard.',
      'Normalized PostgreSQL schema utilizing PostGIS geometry types (ST_Point, ST_Polygon) for telemetry points and geofences. Partitioned telemetry_pings table by month with spatial GiST indexing.',
      'Phase 1: Domain-driven design of vehicle state transitions.\nPhase 2: High-throughput ingestion worker implementation using Python asyncio and Celery.\nPhase 3: Integration of PostGIS spatial queries.\nPhase 4: WebSocket dispatch interface and automated PDF report generator.',
      '1. High-frequency telemetry writes causing database lock contention.\n2. Disconnections in remote mobile areas creating out-of-order GPS points.\n3. Memory consumption spikes during geospatial bounding-box queries.',
      '1. Introduced Redis buffer queues with bulk batch inserts every 2 seconds.\n2. Implemented timestamp vector-clock reconciliation for delayed telemetry packets.\n3. Pre-computed vehicle cluster tiles to eliminate runtime spatial re-indexing.',
      'Successfully deployed across 450 commercial freight vehicles. Achieved 99.94% ingestion uptime, slashed fuel consumption by 18.2%, and cut daily dispatch reconciliation time from 4.2 hours to 8 minutes.',
      'Integration of predictive machine learning models for early mechanical maintenance alerts and dynamic weather-aware routing.',
      JSON.stringify([
        { url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80', caption: 'Real-time Telemetry Dispatch & Fleet Control Map' },
        { url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80', caption: 'Fuel Analytics & Geospatial Route Optimization Dashboard' },
        { url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80', caption: 'Automated Regulatory Compliance & Driver Shift Reports' }
      ])
    );

    // Project 2: PayShield Fraud Detection
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
        view_count = 215,
        github_click_count = 73,
        live_demo_click_count = 94
      WHERE id = 2
    `).run(
      'Online merchant aggregators were vulnerable to card testing botnets, synthetic identity fraud, and chargeback spikes, resulting in high merchant reserve penalties.',
      '1. Evaluate payment transaction risk scores in sub-50 milliseconds.\n2. Guarantee idempotency for all inbound transaction webhooks.\n3. Provide compliance-grade audit logging adhering to PCI-DSS standards.\n4. Implement sliding-window velocity checks without performance degradation.',
      'Engineered an event-driven fraud scoring engine in Python and Django REST Framework using Redis sliding-window counters, token bucket rate limiters, and cryptographically verified HMAC webhook signatures.',
      'Inbound Payment API -> HMAC Signature Verifier -> Idempotency Cache (Redis) -> Rule Evaluation Engine -> SQLite/Postgres Persistence -> Webhook Dispatcher.',
      'ACID transactional ledger with unique transaction UUIDs, idempotency keys with TTL expiry, and encrypted card tokenization tables.',
      'Designed rule pipeline using OOP Chain-of-Responsibility pattern. Developed comprehensive test matrix with PyTest reaching 94% branch coverage.',
      'Distributed clock skew causing false positives in velocity rate limiting across multi-region server nodes.',
      'Utilized Redis centralized atomic Lua scripts for synchronized token bucket decrementing and velocity scoring.',
      'Blocked over $1.8M in fraudulent transaction attempts in first quarter of deployment. Maintained p95 evaluation latency of 38ms.',
      'Introduction of unsupervised graph neural network (GNN) embeddings to detect coordinated credit card fraud rings.',
      JSON.stringify([
        { url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80', caption: 'PayShield Fraud Score Evaluation & Rule Engine Monitor' },
        { url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80', caption: 'Real-time Transaction Velocity & Webhook Ledger' }
      ])
    );

    // Project 3: DocuMind AI
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
        view_count = 280,
        github_click_count = 89,
        live_demo_click_count = 112
      WHERE id = 3
    `).run(
      'Engineering teams at growing tech enterprises waste up to 25% of their working hours searching through siloed Confluence docs, GitHub READMEs, and technical specifications.',
      '1. Ingest multi-format documents (PDF, Markdown, OpenAPI specs).\n2. Chunk, embed, and store vector representations using pgvector.\n3. Provide interactive semantic Q&A with exact source citations and latency under 1.5s.',
      'Developed a modern RAG system powered by Gemini Pro SDK, Django backend, pgvector similarity search, and a responsive TypeScript React UI.',
      'Document Parser -> Text Splitter & Chunking -> Vector Embedding -> pgvector Index -> Cosine Similarity Retrieval -> Gemini Context Grounding -> Streaming Response.',
      'Documents table linked to chunks table storing 768-dimensional vector embeddings with HNSW indexing for rapid cosine distance matching.',
      'Implemented recursive character splitting with overlap, integrated Gemini model for query expansion, and built streaming SSE chat endpoint.',
      'Hallucinations on complex proprietary API queries where documentation was sparse.',
      'Implemented strict citation grounding with confidence thresholding: if cosine similarity < 0.72, the model issues a safe fallback response.',
      'Accelerated developer onboarding time by 40% across pilot teams with zero hallucinated API signatures.',
      'Multi-modal document indexing supporting architectural diagrams and database schema ERD images.',
      JSON.stringify([
        { url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80', caption: 'DocuMind Semantic Knowledge Query Interface' },
        { url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80', caption: 'Citation Verification & Vector Embedding Graph' }
      ])
    );
  }
}

function seedCVTracksIfMissing() {
  const cvCount = db.prepare('SELECT COUNT(*) as count FROM cv_documents').get() as any;
  if (cvCount.count <= 1) {
    db.prepare(`
      INSERT INTO cv_documents (version_title, file_name, file_size, is_active, cv_track, notes, summary_content, custom_highlights)
      VALUES
        (
          'Python & Django Backend Specialist CV',
          'Cisse_Acquah_Django_Backend_Specialist_CV.pdf',
          '262 KB',
          0,
          'django_backend',
          'Tailored for Lead Backend, Django Architect, and Distributed Systems roles.',
          'Senior Backend Software Engineer with deep expertise in Python 3.10+, Django 5.0, Django REST Framework, PostgreSQL optimization, and high-concurrency microservices.',
          'Django MVT & DRF Architecture, PostgreSQL Schema Tuning, Celery Task Queues, Redis Caching, Idempotent Payment Pipelines'
        ),
        (
          'Data Science & Analytics Engineer CV',
          'Cisse_Acquah_Data_Science_Analytics_CV.pdf',
          '255 KB',
          0,
          'data_science',
          'Focused on ETL pipeline engineering, business intelligence, and telemetry analytics.',
          'Data-driven Software Engineer with extensive experience in automated data pipelines, Pandas/NumPy processing, statistical modeling, and PostgreSQL/PostGIS spatial analytics.',
          'ETL Automation, Pandas & NumPy, PostGIS Spatial Analytics, Data Visualization, Telemetry Ingestion Engines'
        ),
        (
          'AI & Machine Learning Systems Architect CV',
          'Cisse_Acquah_AI_ML_Systems_CV.pdf',
          '270 KB',
          0,
          'ai_ml',
          'Designed for AI Engineering, LLM Integration, and RAG Architecture positions.',
          'Software Engineer specializing in modern AI integrations, Gemini API, Retrieval-Augmented Generation (RAG) pipelines, vector databases (pgvector), and semantic search solutions.',
          'Gemini API & LLM SDK, RAG Architecture, Vector Databases (pgvector), Prompt Engineering, Semantic Search Systems'
        );
    `).run();
  }
}

function seedInitialData() {
  db.exec(`
    INSERT INTO profile (
      id, full_name, professional_title, personal_intro, bio, profile_image,
      email, phone, location, career_interests, technical_specialisations, whatsapp_number
    ) VALUES (
      1,
      'Cisse Acquah',
      'Senior Software Engineer & Full-Stack Architect',
      'Dedicated Software Engineer with 6+ years of experience designing high-scale web platforms, robust Python/Django APIs, distributed microservices, and reactive user interfaces.',
      'I am an inventive, product-driven Software Engineer specialising in full-stack architecture, clean OOP paradigms, and enterprise web solutions. Over the course of my career, I have engineered data-heavy backend systems using Python, Django, PostgreSQL, and SQLite, alongside modern frontend ecosystems with TypeScript and React. Passionate about system analysis, cloud reliability, database performance tuning, and practical AI integrations.',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      'acquah.cisse1980@gmail.com',
      '+233 24 476 2558',
      'HSE N0: E57/15, Hot-Coffee Down, Near Buza-11, Opposite the Shia-Mosque Nima-Accra, Ghana',
      'Distributed Systems Architecture, High-Concurrency Cloud Backends, AI-powered Developer Tools, Event-Driven Architecture, Secure Data Pipelines',
      'Python, Django Framework, RESTful & GraphQL APIs, SQLite/PostgreSQL, TypeScript, React, Docker, Linux, System Security & CI/CD',
      '+233244762558'
    );

    INSERT INTO website_settings (
      id, site_title, meta_description, whatsapp_number, admin_username, admin_password,
      hero_headline, hero_subheadline, visitor_count, ai_assistant_enabled, ai_assistant_name, ai_welcome_message
    ) VALUES (
      1,
      'Cisse Acquah | Senior Software Engineer Portfolio',
      'Personal portfolio and technical showcase of Cisse Acquah - Senior Software Engineer specialising in Python, Django, React, and Scalable Backend Systems.',
      '+233244762558',
      'admin',
      'admin123',
      'Engineering Resilient, Scalable & Clean Software Systems',
      'Specialised in Python/Django backend architecture, robust relational database design, and modern high-performance web applications.',
      142,
      1,
      'DevBot',
      'Hello! I am Cisse Acquah\\''s virtual AI assistant. Ask me about his software projects, technical skills, background, or CV request workflow!'
    );

    -- Education
    INSERT INTO education (degree, institution, field_of_study, start_year, end_year, grade_or_honors, description, order_index)
    VALUES 
      ('Master of Science (MSc)', 'University of Oxford', 'Computer Science & Software Engineering', '2018', '2020', 'First Class Honours (Distinction)', 'Specialised in distributed databases, software verification, and high-performance concurrent computing.', 1),
      ('Bachelor of Science (BSc)', 'Imperial College London', 'Computing & Information Systems', '2014', '2018', 'Upper Second Class Honours (2:1)', 'Core foundations in data structures, OOP programming, computer architecture, and database management systems.', 2);

    -- Work Experience
    INSERT INTO work_experience (job_title, company, location, start_date, end_date, is_current, description, accomplishments, order_index)
    VALUES
      ('Lead Backend Software Engineer', 'FinEdge Technologies', 'London / Hybrid', '2022-03', 'Present', 1, 
       'Direct the core payment orchestration and transactional data engine powering over 1.2M daily transactions. Overseeing Django/Python microservices and database clustering.',
       'Architected idempotent payout pipeline reducing reconciliation discrepancies by 99.4%; Migrated legacy monolithic services to high-throughput Django REST APIs; Mentored junior developers.', 1),
      ('Senior Full Stack Developer', 'CloudMatrix Labs', 'Cambridge, UK', '2020-01', '2022-02', 0,
       'Developed customer-facing analytics dashboards and telemetry ingest engines using Python Django, PostgreSQL, Celery, and React.',
       'Optimised complex ORM queries cutting p95 endpoint latency from 780ms to 92ms; Built dynamic multi-tenant role-based access control (RBAC) security layer.', 2),
      ('Software Development Engineer', 'Apex Digital Solutions', 'London, UK', '2018-06', '2019-12', 0,
       'Engineered custom ERP and inventory management solutions for enterprise retail clients using Django MVT architecture and PostgreSQL.',
       'Delivered 5 full-cycle client software projects on schedule; Automated test suites increasing unit test coverage from 45% to 88%.', 3);

    -- Skill Categories
    INSERT INTO skill_categories (name, slug, order_index)
    VALUES
      ('Programming Languages', 'languages', 1),
      ('Backend Development', 'backend', 2),
      ('Web Development', 'web-dev', 3),
      ('Frontend Development', 'frontend', 4),
      ('Databases & Storage', 'databases', 5),
      ('Artificial Intelligence & ML', 'ai-ml', 6),
      ('Data Science & Analytics', 'data-science', 7),
      ('Development Tools & DevOps', 'tools-devops', 8);

    -- Skills
    INSERT INTO skills (category_id, name, proficiency_percent, icon_class, badge_color, order_index) VALUES
      (1, 'Python', 96, 'bi bi-code-slash', '#3776ab', 1),
      (1, 'TypeScript / JavaScript', 90, 'bi bi-filetype-tsx', '#3178c6', 2),
      (1, 'SQL (PostgreSQL / SQLite)', 94, 'bi bi-database', '#336791', 3),
      (1, 'Bash / Shell Scripting', 84, 'bi bi-terminal', '#4eaa25', 4),
      (1, 'Rust (Fundamentals)', 72, 'bi bi-gear-wide-connected', '#dea584', 5),

      (2, 'Django & Django REST Framework', 98, 'bi bi-layers', '#092e20', 1),
      (2, 'RESTful & GraphQL API Design', 94, 'bi bi-cloud-arrow-up', '#0284c7', 2),
      (2, 'Object-Oriented Programming (OOP)', 95, 'bi bi-diagram-3', '#6366f1', 3),
      (2, 'Microservices Architecture', 88, 'bi bi-boxes', '#8b5cf6', 4),
      (2, 'Authentication (JWT, Session, OAuth2)', 92, 'bi bi-shield-lock', '#10b981', 5),
      (2, 'Celery / Redis Task Queues', 86, 'bi bi-cpu', '#ef4444', 6),

      (3, 'Django MVT Architecture', 96, 'bi bi-window-stack', '#047857', 1),
      (3, 'Web Security (CSRF, XSS, SQLi)', 92, 'bi bi-shield-check', '#059669', 2),
      (3, 'WebSockets & Real-time I/O', 85, 'bi bi-broadcast-pin', '#06b6d4', 3),
      (3, 'Performance Profiling & Caching', 89, 'bi bi-speedometer2', '#f59e0b', 4),

      (4, 'React 19 & Next.js Ecosystem', 90, 'bi bi-filetype-jsx', '#61dafb', 1),
      (4, 'HTML5, Modern CSS3 & Tailwind', 95, 'bi bi-filetype-css', '#38bdf8', 2),
      (4, 'Bootstrap 5 Framework', 94, 'bi bi-bootstrap', '#7952b3', 3),
      (4, 'State Management & Responsive Design', 92, 'bi bi-phone', '#ec4899', 4),

      (5, 'PostgreSQL (High Availability)', 92, 'bi bi-database-fill-check', '#336791', 1),
      (5, 'SQLite Engine & Schema Optimization', 95, 'bi bi-database-gear', '#003b57', 2),
      (5, 'Redis In-Memory Cache', 88, 'bi bi-lightning-charge', '#dc2626', 3),
      (5, 'Database Migrations & Constraints', 94, 'bi bi-arrow-repeat', '#14b8a6', 4),

      (6, 'Gemini AI & LLM SDK Integration', 90, 'bi bi-robot', '#8b5cf6', 1),
      (6, 'RAG Pipelines & Vector Embeddings', 84, 'bi bi-puzzle', '#a855f7', 2),
      (6, 'OpenAI / HuggingFace APIs', 86, 'bi bi-stars', '#10b981', 3),

      (7, 'Pandas & NumPy Data Processing', 86, 'bi bi-graph-up', '#150458', 1),
      (7, 'ETL Data Pipeline Automation', 88, 'bi bi-funnel', '#d97706', 2),
      (7, 'Data Visualization & Reporting', 85, 'bi bi-pie-chart', '#0284c7', 3),

      (8, 'Docker & Containerization', 90, 'bi bi-box-seam', '#2496ed', 1),
      (8, 'Git & Collaborative Version Control', 96, 'bi bi-git', '#f05032', 2),
      (8, 'Linux Server Administration (Ubuntu)', 91, 'bi bi-ubuntu', '#e95420', 3),
      (8, 'CI/CD Pipelines (GitHub Actions)', 89, 'bi bi-check-all', '#2088ff', 4);

    -- Services Offered
    INSERT INTO services (title, icon_class, short_description, full_description, key_deliverables, order_index) VALUES
      ('Web Application Development', 'bi bi-browser-chrome', 'Building responsive, scalable, and cross-browser compliant applications.',
       'End-to-end full stack web application engineering utilizing modern architectural patterns. Clean separation of concerns, resilient UX, and seamless backend services.',
       'Interactive SPAs, Server-side rendered interfaces, responsive UI for mobile/desktop, production-ready deployments.', 1),
      ('Backend Development', 'bi bi-hdd-network', 'High-performance API servers and scalable business logic architectures.',
       'Robust backend engineering focused on throughput, data validation, domain-driven design, and strict test coverage.',
       'Modular services, clean OOP class design, background worker integration, high-concurrency request handling.', 2),
      ('Database Design & Management', 'bi bi-database-check', 'Normalized relational data structures, indexing, and tuning.',
       'Expert schema modeling in SQLite and PostgreSQL with strict referential integrity, automated migration paths, and query optimization.',
       'Entity Relationship Models, ACID compliance guarantees, zero-downtime schema migrations, query profiling.', 3),
      ('API Development & Integration', 'bi bi-bezier2', 'Secure RESTful & GraphQL endpoints with granular authentication.',
       'Crafting enterprise-grade API ecosystems with comprehensive OpenAPI documentation, rate limiting, and 3rd-party webhook integrations.',
       'Standardized REST endpoints, JWT/Bearer token authorization, rate-limiting policies, comprehensive Postman docs.', 4),
      ('Django Application Development', 'bi bi-file-earmark-code', 'MVT-driven Django web systems and Django REST Framework.',
       'Leveraging the power of Django for batteries-included security, ORM efficiency, template inheritance, and built-in administrative workflows.',
       'Custom Django apps, tailored ModelAdmin modules, dynamic forms with CSRF validation, signals and middleware.', 5),
      ('AI-Based System Development', 'bi bi-cpu', 'Intelligent agents, retrieval pipelines, and smart automation.',
       'Infusing software applications with cutting-edge Large Language Models, semantic search, automated document ingestion, and prompt workflows.',
       'Gemini / OpenAI API integrations, embeddings search, automated text synthesis, smart extraction tooling.', 6),
      ('System Analysis & Design', 'bi bi-diagram-2', 'Comprehensive architectural blueprints and system flow mapping.',
       'Evaluating business requirements to synthesize technical specifications, architecture diagrams, latency budgets, and security posture.',
       'UML diagrams, data-flow architectures, failure-mode analysis, technology stack recommendation reports.', 7),
      ('Software Consultancy', 'bi bi-briefcase', 'Code audits, technical debt mitigation, and engineering mentorship.',
       'Advising engineering teams and stakeholders on refactoring legacy systems, adopting CI/CD, and scaling database performance.',
       'Code quality reviews, security vulnerability assessments, performance audits, developer team workshops.', 8);

    -- Project Categories
    INSERT INTO project_categories (name, slug) VALUES
      ('Enterprise & Web Apps', 'enterprise'),
      ('Backend & APIs', 'backend'),
      ('AI & Data Systems', 'ai-data'),
      ('Developer Tools', 'dev-tools');

    -- Projects
    INSERT INTO projects (
      title, category_id, description, technologies, thumbnail_url, status,
      commencement_date, completion_date, github_url, live_url, key_features, is_featured, order_index
    ) VALUES
      (
        'ApexFleet - Logistics & Telemetry Orchestration Platform',
        1,
        'Enterprise fleet telemetry and route planning platform built with Django, PostGIS, and modern reactive dashboards. Handles real-time vehicle dispatching, fuel consumption analytics, and driver scheduling.',
        'Python, Django 5.0, PostgreSQL, PostGIS, Redis, WebSockets, Bootstrap 5, Chart.js',
        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
        'Completed',
        '2024-01-15',
        '2024-09-30',
        'https://github.com/example/apexfleet-telemetry',
        'https://demo.apexfleet.example.com',
        'Real-time GPS tracking over WebSockets, automated geofence event triggers, multi-tier RBAC for dispatchers and fleet managers, automated weekly PDF compliance reports.',
        1,
        1
      ),
      (
        'PayShield - Fraud Detection & Financial Gateway API',
        2,
        'High-throughput financial transaction processing engine featuring rule-based fraud scoring, idempotent webhooks, and automated dispute management.',
        'Python, Django REST Framework, SQLite/PostgreSQL, Celery, Docker, PyTest',
        'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80',
        'Completed',
        '2023-05-10',
        '2023-12-20',
        'https://github.com/example/payshield-fraud-engine',
        'https://payshield-api.example.com',
        'Sub-50ms fraud scoring algorithm, distributed token bucket rate-limiting, HMAC-SHA256 signature verification for inbound payment webhooks, PCI-DSS compliant data masking.',
        1,
        2
      ),
      (
        'DocuMind AI - Intelligent Knowledge Base & Semantic Search',
        3,
        'Retrieval-Augmented Generation (RAG) platform for engineering teams to query unstructured technical documentation and code repositories using natural language.',
        'Python, Gemini Pro SDK, Django, pgvector, React, Tailwind CSS',
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
        'Ongoing',
        '2024-08-01',
        NULL,
        'https://github.com/example/documind-ai',
        'https://documind.example.com',
        'Automated PDF & Markdown parsing, semantic chunking and vector storage, interactive citation-backed answers, multi-workspace access control.',
        1,
        3
      ),
      (
        'OmniStore - Multi-Tenant E-Commerce Core & Inventory Engine',
        1,
        'Scalable multi-tenant e-commerce engine with real-time stock reservations, dynamic discount calculation rules, and payment processor adapters.',
        'Python, Django, SQLite, Tailwind, Alpine.js, Stripe API',
        'https://images.unsplash.com/photo-1556742049-0a67e557224d?auto=format&fit=crop&w=800&q=80',
        'Completed',
        '2023-01-10',
        '2023-08-15',
        'https://github.com/example/omnistore-core',
        'https://omnistore-demo.example.com',
        'Isolated schema-based tenant tenancy, pessimistic locking for inventory checkout to prevent overselling, customizable storefront themes, automated invoice generation.',
        0,
        4
      ),
      (
        'SchemaDiff - Database Migration Verification & Linting CLI',
        4,
        'Open-source developer utility that analyzes Django migration dependency graphs, detects destructive column drops, and validates indexes before deployment.',
        'Python, Click, AST Parser, SQLite, GitHub Actions',
        'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
        'Completed',
        '2023-09-01',
        '2023-11-15',
        'https://github.com/example/django-schemadiff',
        'https://pypi.org/project/django-schemadiff/',
        'Static analysis of Django model alterations, automated backward compatibility checks, zero-dependency lightweight binary packaging, CLI exit code integration for CI.',
        0,
        5
      ),
      (
        'HealthSync - Clinical EHR Integration & FHIR HL7 Connector',
        2,
        'Healthcare interoperability service translating legacy hospital records into standardized FHIR JSON representations with HIPAA compliance auditing.',
        'Python, Django, Redis, Celery, PostgreSQL, Docker',
        'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
        'Ongoing',
        '2024-06-15',
        NULL,
        'https://github.com/example/healthsync-fhir',
        NULL,
        'Bidirectional HL7 v2 to FHIR R4 transformation, encrypted at-rest audit log trail, strict role-based access for medical practitioners, retry dead-letter queues.',
        0,
        6
      );

    -- Primary CV Document (Default)
    INSERT INTO cv_documents (version_title, file_name, file_size, is_active, cv_track, notes, summary_content, custom_highlights)
    VALUES (
      'Software Engineer - Full Stack & Systems Architect',
      'Cisse_Acquah_Senior_Software_Engineer_CV.pdf',
      '248 KB',
      1,
      'software_engineer',
      'Primary general public CV covering full-stack engineering, scalable Python/Django systems, and React interfaces.',
      'Comprehensive resume of Cisse Acquah detailing 6+ years of professional engineering experience, education from Oxford & Imperial, technical stack competencies, and verified project accomplishments.',
      'Full Stack Architecture, Python/Django Systems, PostgreSQL/SQLite Design, TypeScript/React Interfaces, Cloud Scalability'
    );

    -- Social Media
    INSERT INTO social_media (platform_name, profile_url, icon_class, is_active, order_index)
    VALUES
      ('GitHub', 'https://github.com/acquah-cisse', 'bi bi-github', 1, 1),
      ('LinkedIn', 'https://linkedin.com/in/cisse-acquah', 'bi bi-linkedin', 1, 2),
      ('WhatsApp', 'https://wa.me/233244762558', 'bi bi-whatsapp', 1, 3),
      ('Email', 'mailto:acquah.cisse1980@gmail.com', 'bi bi-envelope-at-fill', 1, 4),
      ('Twitter/X', 'https://x.com/cisse_dev', 'bi bi-twitter-x', 1, 5);

    -- Initial Activity Log
    INSERT INTO activity_logs (action_type, description)
    VALUES 
      ('System', 'Portfolio database initialized with enterprise models, projects, and skills.'),
      ('Security', 'Admin dashboard credentials and protected CV download workflows configured.');
  `);

  seedCaseStudiesIfMissing();
  seedCVTracksIfMissing();
}

initDatabase();
