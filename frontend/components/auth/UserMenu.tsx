'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import LogoutButton from './LogoutButton';

interface UserMenuProps {
  className?: string;
}

const UserMenu: React.FC<UserMenuProps> = ({ className = '' }) => {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!isAuthenticated || !user) {
    return null;
  }

  const getRoleDisplayName = (roleName: string): string => {
    const roleMap: Record<string, string> = {
      'admin': 'Admin',
      'director': 'Direktor',
      'vp': 'Sədr müavini',
      'manager': 'Manager',
      'agent': 'Agent'
    };
    return user.role.displayName || roleMap[roleName] || roleName;
  };

  const getRoleBadgeColor = (roleName: string): string => {
    const colorMap: Record<string, string> = {
      'admin': 'bg-purple-100 text-purple-800 border-purple-200',
      'director': 'bg-red-100 text-red-800 border-red-200',
      'vp': 'bg-orange-100 text-orange-800 border-orange-200',
      'manager': 'bg-blue-100 text-blue-800 border-blue-200',
      'agent': 'bg-green-100 text-green-800 border-green-200'
    };
    return colorMap[roleName] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getInitials = (firstName: string, lastName: string): string => {
    return `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
  };

  const formatLastLogin = (lastLoginAt?: string): string => {
    if (!lastLoginAt) return 'Məlumat yoxdur';
    
    try {
      const date = new Date(lastLoginAt);
      return date.toLocaleDateString('az-AZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Məlumat yoxdur';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* User menu trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* User avatar */}
        <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
          {getInitials(user.first_name, user.last_name)}
        </div>
        
        {/* User info */}
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-gray-900">
            {user.first_name} {user.last_name}
          </p>
          <p className="text-xs text-gray-500">
            {getRoleDisplayName(user.role)}
          </p>
        </div>
        
        {/* Dropdown arrow */}
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <>
          {/* Overlay to close menu */}
          <div 
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu content */}
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            {/* User profile header */}
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center text-white text-lg font-medium">
                  {getInitials(user.first_name, user.last_name)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                  {user.phone && (
                    <p className="text-xs text-gray-500">{user.phone}</p>
                  )}
                </div>
              </div>
              
              {/* Role badge */}
              <div className="mt-2">
                <span className={`
                  inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                  ${getRoleBadgeColor(user.role)}
                `}>
                  {getRoleDisplayName(user.role)}
                </span>
              </div>
              
              {/* Branch info */}
              {user.branch_code && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500">
                    <span className="font-medium">Filial:</span> {user.branch_code}
                  </p>
                </div>
              )}
            </div>

            {/* Account details */}
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Son giriş:</span>
                  <span className="text-gray-900">{formatLastLogin(user.lastLoginAt)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Hesab statusu:</span>
                  <span className="font-medium text-green-600">
                    Aktiv
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">İcazə səviyyəsi:</span>
                  <span className="text-gray-900">{user.role}</span>
                </div>
              </div>
            </div>

            {/* Permissions preview */}
            <div className="px-4 py-3 border-b border-gray-200">
              <p className="text-xs font-medium text-gray-700 mb-2">İcazələr:</p>
              <div className="flex flex-wrap gap-1">
                {user.permissions.slice(0, 4).map((permission, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
                  >
                    {permission === '*' ? 'Tam giriş' : permission}
                  </span>
                ))}
                {user.permissions.length > 4 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                    +{user.permissions.length - 4} əlavə
                  </span>
                )}
              </div>
            </div>

            {/* Menu actions */}
            <div className="px-4 py-3">
              <div className="space-y-2">
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-200"
                  onClick={() => {
                    // TODO: Navigate to profile page
                    setIsOpen(false);
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Profil</span>
                  </div>
                </button>
                
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-200"
                  onClick={() => {
                    // TODO: Navigate to settings page
                    setIsOpen(false);
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Tənzimləmələr</span>
                  </div>
                </button>
                
                <div className="border-t border-gray-200 pt-2">
                  <LogoutButton
                    className="w-full bg-red-600 hover:bg-red-700 justify-center"
                    showConfirm={true}
                    onLogoutComplete={() => setIsOpen(false)}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserMenu;