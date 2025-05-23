/**
 * This is a development utility to simplify testing
 * Do NOT include this in production code!
 * 
 * Usage in browser console:
 * - Run setDevToken() to set a development token
 * - Run clearDevToken() to clear the token
 */

// Set a development token for testing
function setDevToken() {
    localStorage.setItem('accessToken', 'dev-token');
    localStorage.setItem('authToken', 'dev-token');
    console.log('✅ Development token set!');
    console.log('⚠️ Warning: This bypasses authentication. For development only!');
    console.log('To use: Reload the page and the dev token will be used for requests.');
    return 'Dev token set';
}

// Clear the development token
function clearDevToken() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('authToken');
    console.log('✅ Token cleared!');
    return 'Token cleared';
}

// Make these functions available globally
window.setDevToken = setDevToken;
window.clearDevToken = clearDevToken;

console.log('🔧 Development tools loaded!');
console.log('Usage:');
console.log('  - Run setDevToken() to set a development token');
console.log('  - Run clearDevToken() to clear the token'); 