'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Book,
  Code2,
  ExternalLink,
  Play,
  Copy,
  CheckCircle,
  AlertTriangle,
  Info,
  Server,
  Key,
  Database,
  Zap,
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const EXAMPLE_ENDPOINTS = [
  {
    method: 'POST',
    path: '/api/auth/login',
    title: 'User Login',
    description: 'Authenticate user and get JWT token',
    request: {
      email: 'admin@rea-invest.com',
      password: 'password123'
    }
  },
  {
    method: 'GET',
    path: '/api/properties',
    title: 'List Properties',
    description: 'Get paginated list of properties',
    params: '?page=1&limit=20&category=sale&status=active'
  },
  {
    method: 'POST',
    path: '/api/properties',
    title: 'Create Property',
    description: 'Create new property listing',
    request: {
      property_category: 'residential',
      property_subcategory: 'apartment',
      area_m2: 120.5,
      category: 'sale',
      listing_type: 'agency_owned',
      sell_price_azn: 250000,
      address: 'Nizami street 123, Baku'
    }
  },
  {
    method: 'GET',
    path: '/api/analytics',
    title: 'Get Analytics',
    description: 'Retrieve system analytics data',
    params: '?type=properties&period=30d'
  }
];

const API_CATEGORIES = [
  {
    name: 'Authentication',
    icon: Key,
    endpoints: [
      'POST /api/auth/login',
      'GET /api/auth/me',
      'POST /api/auth/logout'
    ]
  },
  {
    name: 'Properties',
    icon: Database,
    endpoints: [
      'GET /api/properties',
      'POST /api/properties',
      'GET /api/properties/:id',
      'PUT /api/properties/:id',
      'DELETE /api/properties/:id'
    ]
  },
  {
    name: 'Bookings',
    icon: Server,
    endpoints: [
      'GET /api/bookings',
      'POST /api/bookings',
      'GET /api/bookings/:id',
      'PUT /api/bookings/:id'
    ]
  },
  {
    name: 'Analytics',
    icon: Zap,
    endpoints: [
      'GET /api/analytics',
      'GET /api/analytics/properties',
      'GET /api/analytics/users'
    ]
  }
];

