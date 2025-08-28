'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { loginSchema, formatZodErrors, type LoginFormData } from '@/lib/validations/authSchema';
import { AuthError } from '@/lib/auth/authService';

interface LoginFormProps {
  redirectTo?: string;
  onSuccess?: (user: any) => void;
  onError?: (error: AuthError) => void;
  isModal?: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({
  redirectTo = '/dashboard',
  onSuccess,
  onError,
  isModal = false
}) => {
  const { login } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    remember_me: false
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    const validation = loginSchema.safeParse(formData);
    if (!validation.success) {
      setErrors(formatZodErrors(validation.error));
      return;
    }
    
    setIsLoading(true);
    setErrors({});
    
    try {
      await login(validation.data);
      
      // Handle successful login
      if (onSuccess) {
        onSuccess(validation.data);
      }
      
      if (!isModal) {
        // Check for redirect parameter in URL
        const urlParams = new URLSearchParams(window.location.search);
        const redirectUrl = urlParams.get('redirect') || redirectTo;
        router.push(redirectUrl);
      }
      
    } catch (error: any) {
      let authError: AuthError;
      
      if (error instanceof AuthError) {
        authError = error;
      } else if (error?.response?.data?.error) {
        authError = new AuthError(
          error.response.data.error.code || 'UNKNOWN_ERROR',
          error.response.data.error.message || 'Gözlənilməz xəta baş verdi',
          error.response.status || 0
        );
      } else {
        authError = new AuthError(
          'NETWORK_ERROR',
          'Şəbəkə xətası. İnternet bağlantınızı yoxlayın',
          0
        );
      }
      
      // Handle specific error cases
      if (authError.code === 'ACCOUNT_LOCKED') {
        setErrors({ form: `${authError.message}. 15 dəqiqə sonra yenidən cəhd edin.` });
      } else if (authError.code === 'TOO_MANY_ATTEMPTS') {
        setErrors({ form: authError.message });
      } else if (authError.code === 'INVALID_CREDENTIALS') {
        setErrors({ 
          email: 'Email və ya parol yanlışdır',
          password: 'Email və ya parol yanlışdır'
        });
      } else {
        setErrors({ form: authError.message });
      }
      
      if (onError) {
        onError(authError);
      }
      
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Email field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={formData.email}
          onChange={handleChange}
          disabled={isLoading}
          className={`
            relative block w-full px-3 py-2 border rounded-lg text-gray-900 
            placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 
            focus:border-blue-500 sm:text-sm transition-colors
            ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'}
            ${isLoading ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          `}
          placeholder="admin@rea-invest.com"
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <p id="email-error" className="mt-1 text-xs text-red-600" role="alert">
            {errors.email}
          </p>
        )}
      </div>

      {/* Password field */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
          Parol
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={formData.password}
            onChange={handleChange}
            disabled={isLoading}
            className={`
              block w-full px-3 py-2 pr-10 border rounded-lg text-gray-900 
              placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 
              focus:border-blue-500 sm:text-sm transition-colors
              ${errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'}
              ${isLoading ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            `}
            placeholder="••••••••"
            aria-describedby={errors.password ? 'password-error' : undefined}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
            aria-label={showPassword ? 'Parolu gizlət' : 'Parolu göstər'}
          >
            {showPassword ? (
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464m1.414 1.414L12 12m2.122-2.122L8.464 5.05m0 0L6.343 2.929m2.121 2.121L12 8.172l2.829-2.829m0 0L18.07 2.929m-2.828 2.829L21 9.586" />
              </svg>
            ) : (
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        {errors.password && (
          <p id="password-error" className="mt-1 text-xs text-red-600" role="alert">
            {errors.password}
          </p>
        )}
      </div>

      {/* Remember me checkbox */}
      <div className="flex items-center">
        <input
          id="remember-me"
          name="remember_me"
          type="checkbox"
          checked={formData.remember_me}
          onChange={handleChange}
          disabled={isLoading}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
          Məni xatırla
        </label>
      </div>

      {/* Global form error */}
      {errors.form && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm" role="alert">
          <div className="flex items-start">
            <svg className="h-4 w-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errors.form}</span>
          </div>
        </div>
      )}

      {/* Submit button */}
      <div>
        <button
          type="submit"
          disabled={isLoading}
          className={`
            group relative w-full flex justify-center py-3 px-4 border border-transparent 
            text-sm font-medium rounded-lg text-white focus:outline-none focus:ring-2 
            focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200
            ${isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 transform hover:scale-[1.02] shadow-md hover:shadow-lg'
            }
          `}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Yoxlanılır...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Daxil ol
            </>
          )}
        </button>
      </div>

      {/* Additional help text */}
      <div className="text-center text-xs text-gray-500 mt-4">
        Problemləriniz varsa, sistem administratoruna müraciət edin
      </div>
    </form>
  );
};

export default LoginForm;