/**
 * Admin Users Page
 * Users management page with list, filters, and actions
 */

import { Metadata } from 'next';
import { Suspense } from 'react';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import UsersList from '@/components/admin/users/UsersList';
import UserFilters from '@/components/admin/users/UserFilters';
import PageHeader from '@/components/admin/PageHeader';

export const metadata: Metadata = {
  title: 'İstifadəçilər - REA INVEST Admin',
  description: 'İstifadəçi idarəetmə səhifəsi - REA INVEST admin paneli',
};

interface UsersPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    role?: string;
    status?: string;
    branch_code?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  }>;
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const resolvedSearchParams = await searchParams;
  const {
    page = '1',
    search = '',
    role = '',
    status = '',
    branch_code = '',
    sort = 'created_at',
    order = 'desc'
  } = resolvedSearchParams;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="İstifadəçilər"
        description="Sistem istifadəçilərinin idarə edilməsi və rolların təyin edilməsi"
        actions={
          <Link
            href="/admin/users/create"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Yeni İstifadəçi
          </Link>
        }
      />

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <UserFilters
          initialValues={{
            search,
            role,
            status,
            branch_code,
            sort,
            order
          }}
        />
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <Suspense
          fallback={
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-600">İstifadəçilər yüklənir...</p>
            </div>
          }
        >
          <UsersList
            searchParams={{
              page,
              search,
              role,
              status,
              branch_code,
              sort,
              order
            }}
          />
        </Suspense>
      </div>
    </div>
  );
}