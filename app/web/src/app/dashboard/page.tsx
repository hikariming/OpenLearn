'use client';

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

export default function DashboardPage() {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <span className="text-xl font-bold text-gray-900">OpenLearn Dashboard</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-700">Welcome, {user?.name}</span>
                            <Button variant="outline" onClick={logout}>Sign out</Button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Your Workspace</h3>
                        <div className="mt-2 max-w-xl text-sm text-gray-500">
                            <p>This is a protected area. You can only see this if you are logged in.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
