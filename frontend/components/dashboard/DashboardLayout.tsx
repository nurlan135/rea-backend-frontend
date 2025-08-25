'use client';

import { ReactNode, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Bell,
  ChevronDown,
  Home,
  Building,
  Calendar,
  DollarSign,
  Receipt,
  MessageSquare,
  FileText,
  Users,
  Shield,
  Settings,
  Search,
  Menu,
  X
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  badge?: string;
  children?: NavigationItem[];
}

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notificationCount] = useState(3); // Mock notification count

  const navigation: NavigationItem[] = [
    {
      name: 'Əsas Səhifə',
      href: '/dashboard',
      icon: Home,
    },
    {
      name: 'Əmlak',
      href: '/dashboard/properties',
      icon: Building,
      badge: '24', // Could be dynamic count
    },
    {
      name: 'Rezervasiyalar',
      href: '/dashboard/bookings',
      icon: Calendar,
      badge: '5',
    },
    {
      name: 'Satışlar',
      href: '/dashboard/deals',
      icon: DollarSign,
    },
    {
      name: 'Xərclər',
      href: '/dashboard/expenses',
      icon: Receipt,
      requiredRoles: ['manager', 'vp', 'director', 'admin'],
    },
    {
      name: 'Ünsiyyət',
      href: '/dashboard/communications',
      icon: MessageSquare,
    },
    {
      name: 'Hesabatlar',
      href: '/dashboard/reports',
      icon: FileText,
      requiredRoles: ['manager', 'vp', 'director', 'admin'],
    },
    {
      name: 'İstifadəçilər',
      href: '/dashboard/users',
      icon: Users,
      requiredRoles: ['admin'],
    },
    {
      name: 'Audit Log',
      href: '/dashboard/audit',
      icon: Shield,
      requiredRoles: ['director', 'admin'],
    },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const filteredNavigation = navigation.filter(item => {
    if (item.requiredRoles && item.requiredRoles.length > 0) {
      return item.requiredRoles.includes(user?.role?.toLowerCase() || '');
    }
    if (item.requiredPermissions && item.requiredPermissions.length > 0) {
      return item.requiredPermissions.every(permission =>
        user?.permissions?.includes(permission)
      );
    }
    return true;
  });

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-card shadow-2xl border-r border-border">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 rounded-full h-10 w-10"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            <SidebarContent 
              navigation={filteredNavigation} 
              collapsed={false}
              onCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className={`flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-60'}`}>
          <SidebarContent 
            navigation={filteredNavigation} 
            collapsed={sidebarCollapsed}
            onCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Header */}
        <header className="relative z-10 flex-shrink-0 flex h-16 bg-card shadow-sm border-b border-border">
          <Button
            variant="ghost"
            size="icon"
            className="px-4 border-r border-border text-muted-foreground md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          
          <div className="flex-1 px-4 flex justify-between items-center">
            {/* Search */}
            <div className="flex-1 flex max-w-md">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-muted-foreground" />
                </div>
                <Input
                  id="search-field"
                  className="pl-10 pr-3 h-9 bg-background/60 border-input focus:bg-background transition-colors"
                  placeholder="Axtar..."
                  type="search"
                  name="search"
                />
              </div>
            </div>
            
            {/* Header Actions */}
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <ThemeToggle />
              
              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                  >
                    {notificationCount}
                  </Badge>
                )}
              </Button>
              
              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 h-9">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-foreground">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </span>
                    </div>
                    <div className="hidden md:block text-left">
                      <div className="text-sm font-medium">
                        {user?.firstName} {user?.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {user?.branch?.name}
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                      <Badge variant="outline" className="w-fit text-xs">
                        {user?.role}
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Tənzimləmələr
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Users className="mr-2 h-4 w-4" />
                    Profil
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    Çıxış
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-background">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

interface SidebarContentProps {
  navigation: NavigationItem[];
  collapsed: boolean;
  onCollapse: () => void;
}

function SidebarContent({ navigation, collapsed, onCollapse }: SidebarContentProps) {
  const { user } = useAuth();
  const pathname = usePathname();

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-card border-r border-border">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        {/* Logo & Collapse Button */}
        <div className="flex items-center justify-between flex-shrink-0 px-4 mb-6">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-primary rounded flex items-center justify-center">
              <Building className="h-5 w-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <h1 className="ml-3 text-xl font-bold text-foreground transition-opacity">
                REA INVEST
              </h1>
            )}
          </div>
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground hidden md:flex"
              onClick={onCollapse}
            >
              <Menu className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-2 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  group flex items-center px-2 py-2 text-sm font-medium rounded-lg transition-colors
                  ${
                    isActive
                      ? 'bg-primary/10 text-primary border-r-2 border-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }
                `}
              >
                <Icon className={`flex-shrink-0 h-5 w-5 transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-accent-foreground'
                } ${collapsed ? '' : 'mr-3'}`} />
                {!collapsed && (
                  <div className="flex items-center justify-between flex-1">
                    <span>{item.name}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                )}
              </Link>
            )
          })}
        </nav>
      </div>
      
      {/* User Info - Bottom */}
      {!collapsed && (
        <div className="flex-shrink-0 border-t border-border p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-sm font-medium text-primary-foreground">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.branch?.name}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Collapsed expand button */}
      {collapsed && (
        <div className="flex-shrink-0 p-2">
          <Button
            variant="ghost"
            size="icon"
            className="w-full h-10 text-muted-foreground hover:text-foreground"
            onClick={onCollapse}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}