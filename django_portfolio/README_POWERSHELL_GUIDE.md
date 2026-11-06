# PERSONAL SOFTWARE DEVELOPER PORTFOLIO - DJANGO SETUP & RUN GUIDE

This document provides step-by-step instructions for running the Django web application on Windows using PowerShell.

---

## 1. Prerequisites
- Python 3.10+ installed and added to PATH
- Git (optional)

---

## 2. Windows PowerShell Setup Commands

Open Windows PowerShell in the project directory (`cd django_portfolio`) and execute:

```powershell
# Step 1: Create a virtual environment
python -m venv venv

# Step 2: Activate the virtual environment
.\venv\Scripts\Activate.ps1

# (If PowerShell displays execution policy error, run once: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser)

# Step 3: Upgrade pip and install required packages
python -m pip install --upgrade pip
pip install -r requirements.txt

# Step 4: Make and apply database migrations (creates SQLite db.sqlite3)
python manage.py makemigrations
python manage.py migrate

# Step 5: Create administrative superuser account
python manage.py createsuperuser
# Enter your username, email, and password when prompted.

# Step 6: Launch the development web server
python manage.py runserver 127.0.0.1:8000
```

---

## 3. Accessing the Website & Admin Portal

- **Public Portfolio Website:** Open `http://127.0.0.1:8000/` in your browser.
- **Django Administrative Dashboard:** Open `http://127.0.0.1:8000/admin/` and log in with your superuser credentials.

---

## 4. Key Architectural Features Implemented

1. **Model-View-Template (MVT) Architecture:** Clean separation between models, views, and Bootstrap templates.
2. **Employer Verification & Protected CV Download:**
   - Visitor clicks "Download My CV" -> Modal prompts: "Please, are you an employer wanting to be serviced?"
   - **YES:** Collects official employer credentials, creates a unique UUID token, and initiates protected download.
   - **NO:** Prompts WhatsApp contact redirection to your configured phone number.
   - Protected download view prevents guessing direct file URLs.
3. **Admin Dashboard CRUD Modules:**
   - Profile & Biography
   - Educational Background
   - Work Experience Timeline
   - Technical Skills (with category grouping and proficiency ratings)
   - Software Services Offered
   - Projects Management (Ongoing vs Completed filtering)
   - CV Versions & Activation
   - Employer Verification Requests & Download Tracker
   - Contact Messages Inbox
   - Social Media Links
   - Website Settings & Visitor Analytics
4. **Database Migration to PostgreSQL:**
   - To switch to PostgreSQL, install `psycopg2-binary` and update the `DATABASES` dictionary in `portfolio_project/settings.py` with your database credentials.
