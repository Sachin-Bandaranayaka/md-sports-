'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { authPost } from '@/utils/api';

export default function LoginPage() {
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [debugInfo, setDebugInfo] = useState<any>(null);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setDebugInfo(null);

        const formData = new FormData(e.currentTarget);
        const username = formData.get('username') as string;
        const password = formData.get('password') as string;

        // TEMPORARY: Directly use hardcoded credentials while fixing backend issues
        if (username === 'admin' && password === 'password') {
            localStorage.setItem('authToken', 'dev-token');
            localStorage.setItem('userData', JSON.stringify({
                id: 1,
                username: 'admin',
                fullName: 'Admin User'
            }));
            router.push('/dashboard');
            return;
        }

        // First try the debug endpoint
        try {
            const debugResponse = await authPost('/api/auth/debug', { username, password });

            // Check if the response is actually JSON
            const contentType = debugResponse.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const debugData = await debugResponse.json();
                setDebugInfo(debugData);
                console.log("Debug data:", debugData);

                // If debug shows database issues, show the error
                if (!debugData.success) {
                    setError(`Debug error: ${debugData.message}`);
                    setIsLoading(false);
                    return;
                }
            } else {
                const textResponse = await debugResponse.text();
                console.error('Non-JSON response:', textResponse);
                setError('Server returned an invalid response format');
                setIsLoading(false);
                return;
            }
        } catch (debugError) {
            console.error('Debug endpoint error:', debugError);
            setError(`Debug API error: ${(debugError as Error).message}`);
            setIsLoading(false);
            return;
        }

        // Try the auth login using the useAuth hook
        try {
            await login(username, password);
        } catch (error) {
            console.error('Login error:', error);
            setError(`Login API error: ${(error as Error).message}`);
            setIsLoading(false);
        }
    };

    // For development purposes only - hardcoded login
    const handleDevLogin = () => {
        localStorage.setItem('authToken', 'dev-token');
        localStorage.setItem('userData', JSON.stringify({
            id: 1,
            username: 'admin',
            fullName: 'Admin User',
            roleId: 1,
            roleName: 'Admin',
        }));
        router.push('/dashboard');
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-extrabold text-gray-900">MS Sport</h1>
                    <h2 className="mt-2 text-xl text-primary">Inventory Management System</h2>
                </div>

                <div className="mt-8 bg-tertiary p-8 shadow-md rounded-lg">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <Input
                                id="username"
                                name="username"
                                type="text"
                                label="Username"
                                required
                                autoComplete="username"
                                defaultValue="admin"
                            />
                        </div>

                        <div>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                label="Password"
                                required
                                autoComplete="current-password"
                                defaultValue="password"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                                    Remember me
                                </label>
                            </div>

                            <div className="text-sm">
                                <Link href="/forgot-password" className="text-primary hover:underline">
                                    Forgot password?
                                </Link>
                            </div>
                        </div>

                        <div>
                            <Button
                                type="submit"
                                className="w-full"
                                isLoading={isLoading}
                            >
                                Sign in
                            </Button>
                        </div>

                        <div className="pt-4">
                            <Button
                                type="button"
                                className="w-full bg-green-600 hover:bg-green-700"
                                onClick={handleDevLogin}
                            >
                                Development Login
                            </Button>
                        </div>

                        {debugInfo && (
                            <div className="mt-4 p-3 text-xs font-mono bg-gray-100 rounded overflow-auto max-h-60">
                                <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
} 