"""
Django Models for Personal Software Developer Portfolio.
Implements OOP principles, proper foreign keys, database constraints, and timestamps.
"""
from django.db import models
from django.utils.text import slugify
from django.urls import reverse
import uuid

class Profile(models.Model):
    full_name = models.CharField(max_length=150, help_text="Full legal/professional name")
    professional_title = models.CharField(max_length=150, default="Senior Software Engineer")
    personal_intro = models.CharField(max_length=300, help_text="One-sentence headline summary")
    bio = models.TextField(help_text="Detailed professional biography")
    profile_image = models.ImageField(upload_to='profile/', null=True, blank=True)
    profile_image_url = models.URLField(max_length=500, blank=True, null=True, help_text="Fallback web image URL")
    email = models.EmailField()
    phone = models.CharField(max_length=50, default="+233 24 476 2558")
    location = models.CharField(max_length=250, default="HSE N0: E57/15, Hot-Coffee Down, Near Buza-11, Opposite the Shia-Mosque Nima-Accra, Ghana")
    career_interests = models.TextField(help_text="Primary engineering domains of interest")
    technical_specialisations = models.TextField(help_text="Core stack specialisations")
    whatsapp_number = models.CharField(max_length=30, default="+233244762558")
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.full_name} ({self.professional_title})"

class Education(models.Model):
    degree = models.CharField(max_length=150)
    institution = models.CharField(max_length=200)
    field_of_study = models.CharField(max_length=150)
    start_year = models.CharField(max_length=10)
    end_year = models.CharField(max_length=10)
    grade_or_honors = models.CharField(max_length=100, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    order_index = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order_index', '-start_year']
        verbose_name_plural = "Education"

    def __str__(self):
        return f"{self.degree} - {self.institution}"

class WorkExperience(models.Model):
    job_title = models.CharField(max_length=150)
    company = models.CharField(max_length=150)
    location = models.CharField(max_length=150)
    start_date = models.CharField(max_length=30, help_text="e.g. 2022-03 or Mar 2022")
    end_date = models.CharField(max_length=30, default="Present")
    is_current = models.BooleanField(default=False)
    description = models.TextField()
    accomplishments = models.TextField(blank=True, null=True)
    order_index = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order_index', '-id']

    def __str__(self):
        return f"{self.job_title} at {self.company}"

class SkillCategory(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    order_index = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order_index', 'name']
        verbose_name_plural = "Skill Categories"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class Skill(models.Model):
    category = models.ForeignKey(SkillCategory, on_delete=models.CASCADE, related_name='skills')
    name = models.CharField(max_length=100)
    proficiency_percent = models.PositiveIntegerField(default=85, help_text="1 to 100")
    icon_class = models.CharField(max_length=100, default="bi bi-code-slash")
    badge_color = models.CharField(max_length=30, default="#3b82f6")
    order_index = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order_index', '-proficiency_percent']

    def __str__(self):
        return f"{self.name} ({self.proficiency_percent}%)"

class Service(models.Model):
    title = models.CharField(max_length=150)
    icon_class = models.CharField(max_length=100, default="bi bi-laptop")
    short_description = models.CharField(max_length=250)
    full_description = models.TextField()
    key_deliverables = models.TextField(blank=True, null=True)
    order_index = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order_index']

    def __str__(self):
        return self.title

class ProjectCategory(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120, unique=True, blank=True)

    class Meta:
        verbose_name_plural = "Project Categories"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class Project(models.Model):
    STATUS_CHOICES = [
        ('Ongoing', 'Ongoing'),
        ('Completed', 'Completed'),
        ('On Hold', 'On Hold'),
    ]

    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    category = models.ForeignKey(ProjectCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='projects')
    description = models.TextField()
    technologies = models.CharField(max_length=300, help_text="Comma-separated technologies")
    thumbnail = models.ImageField(upload_to='projects/', blank=True, null=True)
    thumbnail_url = models.URLField(max_length=500, blank=True, null=True, help_text="Web image URL")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Completed')
    commencement_date = models.DateField()
    completion_date = models.DateField(blank=True, null=True)
    github_url = models.URLField(blank=True, null=True)
    live_url = models.URLField(blank=True, null=True)
    key_features = models.TextField(help_text="Key features and technical architecture highlights")
    is_featured = models.BooleanField(default=False)
    order_index = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    # 17-Point Detailed Project Case Study Fields (Section 17)
    problem_statement = models.TextField(blank=True, null=True, help_text="Background and problem statement")
    project_objectives = models.TextField(blank=True, null=True, help_text="Project objectives and goals")
    proposed_solution = models.TextField(blank=True, null=True, help_text="Proposed solution architecture")
    system_architecture = models.TextField(blank=True, null=True, help_text="System architecture and design")
    database_design = models.TextField(blank=True, null=True, help_text="Relational database schema strategy")
    implementation_process = models.TextField(blank=True, null=True, help_text="Implementation process and sprints")
    challenges_encountered = models.TextField(blank=True, null=True, help_text="Engineering challenges")
    solutions_implemented = models.TextField(blank=True, null=True, help_text="Technical solutions applied")
    project_outcomes = models.TextField(blank=True, null=True, help_text="Quantifiable outcomes and achievements")
    future_improvements = models.TextField(blank=True, null=True, help_text="Future improvements roadmap")
    screenshots_gallery = models.TextField(blank=True, null=True, help_text="JSON array of screenshot objects {url, caption}")
    is_draft = models.BooleanField(default=False, help_text="Draft mode hides project from public portfolio")
    view_count = models.PositiveIntegerField(default=0)
    github_click_count = models.PositiveIntegerField(default=0)
    live_demo_click_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order_index', '-is_featured', '-created_at']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        return reverse('project_detail', kwargs={'slug': self.slug})

    def __str__(self):
        return f"{self.title} [{self.status}]"

class CVDocument(models.Model):
    TRACK_CHOICES = [
        ('software_engineer', 'Software Engineer'),
        ('django_backend', 'Python & Django Backend'),
        ('data_science', 'Data Science & Analytics'),
        ('ai_ml', 'AI & Machine Learning Systems'),
    ]

    version_title = models.CharField(max_length=150)
    cv_file = models.FileField(upload_to='cv_documents/', blank=True, null=True)
    file_name = models.CharField(max_length=200, default="Senior_Software_Engineer_CV.pdf")
    file_size = models.CharField(max_length=50, default="248 KB")
    cv_track = models.CharField(max_length=50, choices=TRACK_CHOICES, default='software_engineer')
    custom_highlights = models.TextField(blank=True, null=True, help_text="Track-specific custom highlights callout")
    download_count = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=False, help_text="Determines which CV version is active default")
    upload_date = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)
    summary_content = models.TextField(blank=True, null=True)

    def save(self, *args, **kwargs):
        if self.is_active:
            CVDocument.objects.filter(is_active=True).update(is_active=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.version_title} ({self.cv_track}) {'[Active]' if self.is_active else ''}"

