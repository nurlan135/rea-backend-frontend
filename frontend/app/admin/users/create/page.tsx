/**
 * Create User Page
 * Form page for creating new users
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import UserForm from '@/components/admin/users/UserForm';
import PageHeader from '@/components/admin/PageHeader';

export const metadata: Metadata = {
  title: 'Yeni İstifadəçi - REA INVEST Admin',
  description: 'Yeni istifadəçi yaratma formu',
};

export default function CreateUserPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Yeni İstifadəçi"
        description="Sistemə yeni istifadəçi əlavə edin və rolunu təyin edin"
        actions={
          <Link
            href="/admin/users"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri
          </Link>
        }
      />

      {/* Form */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <UserForm mode="create" />
      </div>
    </div>
  );
}