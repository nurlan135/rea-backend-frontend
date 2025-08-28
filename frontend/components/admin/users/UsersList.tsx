/**
 * Users List Component
 * Data table component for displaying users with pagination and actions
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Edit, 
  MoreVertical, 
  Shield, 
  ShieldOff, 
  KeyRound, 
  Unlock,
  User,
  Crown,
  Briefcase,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import adminUsersService, { User as UserType, UserListResponse } from '@/lib/api/admin/users';

// Use types from API service
type User = UserType;

interface UsersListProps {
  searchParams: {
    page: string;
    search: string;
    role: string;
    status: string;
    branch_code: string;
    sort: string;
    order: string;
  };
}

// Role configuration

const roleIcons = {
  admin: Crown,
  director: Shield,
  vp: Briefcase,
  manager: UserCheck,
  agent: User
};

const roleLabels = {
  admin: 'Admin',
  director: 'Direktor',
  vp: 'VP',
  manager: 'Manager',
  agent: 'Agent'
};

const roleColors = {
  admin: 'text-red-600 bg-red-50 border-red-200',
  director: 'text-blue-600 bg-blue-50 border-blue-200',
  vp: 'text-purple-600 bg-purple-50 border-purple-200',
  manager: 'text-green-600 bg-green-50 border-green-200',
  agent: 'text-gray-600 bg-gray-50 border-gray-200'
};

const statusColors = {
  active: 'text-green-600 bg-green-50 border-green-200',
  inactive: 'text-gray-600 bg-gray-50 border-gray-200',
  suspended: 'text-red-600 bg-red-50 border-red-200'
};

const statusLabels = {
  active: 'Aktiv',
  inactive: 'Qeyri-aktiv',
  suspended: 'Dayandırılmış'
};

export default function UsersList({ searchParams }: UsersListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    pages: 1
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch users data
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await adminUsersService.getUsers({
          page: parseInt(searchParams.page),
          search: searchParams.search || undefined,
          role: searchParams.role || undefined,
          status: searchParams.status || undefined,
          branch_code: searchParams.branch_code || undefined,
          sort: searchParams.sort || undefined,
          order: (searchParams.order as 'asc' | 'desc') || undefined
        });

        if (response.success && response.data) {
          setUsers(response.data.users);
          setPagination(response.data.pagination);
        } else {
          setError(response.error?.message || 'İstifadəçilər yüklənərkən xəta baş verdi');
        }
        
      } catch (err) {
        setError('İstifadəçilər yüklənərkən xəta baş verdi');
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [searchParams]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Heç vaxt';
    return new Date(dateString).toLocaleDateString('az-AZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-sm text-gray-600">İstifadəçilər yüklənir...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800"
        >
          Yenidən yükləyin
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                İstifadəçi
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Filial
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Son Daxil Olma
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Əməliyyatlar
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => {
              const RoleIcon = roleIcons[user.role];
              
              return (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </div>
                          {user.is_locked && (
                            <Shield className="h-4 w-4 text-red-500" title="Hesab kilidlənib" />
                          )}
                          {user.force_password_change && (
                            <KeyRound className="h-4 w-4 text-yellow-500" title="Parol dəyişmə tələb olunur" />
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        {user.phone && (
                          <div className="text-xs text-gray-400">{user.phone}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={cn(
                      'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border',
                      roleColors[user.role]
                    )}>
                      <RoleIcon className="h-3 w-3 mr-1" />
                      {roleLabels[user.role]}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={cn(
                      'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border',
                      statusColors[user.status]
                    )}>
                      {statusLabels[user.status]}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.branch_code || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.last_login_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="text-blue-600 hover:text-blue-900"
                        title="Redaktə et"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      
                      <button
                        className="text-gray-400 hover:text-gray-600"
                        title="Daha çox"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {users.length === 0 && (
        <div className="text-center py-12">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">İstifadəçi tapılmadı</h3>
          <p className="text-gray-500">
            Axtarış meyarlarınızı dəyişdirməyi yoxlayın
          </p>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="bg-white px-6 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <Link
              href={`?${new URLSearchParams({ ...searchParams, page: String(Math.max(1, pagination.page - 1)) })}`}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Əvvəlki
            </Link>
            <Link
              href={`?${new URLSearchParams({ ...searchParams, page: String(Math.min(pagination.pages, pagination.page + 1)) })}`}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Növbəti
            </Link>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span>
                {' '}-{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>
                {' '}arası, ümumi{' '}
                <span className="font-medium">{pagination.total}</span> nəticə
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <Link
                  href={`?${new URLSearchParams({ ...searchParams, page: '1' })}`}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <ChevronsLeft className="h-5 w-5" />
                </Link>
                <Link
                  href={`?${new URLSearchParams({ ...searchParams, page: String(Math.max(1, pagination.page - 1)) })}`}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Link>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const pageNum = Math.max(1, pagination.page - 2) + i;
                  if (pageNum > pagination.pages) return null;
                  
                  return (
                    <Link
                      key={pageNum}
                      href={`?${new URLSearchParams({ ...searchParams, page: String(pageNum) })}`}
                      className={cn(
                        'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
                        pageNum === pagination.page
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      )}
                    >
                      {pageNum}
                    </Link>
                  );
                })}
                
                <Link
                  href={`?${new URLSearchParams({ ...searchParams, page: String(Math.min(pagination.pages, pagination.page + 1)) })}`}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <ChevronRight className="h-5 w-5" />
                </Link>
                <Link
                  href={`?${new URLSearchParams({ ...searchParams, page: String(pagination.pages) })}`}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <ChevronsRight className="h-5 w-5" />
                </Link>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}