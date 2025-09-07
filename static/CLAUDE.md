# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Install dependencies:**
```bash
pip install -r requirements.txt
```

**Run the application:**
```bash
python app.py
```
The Flask development server runs on `http://localhost:5001` (default port changed from 5000) with debug mode configurable via FLASK_DEBUG environment variable.

**Initialize database (if needed):**
```bash
python -c "from app import app, db; app.app_context().push(); db.create_all()"
```

No specific lint, test, or build commands are configured for this project.

## Architecture Overview

This is a Flask-based personal flight tracking web application with the following architecture:

### Backend Structure
- **Main Application**: `app.py` - Single-file Flask application containing all routes, models, and API endpoints (500 lines)
- **Database**: PostgreSQL with SQLAlchemy ORM (previously SQLite, now migrated)
  - Supports both `DATABASE_URL` environment variable and individual DB parameters
  - Automatically handles Heroku/Render postgres:// to postgresql:// conversion
  - Two main models:
    - `User` - User authentication with email/password and Flask-Login
    - `Flight` - Flight records linked to users with comprehensive flight details
- **Authentication**: Flask-Login with session-based auth, password hashing via Werkzeug
- **Security**: Input validation and sanitization for email, airport codes, and text fields

### Frontend Structure
- **Static HTML Pages**: Located in `static/` directory serving as SPA-style pages
  - `index.html` - Main flight list view with card-based layout
  - `add-flight.html` - Comprehensive flight entry form (22KB)
  - `stats.html` - Statistics dashboard with charts and analytics
  - `map.html` - Flight map page (placeholder for future interactive map)
  - `login.html` / `signup.html` - Authentication pages
  - `design-system.html` - Design system documentation
- **JavaScript**: Two main files in `static/js/`
  - `app.js` - Core application logic, flight management, statistics display (15KB)
  - `auth.js` - Authentication form handling for login/signup (4KB)
- **Styling**: Tailwind CSS CDN with custom color palette:
  - persian_indigo, cornflower_blue, periwinkle, anti_flash_white, ut_orange
  - Mobile-responsive with bottom navigation bar
  - Inter font family from Google Fonts

### API Design
RESTful JSON API with these endpoints:

**Authentication** (`/api/auth/*`):
- `POST /api/auth/signup` - User registration with email validation
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/status` - Check authentication status

**Flights** (`/api/flights`):
- `GET /api/flights` - Get all user's flights (ordered by date)
- `POST /api/flights` - Create new flight with automatic duration calculation
- `GET /api/flights/<id>` - Get specific flight details
- `DELETE /api/flights/<id>` - Delete a flight

**Statistics** (`/api/stats`):
- `GET /api/stats` - Get comprehensive statistics including:
  - Total flights, hours, countries visited, miles flown
  - Cabin class distribution with percentages
  - Top 5 destinations
  - Monthly activity for current year

### Key Implementation Details
- **Database**: PostgreSQL with automatic table creation on startup
  - Connection via DATABASE_URL or individual parameters (DB_USER, DB_PASSWORD, etc.)
  - Support for both local development and production deployment
- **Flight Duration**: Automatically calculated from departure/arrival times
  - Handles flights crossing midnight
  - Format: "Xh Ym" (e.g., "2h 30m")
- **Data Validation**:
  - Email format validation with regex
  - Airport code validation (3 uppercase letters)
  - Password minimum length (6 characters)
  - Input sanitization to prevent XSS
  - Text input limited to 500 characters
- **Time Handling**: Supports both ISO datetime and HH:MM formats
- **Statistics**: Server-side calculations with country extraction from city names
- **Session Management**: Flask-Login with persistent sessions
- **Error Handling**: User-friendly error messages with proper HTTP status codes

### Development Patterns
- **Architecture**: Single-page application behavior with server-side routing
- **API Pattern**: RESTful JSON endpoints with consistent error responses
- **Data Serialization**: All models include `to_dict()` methods for JSON conversion
- **Frontend Communication**: Vanilla JavaScript with native fetch API
- **UI Updates**: Dynamic DOM manipulation without framework dependencies
- **Mobile Design**: Bottom navigation bar with icon-based navigation
- **Form Handling**: Client-side validation with server-side verification
- **Date/Time**: ISO format for API, localized display in UI

## Environment Variables

```bash
# Required
SECRET_KEY=your-secret-key-here  # For session encryption

# Database (Option 1: Single URL)
DATABASE_URL=postgresql://user:pass@host:port/dbname

# Database (Option 2: Individual parameters)
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=soarrr_web

# Optional
FLASK_DEBUG=true  # Enable debug mode
PORT=5001        # Server port (default: 5001)
```

## Dependencies

- Flask 3.0.0 - Web framework
- Flask-Login 0.6.3 - User session management
- Flask-SQLAlchemy 3.1.1 - ORM integration
- SQLAlchemy 2.0.43 - Database ORM
- psycopg2-binary 2.9.10 - PostgreSQL adapter
- python-dotenv 1.1.1 - Environment variable loading
- gunicorn 23.0.0 - Production WSGI server
- Werkzeug 3.1.3 - Password hashing and utilities