export default function ApiDocsPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState(EXAMPLE_ENDPOINTS[0]);
  const [testRequest, setTestRequest] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates(prev => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const testEndpoint = async () => {
    setLoading(true);
    setTestResponse('');

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const requestOptions: RequestInit = {
        method: selectedEndpoint.method,
        headers,
      };

      if (selectedEndpoint.method !== 'GET' && testRequest) {
        requestOptions.body = testRequest;
      }

      let url = `${API_BASE_URL}${selectedEndpoint.path.replace('/api', '')}`;
      if (selectedEndpoint.method === 'GET' && selectedEndpoint.params) {
        url += selectedEndpoint.params;
      }

      const response = await fetch(url, requestOptions);
      const data = await response.json();

      setTestResponse(JSON.stringify({
        status: response.status,
        headers: {
          'content-type': response.headers.get('content-type'),
          'x-ratelimit-remaining': response.headers.get('x-ratelimit-remaining'),
        },
        body: data
      }, null, 2));
    } catch (error: any) {
      setTestResponse(JSON.stringify({
        error: error.message || 'Request failed',
        details: error.toString()
      }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800';
      case 'POST': return 'bg-blue-100 text-blue-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Documentation</h1>
          <p className="text-muted-foreground">
            Comprehensive API documentation and interactive testing
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <a href={`${API_BASE_URL}/docs`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Swagger UI
            </a>
          </Button>
          <Button asChild>
            <a href="/docs/api-documentation.md" target="_blank" rel="noopener noreferrer">
              <Book className="mr-2 h-4 w-4" />
              Full Docs
            </a>
          </Button>
        </div>
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Base URL</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-mono text-sm">{API_BASE_URL}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Authentication</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">Bearer JWT Token</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rate Limit</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">100 req/15min</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="testing">API Testing</TabsTrigger>
          <TabsTrigger value="examples">Code Examples</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Categories</CardTitle>
              <CardDescription>
                Main API endpoint categories and their functions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {API_CATEGORIES.map((category) => {
                  const IconComponent = category.icon;
                  return (
                    <div key={category.name} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <IconComponent className="h-5 w-5" />
                        <h3 className="font-semibold">{category.name}</h3>
                      </div>
                      <div className="space-y-1">
                        {category.endpoints.map((endpoint) => (
                          <div key={endpoint} className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={getMethodColor(endpoint.split(' ')[0])}
                            >
                              {endpoint.split(' ')[0]}
                            </Badge>
                            <code className="text-sm">{endpoint.split(' ')[1]}</code>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Response Format</CardTitle>
              <CardDescription>
                Standard API response structure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2 text-green-600">Success Response</h4>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation completed"
}`}
                  </pre>
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-red-600">Error Response</h4>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`{
  "success": false,
  "message": "Error description",
  "error": "Detailed error info"
}`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Endpoints Tab */}
        <TabsContent value="endpoints" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Example Endpoints</CardTitle>
              <CardDescription>
                Common API endpoints with example requests and responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {EXAMPLE_ENDPOINTS.map((endpoint, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge className={getMethodColor(endpoint.method)}>
                          {endpoint.method}
                        </Badge>
                        <code className="font-medium">{endpoint.path}</code>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(
                          `${endpoint.method} ${endpoint.path}${endpoint.params || ''}`, 
                          `endpoint-${index}`
                        )}
                      >
                        {copiedStates[`endpoint-${index}`] ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground mb-3">
                      {endpoint.description}
                    </div>
                    {endpoint.params && (
                      <div className="mb-2">
                        <span className="text-sm font-medium">Query Parameters:</span>
                        <code className="ml-2 text-sm bg-muted px-1 rounded">
                          {endpoint.params}
                        </code>
                      </div>
                    )}
                    {endpoint.request && (
                      <div>
                        <span className="text-sm font-medium">Request Body:</span>
                        <pre className="bg-muted p-3 rounded text-xs overflow-x-auto mt-1">
                          {JSON.stringify(endpoint.request, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Testing Tab */}
        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Interactive API Testing</CardTitle>
              <CardDescription>
                Test API endpoints directly from the documentation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Auth Token */}
              <div>
                <Label htmlFor="auth-token">Authorization Token (Optional)</Label>
                <Input
                  id="auth-token"
                  placeholder="Bearer token from login endpoint"
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                />
              </div>

              {/* Endpoint Selection */}
              <div>
                <Label htmlFor="endpoint-select">Select Endpoint</Label>
                <select
                  id="endpoint-select"
                  className="w-full mt-1 p-2 border rounded-md"
                  value={EXAMPLE_ENDPOINTS.indexOf(selectedEndpoint)}
                  onChange={(e) => setSelectedEndpoint(EXAMPLE_ENDPOINTS[parseInt(e.target.value)])}
                >
                  {EXAMPLE_ENDPOINTS.map((endpoint, index) => (
                    <option key={index} value={index}>
                      {endpoint.method} {endpoint.path} - {endpoint.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Request Configuration */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="request-body">Request Body</Label>
                  <Textarea
                    id="request-body"
                    placeholder={
                      selectedEndpoint.request 
                        ? JSON.stringify(selectedEndpoint.request, null, 2)
                        : 'No request body needed for GET requests'
                    }
                    value={testRequest}
                    onChange={(e) => setTestRequest(e.target.value)}
                    rows={8}
                    className="font-mono text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="response">Response</Label>
                  <Textarea
                    id="response"
                    placeholder="Response will appear here after testing"
                    value={testResponse}
                    readOnly
                    rows={8}
                    className="font-mono text-sm bg-muted"
                  />
                </div>
              </div>

              {/* Test Button */}
              <div className="flex justify-between items-center">
                <Button
                  onClick={testEndpoint}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Test Endpoint
                </Button>

                {testResponse && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(testResponse, 'response')}
                  >
                    {copiedStates.response ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>

              {/* Test Alerts */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  To test authenticated endpoints, first login using the auth endpoint to get a token,
                  then paste it in the Authorization Token field above.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Code Examples Tab */}
        <TabsContent value="examples" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Code Examples</CardTitle>
              <CardDescription>
                Integration examples in different programming languages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="javascript" className="w-full">
                <TabsList>
                  <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                  <TabsTrigger value="php">PHP</TabsTrigger>
                </TabsList>

                <TabsContent value="javascript" className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Authentication</h4>
                    <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
{`// Login and get token
const response = await fetch('${API_BASE_URL}/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password'
  })
});

const { data } = await response.json();
const token = data.token;

// Use token for authenticated requests
const properties = await fetch('${API_BASE_URL}/properties', {
  headers: {
    'Authorization': \`Bearer \${token}\`,
    'Content-Type': 'application/json',
  }
});`}
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Create Property</h4>
                    <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
{`const newProperty = await fetch('${API_BASE_URL}/properties', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${token}\`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    property_category: 'residential',
    area_m2: 120.5,
    category: 'sale',
    listing_type: 'agency_owned',
    sell_price_azn: 250000,
    address: 'Nizami street 123, Baku'
  })
});

const result = await newProperty.json();`}
                    </pre>
                  </div>
                </TabsContent>

                <TabsContent value="python" className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Authentication</h4>
                    <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
{`import requests

# Login and get token
response = requests.post('${API_BASE_URL}/auth/login', json={
    'email': 'user@example.com',
    'password': 'password'
})

token = response.json()['data']['token']

# Use token for authenticated requests
headers = {'Authorization': f'Bearer {token}'}
properties = requests.get('${API_BASE_URL}/properties', headers=headers)`}
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Create Property</h4>
                    <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
{`property_data = {
    'property_category': 'residential',
    'area_m2': 120.5,
    'category': 'sale',
    'listing_type': 'agency_owned',
    'sell_price_azn': 250000,
    'address': 'Nizami street 123, Baku'
}

response = requests.post(
    '${API_BASE_URL}/properties',
    headers=headers,
    json=property_data
)`}
                    </pre>
                  </div>
                </TabsContent>

                <TabsContent value="curl" className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Authentication</h4>
                    <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
{`# Login and get token
curl -X POST ${API_BASE_URL}/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com",
    "password": "password"
  }'

# Use token for authenticated requests
TOKEN="your-jwt-token-here"
curl -X GET ${API_BASE_URL}/properties \\
  -H "Authorization: Bearer $TOKEN"`}
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Create Property</h4>
                    <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
{`curl -X POST ${API_BASE_URL}/properties \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "property_category": "residential",
    "area_m2": 120.5,
    "category": "sale",
    "listing_type": "agency_owned",
    "sell_price_azn": 250000,
    "address": "Nizami street 123, Baku"
  }'`}
                    </pre>
                  </div>
                </TabsContent>

                <TabsContent value="php" className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Authentication</h4>
                    <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
{`<?php
// Login and get token
$login_data = [
    'email' => 'user@example.com',
    'password' => 'password'
];

$response = file_get_contents('${API_BASE_URL}/auth/login', false, 
    stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => 'Content-Type: application/json',
            'content' => json_encode($login_data)
        ]
    ])
);

$token = json_decode($response, true)['data']['token'];

// Use token for authenticated requests
$context = stream_context_create([
    'http' => [
        'header' => "Authorization: Bearer $token"
    ]
]);

$properties = file_get_contents('${API_BASE_URL}/properties', false, $context);
?>`}
                    </pre>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}