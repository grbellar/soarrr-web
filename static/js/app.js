// Main application JavaScript for flight management

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is authenticated on protected pages
    checkAuth();
    
    // Initialize page-specific functionality
    const currentPage = window.location.pathname;
    
    if (currentPage === '/' || currentPage === '/index.html') {
        initFlightsList();
    } else if (currentPage === '/add-flight' || currentPage === '/add-flight.html') {
        initAddFlightForm();
    } else if (currentPage === '/stats' || currentPage === '/stats.html') {
        initStats();
    }
});

// Check authentication status
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/status');
        const data = await response.json();
        
        if (!data.authenticated && 
            !['/login', '/signup', '/login.html', '/signup.html'].includes(window.location.pathname)) {
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('Auth check failed:', error);
    }
}

// Initialize flights list page
async function initFlightsList() {
    try {
        const response = await fetch('/api/flights');
        if (!response.ok) {
            throw new Error('Failed to fetch flights');
        }
        
        const flights = await response.json();
        displayFlights(flights);
        
    } catch (error) {
        console.error('Error loading flights:', error);
        showMessage('Error loading flights. Please try again.', 'error');
    }
}

// Display flights in the list
function displayFlights(flights) {
    const flightsContainer = document.querySelector('#flights-container');
    if (!flightsContainer) return;
    
    if (flights.length === 0) {
        flightsContainer.innerHTML = `
            <div class="bg-anti_flash_white-500 rounded-xl p-8 text-center">
                <div class="text-6xl mb-4">✈️</div>
                <h2 class="text-xl font-semibold text-persian_indigo-400 mb-2">No flights yet!</h2>
                <p class="text-anti_flash_white-300 mb-4">Start tracking your flights by adding your first one.</p>
                <a href="/add-flight" class="inline-block bg-cornflower_blue-500 hover:bg-cornflower_blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                    Add Your First Flight
                </a>
            </div>
        `;
        return;
    }
    
    const flightCards = flights.map(flight => createFlightCard(flight)).join('');
    flightsContainer.innerHTML = flightCards;
    
    // Add delete functionality
    document.querySelectorAll('.delete-flight').forEach(button => {
        button.addEventListener('click', handleDeleteFlight);
    });
}

