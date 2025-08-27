'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface DocumentType {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export default function DocumentTypesPage() {
  const router = useRouter();
  const { getAuthHeaders } = useAuth();
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [formErrors, setFormErrors] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDocumentTypes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`http://localhost:8000/api/admin/document-types?${params}`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setDocumentTypes(data.data.documentTypes);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching document types:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocumentTypes();
  }, [pagination.page, searchQuery]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPagination({ ...pagination, page: 1 });
  };

  const handlePageChange = (page: number) => {
    setPagination({ ...pagination, page });
  };

  const handleAdd = () => {
    setFormData({ name: '', description: '' });
    setFormErrors({});
    setIsEditing(false);
    setShowModal(true);
  };

  const handleEdit = (documentType: DocumentType) => {
    setFormData({
      name: documentType.name,
      description: documentType.description || ''
    });
    setFormErrors({});
    setSelectedDocumentType(documentType);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = (documentType: DocumentType) => {
    setSelectedDocumentType(documentType);
    setShowDeleteModal(true);
  };

  const submitForm = async () => {
    setSubmitting(true);
    setFormErrors({});

    try {
      const url = isEditing 
        ? `http://localhost:8000/api/admin/document-types/${selectedDocumentType?.id}`
        : 'http://localhost:8000/api/admin/document-types';
      
      const response = await fetch(url, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok) {
        setShowModal(false);
        fetchDocumentTypes();
      } else {
        setFormErrors({ general: result.error?.message || 'Xəta baş verdi' });
      }
    } catch (error) {
      setFormErrors({ general: 'Server xətası' });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedDocumentType) return;

    setSubmitting(true);
    try {
      const response = await fetch(
        `http://localhost:8000/api/admin/document-types/${selectedDocumentType.id}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders()
        }
      );

      if (response.ok) {
        setShowDeleteModal(false);
        fetchDocumentTypes();
      } else {
        const result = await response.json();
        alert(result.error?.message || 'Silmə zamanı xəta');
      }
    } catch (error) {
      alert('Server xətası');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'name',
      title: 'Sənəd Növü',
    },
    {
      key: 'description',
      title: 'Açıqlama',
      render: (value: string) => value || '-'
    },
    {
      key: 'created_at',
      title: 'Yaradılma Tarixi',
      render: (value: string) => new Date(value).toLocaleDateString('az-AZ')
    }
  ];

  return (
    <ProtectedRoute requiredRoles={['admin']}>
      <DashboardLayout title="Sənəd Növləri">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Link href="/dashboard/admin/settings">
              <Button variant="outline" size="sm" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Geri
              </Button>
            </Link>
            
            <h1 className="text-2xl font-bold text-gray-900">Sənəd Növləri</h1>
            <p className="text-gray-600">Mülkiyyət sənəd növləri</p>
          </div>

          <DataTable
            title="Sənəd Növləri Siyahısı"
            columns={columns}
            data={documentTypes}
            loading={loading}
            pagination={pagination}
            onSearch={handleSearch}
            onPageChange={handlePageChange}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAdd={handleAdd}
            searchPlaceholder="Sənəd növü axtar..."
            emptyMessage="Sənəd növü tapılmadı"
          />
        </div>

        {/* Add/Edit Modal */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? 'Sənəd Növünü Redaktə Et' : 'Yeni Sənəd Növü'}
              </DialogTitle>
              <DialogDescription>
                {isEditing ? 'Sənəd növü məlumatlarını yeniləyin' : 'Yeni sənəd növü əlavə edin'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              {formErrors.general && (
                <div className="flex items-start p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                  <p className="text-red-700 text-sm">{formErrors.general}</p>
                </div>
              )}

              <div>
                <Label htmlFor="name">Sənəd Növü *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Sənəd növünü daxil edin"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Açıqlama</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Sənəd növü haqqında açıqlama"
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Ləğv Et
              </Button>
              <Button onClick={submitForm} disabled={submitting}>
                {submitting ? 'Saxlanılır...' : (isEditing ? 'Yenilə' : 'Əlavə Et')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sənəd Növünü Sil</DialogTitle>
              <DialogDescription>
                <strong>{selectedDocumentType?.name}</strong> sənəd növünü silmək istədiyinizdən əminsiniz?
                Bu əməliyyat geri qaytarıla bilməz.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                Ləğv Et
              </Button>
              <Button variant="destructive" onClick={confirmDelete} disabled={submitting}>
                {submitting ? 'Silinir...' : 'Sil'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  );
}