from django import forms
from .models import EmployerRequest, ContactMessage

class EmployerVerificationForm(forms.ModelForm):
    PURPOSE_CHOICES = [
        ('Full-time Employment Opportunity', 'Full-time Senior Engineering Role'),
        ('Contract / Freelance Project', 'Contract / Independent Consulting'),
        ('Technical Advisory / Architecture', 'Technical Advisory / Fractional Lead'),
        ('Executive Recruitment', 'Executive Technical Search'),
        ('Other Business Service', 'Other Business Service'),
    ]

    purpose = forms.ChoiceField(
        choices=PURPOSE_CHOICES,
        widget=forms.Select(attrs={'class': 'form-select'})
    )

    class Meta:
        model = EmployerRequest
        fields = ['full_name', 'company_name', 'email', 'phone', 'position', 'purpose', 'message']
        widgets = {
            'full_name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'e.g. Sarah Jenkins'}),
            'company_name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'e.g. Acme Tech Solutions'}),
            'email': forms.EmailInput(attrs={'class': 'form-control', 'placeholder': 's.jenkins@acme.com'}),
            'phone': forms.TextInput(attrs={'class': 'form-control', 'placeholder': '+233 24 476 2558'}),
            'position': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'e.g. VP of Engineering'}),
            'message': forms.Textarea(attrs={'class': 'form-control', 'rows': 3, 'placeholder': 'Role description or project scope (optional)...'}),
        }

class ContactForm(forms.ModelForm):
    class Meta:
        model = ContactMessage
        fields = ['name', 'email', 'subject', 'message']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Your Name'}),
            'email': forms.EmailInput(attrs={'class': 'form-control', 'placeholder': 'your.email@domain.com'}),
            'subject': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Subject of enquiry'}),
            'message': forms.Textarea(attrs={'class': 'form-control', 'rows': 4, 'placeholder': 'How can I help you?'}),
        }