// Create a flight card HTML
function createFlightCard(flight) {
    const cabinClassColors = {
        'Economy': 'bg-cornflower_blue-100 text-cornflower_blue-700',
        'Premium Economy': 'bg-ut_orange-100 text-ut_orange-700',
        'Business': 'bg-persian_indigo-200 text-persian_indigo-700',
        'First': 'bg-persian_indigo-300 text-persian_indigo-800'
    };
    
    const cabinClassColor = cabinClassColors[flight.cabin_class] || 'bg-gray-100 text-gray-700';
    const flightDate = flight.flight_date ? new Date(flight.flight_date).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    }) : 'Date not set';
    
    return `
        <div class="bg-anti_flash_white-500 rounded-xl p-4 shadow-sm">
            <div class="flex items-start justify-between mb-3">
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="text-lg font-bold text-persian_indigo-400">${flight.departure_code || 'N/A'}</span>
                        <svg class="w-4 h-4 text-anti_flash_white-200" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                        </svg>
                        <span class="text-lg font-bold text-persian_indigo-400">${flight.arrival_code || 'N/A'}</span>
                    </div>
                    <div class="text-sm text-anti_flash_white-300 mb-1">${flight.departure_city || 'Departure city'}</div>
                    <div class="text-sm text-anti_flash_white-300">${flight.arrival_city || 'Arrival city'}</div>
                    <div class="text-xs text-anti_flash_white-200 mt-2">
                        ${flight.flight_number ? `Flight ${flight.flight_number}` : 'Flight number not set'} • 
                        ${flight.aircraft || 'Aircraft not set'}
                    </div>
                </div>
                <div class="text-right">
                    <span class="inline-block ${cabinClassColor} px-2 py-1 rounded-md text-xs font-medium mb-2">
                        ${flight.cabin_class || 'Class not set'}
                    </span>
                    <div class="text-sm font-semibold text-persian_indigo-400">${flightDate}</div>
                    <div class="text-xs text-anti_flash_white-200">${flight.duration || '0h 0m'}</div>
                    <button class="delete-flight mt-2 text-xs text-red-500 hover:text-red-600" data-flight-id="${flight.id}">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Handle flight deletion
async function handleDeleteFlight(event) {
    const flightId = event.target.getAttribute('data-flight-id');
    
    if (!confirm('Are you sure you want to delete this flight?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/flights/${flightId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            // Refresh the flights list
            initFlightsList();
            showMessage('Flight deleted successfully!', 'success');
        } else {
            throw new Error('Failed to delete flight');
        }
    } catch (error) {
        console.error('Error deleting flight:', error);
        showMessage('Error deleting flight. Please try again.', 'error');
    }
}

// Initialize add flight form
function initAddFlightForm() {
    const form = document.getElementById('add-flight-form');
    if (!form) return;
    
    form.addEventListener('submit', handleAddFlight);
}

// Handle add flight form submission
async function handleAddFlight(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const flightData = {};
    
    // Extract form data
    for (let [key, value] of formData.entries()) {
        if (value.trim()) {
            flightData[key] = value.trim();
        }
    }
    
    // Get selected cabin class
    const selectedClass = document.querySelector('input[name="flight-class"]:checked');
    if (selectedClass) {
        const classLabels = {
            'economy': 'Economy',
            'premium-economy': 'Premium Economy',
            'business': 'Business'
        };
        flightData.cabin_class = classLabels[selectedClass.value];
    }
    
    // Combine date and times if provided
    if (flightData.flight_date && flightData.departure_time) {
        flightData.departure_time = `${flightData.flight_date}T${flightData.departure_time}:00`;
    }
    if (flightData.flight_date && flightData.arrival_time) {
        flightData.arrival_time = `${flightData.flight_date}T${flightData.arrival_time}:00`;
    }
    
    const submitBtn = document.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Adding Flight...';
    
    try {
        const response = await fetch('/api/flights', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(flightData)
        });
        
        if (response.ok) {
            showMessage('Flight added successfully!', 'success');
            setTimeout(() => {
                window.location.href = '/';
            }, 1500);
        } else {
            const data = await response.json();
            throw new Error(data.error || 'Failed to add flight');
        }
    } catch (error) {
        console.error('Error adding flight:', error);
        showMessage(error.message || 'Error adding flight. Please try again.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Add Flight';
    }
}

// Initialize stats page
async function initStats() {
    try {
        const response = await fetch('/api/stats');
        if (!response.ok) {
            throw new Error('Failed to fetch statistics');
        }
        
        const stats = await response.json();
        displayStats(stats);
        
    } catch (error) {
        console.error('Error loading stats:', error);
        showMessage('Error loading statistics. Please try again.', 'error');
    }
}

// Display statistics
function displayStats(stats) {
    // Update overview cards
    updateStatCard('total-flights', stats.total_flights);
    updateStatCard('total-hours', stats.total_hours);
    updateStatCard('countries-visited', stats.countries_visited);
    updateStatCard('miles-flown', stats.miles_flown);
    
    // Update flight classes
    updateFlightClasses(stats.flight_classes);
    
    // Update top destinations
    updateTopDestinations(stats.top_destinations);
    
    // Update monthly activity (simple version)
    updateMonthlyActivity(stats.monthly_activity);
}

function updateStatCard(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function updateFlightClasses(classes) {
    const container = document.getElementById('flight-classes');
    if (!container) return;
    
    const classEntries = Object.entries(classes);
    if (classEntries.length === 0) {
        container.innerHTML = '<p class="text-anti_flash_white-300 text-center">No flight data available</p>';
        return;
    }
    
    const classColors = {
        'Economy': 'bg-cornflower_blue-500',
        'Premium Economy': 'bg-ut_orange-500',
        'Business': 'bg-persian_indigo-600'
    };
    
    const classHTML = classEntries.map(([className, data]) => `
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="w-4 h-4 ${classColors[className] || 'bg-gray-500'} rounded"></div>
                <span class="text-sm text-anti_flash_white-300">${className}</span>
            </div>
            <div class="flex items-center gap-2">
                <div class="w-32 bg-anti_flash_white-400 rounded-full h-2">
                    <div class="${classColors[className] || 'bg-gray-500'} h-2 rounded-full" style="width: ${data.percentage}%"></div>
                </div>
                <span class="text-sm font-medium text-persian_indigo-400">${data.percentage}%</span>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = classHTML;
}

