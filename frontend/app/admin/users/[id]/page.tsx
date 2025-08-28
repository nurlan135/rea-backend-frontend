/**
 * User Detail Page
 * View and manage individual user details and permissions
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import UserDetailView from '@/components/admin/users/UserDetailView';

interface UserDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata: Metadata = {
  title: 'İstifadəçi Detalları - REA INVEST Admin',
  description: 'İstifadəçi məlumatları və icazələrinin idarəetməsi',
};

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { id } = await params;
  
  // Basic ID validation
  if (!id || typeof id !== 'string') {
    notFound();
  }

  return (
    <div className="space-y-6">
      <UserDetailView userId={id} />
    </div>
  );
}