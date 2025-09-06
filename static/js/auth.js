// Authentication handling for login and signup pages

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const errorMessage = document.getElementById('error-message');

    // Login form handler
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const submitBtn = document.getElementById('login-btn');
            
            // Disable button and show loading
            submitBtn.disabled = true;
            submitBtn.textContent = 'Signing In...';
            hideError();
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    // Redirect to main page
                    window.location.href = '/';
                } else {
                    showError(data.error || 'Login failed');
                }
            } catch (error) {
                showError('Network error. Please try again.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign In';
            }
        });
    }

    // Signup form handler
    if (signupForm) {
        signupForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const submitBtn = document.getElementById('signup-btn');
            
            // Validate passwords match
            if (password !== confirmPassword) {
                showError('Passwords do not match');
                return;
            }
            
            if (password.length < 6) {
                showError('Password must be at least 6 characters');
                return;
            }
            
            // Disable button and show loading
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating Account...';
            hideError();
            
            try {
                const response = await fetch('/api/auth/signup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    // Redirect to main page
                    window.location.href = '/';
                } else {
                    showError(data.error || 'Signup failed');
                }
            } catch (error) {
                showError('Network error. Please try again.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create Account';
            }
        });
    }

    function showError(message) {
        if (errorMessage) {
            errorMessage.querySelector('.error-text').textContent = message;
            errorMessage.classList.remove('hidden');
        }
    }

    function hideError() {
        if (errorMessage) {
            errorMessage.classList.add('hidden');
        }
    }
});