class EmployerRequest(models.Model):
    STATUS_CHOICES = [
        ('Approved', 'Approved'),
        ('Pending', 'Pending'),
        ('Contacted', 'Contacted'),
        ('Archived', 'Archived'),
    ]

    REVIEW_CHOICES = [
        ('Pending', 'Pending'),
        ('Reviewed', 'Reviewed'),
        ('Contacted', 'Contacted'),
        ('Resolved', 'Resolved'),
    ]

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
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='Approved')
    review_status = models.CharField(max_length=30, choices=REVIEW_CHOICES, default='Pending')
    cv_version = models.ForeignKey(CVDocument, on_delete=models.SET_NULL, null=True, blank=True)
    admin_notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.full_name} ({self.company_name}) - {self.review_status}"

class ContactMessage(models.Model):
    name = models.CharField(max_length=150)
    email = models.EmailField()
    subject = models.CharField(max_length=250)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.subject}"

class SocialMedia(models.Model):
    platform_name = models.CharField(max_length=80)
    profile_url = models.URLField()
    icon_class = models.CharField(max_length=100, default="bi bi-link-45deg")
    is_active = models.BooleanField(default=True)
    order_index = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order_index']

    def __str__(self):
        return self.platform_name

class WebsiteSettings(models.Model):
    site_title = models.CharField(max_length=200, default="Software Developer Portfolio")
    meta_description = models.TextField()
    whatsapp_number = models.CharField(max_length=30, default="+233244762558")
    hero_headline = models.CharField(max_length=250)
    hero_subheadline = models.TextField()
    visitor_count = models.PositiveIntegerField(default=0)
    # AI Assistant controls (Section 16)
    ai_assistant_enabled = models.BooleanField(default=True)
    ai_assistant_name = models.CharField(max_length=100, default="DevBot")
    ai_welcome_message = models.TextField(default="Hello! I am Cisse's AI Portfolio Assistant. How can I help you today?")

    def __str__(self):
        return self.site_title

class AnalyticsEvent(models.Model):
    EVENT_TYPES = [
        ('page_view', 'Page View'),
        ('project_view', 'Project View'),
        ('github_click', 'GitHub Click'),
        ('live_demo_click', 'Live Demo Click'),
        ('cv_download', 'CV Download'),
        ('chat_interaction', 'Chat Interaction'),
    ]

    event_type = models.CharField(max_length=50, choices=EVENT_TYPES)
    target_id = models.IntegerField(null=True, blank=True)
    target_name = models.CharField(max_length=255, null=True, blank=True)
    path = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.event_type} - {self.target_name} ({self.created_at})"
