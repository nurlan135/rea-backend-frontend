/**
 * Edit User Page
 * Form page for editing existing users
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import UserForm from '@/components/admin/users/UserForm';
import PageHeader from '@/components/admin/PageHeader';

interface EditUserPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata: Metadata = {
  title: 'İstifadəçini Redaktə Et - REA INVEST Admin',
  description: 'İstifadəçi məlumatlarının redaktəsi',
};

export default async function EditUserPage({ params }: EditUserPageProps) {
  const { id } = await params;
  
  // Basic ID validation
  if (!id || typeof id !== 'string') {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="İstifadəçini Redaktə Et"
        description="İstifadəçi məlumatlarını yeniləyin və icazələri idarə edin"
        actions={
          <div className="flex items-center space-x-3">
            <Link
              href={`/admin/users/${id}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Detalları gör
            </Link>
            <Link
              href="/admin/users"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              İstifadəçilər
            </Link>
          </div>
        }
      />

      {/* Form */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <UserForm mode="edit" userId={id} />
      </div>
    </div>
  );
}