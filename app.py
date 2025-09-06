from flask import Flask, request, jsonify, render_template, redirect, url_for, session, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'soarrr-web-secret-key-change-in-production'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///flights.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Ensure instance directory exists
os.makedirs('instance', exist_ok=True)

db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login_page'

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
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 400
    
    user = User(email=data['email'])
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
    
    user = User.query.filter_by(email=data['email']).first()
    
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
        flight = Flight(
            user_id=current_user.id,
            flight_number=data.get('flight_number'),
            aircraft=data.get('aircraft'),
            cabin_class=data.get('cabin_class'),
            departure_code=data.get('departure_code'),
            departure_city=data.get('departure_city'),
            arrival_code=data.get('arrival_code'),
            arrival_city=data.get('arrival_city'),
            notes=data.get('notes')
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

if __name__ == '__main__':
    app.run(debug=True)