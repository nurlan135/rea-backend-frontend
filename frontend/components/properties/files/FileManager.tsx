'use client';

import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Upload, 
  Download, 
  Trash2, 
  Eye, 
  Search, 
  Grid, 
  List,
  Move,
  Image,
  FileText,
  File,
  Filter,
  CheckSquare,
  X,
  FolderPlus,
  Archive,
  RefreshCcw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

interface FileItem {
  id: string;
  original_name: string;
  file_name: string;
  file_path: string;
  thumbnail_path?: string;
  file_size: number;
  mime_type: string;
  category: string;
  property_id?: string;
  property_title?: string;
  description?: string;
  tags?: string[];
  upload_progress?: number;
  uploaded_by: string;
  first_name: string;
  last_name: string;
  created_at: string;
  download_count?: number;
}

interface FileManagerProps {
  propertyId?: string;
  category?: string;
  allowedTypes?: string[];
  maxFileSize?: number;
  maxFiles?: number;
}

const FILE_CATEGORIES = [
  { value: 'images', label: 'Şəkillər', icon: Image },
  { value: 'documents', label: 'Sənədlər', icon: FileText },
  { value: 'plans', label: 'Planlar', icon: FileText },
  { value: 'contracts', label: 'Müqavilələr', icon: File },
  { value: 'general', label: 'Ümumi', icon: File }
];

