'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Branch {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function BranchesPage() {
  const router = useRouter();
  const { getAuthHeaders } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
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
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    is_active: true
  });
  const [formErrors, setFormErrors] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`http://localhost:8000/api/admin/branches?${params}`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setBranches(data.data.branches);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, [pagination.page, searchQuery]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPagination({ ...pagination, page: 1 });
  };

  const handlePageChange = (page: number) => {
    setPagination({ ...pagination, page });
  };

  const handleAdd = () => {
    setFormData({ name: '', address: '', phone: '', email: '', is_active: true });
    setFormErrors({});
    setIsEditing(false);
    setShowModal(true);
  };

  const handleEdit = (branch: Branch) => {
    setFormData({
      name: branch.name,
      address: branch.address || '',
      phone: branch.phone || '',
      email: branch.email || '',
      is_active: branch.is_active
    });
    setFormErrors({});
    setSelectedBranch(branch);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = (branch: Branch) => {
    setSelectedBranch(branch);
    setShowDeleteModal(true);
  };

  const submitForm = async () => {
    setSubmitting(true);
    setFormErrors({});

    try {
      const url = isEditing 
        ? `http://localhost:8000/api/admin/branches/${selectedBranch?.id}`
        : 'http://localhost:8000/api/admin/branches';
      
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
        fetchBranches();
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
    if (!selectedBranch) return;

    setSubmitting(true);
    try {
      const response = await fetch(
        `http://localhost:8000/api/admin/branches/${selectedBranch.id}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders()
        }
      );

      if (response.ok) {
        setShowDeleteModal(false);
        fetchBranches();
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
      title: 'Filial Adı',
    },
    {
      key: 'address',
      title: 'Ünvan',
      render: (value: string) => value || '-'
    },
    {
      key: 'phone',
      title: 'Telefon',
      render: (value: string) => value || '-'
    },
    {
      key: 'email',
      title: 'E-mail',
      render: (value: string) => value || '-'
    },
    {
      key: 'is_active',
      title: 'Status',
      render: (value: boolean) => (
        <Badge className={value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
          {value ? 'Aktiv' : 'Deaktiv'}
        </Badge>
      )
    },
    {
      key: 'created_at',
      title: 'Yaradılma Tarixi',
      render: (value: string) => new Date(value).toLocaleDateString('az-AZ')
    }
  ];

  return (
    <ProtectedRoute requiredRoles={['admin']}>
      <DashboardLayout title="Filiallar">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Link href="/dashboard/admin/settings">
              <Button variant="outline" size="sm" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Geri
              </Button>
            </Link>
            
            <h1 className="text-2xl font-bold text-gray-900">Filiallar</h1>
            <p className="text-gray-600">Şirkət filiallarının idarəsi</p>
          </div>

          <DataTable
            title="Filiallar Siyahısı"
            columns={columns}
            data={branches}
            loading={loading}
            pagination={pagination}
            onSearch={handleSearch}
            onPageChange={handlePageChange}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAdd={handleAdd}
            searchPlaceholder="Filial axtar..."
            emptyMessage="Filial tapılmadı"
          />
        </div>

        {/* Add/Edit Modal */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? 'Filialı Redaktə Et' : 'Yeni Filial'}
              </DialogTitle>
              <DialogDescription>
                {isEditing ? 'Filial məlumatlarını yeniləyin' : 'Yeni filial əlavə edin'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4 max-h-96 overflow-y-auto">
              {formErrors.general && (
                <div className="flex items-start p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                  <p className="text-red-700 text-sm">{formErrors.general}</p>
                </div>
              )}

              <div>
                <Label htmlFor="name">Filial Adı *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Filial adını daxil edin"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="address">Ünvan</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Filial ünvanını daxil edin"
                  className="mt-1"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Telefon nömrəsini daxil edin"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="E-mail ünvanını daxil edin"
                  className="mt-1"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: Boolean(checked) })}
                />
                <Label htmlFor="is_active">Aktiv filial</Label>
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
              <DialogTitle>Filialı Sil</DialogTitle>
              <DialogDescription>
                <strong>{selectedBranch?.name}</strong> filialını silmək istədiyinizdən əminsiniz?
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