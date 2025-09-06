# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Run the application:**
```bash
python app.py
```
The Flask development server runs on `http://localhost:5000` with debug mode enabled.

**Install dependencies:**
```bash
pip install -r requirements.txt
```

No specific lint, test, or build commands are configured for this project.

## Architecture Overview

This is a Flask-based flight tracking web application with the following architecture:

### Backend Structure
- **Main Application**: `app.py` - Single-file Flask application containing all routes, models, and API endpoints
- **Database**: SQLite with SQLAlchemy ORM, using two main models:
  - `User` - User authentication with email/password and Flask-Login
  - `Flight` - Flight records linked to users with comprehensive flight details
- **Authentication**: Flask-Login with session-based auth, password hashing via Werkzeug

### Frontend Structure
- **Static HTML Pages**: Located in `static/` directory serving as SPA-style pages
  - `index.html` - Main flight list view
  - `add-flight.html` - Flight entry form  
  - `stats.html` - Statistics dashboard
  - `login.html` / `signup.html` - Authentication pages
- **JavaScript**: Two main files in `static/js/`
  - `app.js` - Core application logic, flight management, statistics display
  - `auth.js` - Authentication form handling for login/signup
- **Styling**: Tailwind CSS with custom color palette (cornflower_blue, persian_indigo, ut_orange, etc.)

### API Design
RESTful JSON API with these endpoint groups:
- `/api/auth/*` - Authentication (signup, login, logout, status)
- `/api/flights` - CRUD operations for flights  
- `/api/stats` - Statistics calculations and aggregations

### Key Implementation Details
- Database automatically created on first run in `instance/flights.db`
- Frontend uses vanilla JavaScript with fetch API for all server communication
- Statistics calculations performed server-side including flight hours, countries visited, cabin class distribution
- Authentication required for all flight-related operations
- Simple file-based SQLite database suitable for single-user or small-scale deployment

### Development Patterns
- Single-page application behavior with client-side routing via URL paths
- Server serves static HTML files, client-side JS handles dynamic content
- All database models include `to_dict()` methods for JSON serialization
- Error handling with user-friendly messages both client and server side
- Responsive design with mobile-first Tailwind CSS approach