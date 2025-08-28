/**
 * Breadcrumbs Component
 * Navigation breadcrumb trail for admin pages
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

// Breadcrumb mapping for admin routes
const routeBreadcrumbs: Record<string, BreadcrumbItem[]> = {
  '/admin': [
    { label: 'Dashboard' }
  ],
  '/admin/users': [
    { label: 'Dashboard', href: '/admin' },
    { label: 'İstifadəçilər' }
  ],
  '/admin/users/create': [
    { label: 'Dashboard', href: '/admin' },
    { label: 'İstifadəçilər', href: '/admin/users' },
    { label: 'Yeni İstifadəçi' }
  ],
  '/admin/properties': [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Əmlak' }
  ],
  '/admin/customers': [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Müştərilər' }
  ],
  '/admin/deals': [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Sövdələşmələr' }
  ],
  '/admin/reports': [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Hesabatlar' }
  ],
  '/admin/settings': [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Ayarlar' }
  ],
  '/admin/audit': [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Audit Logları' }
  ]
};

export default function Breadcrumbs() {
  const pathname = usePathname();
  
  // Get breadcrumbs for current route
  const getBreadcrumbs = (path: string): BreadcrumbItem[] => {
    // Check for exact match first
    if (routeBreadcrumbs[path]) {
      return routeBreadcrumbs[path];
    }
    
    // Check for dynamic routes (e.g. /admin/users/[id])
    const segments = path.split('/');
    if (segments.length > 3) {
      // Dynamic route like /admin/users/123 or /admin/users/123/edit
      const baseRoute = segments.slice(0, 3).join('/'); // /admin/users
      const baseBreadcrumbs = routeBreadcrumbs[baseRoute] || [];
      
      // Add dynamic segments
      const dynamicBreadcrumbs: BreadcrumbItem[] = [...baseBreadcrumbs];
      
      if (segments.length === 4) {
        // /admin/users/123
        if (segments[2] === 'users') {
          dynamicBreadcrumbs.push({ label: 'İstifadəçi Detalları' });
        } else if (segments[2] === 'properties') {
          dynamicBreadcrumbs.push({ label: 'Əmlak Detalları' });
        }
      } else if (segments.length === 5) {
        // /admin/users/123/edit
        if (segments[2] === 'users') {
          dynamicBreadcrumbs.push(
            { label: 'İstifadəçi Detalları', href: `/admin/users/${segments[3]}` },
            { label: 'Redaktə' }
          );
        }
      }
      
      return dynamicBreadcrumbs;
    }
    
    // Fallback for unknown routes
    return [{ label: 'Dashboard', href: '/admin' }, { label: 'Səhifə' }];
  };

  const breadcrumbs = getBreadcrumbs(pathname);

  if (breadcrumbs.length <= 1) {
    return null; // Don't show breadcrumbs for dashboard
  }

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-4">
        {/* Home icon for first item */}
        <li>
          <div>
            <Link 
              href="/admin" 
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <Home className="h-5 w-5" />
              <span className="sr-only">Ana səhifə</span>
            </Link>
          </div>
        </li>
        
        {breadcrumbs.map((item, index) => (
          <li key={index}>
            <div className="flex items-center">
              <ChevronRight className="flex-shrink-0 h-5 w-5 text-gray-300" />
              {item.href ? (
                <Link
                  href={item.href}
                  className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="ml-4 text-sm font-medium text-gray-900">
                  {item.label}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}