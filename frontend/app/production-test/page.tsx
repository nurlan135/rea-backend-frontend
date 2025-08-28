'use client';

import { useState, useEffect } from 'react';

interface Property {
  id: string;
  title: string;
  price: string;
  currency: string;
  type: string;
  category: string;
  status: string;
  agent_first_name?: string;
  agent_last_name?: string;
}

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface LoginResponse {
  success: boolean;
  data?: {
    token: string;
    user: User;
  };
  error?: {
    code: string;
    message: string;
  };
}

interface PropertiesResponse {
  success: boolean;
  data?: Property[];
  meta?: {
    total: number;
    limit: number;
    offset: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

export default function ProductionTest() {
  const [loginResult, setLoginResult] = useState<LoginResponse | null>(null);
  const [propertiesResult, setPropertiesResult] = useState<PropertiesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string>('');

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const testLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@rea-invest.com',
          password: 'password123'
        })
      });
      const data = await response.json();
      setLoginResult(data);
      
      if (data.success && data.data?.token) {
        setToken(data.data.token);
      }
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setLoginResult({ 
        success: false, 
        error: { code: 'NETWORK_ERROR', message: errorMsg } 
      });
    }
    setLoading(false);
  };

  const testProperties = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/properties?limit=5`, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      const data = await response.json();
      setPropertiesResult(data);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setPropertiesResult({ 
        success: false, 
        error: { code: 'NETWORK_ERROR', message: errorMsg } 
      });
    }
    setLoading(false);
  };

  const testHealth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();
      alert(`Production Health Check: ${data.status} - Environment: ${data.environment}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      alert(`Health Check Failed: ${errorMsg}`);
    }
  };

  useEffect(() => {
    // Auto-test health on load
    testHealth();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              🚀 REA INVEST Production Test
            </h1>
            <p className="text-gray-600">
              API Base URL: <code className="bg-gray-100 px-2 py-1 rounded">{API_BASE_URL}</code>
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Environment: {process.env.NODE_ENV || 'development'}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <button
              onClick={testHealth}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              🔍 Health Check
            </button>
            
            <button
              onClick={testLogin}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '⏳ Loading...' : '🔐 Production Login'}
            </button>
            
            <button
              onClick={testProperties}
              disabled={loading || !token}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '⏳ Loading...' : '🏠 Fetch Properties'}
            </button>
          </div>

          {token && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">✅ Authenticated!</p>
              <p className="text-green-600 text-sm">Token: {token.substring(0, 20)}...</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {loginResult && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-bold text-blue-900 mb-3 flex items-center">
                  🔐 Production Login Result
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                    loginResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {loginResult.success ? 'SUCCESS' : 'FAILED'}
                  </span>
                </h3>
                <div className="bg-blue-100 rounded-lg p-3 max-h-60 overflow-y-auto">
                  <pre className="text-sm text-blue-800 whitespace-pre-wrap">
                    {JSON.stringify(loginResult, null, 2)}
                  </pre>
                </div>
              </div>
            )}
            
            {propertiesResult && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h3 className="font-bold text-purple-900 mb-3 flex items-center">
                  🏠 Properties Result
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                    propertiesResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {propertiesResult.success ? 'SUCCESS' : 'FAILED'}
                  </span>
                </h3>
                <div className="bg-purple-100 rounded-lg p-3 max-h-60 overflow-y-auto">
                  {propertiesResult.success && propertiesResult.data ? (
                    <div className="space-y-3">
                      {propertiesResult.data.map((property) => (
                        <div key={property.id} className="bg-white p-3 rounded border">
                          <h4 className="font-medium text-gray-900">{property.title}</h4>
                          <p className="text-sm text-gray-600">
                            {property.price} {property.currency} • {property.type} • {property.category}
                          </p>
                          {property.agent_first_name && (
                            <p className="text-xs text-gray-500">
                              Agent: {property.agent_first_name} {property.agent_last_name}
                            </p>
                          )}
                        </div>
                      ))}
                      <div className="text-xs text-purple-600 mt-2">
                        Total: {propertiesResult.meta?.total} properties
                      </div>
                    </div>
                  ) : (
                    <pre className="text-sm text-purple-800 whitespace-pre-wrap">
                      {JSON.stringify(propertiesResult, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 bg-gray-50 rounded-lg p-6">
            <h3 className="font-bold text-gray-900 mb-3">🧪 Production Test Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <h4 className="font-medium mb-2">🔗 Endpoints:</h4>
                <ul className="space-y-1">
                  <li>• Health: <code>/health</code></li>
                  <li>• Login: <code>/api/auth/login</code></li>
                  <li>• Properties: <code>/api/properties</code></li>
                  <li>• Analytics: <code>/api/analytics/dashboard</code></li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">🔑 Test Credentials:</h4>
                <ul className="space-y-1">
                  <li>• Admin: admin@rea-invest.com / password123</li>
                  <li>• Agent: agent@rea-invest.com / password123</li>
                  <li>• Manager: manager@rea-invest.com / password123</li>
                  <li>• Director: director@rea-invest.com / password123</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}