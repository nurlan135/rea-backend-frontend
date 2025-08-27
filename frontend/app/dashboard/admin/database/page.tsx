'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Database,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Server,
  Zap,
  BarChart3,
  Gauge,
  RefreshCw,
} from 'lucide-react';

interface DatabaseStats {
  tables: Array<{
    name: string;
    columns: Array<{
      name: string;
      distinct_values: number;
      correlation: number;
      null_fraction: number;
      avg_width: number;
    }>;
  }>;
  indexes: Array<{
    table_name: string;
    index_name: string;
    columns: string[];
    is_unique: boolean;
    is_primary: boolean;
    size: string;
  }>;
  connections: {
    total_connections: number;
    active_connections: number;
    idle_connections: number;
    idle_in_transaction: number;
  };
  poolInfo: {
    used: number;
    free: number;
    pending: number;
    size: number;
    max: number;
    min: number;
  };
}

interface SlowQuery {
  query: string;
  mean_time: number;
  calls: number;
  total_time: number;
  rows: number;
  hit_percent: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export default function DatabaseDashboardPage() {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [slowQueries, setSlowQueries] = useState<SlowQuery[]>([]);
  const [healthCheck, setHealthCheck] = useState<any>(null);
  const [performanceReport, setPerformanceReport] = useState<any>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [queryToAnalyze, setQueryToAnalyze] = useState('');
  const [queryAnalysis, setQueryAnalysis] = useState<any>(null);

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  };

  const handleAction = async (action: string, fn: () => Promise<any>) => {
    setLoading(prev => ({ ...prev, [action]: true }));
    setError(null);
    try {
      await fn();
    } catch (error: any) {
      setError(error.message || 'Operation failed');
    } finally {
      setLoading(prev => ({ ...prev, [action]: false }));
    }
  };

  const loadStats = async () => {
    const data = await fetchWithAuth('/database/stats');
    setStats(data.data);
  };

  const loadSlowQueries = async () => {
    const data = await fetchWithAuth('/database/slow-queries?min_duration=500');
    setSlowQueries(data.data);
  };

  const loadHealthCheck = async () => {
    const data = await fetchWithAuth('/database/health');
    setHealthCheck(data.data);
  };

  const loadPerformanceReport = async () => {
    const data = await fetchWithAuth('/database/performance-report');
    setPerformanceReport(data.data);
  };

  const analyzeQuery = async () => {
    if (!queryToAnalyze.trim()) return;
    
    const data = await fetchWithAuth('/database/analyze-query', {
      method: 'POST',
      body: JSON.stringify({ query: queryToAnalyze }),
    });
    setQueryAnalysis(data.data);
  };

  const analyzeTables = async () => {
    await fetchWithAuth('/database/analyze-tables', {
      method: 'POST',
      body: JSON.stringify({ tables: [] }),
    });
  };

  const vacuumTables = async () => {
    await fetchWithAuth('/database/vacuum-tables', {
      method: 'POST',
      body: JSON.stringify({ tables: [] }),
    });
  };

