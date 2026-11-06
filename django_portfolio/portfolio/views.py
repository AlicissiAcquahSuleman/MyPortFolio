from django.shortcuts import render, get_object_or_404, redirect
from django.http import HttpResponse, Http404, JsonResponse
from django.contrib import messages
from django.utils import timezone
from datetime import timedelta
import io

from .models import (
    Profile, Education, WorkExperience, SkillCategory, Skill,
    Service, ProjectCategory, Project, CVDocument, EmployerRequest,
    ContactMessage, SocialMedia, WebsiteSettings
)
from .forms import EmployerVerificationForm, ContactForm

def portfolio_home(request):
    """
    Main landing page view assembling all portfolio sections.
    """
    # Track visitor counter
    settings = WebsiteSettings.objects.first()
    if settings:
        settings.visitor_count += 1
        settings.save(update_fields=['visitor_count'])

    profile = Profile.objects.first()
    education = Education.objects.all()
    experience = WorkExperience.objects.all()
    skill_categories = SkillCategory.objects.prefetch_related('skills').all()
    services = Service.objects.all()
    projects = Project.objects.select_related('category').all()
    project_categories = ProjectCategory.objects.all()
    active_cv = CVDocument.objects.filter(is_active=True).first()
    socials = SocialMedia.objects.filter(is_active=True)

    context = {
        'profile': profile,
        'settings': settings,
        'education': education,
        'experience': experience,
        'skill_categories': skill_categories,
        'services': services,
        'projects': projects,
        'project_categories': project_categories,
        'active_cv': active_cv,
        'socials': socials,
        'contact_form': ContactForm(),
        'employer_form': EmployerVerificationForm(),
    }
    return render(request, 'portfolio/index.html', context)

def project_detail(request, slug):
    """
    Detailed project showcase view.
    """
    project = get_object_or_404(Project, slug=slug)
    return render(request, 'portfolio/project_detail.html', {'project': project})

def employer_verification(request):
    """
    Employer Verification Workflow (Scenario A).
    Validates employer details, creates download token, and authorizes CV download.
    """
    if request.method == 'POST':
        form = EmployerVerificationForm(request.POST)
        if form.is_valid():
            employer_req = form.save(commit=False)
            employer_req.token_expires_at = timezone.now() + timedelta(hours=48)
            employer_req.status = 'Approved'
            employer_req.save()

            messages.success(
                request,
                f"Employer verification successful! Access granted for {employer_req.company_name}. Downloading official CV now."
            )
            return redirect('protected_cv_download', token=str(employer_req.download_token))
        else:
            messages.error(request, "Please correct the errors in the employer verification form.")
    else:
        form = EmployerVerificationForm()

    return render(request, 'portfolio/employer_form.html', {'form': form})

def protected_cv_download(request, token):
    """
    Backend-protected CV download view.
    Prevents direct URL guessing by validating a one-time or time-limited download token.
    """
    employer_req = get_object_or_404(EmployerRequest, download_token=token)

    # Check token expiration
    if employer_req.token_expires_at and timezone.now() > employer_req.token_expires_at:
        messages.error(request, "This CV download link has expired. Please verify again.")
        return redirect('portfolio_home')

    # Update download status
    employer_req.is_downloaded = True
    employer_req.downloaded_at = timezone.now()
    employer_req.save(update_fields=['is_downloaded', 'downloaded_at'])

    active_cv = CVDocument.objects.filter(is_active=True).first()

    # If physical file is uploaded in CVDocument, serve it securely
    if active_cv and active_cv.cv_file:
        response = HttpResponse(active_cv.cv_file.read(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{active_cv.file_name}"'
        return response

    # Dynamic PDF generation fallback via ReportLab
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.pdfgen import canvas

        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        profile = Profile.objects.first()

        p.setFont("Helvetica-Bold", 18)
        p.drawString(50, 750, profile.full_name if profile else "Software Developer CV")
        p.setFont("Helvetica", 12)
        p.drawString(50, 730, profile.professional_title if profile else "Senior Software Engineer")
        p.drawString(50, 710, f"Email: {profile.email} | Phone: {profile.phone}")
        p.line(50, 700, 550, 700)

        p.setFont("Helvetica-Bold", 14)
        p.drawString(50, 670, "Summary")
        p.setFont("Helvetica", 10)
        p.drawString(50, 650, (profile.personal_intro if profile else "")[:95])

        p.drawString(50, 100, f"Verified Employer Download - Access Token: {token}")
        p.showPage()
        p.save()

        buffer.seek(0)
        return HttpResponse(buffer, content_type='application/pdf')
    except ImportError:
        # Fallback text file
        content = f"OFFICIAL CURRICULUM VITAE\nName: {profile.full_name}\nTitle: {profile.professional_title}\nEmail: {profile.email}\nPhone: {profile.phone}\nToken: {token}"
        response = HttpResponse(content, content_type='text/plain')
        response['Content-Disposition'] = 'attachment; filename="CV.txt"'
        return response

def submit_contact(request):
    """
    Handles Contact Me form submissions.
    """
    if request.method == 'POST':
        form = ContactForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "Your message has been received! I will get in touch with you shortly.")
        else:
            messages.error(request, "Failed to submit message. Please check the fields.")
    return redirect('portfolio_home')

def assistant_chat(request):
    """
    AI Portfolio Assistant endpoint in Django.
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'POST method required'}, status=405)
    
    import json
    try:
        data = json.loads(request.body.decode('utf-8'))
        message = data.get('message', '').strip()
    except Exception:
        message = request.POST.get('message', '').strip()

    if not message:
        return JsonResponse({'error': 'Message text is required'}, status=400)

    # Database Grounding in Django
    profile = Profile.objects.first()
    projects = list(Project.objects.filter(is_draft=False).values('title', 'technologies', 'status', 'description'))

    reply = f"Hello! Cisse is a {profile.professional_title if profile else 'Senior Software Engineer'} based in Ghana with direct WhatsApp +233244762558. Cisse has engineered {len(projects)} featured production systems including Python/Django backend architectures, AI diagnostics, and modern reactive dashboards."

    return JsonResponse({
        'reply': reply,
        'actions': [
            {'label': 'Request Verified CV', 'action': 'open_cv'},
            {'label': 'Chat on WhatsApp', 'action': 'open_whatsapp'}
        ]
    })

def export_analytics_csv(request):
    """
    Admin CSV Export for Employer Inquiries & Analytics (Section 18).
    """
    import csv

    response = HttpResponse(content_type='text/csv; charset=utf-8')
    response['Content-Disposition'] = f'attachment; filename="employer_inquiries_{timezone.now().date()}.csv"'

    writer = csv.writer(response)
    writer.writerow([
        'Request ID', 'Date Created', 'Contact Name', 'Organization',
        'Email Address', 'Phone', 'Role / Position', 'Purpose',
        'Review Status', 'CV Downloaded', 'Downloaded At'
    ])

    for req in EmployerRequest.objects.all():
        writer.writerow([
            req.id,
            req.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            req.full_name,
            req.company_name,
            req.email,
            req.phone,
            req.position,
            req.purpose,
            req.review_status,
            'Yes' if req.is_downloaded else 'No',
            req.downloaded_at.strftime('%Y-%m-%d %H:%M:%S') if req.downloaded_at else 'N/A'
        ])

    return response
