'use client';

import React, { ReactNode, useState, useEffect } from 'react';
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
    LogOut,
    TruckIcon,
    ClipboardIcon,
    ReceiptIcon,
    WalletIcon,
    ChevronDown,
    ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type NavItem = {
    icon: React.ElementType;
    href: string;
    label: string;
    children?: NavItem[];
};

const navItems: NavItem[] = [
    { icon: Home, href: '/dashboard', label: 'Dashboard' },
    {
        icon: Package,
        href: '/inventory',
        label: 'Inventory',
        children: [
            { icon: TruckIcon, href: '/inventory/transfers', label: 'Transfers' },
            { icon: TruckIcon, href: '/suppliers', label: 'Suppliers' },
            { icon: FileText, href: '/purchases', label: 'Purchases' },
        ]
    },
    { icon: ClipboardIcon, href: '/quotations', label: 'Quotations' },
    { icon: Store, href: '/shops', label: 'Shops' },
    { icon: Users, href: '/customers', label: 'Customers' },
    { icon: FileText, href: '/invoices', label: 'Invoices' },
    { icon: ReceiptIcon, href: '/receipts', label: 'Receipts' },
    { icon: WalletIcon, href: '/accounting', label: 'Accounting' },
    { icon: BarChart2, href: '/reports', label: 'Reports' },
    { icon: Settings, href: '/settings', label: 'Settings' },
];

interface MainLayoutProps {
    children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [expandedItems, setExpandedItems] = useState<string[]>(['/inventory']); // Auto-expand Inventory by default
    const pathname = usePathname();

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const toggleSubmenu = (itemHref: string) => {
        setExpandedItems(prev =>
            prev.includes(itemHref)
                ? prev.filter(href => href !== itemHref)
                : [...prev, itemHref]
        );
    };

    // Auto-expand parent menu if current path is a child
    useEffect(() => {
        navItems.forEach(item => {
            if (item.children && item.children.some(child => child.href === pathname)) {
                if (!expandedItems.includes(item.href)) {
                    setExpandedItems(prev => [...prev, item.href]);
                }
            }
        });
    }, [pathname]);

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-40 w-64 bg-secondary text-tertiary transform transition-transform duration-300 ease-in-out flex flex-col',
                    isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
                    'md:translate-x-0'
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800 flex-shrink-0">
                    <div className="flex items-center">
                        <span className="text-xl font-bold text-primary">MS Sport</span>
                    </div>
                    <button
                        className="md:hidden text-tertiary hover:text-primary"
                        onClick={toggleSidebar}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Scrollable Navigation */}
                <div className="flex-1 overflow-y-auto">
                    <nav className="mt-6 px-2">
                        <ul className="space-y-1">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;
                                const isExpanded = expandedItems.includes(item.href);
                                const hasActiveChild = item.children?.some(child => pathname === child.href);
                                const isParentActive = isActive || hasActiveChild;

                                return (
                                    <li key={item.href} className={item.children ? 'mb-1' : ''}>
                                        {item.children ? (
                                            <>
                                                <div className="flex">
                                                    <Link
                                                        href={item.href}
                                                        className={cn(
                                                            'flex-grow flex items-center px-4 py-3 rounded-l-md transition-colors',
                                                            isParentActive
                                                                ? 'bg-primary text-tertiary'
                                                                : 'text-gray-300 hover:bg-gray-800 hover:text-tertiary'
                                                        )}
                                                    >
                                                        <Icon className="mr-3 h-5 w-5" />
                                                        <span>{item.label}</span>
                                                    </Link>
                                                    <button
                                                        onClick={() => toggleSubmenu(item.href)}
                                                        className={cn(
                                                            'w-10 flex items-center justify-center rounded-r-md transition-colors',
                                                            isParentActive
                                                                ? 'bg-primary text-tertiary'
                                                                : 'text-gray-300 hover:bg-gray-800 hover:text-tertiary'
                                                        )}
                                                        aria-label="Toggle submenu"
                                                    >
                                                        {isExpanded ? (
                                                            <ChevronDown className="h-4 w-4" />
                                                        ) : (
                                                            <ChevronRight className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                </div>
                                                {isExpanded && (
                                                    <ul className="mt-1 ml-6 space-y-1">
                                                        {item.children.map(child => {
                                                            const ChildIcon = child.icon;
                                                            const isChildActive = pathname === child.href;
                                                            return (
                                                                <li key={child.href}>
                                                                    <Link
                                                                        href={child.href}
                                                                        className={cn(
                                                                            'flex items-center px-4 py-2 rounded-md transition-colors',
                                                                            isChildActive
                                                                                ? 'bg-gray-700 text-tertiary'
                                                                                : 'text-gray-300 hover:bg-gray-800 hover:text-tertiary'
                                                                        )}
                                                                    >
                                                                        <ChildIcon className="mr-3 h-4 w-4" />
                                                                        <span>{child.label}</span>
                                                                    </Link>
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                )}
                                            </>
                                        ) : (
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
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-800 bg-secondary flex-shrink-0">
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
                                {pathname === '/' ? 'Dashboard' : (
                                    navItems.flatMap(item =>
                                        [item, ...(item.children || [])]
                                    ).find(item => pathname === item.href)?.label || 'Dashboard'
                                )}
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