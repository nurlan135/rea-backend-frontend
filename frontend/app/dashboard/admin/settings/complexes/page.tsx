'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Complex {
  id: string;
  name: string;
  location?: string;
  type: 'residential' | 'commercial' | 'mixed';
  created_at: string;
  updated_at: string;
}

const complexTypeLabels = {
  residential: 'Yaşayış',
  commercial: 'Kommersiya',
  mixed: 'Qarışıq'
};

const complexTypeColors = {
  residential: 'bg-green-100 text-green-800',
  commercial: 'bg-blue-100 text-blue-800',
  mixed: 'bg-purple-100 text-purple-800'
};

export default function ComplexesPage() {
  const router = useRouter();
  const { getAuthHeaders } = useAuth();
  const [complexes, setComplexes] = useState<Complex[]>([]);
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
  const [selectedComplex, setSelectedComplex] = useState<Complex | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    type: 'residential' as const
  });
  const [formErrors, setFormErrors] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('');

  const fetchComplexes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      
      if (searchQuery) params.append('search', searchQuery);
      if (filterType && filterType !== 'all') params.append('type', filterType);

      const response = await fetch(`http://localhost:8000/api/admin/complexes?${params}`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setComplexes(data.data.complexes);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching complexes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplexes();
  }, [pagination.page, searchQuery, filterType]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPagination({ ...pagination, page: 1 });
  };

  const handlePageChange = (page: number) => {
    setPagination({ ...pagination, page });
  };

  const handleAdd = () => {
    setFormData({ name: '', location: '', type: 'residential' });
    setFormErrors({});
    setIsEditing(false);
    setShowModal(true);
  };

  const handleEdit = (complex: Complex) => {
    setFormData({
      name: complex.name,
      location: complex.location || '',
      type: complex.type
    });
    setFormErrors({});
    setSelectedComplex(complex);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = (complex: Complex) => {
    setSelectedComplex(complex);
    setShowDeleteModal(true);
  };

  const submitForm = async () => {
    setSubmitting(true);
    setFormErrors({});

    try {
      const url = isEditing 
        ? `http://localhost:8000/api/admin/complexes/${selectedComplex?.id}`
        : 'http://localhost:8000/api/admin/complexes';
      
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
        fetchComplexes();
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
    if (!selectedComplex) return;

    setSubmitting(true);
    try {
      const response = await fetch(
        `http://localhost:8000/api/admin/complexes/${selectedComplex.id}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders()
        }
      );

      if (response.ok) {
        setShowDeleteModal(false);
        fetchComplexes();
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
      title: 'Ad',
    },
    {
      key: 'location',
      title: 'Yer',
      render: (value: string) => value || '-'
    },
    {
      key: 'type',
      title: 'Tip',
      render: (value: string) => (
        <Badge className={complexTypeColors[value as keyof typeof complexTypeColors]}>
          {complexTypeLabels[value as keyof typeof complexTypeLabels]}
        </Badge>
      )
    },
    {
      key: 'created_at',
      title: 'Yaradılma Tarixi',
      render: (value: string) => new Date(value).toLocaleDateString('az-AZ')
    }
  ];

  const filterComponent = (
    <Select value={filterType} onValueChange={setFilterType}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Tip üzrə filter" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Hamısı</SelectItem>
        <SelectItem value="residential">Yaşayış</SelectItem>
        <SelectItem value="commercial">Kommersiya</SelectItem>
        <SelectItem value="mixed">Qarışıq</SelectItem>
      </SelectContent>
    </Select>
  );

  return (
    <ProtectedRoute requiredRoles={['admin']}>
      <DashboardLayout title="Komplekslər">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Link href="/dashboard/admin/settings">
              <Button variant="outline" size="sm" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Geri
              </Button>
            </Link>
            
            <h1 className="text-2xl font-bold text-gray-900">Komplekslər</h1>
            <p className="text-gray-600">Layihə və komplekslərin idarəsi</p>
          </div>

          <DataTable
            title="Komplekslər Siyahısı"
            columns={columns}
            data={complexes}
            loading={loading}
            pagination={pagination}
            onSearch={handleSearch}
            onPageChange={handlePageChange}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAdd={handleAdd}
            searchPlaceholder="Kompleks axtar..."
            emptyMessage="Kompleks tapılmadı"
            filter={filterComponent}
          />
        </div>

        {/* Add/Edit Modal */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? 'Kompleksi Redaktə Et' : 'Yeni Kompleks'}
              </DialogTitle>
              <DialogDescription>
                {isEditing ? 'Kompleks məlumatlarını yeniləyin' : 'Yeni kompleks əlavə edin'}
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
                <Label htmlFor="name">Kompleks Adı *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Kompleks adını daxil edin"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="location">Yer</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Yerləşmə məlumatı"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="type">Tip *</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Yaşayış</SelectItem>
                    <SelectItem value="commercial">Kommersiya</SelectItem>
                    <SelectItem value="mixed">Qarışıq</SelectItem>
                  </SelectContent>
                </Select>
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
              <DialogTitle>Kompleksi Sil</DialogTitle>
              <DialogDescription>
                <strong>{selectedComplex?.name}</strong> kompleksini silmək istədiyinizdən əminsiniz?
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