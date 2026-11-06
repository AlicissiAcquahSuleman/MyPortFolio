import React, { useState } from 'react';

interface DjangoGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DjangoGuideModal: React.FC<DjangoGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'powershell' | 'structure' | 'models' | 'views' | 'urls' | 'admin' | 'settings'>('powershell');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const powershellGuide = `# ==============================================================
# WINDOWS POWERSHELL SETUP & DEPLOYMENT COMMANDS
# Personal Software Developer Portfolio (Django Framework)
# ==============================================================

# 1. Open Windows PowerShell in your project folder
cd django_portfolio

# 2. Create isolated Python virtual environment
python -m venv venv

# 3. Activate the virtual environment
.\\venv\\Scripts\\Activate.ps1

# (Optional: If execution policy blocks scripts, run once:
# Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser)

# 4. Upgrade pip and install required dependencies
python -m pip install --upgrade pip
pip install -r requirements.txt

# 5. Execute initial database migrations (creates SQLite db.sqlite3)
python manage.py makemigrations
python manage.py migrate

# 6. Create Django Administrator superuser
python manage.py createsuperuser
# -> Enter username (e.g. admin), email, and secure password

# 7. Start local development server
python manage.py runserver 127.0.0.1:8000

# --------------------------------------------------------------
# Access URLs:
# Public Portfolio:  http://127.0.0.1:8000/
# Admin Dashboard:   http://127.0.0.1:8000/admin/
# --------------------------------------------------------------`;

  const structureGuide = `django_portfolio/
│
├── manage.py                     # Django CLI command runner
├── requirements.txt              # Django, Pillow, reportlab, psycopg2-binary
├── README_POWERSHELL_GUIDE.md    # Windows execution guide
│
├── portfolio_project/            # Project configuration package
│   ├── __init__.py
│   ├── settings.py               # SQLite & PostgreSQL database settings
│   ├── urls.py                   # Master URL routing
│   ├── wsgi.py                   # WSGI production entry
│   └── asgi.py                   # ASGI asynchronous entry
│
├── portfolio/                    # Core portfolio application
│   ├── __init__.py
│   ├── admin.py                  # Custom Django Admin registrations
│   ├── apps.py                   # App configuration
│   ├── forms.py                  # Employer verification & Contact forms
│   ├── models.py                 # 12 MVT database models with constraints
│   ├── urls.py                   # App URL endpoints
│   ├── views.py                  # MVT views, protected CV downloads
│   └── migrations/               # Database schema version history
│
└── templates/                    # Reusable HTML5 / Bootstrap 5 templates
    ├── base.html                 # Navigation, master layouts & alerts
    └── portfolio/
        ├── index.html            # Public portfolio landing page
        ├── employer_form.html    # Employer verification page
        └── project_detail.html   # Detailed project view`;

  const modelsCode = `from django.db import models
from django.utils.text import slugify
import uuid

class Profile(models.Model):
    full_name = models.CharField(max_length=150)
    professional_title = models.CharField(max_length=150, default="Senior Software Engineer")
    personal_intro = models.CharField(max_length=300)
    bio = models.TextField()
    email = models.EmailField()
    phone = models.CharField(max_length=50)
    location = models.CharField(max_length=150, default="London, UK")
    career_interests = models.TextField()
    technical_specialisations = models.TextField()
    whatsapp_number = models.CharField(max_length=30)
    updated_at = models.DateTimeField(auto_now=True)

class Project(models.Model):
    STATUS_CHOICES = [('Ongoing', 'Ongoing'), ('Completed', 'Completed'), ('On Hold', 'On Hold')]
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    category = models.ForeignKey('ProjectCategory', on_delete=models.SET_NULL, null=True)
    description = models.TextField()
    technologies = models.CharField(max_length=300)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Completed')
    commencement_date = models.DateField()
    completion_date = models.DateField(blank=True, null=True)
    github_url = models.URLField(blank=True, null=True)
    live_url = models.URLField(blank=True, null=True)
    key_features = models.TextField()
    is_featured = models.BooleanField(default=False)

class EmployerRequest(models.Model):
    full_name = models.CharField(max_length=150)
    company_name = models.CharField(max_length=200)
    email = models.EmailField()
    phone = models.CharField(max_length=50)
    position = models.CharField(max_length=150)
    purpose = models.CharField(max_length=200)
    message = models.TextField(blank=True, null=True)
    download_token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    token_expires_at = models.DateTimeField(null=True, blank=True)
    is_downloaded = models.BooleanField(default=False)
    downloaded_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=30, default='Approved')
    created_at = models.DateTimeField(auto_now_add=True)`;

  const viewsCode = `from django.shortcuts import render, get_object_or_404, redirect
from django.http import HttpResponse, Http404
from django.utils import timezone
from .models import Profile, Project, EmployerRequest, CVDocument
from .forms import EmployerVerificationForm, ContactForm

def employer_verification(request):
    """
    Employer Verification Workflow (Scenario A).
    Validates employer details, generates secure download token, and authorizes CV download.
    """
    if request.method == 'POST':
        form = EmployerVerificationForm(request.POST)
        if form.is_valid():
            employer_req = form.save(commit=False)
            employer_req.token_expires_at = timezone.now() + timezone.timedelta(hours=48)
            employer_req.status = 'Approved'
            employer_req.save()
            return redirect('protected_cv_download', token=str(employer_req.download_token))
    else:
        form = EmployerVerificationForm()
    return render(request, 'portfolio/employer_form.html', {'form': form})

def protected_cv_download(request, token):
    """
    Backend-protected CV download view.
    Prevents direct URL guessing by validating the authorized token.
    """
    employer_req = get_object_or_404(EmployerRequest, download_token=token)
    employer_req.is_downloaded = True
    employer_req.downloaded_at = timezone.now()
    employer_req.save(update_fields=['is_downloaded', 'downloaded_at'])

    active_cv = CVDocument.objects.filter(is_active=True).first()
    if active_cv and active_cv.cv_file:
        response = HttpResponse(active_cv.cv_file.read(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{active_cv.file_name}"'
        return response
    return HttpResponse("Official Software Engineer CV", content_type='application/pdf')`;

  const getCodeContent = () => {
    switch (activeTab) {
      case 'powershell': return powershellGuide;
      case 'structure': return structureGuide;
      case 'models': return modelsCode;
      case 'views': return viewsCode;
      case 'urls': return `from django.urls import path\nfrom . import views\n\nurlpatterns = [\n    path('', views.portfolio_home, name='portfolio_home'),\n    path('project/<slug:slug>/', views.project_detail, name='project_detail'),\n    path('employer-verification/', views.employer_verification, name='employer_verification'),\n    path('download-cv/<str:token>/', views.protected_cv_download, name='protected_cv_download'),\n    path('contact/submit/', views.submit_contact, name='submit_contact'),\n]`;
      case 'admin': return `@admin.register(EmployerRequest)\nclass EmployerRequestAdmin(admin.ModelAdmin):\n    list_display = ('full_name', 'company_name', 'email', 'position', 'is_downloaded', 'created_at')\n    list_filter = ('status', 'is_downloaded')\n    readonly_fields = ('download_token', 'downloaded_at')\n\n@admin.register(Project)\nclass ProjectAdmin(admin.ModelAdmin):\n    list_display = ('title', 'category', 'status', 'commencement_date', 'is_featured')\n    list_filter = ('status', 'category')\n    search_fields = ('title', 'description', 'technologies')`;
      case 'settings': return `DATABASES = {\n    'default': {\n        'ENGINE': 'django.db.backends.sqlite3',\n        'NAME': BASE_DIR / 'db.sqlite3',\n    }\n}\n# For PostgreSQL migration, install psycopg2-binary and configure:\n# DATABASES = {\n#     'default': {\n#         'ENGINE': 'django.db.backends.postgresql',\n#         'NAME': 'portfolio_db',\n#         'USER': 'postgres_user',\n#         'PASSWORD': 'secret_password',\n#         'HOST': 'localhost',\n#         'PORT': '5432',\n#     }\n# }`;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCodeContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <i className="bi bi-filetype-py text-lg"></i>
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">
                Django Framework Project &amp; PowerShell Guide
              </h3>
              <p className="text-[11px] text-slate-400">
                Complete MVT backend structure, database models, and Windows setup instructions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <i className="bi bi-x-lg text-sm"></i>
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-2 px-6 py-3 bg-slate-950/70 border-b border-slate-800 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('powershell')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'powershell' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <i className="bi bi-terminal"></i> PowerShell Setup
          </button>
          <button
            onClick={() => setActiveTab('structure')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'structure' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <i className="bi bi-folder-symlink"></i> Directory Structure
          </button>
          <button
            onClick={() => setActiveTab('models')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'models' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            models.py
          </button>
          <button
            onClick={() => setActiveTab('views')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'views' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            views.py
          </button>
          <button
            onClick={() => setActiveTab('urls')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'urls' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            urls.py
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'admin' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            admin.py
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'settings' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            settings.py (DB)
          </button>
        </div>

        {/* Code Content View */}
        <div className="p-6 overflow-y-auto flex-1 font-mono text-xs bg-slate-950">
          <div className="flex items-center justify-between mb-3 text-slate-400">
            <span>Viewing: {activeTab === 'powershell' ? 'Windows PowerShell Execution Script' : activeTab}</span>
            <button
              onClick={handleCopy}
              className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center gap-1 text-[11px]"
            >
              <i className={`bi ${copied ? 'bi-check-lg text-emerald-400' : 'bi-clipboard'}`}></i>
              {copied ? 'Copied to Clipboard' : 'Copy Code'}
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 overflow-x-auto whitespace-pre leading-relaxed">
            {getCodeContent()}
          </pre>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            All code files are located in <code className="text-emerald-400 font-mono">/django_portfolio/</code> in this repository.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium"
          >
            Close Guide
          </button>
        </div>

      </div>
    </div>
  );
};
