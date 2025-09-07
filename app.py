from flask import Flask, request, jsonify, render_template, redirect, url_for, session, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import secrets
import re
from html import escape

app = Flask(__name__)
load_dotenv()
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', secrets.token_hex(32))

# PostgreSQL configuration
# Support both DATABASE_URL and standard Heroku/Render postgres:// URLs
database_url = os.environ.get('DATABASE_URL')
if database_url and database_url.startswith('postgres://'):
    # Fix for SQLAlchemy requiring postgresql:// instead of postgres://
    database_url = database_url.replace('postgres://', 'postgresql://', 1)

# Default to local PostgreSQL if no DATABASE_URL is set
if not database_url:
    # Local PostgreSQL configuration
    db_user = os.environ.get('DB_USER', 'postgres')
    db_password = os.environ.get('DB_PASSWORD', 'postgres')
    db_host = os.environ.get('DB_HOST', 'localhost')
    db_port = os.environ.get('DB_PORT', '5432')
    db_name = os.environ.get('DB_NAME', 'soarrr_web')
    database_url = f'postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}'

app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login_page'

# Input validation helpers
def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_airport_code(code):
    """Validate airport code (3 uppercase letters)"""
    if not code:
        return True  # Optional field
    return re.match(r'^[A-Z]{3}$', code.upper()) is not None

def sanitize_input(text):
    """Sanitize text input to prevent XSS"""
    if text is None:
        return None
    return escape(str(text))[:500]  # Limit length and escape HTML

def validate_password(password):
    """Basic password validation"""
    if not password or len(password) < 6:
        return False, "Password must be at least 6 characters"
    return True, ""

# User Model
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    flights = db.relationship('Flight', backref='user', lazy=True, cascade='all, delete-orphan')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

# Flight Model
class Flight(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    flight_number = db.Column(db.String(20))
    aircraft = db.Column(db.String(100))
    cabin_class = db.Column(db.String(50))
    departure_code = db.Column(db.String(10))
    departure_city = db.Column(db.String(100))
    arrival_code = db.Column(db.String(10))
    arrival_city = db.Column(db.String(100))
    departure_time = db.Column(db.DateTime)
    arrival_time = db.Column(db.DateTime)
    flight_date = db.Column(db.Date)
    duration = db.Column(db.String(20))
    notes = db.Column(db.Text)
    is_seed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'flight_number': self.flight_number,
            'aircraft': self.aircraft,
            'cabin_class': self.cabin_class,
            'departure_code': self.departure_code,
            'departure_city': self.departure_city,
            'arrival_code': self.arrival_code,
            'arrival_city': self.arrival_city,
            'departure_time': self.departure_time.isoformat() if self.departure_time else None,
            'arrival_time': self.arrival_time.isoformat() if self.arrival_time else None,
            'flight_date': self.flight_date.isoformat() if self.flight_date else None,
            'duration': self.duration,
            'notes': self.notes,
            'is_seed': self.is_seed,
            'created_at': self.created_at.isoformat()
        }

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Helper function to calculate flight duration
def calculate_flight_duration(departure_time, arrival_time):
    """
    Calculate flight duration between departure and arrival times.
    Returns duration as a formatted string like "2h 30m" or None if times are invalid.
    """
    if not departure_time or not arrival_time:
        return None
    
    try:
        # Calculate the difference
        duration_delta = arrival_time - departure_time
        
        # Handle flights that cross midnight (negative duration)
        if duration_delta.total_seconds() < 0:
            # Add 24 hours if arrival is next day
            duration_delta += timedelta(days=1)
        
        # Convert to hours and minutes
        total_minutes = int(duration_delta.total_seconds() / 60)
        hours = total_minutes // 60
        minutes = total_minutes % 60
        
        # Format the duration string
        if hours > 0 and minutes > 0:
            return f"{hours}h {minutes}m"
        elif hours > 0:
            return f"{hours}h"
        elif minutes > 0:
            return f"{minutes}m"
        else:
            return "0m"
            
    except Exception as e:
        return None

# Initialize database
with app.app_context():
    db.create_all()

# Routes for serving HTML pages
@app.route('/')
def index():
    if current_user.is_authenticated:
        return send_from_directory('static', 'index.html')
    return redirect(url_for('login_page'))

@app.route('/login')
def login_page():
    return send_from_directory('static', 'login.html')

@app.route('/signup')
def signup_page():
    return send_from_directory('static', 'signup.html')

@app.route('/add-flight')
@login_required
def add_flight_page():
    return send_from_directory('static', 'add-flight.html')

@app.route('/stats')
@login_required
def stats_page():
    return send_from_directory('static', 'stats.html')

@app.route('/map')
@login_required
def map_page():
    return send_from_directory('static', 'map.html')

