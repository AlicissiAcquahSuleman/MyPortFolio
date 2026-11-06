from django.contrib import admin
from django.utils.html import format_html
from .models import (
    Profile, Education, WorkExperience, SkillCategory, Skill,
    Service, ProjectCategory, Project, CVDocument, EmployerRequest,
    ContactMessage, SocialMedia, WebsiteSettings
)

admin.site.site_header = "DevPortfolio - Administrative Dashboard"
admin.site.site_title = "Developer Portfolio Admin"
admin.site.index_title = "Portfolio Management Portal"

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'professional_title', 'email', 'phone', 'whatsapp_number', 'updated_at')

@admin.register(Education)
class EducationAdmin(admin.ModelAdmin):
    list_display = ('degree', 'institution', 'start_year', 'end_year', 'grade_or_honors', 'order_index')
    list_editable = ('order_index',)

@admin.register(WorkExperience)
class WorkExperienceAdmin(admin.ModelAdmin):
    list_display = ('job_title', 'company', 'start_date', 'end_date', 'is_current', 'order_index')
    list_filter = ('is_current',)
    list_editable = ('order_index',)

class SkillInline(admin.TabularInline):
    model = Skill
    extra = 1

@admin.register(SkillCategory)
class SkillCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'order_index')
    prepopulated_fields = {'slug': ('name',)}
    inlines = [SkillInline]

@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'proficiency_percent', 'badge_preview', 'order_index')
    list_filter = ('category',)
    list_editable = ('proficiency_percent', 'order_index')

    def badge_preview(self, obj):
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 4px;">{}</span>',
            obj.badge_color,
            f"{obj.proficiency_percent}%"
        )
    badge_preview.short_description = 'Proficiency'

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('title', 'icon_class', 'order_index')
    list_editable = ('order_index',)

@admin.register(ProjectCategory)
class ProjectCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'status_badge', 'commencement_date', 'is_featured', 'order_index')
    list_filter = ('status', 'category', 'is_featured')
    search_fields = ('title', 'description', 'technologies')
    prepopulated_fields = {'slug': ('title',)}
    list_editable = ('is_featured', 'order_index')

    def status_badge(self, obj):
        colors = {
            'Completed': '#10b981',
            'Ongoing': '#f59e0b',
            'On Hold': '#6b7280'
        }
        color = colors.get(obj.status, '#3b82f6')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 4px; font-weight: bold;">{}</span>',
            color,
            obj.status
        )
    status_badge.short_description = 'Status'

@admin.register(CVDocument)
class CVDocumentAdmin(admin.ModelAdmin):
    list_display = ('version_title', 'file_name', 'file_size', 'is_active', 'upload_date')
    list_filter = ('is_active',)

@admin.register(EmployerRequest)
class EmployerRequestAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'company_name', 'email', 'position', 'purpose', 'download_status', 'created_at')
    list_filter = ('status', 'is_downloaded', 'created_at')
    search_fields = ('full_name', 'company_name', 'email')
    readonly_fields = ('download_token', 'downloaded_at', 'created_at')

    def download_status(self, obj):
        if obj.is_downloaded:
            return format_html('<span style="color: #10b981; font-weight: bold;">Downloaded</span>')
        return format_html('<span style="color: #ef4444;">Not Yet</span>')
    download_status.short_description = 'CV Downloaded'

@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'subject', 'is_read', 'created_at')
    list_filter = ('is_read', 'created_at')
    search_fields = ('name', 'email', 'subject', 'message')
    list_editable = ('is_read',)

@admin.register(SocialMedia)
class SocialMediaAdmin(admin.ModelAdmin):
    list_display = ('platform_name', 'profile_url', 'is_active', 'order_index')
    list_editable = ('is_active', 'order_index')

@admin.register(WebsiteSettings)
class WebsiteSettingsAdmin(admin.ModelAdmin):
    list_display = ('site_title', 'whatsapp_number', 'visitor_count')
