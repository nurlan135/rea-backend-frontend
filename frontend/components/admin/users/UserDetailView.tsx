/**
 * User Detail View Component
 * View and manage individual user details and permissions
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit,
  Shield,
  ShieldOff,
  KeyRound,
  Unlock,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Trash2,
  Plus,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import adminUsersService, { User as UserType, UserPermissions, PermissionTemplate } from '@/lib/api/admin/users';
import PageHeader from '@/components/admin/PageHeader';

interface UserDetailViewProps {
  userId: string;
}

const roleColors = {
  admin: 'text-red-600 bg-red-50 border-red-200',
  director: 'text-blue-600 bg-blue-50 border-blue-200',
  vp: 'text-purple-600 bg-purple-50 border-purple-200',
  manager: 'text-green-600 bg-green-50 border-green-200',
  agent: 'text-gray-600 bg-gray-50 border-gray-200'
};

const roleLabels = {
  admin: 'Admin',
  director: 'Direktor',
  vp: 'VP',
  manager: 'Manager',
  agent: 'Agent'
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

export default function UserDetailView({ userId }: UserDetailViewProps) {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [templates, setTemplates] = useState<PermissionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'permissions'>('details');
  const [newPermission, setNewPermission] = useState('');
  const [showAddPermission, setShowAddPermission] = useState(false);
  const [availablePermissions, setAvailablePermissions] = useState<string[]>([]);

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [userResponse, permissionsResponse, templatesResponse] = await Promise.all([
          adminUsersService.getUser(userId),
          adminUsersService.getUserPermissions(userId),
          adminUsersService.getPermissionTemplates()
        ]);

        if (userResponse.success && userResponse.data) {
          setUser(userResponse.data.user);
        } else {
          setError(userResponse.error?.message || 'İstifadəçi məlumatları yüklənərkən xəta baş verdi');
          return;
        }

        if (permissionsResponse.success && permissionsResponse.data) {
          setPermissions(permissionsResponse.data);
        }

        if (templatesResponse.success && templatesResponse.data) {
          setTemplates(templatesResponse.data.templates);
        }
      } catch (err) {
        console.error('Error loading user data:', err);
        setError('Məlumatlar yüklənərkən xəta baş verdi');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [userId]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Heç vaxt';
    return new Date(dateString).toLocaleDateString('az-AZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleUnlockUser = async () => {
    if (!user) return;
    
    setPermissionsLoading(true);
    try {
      const response = await adminUsersService.unlockUser(userId);
      
      if (response.success) {
        // Reload user data
        const userResponse = await adminUsersService.getUser(userId);
        if (userResponse.success && userResponse.data) {
          setUser(userResponse.data.user);
        }
      } else {
        alert('İstifadəçi kilidini açarkən xəta baş verdi: ' + response.error?.message);
      }
    } catch (err) {
      console.error('Error unlocking user:', err);
      alert('İstifadəçi kilidini açarkən xəta baş verdi');
    } finally {
      setPermissionsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user) return;
    
    const newPassword = prompt('Yeni parol daxil edin (boş buraxsanız avtomatik yaradılacaq):');
    if (newPassword === null) return; // User cancelled
    
    setPermissionsLoading(true);
    try {
      const response = await adminUsersService.resetPassword(userId, newPassword || '');
      
      if (response.success) {
        alert(`Parol yeniləndi! Yeni parol: ${response.data?.temporary_password || newPassword}`);
      } else {
        alert('Parol yeniləmərkən xəta baş verdi: ' + response.error?.message);
      }
    } catch (err) {
      console.error('Error resetting password:', err);
      alert('Parol yeniləmərkən xəta baş verdi');
    } finally {
      setPermissionsLoading(false);
    }
  };

  // Load available permissions
  const loadAvailablePermissions = async () => {
    try {
      const response = await adminUsersService.getAvailablePermissions();
      if (response.success && response.data) {
        const allPerms = [
          ...response.data.role_permissions.admin || [],
          ...response.data.role_permissions.director || [],
          ...response.data.role_permissions.vp || [],
          ...response.data.role_permissions.manager || [],
          ...response.data.role_permissions.agent || []
        ];
        setAvailablePermissions([...new Set(allPerms)]);
      }
    } catch (err) {
      console.error('Error loading available permissions:', err);
    }
  };

  // Grant permission
  const handleGrantPermission = async (permission: string) => {
    if (!user || !permission.trim()) return;
    
    setPermissionsLoading(true);
    try {
      const response = await adminUsersService.grantPermission(userId, permission.trim());
      
      if (response.success) {
        // Reload permissions
        const permissionsResponse = await adminUsersService.getUserPermissions(userId);
        if (permissionsResponse.success && permissionsResponse.data) {
          setPermissions(permissionsResponse.data);
        }
        setNewPermission('');
        setShowAddPermission(false);
      } else {
        alert('İcazə təyin edərkən xəta baş verdi: ' + response.error?.message);
      }
    } catch (err) {
      console.error('Error granting permission:', err);
      alert('İcazə təyin edərkən xəta baş verdi');
    } finally {
      setPermissionsLoading(false);
    }
  };

  // Revoke permission
  const handleRevokePermission = async (permission: string) => {
    if (!user || !permission) return;
    
    if (!confirm(`Bu icazəni ləğv etmək istədiyinizə əminsiniz?\n\n"${permission}"`)) {
      return;
    }

    setPermissionsLoading(true);
    try {
      const response = await adminUsersService.revokePermission(userId, permission);
      
      if (response.success) {
        // Reload permissions
        const permissionsResponse = await adminUsersService.getUserPermissions(userId);
        if (permissionsResponse.success && permissionsResponse.data) {
          setPermissions(permissionsResponse.data);
        }
      } else {
        alert('İcazəni ləğv edərkən xəta baş verdi: ' + response.error?.message);
      }
    } catch (err) {
      console.error('Error revoking permission:', err);
      alert('İcazəni ləğv edərkən xəta baş verdi');
    } finally {
      setPermissionsLoading(false);
    }
  };

  // Load available permissions on permissions tab activation
  if (activeTab === 'permissions' && availablePermissions.length === 0) {
    loadAvailablePermissions();
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-sm text-gray-600">İstifadəçi məlumatları yüklənir...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Xəta</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Link
          href="/admin/users"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          İstifadəçilər siyahısına qayıt
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={`${user.first_name} ${user.last_name}`}
        description={`${roleLabels[user.role]} • ${user.email}`}
        actions={
          <div className="flex items-center space-x-3">
            <Link
              href={`/admin/users/${userId}/edit`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              <Edit className="h-4 w-4 mr-2" />
              Redaktə et
            </Link>
            <Link
              href="/admin/users"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Geri
            </Link>
          </div>
        }
      />

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('details')}
            className={cn(
              'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm',
              activeTab === 'details'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            <User className="h-4 w-4 inline mr-2" />
            Məlumatlar
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={cn(
              'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm',
              activeTab === 'permissions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            <Shield className="h-4 w-4 inline mr-2" />
            İcazələr
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info Card */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Şəxsi məlumatlar</h3>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {user.first_name} {user.last_name}
                    </div>
                    <div className="text-sm text-gray-500">Ad və soyad</div>
                  </div>
                </div>

                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{user.email}</div>
                    <div className="text-sm text-gray-500">Email ünvanı</div>
                  </div>
                </div>

                {user.phone && (
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.phone}</div>
                      <div className="text-sm text-gray-500">Telefon nömrəsi</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {user.branch_code || '—'}
                    </div>
                    <div className="text-sm text-gray-500">Filial</div>
                  </div>
                </div>

                <div className="flex items-center">
                  <Settings className="h-5 w-5 text-gray-400 mr-3" />
                  <div className="flex items-center space-x-2">
                    <div className={cn(
                      'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border',
                      roleColors[user.role]
                    )}>
                      {roleLabels[user.role]}
                    </div>
                    <div className={cn(
                      'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border',
                      statusColors[user.status]
                    )}>
                      {statusLabels[user.status]}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status & Actions Card */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Status və əməliyyatlar</h3>
              
              <div className="space-y-4">
                {/* Account Status */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Hesab statusu</span>
                    {user.is_locked ? (
                      <Shield className="h-4 w-4 text-red-500" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {user.is_locked ? 'Hesab kilidlənib' : 'Hesab açıqdır'}
                  </div>
                </div>

                {/* Password Change Required */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Parol dəyişmə</span>
                    {user.force_password_change ? (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {user.force_password_change ? 'Tələb olunur' : 'Tələb olunmur'}
                  </div>
                </div>

                {/* Last Login */}
                <div>
                  <div className="flex items-center mb-2">
                    <Clock className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Son daxil olma</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatDate(user.last_login_at)}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t space-y-2">
                  {user.is_locked && (
                    <button
                      onClick={handleUnlockUser}
                      disabled={permissionsLoading}
                      className="w-full flex items-center justify-center px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      {permissionsLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Unlock className="h-4 w-4 mr-2" />
                      )}
                      Hesabı aç
                    </button>
                  )}
                  
                  <button
                    onClick={handleResetPassword}
                    disabled={permissionsLoading}
                    className="w-full flex items-center justify-center px-3 py-2 bg-yellow-600 text-white text-sm font-medium rounded-md hover:bg-yellow-700 disabled:opacity-50"
                  >
                    {permissionsLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <KeyRound className="h-4 w-4 mr-2" />
                    )}
                    Parolu sıfırla
                  </button>
                </div>
              </div>
            </div>

            {/* Creation Info */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Yaradılma tarixi</h3>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <div className="text-sm text-gray-600">
                    {formatDate(user.created_at)}
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-400 mr-2" />
                  <div className="text-sm text-gray-600">
                    Son yenilənmə: {formatDate(user.updated_at)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'permissions' && (
        <div className="space-y-6">
          {/* Permissions Management Header */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">İcazələr idarəetməsi</h3>
              <button
                onClick={() => setShowAddPermission(true)}
                disabled={permissionsLoading}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                <Plus className="h-4 w-4 mr-1" />
                İcazə əlavə et
              </button>
            </div>
            
            {/* Add Permission Form */}
            {showAddPermission && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={newPermission}
                      onChange={(e) => setNewPermission(e.target.value)}
                      placeholder="İcazə adını daxil edin (məs: properties:read)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={permissionsLoading}
                    />
                  </div>
                  <button
                    onClick={() => handleGrantPermission(newPermission)}
                    disabled={permissionsLoading || !newPermission.trim()}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {permissionsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Əlavə et'}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddPermission(false);
                      setNewPermission('');
                    }}
                    disabled={permissionsLoading}
                    className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                {/* Available Permissions Suggestions */}
                {availablePermissions.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-600 mb-2">Mövcud icazələr:</p>
                    <div className="flex flex-wrap gap-1">
                      {availablePermissions.slice(0, 10).map((perm) => (
                        <button
                          key={perm}
                          onClick={() => setNewPermission(perm)}
                          className="inline-flex items-center px-2 py-1 rounded text-xs bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                        >
                          {perm}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {permissions ? (
            <div className="space-y-6">
              {/* Role Permissions */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Rol icazələri</h4>
                <div className="flex flex-wrap gap-2">
                  {permissions.permissions.rolePermissions.map((permission) => (
                    <span
                      key={permission}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200"
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      {permission}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Bu icazələr istifadəçinin roluna görə avtomatik təyin edilmişdir və dəyişdirilə bilməz.
                </p>
              </div>

              {/* Custom Permissions */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Xüsusi icazələr ({permissions.permissions.customPermissions.length})
                </h4>
                
                {permissions.permissions.customPermissions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {permissions.permissions.customPermissions.map((permission) => (
                      <span
                        key={permission}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700 border border-green-200"
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        {permission}
                        <button
                          onClick={() => handleRevokePermission(permission)}
                          disabled={permissionsLoading}
                          className="ml-2 text-red-600 hover:text-red-800 disabled:opacity-50"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Xüsusi icazə təyin edilməyib.</p>
                )}
              </div>

              {/* All Permissions Summary */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Bütün aktiv icazələr ({permissions.permissions.allPermissions.length})
                </h4>
                <div className="bg-gray-50 rounded p-3 text-sm text-gray-600 max-h-40 overflow-y-auto">
                  {permissions.permissions.allPermissions.length > 0 ? (
                    permissions.permissions.allPermissions.map((perm, index) => (
                      <span key={index}>
                        {perm}
                        {index < permissions.permissions.allPermissions.length - 1 && ', '}
                      </span>
                    ))
                  ) : (
                    'İcazə yoxdur'
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span className="text-sm text-gray-500">İcazələr yüklənir...</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}