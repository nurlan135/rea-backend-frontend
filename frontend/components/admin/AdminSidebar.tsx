/**
 * Admin Sidebar Navigation
 * Left sidebar with navigation menu for admin dashboard
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Users, 
  Home, 
  Building, 
  FileText, 
  BarChart3, 
  Settings, 
  Shield,
  DollarSign,
  MessageSquare,
  Calendar,
  Archive
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: Home,
    permission: 'dashboard:view'
  },
  {
    name: 'İstifadəçilər',
    href: '/admin/users',
    icon: Users,
    permission: 'users:read'
  },
  {
    name: 'Əmlak',
    href: '/admin/properties',
    icon: Building,
    permission: 'properties:read'
  },
  {
    name: 'Müştərilər',
    href: '/admin/customers',
    icon: Users,
    permission: 'customers:read'
  },
  {
    name: 'Sövdələşmələr',
    href: '/admin/deals',
    icon: DollarSign,
    permission: 'deals:read'
  },
  {
    name: 'Rezervasiyalar',
    href: '/admin/bookings',
    icon: Calendar,
    permission: 'bookings:read'
  },
  {
    name: 'Ünsiyyət',
    href: '/admin/communications',
    icon: MessageSquare,
    permission: 'communications:read'
  },
  {
    name: 'Hesabatlar',
    href: '/admin/reports',
    icon: BarChart3,
    permission: 'reports:read'
  },
  {
    name: 'Sənədlər',
    href: '/admin/documents',
    icon: FileText,
    permission: 'documents:read'
  },
  {
    name: 'Audit',
    href: '/admin/audit',
    icon: Shield,
    permission: 'audit:read'
  },
  {
    name: 'Arxiv',
    href: '/admin/archive',
    icon: Archive,
    permission: 'archive:read'
  },
  {
    name: 'Ayarlar',
    href: '/admin/settings',
    icon: Settings,
    permission: 'settings:read'
  }
];

export default function AdminSidebar() {
  const pathname = usePathname();

  // TODO: Get user permissions from context/API
  const userPermissions = ['*']; // Admin has all permissions for now

  // Check if user has permission for nav item
  const hasPermission = (permission: string) => {
    if (userPermissions.includes('*')) return true;
    return userPermissions.includes(permission);
  };

  // Filter navigation items based on permissions
  const filteredNavItems = navigationItems.filter(item => 
    hasPermission(item.permission)
  );

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:pt-16">
      <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {filteredNavItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/admin' && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-blue-50 border-r-4 border-blue-500 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <item.icon
                    className={cn(
                      'mr-3 flex-shrink-0 h-5 w-5',
                      isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                    )}
                  />
                  {item.name}
                  {/* Active indicator */}
                  {isActive && (
                    <div className="ml-auto">
                      <div className="bg-blue-500 rounded-full w-2 h-2"></div>
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
        
        {/* User info at bottom */}
        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <div className="flex items-center">
            <div className="inline-block h-9 w-9 rounded-full bg-blue-500 flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                Admin Panel
              </p>
              <p className="text-xs font-medium text-gray-500">
                REA INVEST
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}