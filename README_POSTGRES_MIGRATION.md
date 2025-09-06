# PostgreSQL Migration Guide

## Changes Made

1. **Updated dependencies** - Added `psycopg2-binary` to requirements.txt for PostgreSQL support

2. **Updated database configuration** in app.py:
   - Added support for PostgreSQL connection strings
   - Automatic handling of Heroku/Render postgres:// URLs (converts to postgresql://)
   - Flexible configuration via environment variables

3. **Created .env.example** file with PostgreSQL configuration template

## Setup Instructions

### Local Development with PostgreSQL

1. Install PostgreSQL on your machine
2. Create a database:
   ```bash
   createdb soarrr_flights
   ```

3. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your PostgreSQL credentials:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/soarrr_flights
   ```

5. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

6. Initialize the database:
   ```bash
   python -c "from app import app, db; app.app_context().push(); db.create_all()"
   ```

7. Run the application:
   ```bash
   python app.py
   ```

### Production Deployment

For platforms like Heroku, Render, or Railway:

1. Set the `DATABASE_URL` environment variable (usually provided automatically)
2. Set a secure `SECRET_KEY` environment variable
3. The app will automatically use the PostgreSQL database

### Migration from SQLite

If you have existing data in SQLite, you'll need to export and import:

1. Export from SQLite (before migration):
   ```python
   # Run this script with your old SQLite configuration
   from app import app, db, User, Flight
   import json
   
   with app.app_context():
       users = User.query.all()
       flights = Flight.query.all()
       
       data = {
           'users': [u.to_dict() for u in users],
           'flights': [f.to_dict() for f in flights]
       }
       
       with open('backup.json', 'w') as f:
           json.dump(data, f)
   ```

2. Import to PostgreSQL (after migration):
   ```python
   # Run this script with your new PostgreSQL configuration
   from app import app, db, User, Flight
   import json
   from datetime import datetime
   
   with app.app_context():
       with open('backup.json', 'r') as f:
           data = json.load(f)
       
       # Import users
       for user_data in data['users']:
           # Handle the data import (you'll need to adjust based on your needs)
           pass
   ```

## Notes

- The app now defaults to PostgreSQL for both local development and production
- All existing functionality remains the same
- Database migrations are handled automatically on first run