export default function FileManager({
  propertyId,
  category = 'general',
  allowedTypes = ['image/*', 'application/pdf', '.doc', '.docx', '.xls', '.xlsx'],
  maxFileSize = 50 * 1024 * 1024, // 50MB
  maxFiles = 20
}: FileManagerProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterMimeType, setFilterMimeType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<string>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setUploading(true);
    const newUploads: FileItem[] = [];

    for (const file of acceptedFiles.slice(0, maxFiles)) {
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const tempFile: FileItem = {
        id: tempId,
        original_name: file.name,
        file_name: file.name,
        file_path: '',
        file_size: file.size,
        mime_type: file.type,
        category,
        property_id: propertyId,
        upload_progress: 0,
        uploaded_by: '',
        first_name: '',
        last_name: '',
        created_at: new Date().toISOString()
      };

      newUploads.push(tempFile);
      setFiles(prev => [...prev, tempFile]);

      // Upload file
      try {
        if (file.size > 10 * 1024 * 1024) { // Use chunked upload for files > 10MB
          await uploadFileChunked(file, tempId);
        } else {
          await uploadFile(file, tempId);
        }
      } catch (error) {
        console.error('Upload error:', error);
        // Remove failed upload
        setFiles(prev => prev.filter(f => f.id !== tempId));
      }
    }

    setUploading(false);
  }, [category, propertyId, maxFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: allowedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize: maxFileSize,
    multiple: true
  });

  const uploadFile = async (file: File, tempId: string) => {
    const formData = new FormData();
    formData.append('files', file);
    formData.append('category', category);
    if (propertyId) formData.append('property_id', propertyId);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const progress = Math.round((e.loaded / e.total) * 100);
        setUploadProgress(prev => ({ ...prev, [tempId]: progress }));
        setFiles(prev => prev.map(f => 
          f.id === tempId ? { ...f, upload_progress: progress } : f
        ));
      }
    });

    return new Promise((resolve, reject) => {
      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          if (response.success && response.data.files[0]) {
            const uploadedFile = response.data.files[0];
            setFiles(prev => prev.map(f => 
              f.id === tempId ? { ...uploadedFile, upload_progress: 100 } : f
            ));
            resolve(uploadedFile);
          } else {
            reject(new Error('Upload failed'));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Upload failed'));
      
      xhr.open('POST', '/api/files/upload');
      xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('token')}`);
      xhr.send(formData);
    });
  };

  const uploadFileChunked = async (file: File, tempId: string) => {
    const chunkSize = 1 * 1024 * 1024; // 1MB chunks
    const totalChunks = Math.ceil(file.size / chunkSize);
    const fileId = crypto.randomUUID();

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      const reader = new FileReader();
      const chunkBase64 = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(chunk);
      });

      const chunkData = chunkBase64.split(',')[1]; // Remove data URL prefix

      const response = await fetch('/api/files/upload/chunk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          chunk: chunkData,
          chunkIndex,
          totalChunks,
          fileName: file.name,
          fileId,
          mimeType: file.type
        })
      });

      if (!response.ok) {
        throw new Error(`Chunk upload failed: ${response.statusText}`);
      }

      const progress = Math.round(((chunkIndex + 1) / totalChunks) * 100);
      setUploadProgress(prev => ({ ...prev, [tempId]: progress }));
      setFiles(prev => prev.map(f => 
        f.id === tempId ? { ...f, upload_progress: progress } : f
      ));

      const result = await response.json();
      if (result.success && result.data.file) {
        // Upload completed
        setFiles(prev => prev.map(f => 
          f.id === tempId ? { ...result.data.file, upload_progress: 100 } : f
        ));
        break;
      }
    }
  };

  const loadFiles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        sort_by: sortBy,
        sort_order: sortOrder
      });

      if (searchTerm) params.append('search', searchTerm);
      if (filterCategory && filterCategory !== 'all') params.append('category', filterCategory);
      if (filterMimeType && filterMimeType !== 'all') params.append('mime_type', filterMimeType);
      if (propertyId) params.append('property_id', propertyId);

      const response = await fetch(`/api/files?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFiles(data.data.files);
          setTotalPages(data.data.pagination.totalPages);
        }
      }
    } catch (error) {
      console.error('Load files error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleSelectAll = () => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(files.map(f => f.id));
    }
  };

  const handleBatchAction = async (action: string) => {
    if (selectedFiles.length === 0) return;

    try {
      const response = await fetch('/api/files/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          action,
          file_ids: selectedFiles
        })
      });

      if (response.ok) {
        if (action === 'download') {
          // Handle ZIP download
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'files.zip';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        } else {
          await loadFiles();
        }
        setSelectedFiles([]);
      }
    } catch (error) {
      console.error('Batch action error:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType.includes('pdf') || mimeType.includes('document')) return FileText;
    return File;
  };

  const FilterPanel = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Filter className="h-5 w-5 mr-2" />
          Filtr və Axtarış
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Input
            placeholder="Fayl adı ilə axtar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium mb-2 block">Kateqoriya</label>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Hamısı</SelectItem>
                {FILE_CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Fayl növü</label>
            <Select value={filterMimeType} onValueChange={setFilterMimeType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Hamısı</SelectItem>
                <SelectItem value="image">Şəkillər</SelectItem>
                <SelectItem value="application/pdf">PDF</SelectItem>
                <SelectItem value="application/msword">Word</SelectItem>
                <SelectItem value="application/vnd.ms-excel">Excel</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium mb-2 block">Sırala</label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Tarix</SelectItem>
                <SelectItem value="original_name">Ad</SelectItem>
                <SelectItem value="file_size">Ölçü</SelectItem>
                <SelectItem value="download_count">Yükləmə sayı</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Sıra</label>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Azalan</SelectItem>
                <SelectItem value="asc">Artan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={loadFiles} className="w-full">
          <Search className="h-4 w-4 mr-2" />
          Filtr tətbiq et
        </Button>
      </CardContent>
    </Card>
  );

  const UploadArea = () => (
    <Card>
      <CardContent className="p-6">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} ref={fileInputRef} />
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          
          {uploading ? (
            <div>
              <p className="text-lg font-medium mb-2">Fayllar yüklənir...</p>
              <div className="space-y-2">
                {Object.entries(uploadProgress).map(([fileId, progress]) => (
                  <div key={fileId} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Yüklənir...</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="w-full" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-medium mb-2">
                {isDragActive ? 'Faylları buraya atın' : 'Faylları yükləyin'}
              </h3>
              <p className="text-gray-600 mb-4">
                Faylları sürükləyib buraya atın və ya seçmək üçün klikləyin
              </p>
              <p className="text-sm text-gray-500">
                Maksimum: {maxFiles} fayl, {formatFileSize(maxFileSize)} hər fayl
              </p>
              
              <div className="mt-4">
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Fayl seç
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const FileGridView = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {files.map((file) => {
        const IconComponent = getFileIcon(file.mime_type);
        const isUploading = file.upload_progress !== undefined && file.upload_progress < 100;
        
        return (
          <Card 
            key={file.id} 
            className={`hover:shadow-md transition-shadow ${
              selectedFiles.includes(file.id) ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <Checkbox
                  checked={selectedFiles.includes(file.id)}
                  onCheckedChange={() => handleFileSelect(file.id)}
                />
                <Button size="sm" variant="ghost" disabled={isUploading}>
                  <Eye className="h-4 w-4" />
                </Button>
              </div>

              <div className="text-center mb-3">
                {file.thumbnail_path ? (
                  <img
                    src={`/api/files/${file.id}/thumbnail`}
                    alt={file.original_name}
                    className="w-full h-24 object-cover rounded"
                  />
                ) : (
                  <IconComponent className="h-12 w-12 text-gray-400 mx-auto" />
                )}
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm truncate" title={file.original_name}>
                  {file.original_name}
                </h4>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{formatFileSize(file.file_size)}</span>
                  <Badge variant="outline" className="text-xs">
                    {FILE_CATEGORIES.find(c => c.value === file.category)?.label || file.category}
                  </Badge>
                </div>

                {isUploading && (
                  <div>
                    <Progress value={file.upload_progress || 0} className="w-full h-2" />
                    <p className="text-xs text-center mt-1">{file.upload_progress || 0}%</p>
                  </div>
                )}

                {!isUploading && (
                  <div className="flex space-x-1">
                    <Button size="sm" variant="outline" className="flex-1 text-xs">
                      <Download className="h-3 w-3 mr-1" />
                      Yüklə
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const FileListView = () => (
    <div className="space-y-2">
      {files.map((file) => {
        const IconComponent = getFileIcon(file.mime_type);
        const isUploading = file.upload_progress !== undefined && file.upload_progress < 100;
        
        return (
          <Card 
            key={file.id}
            className={`${selectedFiles.includes(file.id) ? 'ring-2 ring-blue-500' : ''}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <Checkbox
                  checked={selectedFiles.includes(file.id)}
                  onCheckedChange={() => handleFileSelect(file.id)}
                />

                <IconComponent className="h-8 w-8 text-gray-400" />

                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{file.original_name}</h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{formatFileSize(file.file_size)}</span>
                    <span>{new Date(file.created_at).toLocaleDateString('az-AZ')}</span>
                    <span>{file.first_name} {file.last_name}</span>
                    {file.download_count && (
                      <span>{file.download_count} yükləmə</span>
                    )}
                  </div>

                  {isUploading && (
                    <div className="mt-2">
                      <Progress value={file.upload_progress || 0} className="w-full h-2" />
                      <p className="text-xs mt-1">{file.upload_progress || 0}% yükləndi</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    {FILE_CATEGORIES.find(c => c.value === file.category)?.label || file.category}
                  </Badge>

                  {!isUploading && (
                    <div className="flex space-x-1">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <UploadArea />

      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedFiles.length === files.length && files.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm">
                  {selectedFiles.length} / {files.length} seçildi
                </span>
              </div>

              {selectedFiles.length > 0 && (
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleBatchAction('download')}
                  >
                    <Archive className="h-4 w-4 mr-1" />
                    ZIP yüklə
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleBatchAction('delete')}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Sil
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              <Button size="sm" onClick={loadFiles}>
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-4 gap-6">
        {/* Filters */}
        <div className="col-span-1">
          <FilterPanel />
        </div>

        {/* File Display */}
        <div className="col-span-3">
          {loading ? (
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 9 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-24 w-full mb-3" />
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : files.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <File className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Fayl yoxdur
                </h3>
                <p className="text-gray-500">
                  Yuxarıdakı sahəyə faylları yükləyin
                </p>
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            <FileGridView />
          ) : (
            <FileListView />
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Card className="mt-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Əvvəlki
                  </Button>
                  
                  <span className="text-sm">
                    Səhifə {currentPage} / {totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Növbəti
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}