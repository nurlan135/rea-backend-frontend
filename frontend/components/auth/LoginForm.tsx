'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { Eye, EyeOff, Mail, Lock, AlertTriangle, Loader2 } from 'lucide-react';

interface LoginFormProps {
  redirectTo?: string;
  onSuccess?: (user: any) => void;
  onError?: (error: any) => void;
}

export default function LoginForm({ redirectTo = '/dashboard', onSuccess, onError }: LoginFormProps) {
  const { login } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email tələb olunur';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = 'Email formatı düzgün deyil';
    }

    if (!formData.password) {
      newErrors.password = 'Parol tələb olunur';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Parol ən az 6 simvol olmalıdır';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Clear API error
    if (apiError) {
      setApiError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await login(formData.email, formData.password);
      
      if (response.success) {
        // Login successful
        if (onSuccess && response.data) {
          onSuccess(response.data.user);
        }
        
        // Redirect based on user role
        if (response.data?.user?.role === 'admin') {
          router.push('/admin');
        } else {
          router.push(redirectTo);
        }
      } else {
        const errorMessage = response.error?.message || 'Giriş uğursuz oldu';
        setApiError(errorMessage);
        
        if (onError) {
          onError(response.error);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = 'Giriş zamanı xəta baş verdi';
      setApiError(errorMessage);
      
      if (onError) {
        onError({ code: 'NETWORK_ERROR', message: errorMessage });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillTestCredentials = (email: string, password: string) => {
    setFormData({ email, password });
    setErrors({});
    setApiError(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* API Error */}
      {apiError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
            <p className="text-sm text-red-800">{apiError}</p>
          </div>
        </div>
      )}

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email ünvanı
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="email"
            id="email"
            name="email"
            autoComplete="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={`block w-full pl-9 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.email ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="admin@rea-invest.com"
            disabled={isSubmitting}
          />
        </div>
        {errors.email && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {errors.email}
          </p>
        )}
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Parol
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            name="password"
            autoComplete="current-password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            className={`block w-full pl-9 pr-10 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.password ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Parolunuzu daxil edin"
            disabled={isSubmitting}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isSubmitting}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {errors.password}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Giriş edilir...
            </>
          ) : (
            'Daxil ol'
          )}
        </button>
      </div>

      {/* Test Credentials */}
      <div className="mt-6 p-3 bg-gray-50 rounded-md">
        <p className="text-xs font-medium text-gray-700 mb-2">Test hesabları:</p>
        <div className="space-y-1 text-xs text-gray-600">
          <div 
            className="cursor-pointer hover:text-gray-800 p-1 rounded hover:bg-gray-100" 
            onClick={() => fillTestCredentials('admin@rea-invest.com', 'password123')}
          >
            <strong>Admin:</strong> admin@rea-invest.com / password123
          </div>
          <div 
            className="cursor-pointer hover:text-gray-800 p-1 rounded hover:bg-gray-100" 
            onClick={() => fillTestCredentials('manager@rea-invest.com', 'password123')}
          >
            <strong>Manager:</strong> manager@rea-invest.com / password123
          </div>
          <div 
            className="cursor-pointer hover:text-gray-800 p-1 rounded hover:bg-gray-100" 
            onClick={() => fillTestCredentials('agent@rea-invest.com', 'password123')}
          >
            <strong>Agent:</strong> agent@rea-invest.com / password123
          </div>
        </div>
      </div>
    </form>
  );
}