# Static files
@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory('static', filename)

# Authentication API
@app.route('/api/auth/signup', methods=['POST'])
def signup():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password required'}), 400
    
    email = data.get('email', '').strip().lower()
    
    # Validate email format
    if not validate_email(email):
        return jsonify({'error': 'Invalid email format'}), 400
    
    # Validate password strength
    valid, msg = validate_password(data.get('password'))
    if not valid:
        return jsonify({'error': msg}), 400
    
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 400
    
    user = User(email=email)
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()
    
    login_user(user)
    return jsonify({'success': True, 'message': 'User created successfully'})

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password required'}), 400
    
    email = data.get('email', '').strip().lower()
    
    # Validate email format
    if not validate_email(email):
        return jsonify({'error': 'Invalid email format'}), 400
    
    user = User.query.filter_by(email=email).first()
    
    if user and user.check_password(data['password']):
        login_user(user)
        return jsonify({'success': True, 'message': 'Logged in successfully'})
    
    return jsonify({'error': 'Invalid email or password'}), 401

@app.route('/api/auth/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'success': True, 'message': 'Logged out successfully'})

@app.route('/api/auth/status')
def auth_status():
    if current_user.is_authenticated:
        return jsonify({
            'authenticated': True,
            'user': {'email': current_user.email}
        })
    return jsonify({'authenticated': False})

# Flight Management API
@app.route('/api/flights', methods=['GET'])
@login_required
def get_flights():
    flights = Flight.query.filter_by(user_id=current_user.id).order_by(Flight.flight_date.desc()).all()
    return jsonify([flight.to_dict() for flight in flights])

@app.route('/api/flights', methods=['POST'])
@login_required
def create_flight():
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    try:
        # Validate and sanitize airport codes
        departure_code = data.get('departure_code', '').upper().strip()
        arrival_code = data.get('arrival_code', '').upper().strip()
        
        if departure_code and not validate_airport_code(departure_code):
            return jsonify({'error': 'Invalid departure airport code format'}), 400
        if arrival_code and not validate_airport_code(arrival_code):
            return jsonify({'error': 'Invalid arrival airport code format'}), 400
        
        # Validate cabin class
        valid_classes = ['Economy', 'Premium Economy', 'Business', 'First']
        cabin_class = data.get('cabin_class')
        if cabin_class and cabin_class not in valid_classes:
            return jsonify({'error': 'Invalid cabin class'}), 400
        
        flight = Flight(
            user_id=current_user.id,
            flight_number=sanitize_input(data.get('flight_number')),
            aircraft=sanitize_input(data.get('aircraft')),
            cabin_class=cabin_class,
            departure_code=departure_code if departure_code else None,
            departure_city=sanitize_input(data.get('departure_city')),
            arrival_code=arrival_code if arrival_code else None,
            arrival_city=sanitize_input(data.get('arrival_city')),
            notes=sanitize_input(data.get('notes')),
            is_seed=False  # Explicitly set to False for manually created flights
        )
        
        # Parse flight date if provided
        flight_date = None
        if data.get('flight_date'):
            flight_date = datetime.fromisoformat(data['flight_date']).date()
            flight.flight_date = flight_date
        else:
            # Default to today if no date provided
            flight_date = datetime.now().date()
            flight.flight_date = flight_date
        
        # Parse times and calculate duration
        departure_time = None
        arrival_time = None
        
        if data.get('departure_time'):
            # Handle both ISO datetime format and HH:MM time format
            time_str = data['departure_time']
            if 'T' in time_str:
                # ISO datetime format (e.g., '1999-02-02T11:03:00')
                departure_time = datetime.fromisoformat(time_str.replace('Z', '+00:00'))
            else:
                # HH:MM time format
                departure_time = datetime.combine(
                    flight_date,
                    datetime.strptime(time_str, '%H:%M').time()
                )
            flight.departure_time = departure_time
        
        if data.get('arrival_time'):
            # Handle both ISO datetime format and HH:MM time format
            time_str = data['arrival_time']
            if 'T' in time_str:
                # ISO datetime format (e.g., '1999-02-02T11:03:00')
                arrival_time = datetime.fromisoformat(time_str.replace('Z', '+00:00'))
            else:
                # HH:MM time format  
                arrival_time = datetime.combine(
                    flight_date,
                    datetime.strptime(time_str, '%H:%M').time()
                )
            flight.arrival_time = arrival_time
        
        # Auto-calculate duration if both times are provided
        if departure_time and arrival_time:
            calculated_duration = calculate_flight_duration(departure_time, arrival_time)
            flight.duration = calculated_duration
        
        db.session.add(flight)
        db.session.commit()
        
        return jsonify(flight.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@app.route('/api/flights/<int:flight_id>', methods=['DELETE'])
@login_required
def delete_flight(flight_id):
    flight = Flight.query.filter_by(id=flight_id, user_id=current_user.id).first()
    
    if not flight:
        return jsonify({'error': 'Flight not found'}), 404
    
    db.session.delete(flight)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Flight deleted successfully'})

@app.route('/api/flights/<int:flight_id>', methods=['GET'])
@login_required
def get_flight(flight_id):
    flight = Flight.query.filter_by(id=flight_id, user_id=current_user.id).first()
    
    if not flight:
        return jsonify({'error': 'Flight not found'}), 404
    
    return jsonify(flight.to_dict())

# Statistics API
@app.route('/api/stats', methods=['GET'])
@login_required
def get_stats():
    flights = Flight.query.filter_by(user_id=current_user.id).all()
    
    if not flights:
        return jsonify({
            'total_flights': 0,
            'total_hours': 0,
            'countries_visited': 0,
            'miles_flown': 0,
            'flight_classes': {},
            'top_destinations': [],
            'monthly_activity': []
        })
    
    # Calculate basic stats
    total_flights = len(flights)
    
    # Parse duration to calculate hours
    total_minutes = 0
    for flight in flights:
        if flight.duration:
            # Parse duration like "7h 30m" or "1h 15m"
            try:
                parts = flight.duration.lower().replace('h', '').replace('m', '').split()
                hours = int(parts[0]) if len(parts) > 0 else 0
                minutes = int(parts[1]) if len(parts) > 1 else 0
                total_minutes += (hours * 60) + minutes
            except:
                pass
    
    total_hours = total_minutes // 60
    
    # Count unique countries (simple approximation)
    countries = set()
    for flight in flights:
        if flight.departure_city:
            # Extract country (last part after comma)
            dep_parts = flight.departure_city.split(',')
            if len(dep_parts) > 1:
                countries.add(dep_parts[-1].strip())
        if flight.arrival_city:
            arr_parts = flight.arrival_city.split(',')
            if len(arr_parts) > 1:
                countries.add(arr_parts[-1].strip())
    
    countries_visited = len(countries)
    
    # Estimate miles (rough calculation)
    miles_flown = total_hours * 500  # Rough estimate
    
    # Flight class distribution
    class_counts = {}
    for flight in flights:
        cabin_class = flight.cabin_class or 'Unknown'
        class_counts[cabin_class] = class_counts.get(cabin_class, 0) + 1
    
    # Calculate percentages
    flight_classes = {}
    for class_name, count in class_counts.items():
        percentage = round((count / total_flights) * 100)
        flight_classes[class_name] = {
            'count': count,
            'percentage': percentage
        }
    
    # Top destinations
    destination_counts = {}
    for flight in flights:
        if flight.arrival_city:
            city = flight.arrival_city.split(',')[0].strip()  # Get city name
            destination_counts[city] = destination_counts.get(city, 0) + 1
    
    top_destinations = []
    for city, count in sorted(destination_counts.items(), key=lambda x: x[1], reverse=True)[:5]:
        percentage = round((count / total_flights) * 100)
        top_destinations.append({
            'city': city,
            'count': count,
            'percentage': percentage,
            'airport_code': next((f.arrival_code for f in flights if f.arrival_city and city in f.arrival_city), 'N/A')
        })
    
    # Monthly activity (simple version - just current year)
    from collections import defaultdict
    monthly_counts = defaultdict(int)
    current_year = datetime.now().year
    
    for flight in flights:
        if flight.flight_date and flight.flight_date.year == current_year:
            month_key = flight.flight_date.strftime('%B')
            monthly_counts[month_key] += 1
    
    monthly_activity = []
    months = ['January', 'February', 'March', 'April', 'May', 'June',
             'July', 'August', 'September', 'October', 'November', 'December']
    
    for month in months:
        monthly_activity.append({
            'month': month,
            'flights': monthly_counts.get(month, 0)
        })
    
    return jsonify({
        'total_flights': total_flights,
        'total_hours': f"{total_hours}h",
        'countries_visited': countries_visited,
        'miles_flown': f"{miles_flown//1000}k" if miles_flown >= 1000 else str(miles_flown),
        'flight_classes': flight_classes,
        'top_destinations': top_destinations,
        'monthly_activity': monthly_activity
    })

# Seed Data API
@app.route('/api/seed/add', methods=['POST'])
@login_required
def add_seed_data():
    """Add sample flight data for the user to explore the app"""
    try:
        # Check if user already has seed data
        existing_seed = Flight.query.filter_by(user_id=current_user.id, is_seed=True).first()
        if existing_seed:
            return jsonify({'error': 'Sample data already exists. Remove it first before adding new sample data.'}), 400
        
        # Sample flights data
        from datetime import date, time
        sample_flights = [
            {
                'flight_number': 'UA328',
                'aircraft': 'Boeing 737-900',
                'cabin_class': 'Economy',
                'departure_code': 'SFO',
                'departure_city': 'San Francisco, USA',
                'arrival_code': 'LAX',
                'arrival_city': 'Los Angeles, USA',
                'flight_date': date.today() - timedelta(days=30),
                'departure_time': datetime.combine(date.today() - timedelta(days=30), time(9, 30)),
                'arrival_time': datetime.combine(date.today() - timedelta(days=30), time(11, 0)),
                'notes': 'Quick business trip to LA'
            },
            {
                'flight_number': 'DL142',
                'aircraft': 'Airbus A330-300',
                'cabin_class': 'Business',
                'departure_code': 'JFK',
                'departure_city': 'New York, USA',
                'arrival_code': 'LHR',
                'arrival_city': 'London, UK',
                'flight_date': date.today() - timedelta(days=60),
                'departure_time': datetime.combine(date.today() - timedelta(days=60), time(22, 0)),
                'arrival_time': datetime.combine(date.today() - timedelta(days=59), time(10, 30)),
                'notes': 'Red-eye to London for vacation'
            },
            {
                'flight_number': 'EK215',
                'aircraft': 'Airbus A380-800',
                'cabin_class': 'First',
                'departure_code': 'DXB',
                'departure_city': 'Dubai, UAE',
                'arrival_code': 'LAX',
                'arrival_city': 'Los Angeles, USA',
                'flight_date': date.today() - timedelta(days=90),
                'departure_time': datetime.combine(date.today() - timedelta(days=90), time(8, 45)),
                'arrival_time': datetime.combine(date.today() - timedelta(days=90), time(13, 50)),
                'notes': 'Long haul flight on the A380!'
            },
            {
                'flight_number': 'AA2402',
                'aircraft': 'Boeing 787-9',
                'cabin_class': 'Premium Economy',
                'departure_code': 'ORD',
                'departure_city': 'Chicago, USA',
                'arrival_code': 'MIA',
                'arrival_city': 'Miami, USA',
                'flight_date': date.today() - timedelta(days=15),
                'departure_time': datetime.combine(date.today() - timedelta(days=15), time(14, 15)),
                'arrival_time': datetime.combine(date.today() - timedelta(days=15), time(18, 45)),
                'notes': 'Weekend getaway to Miami'
            },
            {
                'flight_number': 'SQ22',
                'aircraft': 'Airbus A350-900ULR',
                'cabin_class': 'Business',
                'departure_code': 'SIN',
                'departure_city': 'Singapore',
                'arrival_code': 'EWR',
                'arrival_city': 'Newark, USA',
                'flight_date': date.today() - timedelta(days=120),
                'departure_time': datetime.combine(date.today() - timedelta(days=120), time(23, 30)),
                'arrival_time': datetime.combine(date.today() - timedelta(days=119), time(5, 30)),
                'notes': "World's longest flight!"
            }
        ]
        
        # Create flight records
        created_flights = []
        for flight_data in sample_flights:
            flight = Flight(
                user_id=current_user.id,
                flight_number=flight_data['flight_number'],
                aircraft=flight_data['aircraft'],
                cabin_class=flight_data['cabin_class'],
                departure_code=flight_data['departure_code'],
                departure_city=flight_data['departure_city'],
                arrival_code=flight_data['arrival_code'],
                arrival_city=flight_data['arrival_city'],
                flight_date=flight_data['flight_date'],
                departure_time=flight_data['departure_time'],
                arrival_time=flight_data['arrival_time'],
                notes=flight_data['notes'],
                is_seed=True
            )
            
            # Calculate duration
            flight.duration = calculate_flight_duration(flight.departure_time, flight.arrival_time)
            
            db.session.add(flight)
            created_flights.append(flight)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Added {len(created_flights)} sample flights',
            'flights': [f.to_dict() for f in created_flights]
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to add sample data: {str(e)}'}), 500

@app.route('/api/seed/remove', methods=['DELETE'])
@login_required
def remove_seed_data():
    """Remove all seed data for the current user"""
    try:
        # Find and delete all seed flights for the current user
        seed_flights = Flight.query.filter_by(user_id=current_user.id, is_seed=True).all()
        
        if not seed_flights:
            return jsonify({'error': 'No sample data found to remove'}), 404
        
        count = len(seed_flights)
        for flight in seed_flights:
            db.session.delete(flight)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Removed {count} sample flights'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to remove sample data: {str(e)}'}), 500

if __name__ == '__main__':
    debug_mode = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    port = int(os.environ.get('PORT', 5001))  # Changed default from 5000 to 5001
    app.run(debug=debug_mode, host='0.0.0.0', port=port)