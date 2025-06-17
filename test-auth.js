// Test current authentication and shop filtering
async function testAuth() {
    try {
        console.log('Testing dev-token authentication...');
        
        // Test auth validation
        const authResponse = await fetch('http://localhost:3000/api/auth/validate', {
            headers: {
                'Authorization': 'Bearer dev-token'
            }
        });
        
        const authData = await authResponse.json();
        console.log('Auth validation response:', JSON.stringify(authData, null, 2));
        
        // Test shops API with debug info
        console.log('\nTesting shops API...');
        const shopsResponse = await fetch('http://localhost:3000/api/shops?simple=true&debug=true', {
            headers: {
                'Authorization': 'Bearer dev-token'
            }
        });
        
        const shopsData = await shopsResponse.json();
        console.log('Shops API response:', JSON.stringify(shopsData, null, 2));
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testAuth();