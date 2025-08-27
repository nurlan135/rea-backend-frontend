'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Image, 
  FolderOpen, 
  Upload,
  Download,
  Trash2,
  Archive,
  BarChart3,
  Clock,
  HardDrive,
  Users,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import FileManager from '@/components/properties/files/FileManager';
import ImageGallery from '@/components/properties/files/ImageGallery';

interface FileStats {
  total_files: number;
  total_size: number;
  by_category: { [key: string]: number };
  by_mime_type: { [key: string]: number };
  recent_uploads: number;
  most_active_uploader: {
    name: string;
    count: number;
  };
  storage_usage: {
    used: number;
    total: number;
    percentage: number;
  };
}

export default function FilesPage() {
  const [stats, setStats] = useState<FileStats | null>(null);
  const [recentFiles, setRecentFiles] = useState<any[]>([]);
  const [imageFiles, setImageFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadFileStats(),
        loadRecentFiles(),
        loadImageFiles()
      ]);
    } catch (error) {
      console.error('Dashboard data loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFileStats = async () => {
    try {
      const response = await fetch('/api/files/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(data.data.stats);
        }
      }
    } catch (error) {
      console.error('Stats loading error:', error);
    }
  };

  const loadRecentFiles = async () => {
    try {
      const response = await fetch('/api/files?limit=10&sort_by=created_at&sort_order=desc', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRecentFiles(data.data.files);
        }
      }
    } catch (error) {
      console.error('Recent files loading error:', error);
    }
  };

  const loadImageFiles = async () => {
    try {
      const response = await fetch('/api/files?mime_type=image&limit=20', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setImageFiles(data.data.files);
        }
      }
    } catch (error) {
      console.error('Image files loading error:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileTypeIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return Image;
    return FileText;
  };

  const StatsOverview = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FolderOpen className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{stats?.total_files || 0}</p>
                <p className="text-xs text-gray-600">Cəmi fayl</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HardDrive className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{formatFileSize(stats?.total_size || 0)}</p>
                <p className="text-xs text-gray-600">Cəmi ölçü</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{stats?.recent_uploads || 0}</p>
                <p className="text-xs text-gray-600">Son 7 gün</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-xl font-bold">{stats?.most_active_uploader?.name || 'N/A'}</p>
                <p className="text-xs text-gray-600">Ən aktiv istifadəçi</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Storage Usage */}
      {stats?.storage_usage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <HardDrive className="h-5 w-5 mr-2" />
              Yaddaş İstifadəsi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>İstifadə edilən</span>
                <span className="font-medium">
                  {formatFileSize(stats.storage_usage.used)} / {formatFileSize(stats.storage_usage.total)}
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    stats.storage_usage.percentage > 90 ? 'bg-red-600' :
                    stats.storage_usage.percentage > 75 ? 'bg-orange-500' : 'bg-green-600'
                  }`}
                  style={{ width: `${stats.storage_usage.percentage}%` }}
                />
              </div>
              
              <p className="text-sm text-gray-600">
                {stats.storage_usage.percentage.toFixed(1)}% istifadə edilib
              </p>

              {stats.storage_usage.percentage > 90 && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    Yaddaş yeriniz tükənmək üzrədir. Köhnə faylları silin.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Kateqoriyalar üzrə</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.by_category && Object.entries(stats.by_category).map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2">
                      {category === 'images' ? 'Şəkillər' :
                       category === 'documents' ? 'Sənədlər' :
                       category === 'plans' ? 'Planlar' :
                       category === 'contracts' ? 'Müqavilələr' : 'Ümumi'}
                    </Badge>
                  </div>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fayl növləri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.by_mime_type && Object.entries(stats.by_mime_type)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([mimeType, count]) => {
                  const Icon = getFileTypeIcon(mimeType);
                  return (
                    <div key={mimeType} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Icon className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm">
                          {mimeType.split('/')[1]?.toUpperCase() || mimeType}
                        </span>
                      </div>
                      <span className="font-medium">{count}</span>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Files */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Son Yüklənən Fayllar
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentFiles.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Son fayl yoxdur</p>
          ) : (
            <div className="space-y-3">
              {recentFiles.map((file) => {
                const Icon = getFileTypeIcon(file.mime_type);
                return (
                  <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Icon className="h-8 w-8 text-gray-500" />
                      <div>
                        <p className="font-medium">{file.original_name}</p>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span>{formatFileSize(file.file_size)}</span>
                          <span>•</span>
                          <span>{file.first_name} {file.last_name}</span>
                          <span>•</span>
                          <span>{new Date(file.created_at).toLocaleDateString('az-AZ')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {file.category}
                      </Badge>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fayl İdarəetməsi</h1>
          <p className="text-gray-600">Bütün faylları idarə edin və təşkil edin</p>
        </div>

        <div className="flex space-x-2">
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Yeni Fayl
          </Button>
          <Button variant="outline">
            <Archive className="h-4 w-4 mr-2" />
            Toplu İxrac
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            İcmal
          </TabsTrigger>
          <TabsTrigger value="files" className="flex items-center">
            <FolderOpen className="h-4 w-4 mr-2" />
            Bütün Fayllar
          </TabsTrigger>
          <TabsTrigger value="images" className="flex items-center">
            <Image className="h-4 w-4 mr-2" />
            Şəkillər
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center">
            <Upload className="h-4 w-4 mr-2" />
            Yükləmə
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {loading ? (
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="h-8 w-8 bg-gray-200 rounded mb-4" />
                      <div className="h-6 bg-gray-200 rounded mb-2" />
                      <div className="h-4 bg-gray-200 rounded w-2/3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <StatsOverview />
          )}
        </TabsContent>

        <TabsContent value="files">
          <FileManager />
        </TabsContent>

        <TabsContent value="images">
          <Card>
            <CardHeader>
              <CardTitle>Şəkil Qalereyası</CardTitle>
              <CardDescription>
                Yüklənmiş bütün şəkillər
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageGallery images={imageFiles} showUpload={true} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Fayl Yükləmə</CardTitle>
              <CardDescription>
                Yeni faylları yükləyin və təşkil edin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileManager 
                category="general"
                maxFiles={20}
                maxFileSize={50 * 1024 * 1024}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}