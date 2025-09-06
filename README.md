# Soarrr - Flight Tracking Application

A simple, personal flight tracking web application built with Flask and SQLAlchemy.

## Features

- **User Authentication**: Sign up and log in with email/password
- **Flight Management**: Add, view, and delete personal flights
- **Statistics Dashboard**: View flight statistics, charts, and top destinations
- **Responsive Design**: Clean UI built with Tailwind CSS
- **Simple Architecture**: Minimal dependencies, easy to deploy

## Tech Stack

- **Backend**: Flask (Python) with SQLAlchemy ORM
- **Database**: SQLite (file-based, no server needed)
- **Frontend**: Static HTML with Tailwind CSS and vanilla JavaScript
- **Authentication**: Flask-Login with session management

## Setup Instructions

1. **Clone the repository** (or download the files)

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**:
   ```bash
   python app.py
   ```

4. **Open your browser** and go to `http://localhost:5000`

5. **Sign up** for a new account and start tracking your flights!

## Project Structure

```
soarrr-web/
├── app.py              # Main Flask application
├── requirements.txt    # Python dependencies
├── instance/
│   └── flights.db      # SQLite database (auto-created)
└── static/             
    ├── index.html      # Flight list page
    ├── login.html      # Login page
    ├── signup.html     # Registration page
    ├── add-flight.html # Add flight form
    ├── stats.html      # Statistics dashboard
    └── js/
        ├── app.js      # Main application logic
        └── auth.js     # Authentication handling
```

## API Endpoints

- **Authentication**:
  - `POST /api/auth/signup` - Create new user
  - `POST /api/auth/login` - Login user
  - `POST /api/auth/logout` - Logout user
  - `GET /api/auth/status` - Check authentication status

- **Flights**:
  - `GET /api/flights` - Get user's flights
  - `POST /api/flights` - Add new flight
  - `DELETE /api/flights/<id>` - Delete flight

- **Statistics**:
  - `GET /api/stats` - Get user's flight statistics

## Deployment

This application can be easily deployed to any platform that supports Python/Flask:

- **Render.com** (recommended for MVP)
- **Railway.app**
- **PythonAnywhere**
- **Heroku**

The SQLite database file persists between deployments, making it simple to maintain user data.

## License

MIT License - feel free to use and modify as needed!