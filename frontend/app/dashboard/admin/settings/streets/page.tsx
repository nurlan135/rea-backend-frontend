'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
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

interface Street {
  id: string;
  name: string;
  district_id?: string;
  district_name?: string;
  created_at: string;
  updated_at: string;
}

interface District {
  id: string;
  name: string;
}

export default function StreetsPage() {
  const router = useRouter();
  const { getAuthHeaders } = useAuth();
  const [streets, setStreets] = useState<Street[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
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
  const [selectedStreet, setSelectedStreet] = useState<Street | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    district_id: ''
  });
  const [formErrors, setFormErrors] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDistrict, setFilterDistrict] = useState<string>('');

  const fetchStreets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      
      if (searchQuery) params.append('search', searchQuery);
      if (filterDistrict && filterDistrict !== 'all') params.append('district_id', filterDistrict);

      const response = await fetch(`http://localhost:8000/api/admin/streets?${params}`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setStreets(data.data.streets);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching streets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDistricts = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/admin/districts?limit=100', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setDistricts(data.data.districts);
      }
    } catch (error) {
      console.error('Error fetching districts:', error);
    }
  };

  useEffect(() => {
    fetchStreets();
  }, [pagination.page, searchQuery, filterDistrict]);

  useEffect(() => {
    fetchDistricts();
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPagination({ ...pagination, page: 1 });
  };

  const handlePageChange = (page: number) => {
    setPagination({ ...pagination, page });
  };

  const handleAdd = () => {
    setFormData({ name: '', district_id: '' });
    setFormErrors({});
    setIsEditing(false);
    setShowModal(true);
  };

  const handleEdit = (street: Street) => {
    setFormData({
      name: street.name,
      district_id: street.district_id || ''
    });
    setFormErrors({});
    setSelectedStreet(street);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = (street: Street) => {
    setSelectedStreet(street);
    setShowDeleteModal(true);
  };

  const submitForm = async () => {
    setSubmitting(true);
    setFormErrors({});

    try {
      const url = isEditing 
        ? `http://localhost:8000/api/admin/streets/${selectedStreet?.id}`
        : 'http://localhost:8000/api/admin/streets';
      
      const requestData = {
        name: formData.name,
        district_id: formData.district_id && formData.district_id !== 'none' ? formData.district_id : null
      };

      const response = await fetch(url, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();

      if (response.ok) {
        setShowModal(false);
        fetchStreets();
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
    if (!selectedStreet) return;

    setSubmitting(true);
    try {
      const response = await fetch(
        `http://localhost:8000/api/admin/streets/${selectedStreet.id}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders()
        }
      );

      if (response.ok) {
        setShowDeleteModal(false);
        fetchStreets();
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
      title: 'Küçə Adı',
    },
    {
      key: 'district_name',
      title: 'Rayon',
      render: (value: string) => value || '-'
    },
    {
      key: 'created_at',
      title: 'Yaradılma Tarixi',
      render: (value: string) => new Date(value).toLocaleDateString('az-AZ')
    }
  ];

  const filterComponent = (
    <Select value={filterDistrict} onValueChange={setFilterDistrict}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Rayon üzrə filter" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Hamısı</SelectItem>
        {districts.map((district) => (
          <SelectItem key={district.id} value={district.id}>
            {district.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <ProtectedRoute requiredRoles={['admin']}>
      <DashboardLayout title="Küçələr">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Link href="/dashboard/admin/settings">
              <Button variant="outline" size="sm" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Geri
              </Button>
            </Link>
            
            <h1 className="text-2xl font-bold text-gray-900">Küçələr</h1>
            <p className="text-gray-600">Küçə adlarının idarəsi</p>
          </div>

          <DataTable
            title="Küçələr Siyahısı"
            columns={columns}
            data={streets}
            loading={loading}
            pagination={pagination}
            onSearch={handleSearch}
            onPageChange={handlePageChange}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAdd={handleAdd}
            searchPlaceholder="Küçə axtar..."
            emptyMessage="Küçə tapılmadı"
            filter={filterComponent}
          />
        </div>

        {/* Add/Edit Modal */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? 'Küçəni Redaktə Et' : 'Yeni Küçə'}
              </DialogTitle>
              <DialogDescription>
                {isEditing ? 'Küçə məlumatlarını yeniləyin' : 'Yeni küçə əlavə edin'}
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
                <Label htmlFor="name">Küçə Adı *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Küçə adını daxil edin"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="district_id">Rayon</Label>
                <Select 
                  value={formData.district_id} 
                  onValueChange={(value: string) => setFormData({ ...formData, district_id: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Rayonu seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Rayon seçilməyib</SelectItem>
                    {districts.map((district) => (
                      <SelectItem key={district.id} value={district.id}>
                        {district.name}
                      </SelectItem>
                    ))}
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
              <DialogTitle>Küçəni Sil</DialogTitle>
              <DialogDescription>
                <strong>{selectedStreet?.name}</strong> küçəsini silmək istədiyinizdən əminsiniz?
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