'use client';

import React, { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home,
    Package,
    Store,
    Users,
    FileText,
    BarChart2,
    Settings,
    Menu,
    X,
    LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type NavItem = {
    icon: React.ElementType;
    href: string;
    label: string;
};

const navItems: NavItem[] = [
    { icon: Home, href: '/dashboard', label: 'Dashboard' },
    { icon: Package, href: '/inventory', label: 'Inventory' },
    { icon: Store, href: '/shops', label: 'Shops' },
    { icon: Users, href: '/customers', label: 'Customers' },
    { icon: FileText, href: '/invoices', label: 'Invoices' },
    { icon: BarChart2, href: '/reports', label: 'Reports' },
    { icon: Settings, href: '/settings', label: 'Settings' },
];

interface MainLayoutProps {
    children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const pathname = usePathname();

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-40 w-64 bg-secondary text-tertiary transform transition-transform duration-300 ease-in-out',
                    isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
                    'md:translate-x-0'
                )}
            >
                <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
                    <div className="flex items-center">
                        <span className="text-xl font-bold text-primary">MD Sports</span>
                    </div>
                    <button
                        className="md:hidden text-tertiary hover:text-primary"
                        onClick={toggleSidebar}
                    >
                        <X size={24} />
                    </button>
                </div>

                <nav className="mt-6 px-2">
                    <ul className="space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;

                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            'flex items-center px-4 py-3 rounded-md transition-colors',
                                            isActive
                                                ? 'bg-primary text-tertiary'
                                                : 'text-gray-300 hover:bg-gray-800 hover:text-tertiary'
                                        )}
                                    >
                                        <Icon className="mr-3 h-5 w-5" />
                                        <span>{item.label}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="absolute bottom-0 w-full p-4">
                    <button className="flex items-center justify-center w-full px-4 py-2 text-sm text-gray-300 hover:text-tertiary hover:bg-gray-800 rounded-md transition-colors">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign out</span>
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div
                className={cn(
                    'transition-all duration-300',
                    isSidebarOpen ? 'md:ml-64' : ''
                )}
            >
                {/* Top nav */}
                <header className="bg-tertiary shadow">
                    <div className="flex items-center justify-between h-16 px-4">
                        <div className="flex items-center">
                            <button
                                className="mr-4 text-secondary md:hidden"
                                onClick={toggleSidebar}
                            >
                                <Menu size={24} />
                            </button>
                            <h1 className="text-xl font-semibold text-gray-800">
                                {navItems.find((item) => pathname === item.href)?.label || 'Dashboard'}
                            </h1>
                        </div>
                        <div className="flex items-center">
                            <div className="ml-3 relative">
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm font-medium text-gray-700">Admin User</span>
                                    <div className="h-8 w-8 rounded-full bg-gray-500 flex items-center justify-center text-tertiary">
                                        A
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    );
} 