  useEffect(() => {
    Promise.all([
      handleAction('loadStats', loadStats),
      handleAction('loadHealthCheck', loadHealthCheck),
      handleAction('loadSlowQueries', loadSlowQueries),
    ]);
  }, []);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatDuration = (ms: number) => {
    return `${ms.toFixed(2)}ms`;
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'degraded': return 'text-orange-600';
      case 'unhealthy': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Database Management</h1>
          <p className="text-muted-foreground">
            Monitor and optimize database performance
          </p>
        </div>
        <Button
          onClick={() => Promise.all([
            handleAction('loadStats', loadStats),
            handleAction('loadHealthCheck', loadHealthCheck),
            handleAction('loadSlowQueries', loadSlowQueries),
          ])}
          disabled={loading.loadStats || loading.loadHealthCheck}
          variant="outline"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading.loadStats ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Health Status */}
      {healthCheck && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Database Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${
                  healthCheck.status === 'healthy' ? 'bg-green-500' :
                  healthCheck.status === 'warning' ? 'bg-yellow-500' :
                  healthCheck.status === 'degraded' ? 'bg-orange-500' : 'bg-red-500'
                }`} />
                <span className={`font-medium ${getHealthStatusColor(healthCheck.status)}`}>
                  {healthCheck.status.toUpperCase()}
                </span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Response Time</span>
                <div className="font-medium">{formatDuration(healthCheck.response_time_ms)}</div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Pool Usage</span>
                <div className="font-medium">
                  {healthCheck.pool_info.used}/{healthCheck.pool_info.max}
                </div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Pending</span>
                <div className="font-medium">{healthCheck.pool_info.pending}</div>
              </div>
            </div>
            {healthCheck.issues?.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-yellow-600 mb-2">Issues Detected:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {healthCheck.issues.map((issue: string, index: number) => (
                    <li key={index} className="text-sm text-yellow-600">{issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tables</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats.tables.length)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Indexes</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats.indexes.length)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connections</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats.connections.total_connections)}</div>
              <p className="text-xs text-muted-foreground">
                {stats.connections.active_connections} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pool Usage</CardTitle>
              <Gauge className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {((stats.poolInfo.used / stats.poolInfo.max) * 100).toFixed(0)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.poolInfo.used}/{stats.poolInfo.max} connections
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="slow-queries">Slow Queries</TabsTrigger>
          <TabsTrigger value="analyze">Query Analysis</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="report">Performance Report</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {stats && (
            <div className="grid md:grid-cols-2 gap-4">
              {/* Tables Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Database Tables</CardTitle>
                  <CardDescription>Table structure and statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {stats.tables.map((table) => (
                      <div key={table.name} className="border rounded p-3">
                        <div className="font-medium">{table.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {table.columns.length} columns
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Indexes Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Database Indexes</CardTitle>
                  <CardDescription>Index performance and coverage</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {stats.indexes.slice(0, 10).map((index, i) => (
                      <div key={i} className="border rounded p-3">
                        <div className="font-medium">{index.index_name}</div>
                        <div className="text-sm text-muted-foreground">
                          Table: {index.table_name} • 
                          Columns: {index.columns.join(', ')} • 
                          Size: {index.size}
                          {index.is_primary && <Badge className="ml-2" variant="secondary">PRIMARY</Badge>}
                          {index.is_unique && <Badge className="ml-1" variant="outline">UNIQUE</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Slow Queries Tab */}
        <TabsContent value="slow-queries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Slow Queries
              </CardTitle>
              <CardDescription>
                Queries that may need optimization (mean time > 500ms)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading.loadSlowQueries ? (
                <div className="text-center py-8">Loading slow queries...</div>
              ) : slowQueries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No slow queries detected
                </div>
              ) : (
                <div className="space-y-4">
                  {slowQueries.map((query, index) => (
                    <div key={index} className="border rounded p-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <span className="text-sm text-muted-foreground">Mean Time</span>
                          <div className="font-medium">{formatDuration(query.mean_time)}</div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Calls</span>
                          <div className="font-medium">{formatNumber(query.calls)}</div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Total Time</span>
                          <div className="font-medium">{formatDuration(query.total_time)}</div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Cache Hit</span>
                          <div className="font-medium">{query.hit_percent?.toFixed(1)}%</div>
                        </div>
                      </div>
                      <div className="bg-muted p-3 rounded font-mono text-sm overflow-x-auto">
                        {query.query}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Query Analysis Tab */}
        <TabsContent value="analyze" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Query Analysis</CardTitle>
              <CardDescription>
                Analyze query performance and get optimization suggestions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="query-input">SQL Query</Label>
                <Textarea
                  id="query-input"
                  placeholder="SELECT * FROM properties WHERE status = 'active'"
                  value={queryToAnalyze}
                  onChange={(e) => setQueryToAnalyze(e.target.value)}
                  rows={6}
                />
              </div>
              <Button
                onClick={() => handleAction('analyzeQuery', analyzeQuery)}
                disabled={loading.analyzeQuery || !queryToAnalyze.trim()}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Analyze Query
              </Button>

              {queryAnalysis && (
                <div className="border rounded p-4 mt-4">
                  <h4 className="font-medium mb-3">Analysis Results</h4>
                  {queryAnalysis.performance && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Estimated Cost</span>
                        <div className="font-medium">
                          {queryAnalysis.performance.estimatedCost?.toFixed(2) || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Actual Time</span>
                        <div className="font-medium">
                          {queryAnalysis.performance.actualTime ? 
                            formatDuration(queryAnalysis.performance.actualTime) : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Estimated Rows</span>
                        <div className="font-medium">
                          {queryAnalysis.performance.estimatedRows ? 
                            formatNumber(queryAnalysis.performance.estimatedRows) : 'N/A'}
                        </div>
                      </div>
                    </div>
                  )}
                  {queryAnalysis.plan && (
                    <div>
                      <h5 className="font-medium mb-2">Execution Plan</h5>
                      <div className="bg-muted p-3 rounded font-mono text-xs overflow-x-auto">
                        {Array.isArray(queryAnalysis.plan) ? 
                          queryAnalysis.plan.map((row: any, i: number) => (
                            <div key={i}>{row['QUERY PLAN']}</div>
                          )) : 
                          JSON.stringify(queryAnalysis.plan, null, 2)
                        }
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Table Analysis</CardTitle>
                <CardDescription>
                  Update table statistics for better query planning
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleAction('analyzeTables', analyzeTables)}
                  disabled={loading.analyzeTables}
                  className="w-full"
                >
                  {loading.analyzeTables && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  Analyze All Tables
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Table Vacuum</CardTitle>
                <CardDescription>
                  Clean up dead rows and reclaim storage space
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleAction('vacuumTables', vacuumTables)}
                  disabled={loading.vacuumTables}
                  className="w-full"
                  variant="outline"
                >
                  {loading.vacuumTables && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  Vacuum All Tables
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Report Tab */}
        <TabsContent value="report" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Report
              </CardTitle>
              <CardDescription>
                Comprehensive database performance analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => handleAction('loadPerformanceReport', loadPerformanceReport)}
                disabled={loading.loadPerformanceReport}
                className="mb-4"
              >
                {loading.loadPerformanceReport && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                Generate Report
              </Button>

              {performanceReport && (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 border rounded">
                      <div className="text-2xl font-bold">{performanceReport.summary.total_tables}</div>
                      <div className="text-sm text-muted-foreground">Tables</div>
                    </div>
                    <div className="text-center p-3 border rounded">
                      <div className="text-2xl font-bold">{performanceReport.summary.total_indexes}</div>
                      <div className="text-sm text-muted-foreground">Indexes</div>
                    </div>
                    <div className="text-center p-3 border rounded">
                      <div className="text-2xl font-bold">{performanceReport.summary.slow_queries_count}</div>
                      <div className="text-sm text-muted-foreground">Slow Queries</div>
                    </div>
                    <div className="text-center p-3 border rounded">
                      <div className="text-2xl font-bold">{performanceReport.summary.pool_utilization}</div>
                      <div className="text-sm text-muted-foreground">Pool Usage</div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {performanceReport.recommendations?.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Recommendations</h4>
                      <div className="space-y-2">
                        {performanceReport.recommendations.map((rec: any, index: number) => (
                          <Alert key={index} variant={rec.priority === 'high' ? 'destructive' : 'default'}>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              <Badge className="mr-2" variant={
                                rec.priority === 'high' ? 'destructive' :
                                rec.priority === 'medium' ? 'default' : 'secondary'
                              }>
                                {rec.priority.toUpperCase()}
                              </Badge>
                              {rec.message}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}