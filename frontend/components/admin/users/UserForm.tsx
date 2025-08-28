/**
 * User Form Component
 * Form for creating and editing users with validation
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Save, 
  X, 
  Eye, 
  EyeOff, 
  User, 
  Mail, 
  Phone, 
  MapPin,
  Shield,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import adminUsersService, { User as UserType, UserCreateData, UserUpdateData } from '@/lib/api/admin/users';

interface UserFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'director' | 'vp' | 'manager' | 'agent';
  branch_code?: string;
  password?: string;
  confirm_password?: string;
  status: 'active' | 'inactive' | 'suspended';
  force_password_change: boolean;
}

type ApiUser = UserType;

interface UserFormProps {
  mode: 'create' | 'edit';
  userId?: string;
  initialData?: Partial<UserFormData>;
}

interface FormErrors {
  [key: string]: string;
}

const roleOptions = [
  { value: 'admin', label: 'Admin', description: 'Tam sistem girişi' },
  { value: 'director', label: 'Direktor', description: 'İdarəetmə və strateji qərarlar' },
  { value: 'vp', label: 'VP', description: 'Büdcə təsdiqi və çox-filial girişi' },
  { value: 'manager', label: 'Manager', description: 'Filial idarəetməsi və komanda rəhbərliyi' },
  { value: 'agent', label: 'Agent', description: 'Əmlak satışı və müştəri xidməti' }
];

const branchOptions = [
  { value: 'HQ', label: 'Baş Ofis' },
  { value: 'YAS', label: 'Yasamal Filialı' },
  { value: 'NAS', label: 'Nəsimi Filialı' },
  { value: 'SUR', label: 'Səbail Filialı' }
];

const statusOptions = [
  { value: 'active', label: 'Aktiv', color: 'text-green-600' },
  { value: 'inactive', label: 'Qeyri-aktiv', color: 'text-gray-600' },
  { value: 'suspended', label: 'Dayandırılmış', color: 'text-red-600' }
];

export default function UserForm({ mode, userId, initialData }: UserFormProps) {
  const router = useRouter();
  
  const [formData, setFormData] = useState<UserFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'agent',
    branch_code: '',
    password: '',
    confirm_password: '',
    status: 'active',
    force_password_change: true,
    ...initialData
  });
  const [originalData, setOriginalData] = useState<ApiUser | null>(null);
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load user data for edit mode
  useEffect(() => {
    if (mode === 'edit' && userId) {
      const loadUserData = async () => {
        setLoading(true);
        setApiError(null);
        
        try {
          const response = await adminUsersService.getUser(userId);
          
          if (response.success && response.data) {
            const user = response.data.user;
            setOriginalData(user);
            setFormData({
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email,
              phone: user.phone || '',
              role: user.role,
              branch_code: user.branch_code || '',
              password: '',
              confirm_password: '',
              status: user.status,
              force_password_change: user.force_password_change
            });
          } else {
            setApiError(response.error?.message || 'İstifadəçi məlumatları yüklənərkən xəta baş verdi');
          }
        } catch (err) {
          console.error('Error loading user:', err);
          setApiError('İstifadəçi məlumatları yüklənərkən xəta baş verdi');
        } finally {
          setLoading(false);
        }
      };
      
      loadUserData();
    }
  }, [mode, userId]);

  // Show loading state when fetching user data in edit mode
  if (mode === 'edit' && userId && loading && !originalData) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-sm text-gray-600">İstifadəçi məlumatları yüklənir...</p>
      </div>
    );
  }

  // Show error if failed to load user data
  if (mode === 'edit' && userId && !loading && !originalData && apiError) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 mb-4">
          <AlertTriangle className="h-12 w-12 mx-auto mb-2" />
          <p className="text-lg font-semibold">Xəta</p>
          <p className="text-sm">{apiError}</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Yenidən yükləyin
        </button>
      </div>
    );
  }

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required fields
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'Ad tələb olunur';
    } else if (formData.first_name.length < 2) {
      newErrors.first_name = 'Ad ən az 2 simvol olmalıdır';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Soyad tələb olunur';
    } else if (formData.last_name.length < 2) {
      newErrors.last_name = 'Soyad ən az 2 simvol olmalıdır';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email tələb olunur';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = 'Email formatı düzgün deyil';
    }

    if (!formData.role) {
      newErrors.role = 'Rol seçilməlidir';
    }

    // Password validation for create mode
    if (mode === 'create') {
      if (!formData.password) {
        newErrors.password = 'Parol tələb olunur';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Parol ən az 8 simvol olmalıdır';
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        newErrors.password = 'Parol böyük hərf, kiçik hərf və rəqəm olmalıdır';
      }

      if (!formData.confirm_password) {
        newErrors.confirm_password = 'Parolun təkrarı tələb olunur';
      } else if (formData.password !== formData.confirm_password) {
        newErrors.confirm_password = 'Parollar uyğun deyil';
      }
    }

    // Phone validation if provided
    if (formData.phone && !/^\+994[0-9]{9}$/.test(formData.phone)) {
      newErrors.phone = 'Telefon formatı: +994XXXXXXXXX';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (field: keyof UserFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear errors for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Clear API errors when user starts typing
    if (apiError) {
      setApiError(null);
    }

  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setApiError(null);
    setSuccessMessage(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      let response;
      
      if (mode === 'create') {
        // Create new user
        const createData: UserCreateData = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone || undefined,
          role: formData.role,
          branch_code: formData.branch_code || undefined,
          password: formData.password!,
          status: formData.status,
          force_password_change: formData.force_password_change
        };
        
        response = await adminUsersService.createUser(createData);
        
        if (response.success) {
          setSuccessMessage('İstifadəçi uğurla yaradıldı');
          setTimeout(() => {
            router.push('/admin/users');
          }, 1500);
        }
      } else if (userId) {
        // Update existing user
        const updateData: UserUpdateData = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone || undefined,
          role: formData.role,
          branch_code: formData.branch_code || undefined,
          status: formData.status,
          force_password_change: formData.force_password_change
        };
        
        response = await adminUsersService.updateUser(userId, updateData);
        
        if (response.success) {
          setSuccessMessage('İstifadəçi məlumatları uğurla yeniləndi');
          setTimeout(() => {
            router.push('/admin/users');
          }, 1500);
        }
      }

      if (!response?.success) {
        setApiError(response?.error?.message || 'İstifadəçi yadda saxlanarkən xəta baş verdi');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      setApiError('İstifadəçi yadda saxlanarkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  // Generate strong password
  const generatePassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // Ensure at least one of each required character type
    password += 'A'; // uppercase
    password += 'a'; // lowercase  
    password += '1'; // number
    password += '!'; // symbol
    
    // Fill the rest
    for (let i = 4; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    // Shuffle the password
    password = password.split('').sort(() => 0.5 - Math.random()).join('');
    
    handleInputChange('password', password);
    handleInputChange('confirm_password', password);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6">
      {/* Form Header */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900">
          {mode === 'create' ? 'Yeni İstifadəçi Yaradın' : 'İstifadəçi Məlumatları'}
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          {mode === 'create' 
            ? 'İstifadəçi məlumatlarını daxil edin və rol təyin edin'
            : 'İstifadəçi məlumatlarını yeniləyin'
          }
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-6">
        {/* Personal Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* First Name */}
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
              <User className="inline h-4 w-4 mr-1" />
              Ad *
            </label>
            <input
              type="text"
              id="first_name"
              value={formData.first_name}
              onChange={(e) => handleInputChange('first_name', e.target.value)}
              className={`block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.first_name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Məsələn: Əli"
            />
            {errors.first_name && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                {errors.first_name}
              </p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
              <User className="inline h-4 w-4 mr-1" />
              Soyad *
            </label>
            <input
              type="text"
              id="last_name"
              value={formData.last_name}
              onChange={(e) => handleInputChange('last_name', e.target.value)}
              className={`block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.last_name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Məsələn: Məmmədov"
            />
            {errors.last_name && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                {errors.last_name}
              </p>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="inline h-4 w-4 mr-1" />
              Email *
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="ali.mammadov@rea-invest.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                {errors.email}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="inline h-4 w-4 mr-1" />
              Telefon
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className={`block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.phone ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="+994555123456"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                {errors.phone}
              </p>
            )}
          </div>
        </div>

        {/* Role and Branch */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Role */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              <Shield className="inline h-4 w-4 mr-1" />
              Rol *
            </label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => handleInputChange('role', e.target.value)}
              className={`block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.role ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              {roleOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label} - {option.description}
                </option>
              ))}
            </select>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                {errors.role}
              </p>
            )}
          </div>

          {/* Branch */}
          <div>
            <label htmlFor="branch_code" className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="inline h-4 w-4 mr-1" />
              Filial
            </label>
            <select
              id="branch_code"
              value={formData.branch_code}
              onChange={(e) => handleInputChange('branch_code', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Filial seçin</option>
              {branchOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Password Fields (Create mode only) */}
        {mode === 'create' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Giriş Məlumatları</h3>
              <button
                type="button"
                onClick={generatePassword}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Güclü parol yarat
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Parol *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`block w-full px-3 py-2 pr-10 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.password ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Ən az 8 simvol"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-2">
                  Parol Təkrarı *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirm_password"
                    value={formData.confirm_password}
                    onChange={(e) => handleInputChange('confirm_password', e.target.value)}
                    className={`block w-full px-3 py-2 pr-10 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.confirm_password ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Parolun təkrarı"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.confirm_password && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    {errors.confirm_password}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Status and Options */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Hesab Ayarları</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Force Password Change */}
            <div className="flex items-center h-full">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="force_password_change"
                  checked={formData.force_password_change}
                  onChange={(e) => handleInputChange('force_password_change', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="force_password_change" className="ml-2 block text-sm text-gray-900">
                  İlk girişdə parol dəyişməsinə məcbur et
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {apiError && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
            <p className="text-sm text-red-800">{apiError}</p>
          </div>
        </div>
      )}
      
      {successMessage && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
            <p className="text-sm text-green-800">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="mt-8 flex justify-end space-x-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={loading}
          className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X className="h-4 w-4 mr-2 inline" />
          Ləğv et
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {loading ? 'Yadda saxlanılır...' : (mode === 'create' ? 'İstifadəçi yarat' : 'Dəyişiklikləri saxla')}
        </button>
      </div>
    </form>
  );
}