function updateTopDestinations(destinations) {
    const container = document.getElementById('top-destinations');
    if (!container) return;
    
    if (destinations.length === 0) {
        container.innerHTML = '<p class="text-anti_flash_white-300 text-center">No destinations data available</p>';
        return;
    }
    
    const colors = ['bg-cornflower_blue-500', 'bg-periwinkle-500', 'bg-ut_orange-500', 'bg-persian_indigo-300', 'bg-anti_flash_white-400'];
    
    const destinationsHTML = destinations.map((dest, index) => `
        <div class="flex items-center justify-between py-2">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 ${colors[index] || 'bg-gray-400'} rounded-full flex items-center justify-center text-white text-xs font-bold">
                    ${index + 1}
                </div>
                <div>
                    <div class="font-medium text-persian_indigo-400">${dest.city}</div>
                    <div class="text-xs text-anti_flash_white-300">${dest.airport_code} • ${dest.count} visit${dest.count > 1 ? 's' : ''}</div>
                </div>
            </div>
            <div class="text-sm font-medium text-periwinkle-600">${dest.percentage}%</div>
        </div>
    `).join('');
    
    container.innerHTML = destinationsHTML;
}

function updateMonthlyActivity(activity) {
    const container = document.getElementById('monthly-chart');
    if (!container) return;
    
    const maxFlights = Math.max(...activity.map(m => m.flights), 1);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const chartHTML = activity.slice(0, 7).map((month, index) => {
        const height = (month.flights / maxFlights) * 160; // Max height 160px
        const isCurrentMonth = new Date().getMonth() === index;
        const barColor = isCurrentMonth ? 'bg-ut_orange-500' : 'bg-cornflower_blue-400';
        
        return `
            <div class="flex flex-col items-center">
                <div class="${barColor} w-8 rounded-t mb-2" style="height: ${height}px"></div>
                <span class="text-xs text-anti_flash_white-300">${months[index]}</span>
            </div>
        `;
    }).join('');
    
    container.innerHTML = chartHTML;
}

// Logout functionality
function logout() {
    fetch('/api/auth/logout', { method: 'POST' })
        .then(() => {
            window.location.href = '/login';
        })
        .catch(error => {
            console.error('Logout error:', error);
        });
}

// Utility function to show messages
function showMessage(message, type = 'info') {
    // Create or update message element
    let messageEl = document.getElementById('app-message');
    if (!messageEl) {
        messageEl = document.createElement('div');
        messageEl.id = 'app-message';
        messageEl.className = 'fixed top-4 right-4 z-50 px-4 py-3 rounded-lg font-medium text-sm max-w-sm';
        document.body.appendChild(messageEl);
    }
    
    // Set message content and styling
    messageEl.textContent = message;
    messageEl.className = 'fixed top-4 right-4 z-50 px-4 py-3 rounded-lg font-medium text-sm max-w-sm';
    
    if (type === 'success') {
        messageEl.classList.add('bg-green-100', 'border', 'border-green-400', 'text-green-700');
    } else if (type === 'error') {
        messageEl.classList.add('bg-red-100', 'border', 'border-red-400', 'text-red-700');
    } else {
        messageEl.classList.add('bg-blue-100', 'border', 'border-blue-400', 'text-blue-700');
    }
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        if (messageEl) {
            messageEl.remove();
        }
    }, 3000);
}