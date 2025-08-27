'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  useCacheStats,
  useCacheKeys,
  useCacheValue,
  useCacheActions,
} from '@/lib/hooks/useCache';
import {
  Database,
  Trash2,
  RefreshCw,
  Zap,
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
} from 'lucide-react';

const CACHE_CATEGORIES = [
  'properties',
  'users',
  'analytics',
  'search',
  'notifications',
  'files',
];

export default function CacheDashboardPage() {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [searchPattern, setSearchPattern] = useState('*');
  const [deletePattern, setDeletePattern] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<Array<{
    type: 'success' | 'error';
    text: string;
    timestamp: number;
  }>>([]);

  const { stats, isLoading: statsLoading, refreshStats } = useCacheStats();
  const { keys, isLoading: keysLoading, refreshKeys } = useCacheKeys(searchPattern, 500);
  const { value, isLoading: valueLoading } = useCacheValue(selectedKey);
  const cacheActions = useCacheActions();

  const addMessage = (type: 'success' | 'error', text: string) => {
    const message = { type, text, timestamp: Date.now() };
    setMessages(prev => [message, ...prev.slice(0, 4)]);
    setTimeout(() => {
      setMessages(prev => prev.filter(m => m.timestamp !== message.timestamp));
    }, 5000);
  };

  const handleAction = async (action: string, fn: () => Promise<any>) => {
    setLoading(prev => ({ ...prev, [action]: true }));
    try {
      const result = await fn();
      if (result.success) {
        addMessage('success', result.message);
      } else {
        addMessage('error', result.message || 'Operation failed');
      }
    } catch (error: any) {
      addMessage('error', error.message || 'Operation failed');
    } finally {
      setLoading(prev => ({ ...prev, [action]: false }));
    }
  };

  const formatBytes = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cache Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage application cache performance
          </p>
        </div>
        <Button
          onClick={() => handleAction('refresh', refreshStats)}
          disabled={loading.refresh}
          variant="outline"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading.refresh ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Messages */}
      <div className="space-y-2">
        {messages.map((message) => (
          <Alert
            key={message.timestamp}
            variant={message.type === 'error' ? 'destructive' : 'default'}
          >
            {message.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Keys</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : formatNumber(stats?.total_keys || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Used</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : formatBytes(stats?.memory_usage?.heapUsed || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Heap Total</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : formatBytes(stats?.memory_usage?.heapTotal || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : Object.keys(stats?.categories || {}).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      {stats?.categories && Object.keys(stats.categories).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cache Categories</CardTitle>
            <CardDescription>Keys distribution by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stats.categories).map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="capitalize">{category}</span>
                  <Badge variant="secondary">{formatNumber(count)}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="browse" className="w-full">
        <TabsList>
          <TabsTrigger value="browse">Browse Keys</TabsTrigger>
          <TabsTrigger value="manage">Manage Cache</TabsTrigger>
          <TabsTrigger value="warmup">Cache Warmup</TabsTrigger>
        </TabsList>

        {/* Browse Keys Tab */}
        <TabsContent value="browse" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cache Keys</CardTitle>
              <CardDescription>Browse and inspect cached data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="search-pattern">Search Pattern</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="search-pattern"
                      placeholder="e.g., properties:*, user:*, *"
                      value={searchPattern}
                      onChange={(e) => setSearchPattern(e.target.value)}
                    />
                    <Button
                      onClick={() => refreshKeys()}
                      disabled={keysLoading}
                      variant="outline"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Keys List */}
                <div className="space-y-2">
                  <h3 className="font-medium">
                    Keys ({keysLoading ? '...' : keys?.showing || 0} of {keys?.total || 0})
                  </h3>
                  <div className="border rounded-md max-h-96 overflow-y-auto">
                    {keysLoading ? (
                      <div className="p-4 text-center text-muted-foreground">Loading...</div>
                    ) : keys?.keys?.length ? (
                      <div className="divide-y">
                        {keys.keys.map((key) => (
                          <div
                            key={key}
                            className={`p-3 cursor-pointer hover:bg-muted ${
                              selectedKey === key ? 'bg-muted' : ''
                            }`}
                            onClick={() => setSelectedKey(key)}
                          >
                            <div className="font-mono text-sm truncate">{key}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">
                        No keys found matching pattern
                      </div>
                    )}
                  </div>
                </div>

                {/* Key Value */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Value</h3>
                    {selectedKey && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction('deleteKey', () =>
                          cacheActions.deleteKey(selectedKey)
                        )}
                        disabled={loading.deleteKey}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
                  <div className="border rounded-md max-h-96 overflow-y-auto">
                    {selectedKey ? (
                      valueLoading ? (
                        <div className="p-4 text-center text-muted-foreground">Loading...</div>
                      ) : value ? (
                        <pre className="p-4 text-xs overflow-x-auto">
                          {JSON.stringify(value, null, 2)}
                        </pre>
                      ) : (
                        <div className="p-4 text-center text-muted-foreground">
                          Key not found or expired
                        </div>
                      )
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">
                        Select a key to view its value
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manage Cache Tab */}
        <TabsContent value="manage" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Invalidate Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Invalidate Categories</CardTitle>
                <CardDescription>Clear cache for specific data categories</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {CACHE_CATEGORIES.map((category) => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox
                        id={category}
                        checked={selectedCategories.includes(category)}
                        onCheckedChange={(checked) =>
                          setSelectedCategories(prev =>
                            checked
                              ? [...prev, category]
                              : prev.filter(c => c !== category)
                          )
                        }
                      />
                      <Label htmlFor={category} className="capitalize">
                        {category}
                      </Label>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={() => handleAction('invalidateCategories', () =>
                    cacheActions.invalidateCategories(selectedCategories)
                  )}
                  disabled={loading.invalidateCategories || selectedCategories.length === 0}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Invalidate Selected
                </Button>
              </CardContent>
            </Card>

            {/* Pattern Operations */}
            <Card>
              <CardHeader>
                <CardTitle>Pattern Operations</CardTitle>
                <CardDescription>Delete cache keys by pattern</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="delete-pattern">Delete Pattern</Label>
                  <Input
                    id="delete-pattern"
                    placeholder="e.g., properties:*, user:123:*"
                    value={deletePattern}
                    onChange={(e) => setDeletePattern(e.target.value)}
                  />
                </div>
                <Button
                  onClick={() => handleAction('deletePattern', () =>
                    cacheActions.deletePattern(deletePattern)
                  )}
                  disabled={loading.deletePattern || !deletePattern.trim()}
                  className="w-full"
                  variant="outline"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete by Pattern
                </Button>

                <div className="border-t pt-4">
                  <Button
                    onClick={() => handleAction('flushAll', () =>
                      cacheActions.flushAll()
                    )}
                    disabled={loading.flushAll}
                    className="w-full"
                    variant="destructive"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Flush All Cache
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cache Warmup Tab */}
        <TabsContent value="warmup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cache Warmup</CardTitle>
              <CardDescription>
                Pre-populate cache with frequently accessed data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {['properties', 'analytics'].map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={`warmup-${category}`}
                      checked={selectedCategories.includes(category)}
                      onCheckedChange={(checked) =>
                        setSelectedCategories(prev =>
                          checked
                            ? [...prev, category]
                            : prev.filter(c => c !== category)
                        )
                      }
                    />
                    <Label htmlFor={`warmup-${category}`} className="capitalize">
                      {category}
                    </Label>
                  </div>
                ))}
              </div>
              <Button
                onClick={() => handleAction('warmup', () =>
                  cacheActions.warmupCache(selectedCategories)
                )}
                disabled={loading.warmup || selectedCategories.length === 0}
                className="w-full"
              >
                <Zap className="h-4 w-4 mr-2" />
                Start Warmup
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}