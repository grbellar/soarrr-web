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
                <div class="mb-4 flex justify-center">
                    <svg class="w-24 h-24 text-cornflower_blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                        <circle cx="12" cy="12" r="11" stroke-width="1" stroke-dasharray="2,2" opacity="0.3"/>
                    </svg>
                </div>
                <h2 class="text-xl font-semibold text-persian_indigo-400 mb-2">No flights yet!</h2>
                <p class="text-anti_flash_white-300 mb-4">Start tracking your flights by adding your first one.</p>
                <div class="flex flex-col sm:flex-row gap-3 justify-center items-center">
                    <a href="/add-flight" class="inline-block bg-cornflower_blue-500 hover:bg-cornflower_blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                        Add Your First Flight
                    </a>
                    <button onclick="addSampleData()" class="inline-block bg-periwinkle-500 hover:bg-periwinkle-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                        Try with Sample Data
                    </button>
                </div>
                <p class="text-xs text-anti_flash_white-200 mt-4">Sample data lets you explore the app before adding your own flights</p>
            </div>
        `;
        return;
    }
    
    // Check if there are any seed flights
    const hasSeedData = flights.some(flight => flight.is_seed);
    
    let headerHtml = '';
    if (hasSeedData) {
        headerHtml = `
            <div class="bg-periwinkle-100 border border-periwinkle-300 rounded-lg p-4 mb-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-periwinkle-700">Sample data is active</p>
                        <p class="text-xs text-periwinkle-600">These flights are for demonstration. Add your own flights or remove sample data when ready.</p>
                    </div>
                    <button onclick="removeSampleData()" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        Remove Sample Data
                    </button>
                </div>
            </div>
        `;
    }
    
    const flightCards = flights.map(flight => createFlightCard(flight)).join('');
    flightsContainer.innerHTML = headerHtml + flightCards;
    
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
        'First': 'bg-yellow-100 text-yellow-800'
    };
    
    const cabinClassColor = cabinClassColors[flight.cabin_class] || 'bg-gray-100 text-gray-700';
    const flightDate = flight.flight_date ? new Date(flight.flight_date).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    }) : 'Date not set';
    
    return `
        <div class="bg-anti_flash_white-500 rounded-xl p-4 shadow-sm ${flight.is_seed ? 'border-2 border-periwinkle-300' : ''}">
            ${flight.is_seed ? '<div class="inline-block bg-periwinkle-100 text-periwinkle-700 text-xs px-2 py-1 rounded-md mb-2">Sample Flight</div>' : ''}
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
                    ${flight.notes ? `<div class="text-xs text-anti_flash_white-300 italic mt-1">${flight.notes}</div>` : ''}
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
    
    // Client-side validation with user-friendly messages
    if (!flightData.flight_date) {
        showMessage('Please select a flight date', 'error');
        return;
    }
    
    if (!flightData.departure_code) {
        showMessage('Please enter the departure airport code (e.g., JFK)', 'error');
        return;
    }
    
    if (!flightData.arrival_code) {
        showMessage('Please enter the arrival airport code (e.g., LHR)', 'error');
        return;
    }
    
    if (!flightData.departure_time) {
        showMessage('Please enter the departure time', 'error');
        return;
    }
    
    if (!flightData.arrival_time) {
        showMessage('Please enter the arrival time', 'error');
        return;
    }
    
    // Validate airport codes format (3 letters)
    const airportCodeRegex = /^[A-Z]{3}$/i;
    if (!airportCodeRegex.test(flightData.departure_code)) {
        showMessage('Departure airport code must be 3 letters (e.g., JFK, LAX)', 'error');
        return;
    }
    
    if (!airportCodeRegex.test(flightData.arrival_code)) {
        showMessage('Arrival airport code must be 3 letters (e.g., LHR, CDG)', 'error');
        return;
    }
    
    // Get selected cabin class
    const selectedClass = document.querySelector('input[name="flight-class"]:checked');
    if (selectedClass) {
        const classLabels = {
            'economy': 'Economy',
            'premium-economy': 'Premium Economy',
            'business': 'Business',
            'first': 'First'
        };
        flightData.cabin_class = classLabels[selectedClass.value];
    }
    
    // Convert airport codes to uppercase
    flightData.departure_code = flightData.departure_code.toUpperCase();
    flightData.arrival_code = flightData.arrival_code.toUpperCase();
    
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
            showMessage('Flight added successfully! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = '/';
            }, 1500);
        } else {
            const data = await response.json();
            // Make server error messages more user-friendly
            let errorMessage = data.error || 'Failed to add flight';
            
            // Transform technical errors into user-friendly messages
            if (errorMessage.includes('Invalid departure airport code')) {
                errorMessage = 'Please enter a valid 3-letter departure airport code (e.g., JFK)';
            } else if (errorMessage.includes('Invalid arrival airport code')) {
                errorMessage = 'Please enter a valid 3-letter arrival airport code (e.g., LHR)';
            } else if (errorMessage.includes('departure_time')) {
                errorMessage = 'Please enter a valid departure time';
            } else if (errorMessage.includes('arrival_time')) {
                errorMessage = 'Please enter a valid arrival time';
            } else if (errorMessage.includes('cabin_class')) {
                errorMessage = 'Please select a valid cabin class';
            }
            
            throw new Error(errorMessage);
        }
    } catch (error) {
        console.error('Error adding flight:', error);
        showMessage(error.message || 'Unable to add flight. Please check your connection and try again.', 'error');
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
    const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthsLong = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const chartHTML = activity.slice(0, 12).map((monthData, index) => {
        const height = Math.max((monthData.flights / maxFlights) * 120, 2); // Min height 2px, max 120px (reduced for mobile)
        const currentMonth = new Date().getMonth();
        const isCurrentMonth = currentMonth === index;
        const barColor = isCurrentMonth ? 'bg-ut_orange-500' : 'bg-cornflower_blue-400';
        
        return `
            <div class="flex flex-col items-center flex-1">
                <div class="${barColor} w-6 sm:w-8 rounded-t mb-2" style="height: ${height}px"></div>
                <span class="text-xs text-anti_flash_white-300">${monthsShort[index]}</span>
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
    // Get the notification container or create one if it doesn't exist
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none';
        document.body.appendChild(container);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'pointer-events-auto mb-3 px-6 py-4 rounded-xl shadow-lg font-medium text-sm max-w-md mx-auto flex items-center gap-3 transform transition-all duration-300 translate-y-0 opacity-100';
    
    // Add icon and styling based on type
    let iconSvg = '';
    if (type === 'success') {
        notification.classList.add('bg-cornflower_blue-500', 'text-white');
        iconSvg = '<svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
    } else if (type === 'error') {
        notification.classList.add('bg-ut_orange-500', 'text-white');
        iconSvg = '<svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>';
    } else {
        notification.classList.add('bg-periwinkle-500', 'text-white');
        iconSvg = '<svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>';
    }
    
    notification.innerHTML = `
        ${iconSvg}
        <span class="flex-1">${message}</span>
        <button onclick="this.parentElement.remove()" class="ml-2 hover:opacity-75 transition-opacity">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
        </button>
    `;
    
    // Add entrance animation
    notification.style.transform = 'translateY(-20px)';
    notification.style.opacity = '0';
    container.appendChild(notification);
    
    // Trigger entrance animation
    setTimeout(() => {
        notification.style.transform = 'translateY(0)';
        notification.style.opacity = '1';
    }, 10);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        notification.style.transform = 'translateY(-20px)';
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification && notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 5000);
}

// Add sample data
async function addSampleData() {
    try {
        const response = await fetch('/api/seed/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Sample flights added successfully! Explore the app and remove them when ready.', 'success');
            // Reload the flights list
            initFlightsList();
        } else {
            showMessage(data.error || 'Failed to add sample data', 'error');
        }
    } catch (error) {
        console.error('Error adding sample data:', error);
        showMessage('Failed to add sample data', 'error');
    }
}

// Remove sample data
async function removeSampleData() {
    if (!confirm('Are you sure you want to remove all sample flights? This will not affect your personal flights.')) {
        return;
    }
    
    try {
        const response = await fetch('/api/seed/remove', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Sample flights removed successfully!', 'success');
            // Reload the flights list
            initFlightsList();
        } else {
            showMessage(data.error || 'Failed to remove sample data', 'error');
        }
    } catch (error) {
        console.error('Error removing sample data:', error);
        showMessage('Failed to remove sample data', 'error');
    }
}