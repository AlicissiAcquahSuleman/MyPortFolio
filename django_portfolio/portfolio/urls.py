from django.urls import path
from . import views

urlpatterns = [
    path('', views.portfolio_home, name='portfolio_home'),
    path('project/<slug:slug>/', views.project_detail, name='project_detail'),
    path('employer-verification/', views.employer_verification, name='employer_verification'),
    path('download-cv/<str:token>/', views.protected_cv_download, name='protected_cv_download'),
    path('contact/submit/', views.submit_contact, name='submit_contact'),
    path('api/assistant/chat/', views.assistant_chat, name='assistant_chat'),
    path('admin/analytics/export/', views.export_analytics_csv, name='export_analytics_csv'),
]
