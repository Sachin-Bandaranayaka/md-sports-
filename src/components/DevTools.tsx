'use client';

import Script from 'next/script';

export default function DevTools() {
    // Only load dev tools in development mode
    if (process.env.NODE_ENV !== 'development') {
        return null;
    }

    return (
        <>
            <Script id="dev-tools" strategy="afterInteractive">
                {`
          // Set a development token for testing
          window.setDevToken = function() {
              localStorage.setItem('accessToken', 'dev-token');
              localStorage.setItem('authToken', 'dev-token');
              console.log('✅ Development token set!');
              console.log('⚠️ Warning: This bypasses authentication. For development only!');
              console.log('To use: Reload the page and the dev token will be used for requests.');
              return 'Dev token set';
          }

          // Clear the development token
          window.clearDevToken = function() {
              localStorage.removeItem('accessToken');
              localStorage.removeItem('authToken');
              console.log('✅ Token cleared!');
              return 'Token cleared';
          }

          console.log('🔧 Development tools loaded!');
          console.log('Usage:');
          console.log('  - Run setDevToken() to set a development token');
          console.log('  - Run clearDevToken() to clear the token');
        `}
            </Script>
        </>
    );
} 