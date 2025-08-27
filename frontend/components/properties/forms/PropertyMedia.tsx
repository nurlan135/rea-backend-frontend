'use client';

import { UseFormReturn } from 'react-hook-form';
import { PropertyFormData } from '@/lib/schemas/property';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCallback, useState } from 'react';
import { Upload, X, Image as ImageIcon, Video, FileText, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PropertyMediaProps {
  form: UseFormReturn<PropertyFormData>;
}

interface FileItem {
  file: File;
  preview: string;
  type: 'image' | 'video' | 'document';
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const ACCEPTED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

export default function PropertyMedia({ form }: PropertyMediaProps) {
  const [dragOver, setDragOver] = useState<'images' | 'videos' | 'documents' | null>(null);
  const [uploading, setUploading] = useState(false);

  const watchImages = form.watch('images') || [];
  const watchVideos = form.watch('videos') || [];
  const watchDocuments = form.watch('documents') || [];

  const createFilePreview = (file: File): string => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return '';
  };

  const getFileType = (file: File): 'image' | 'video' | 'document' => {
    if (ACCEPTED_IMAGE_TYPES.includes(file.type)) return 'image';
    if (ACCEPTED_VIDEO_TYPES.includes(file.type)) return 'video';
    return 'document';
  };

  const validateFile = (file: File, expectedType?: 'image' | 'video' | 'document'): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return 'Fayl ölçüsü 10MB-dan çox ola bilməz';
    }

    const fileType = getFileType(file);
    if (expectedType && fileType !== expectedType) {
      const typeNames = {
        image: 'şəkil',
        video: 'video',
        document: 'sənəd'
      };
      return `Yalnız ${typeNames[expectedType]} faylları dəstəklənir`;
    }

    if (fileType === 'image' && !ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return 'Yalnız JPG, PNG və WebP formatları dəstəklənir';
    }

    if (fileType === 'video' && !ACCEPTED_VIDEO_TYPES.includes(file.type)) {
      return 'Yalnız MP4, WebM və MOV formatları dəstəklənir';
    }

    if (fileType === 'document' && !ACCEPTED_DOCUMENT_TYPES.includes(file.type)) {
      return 'Yalnız PDF və Word faylları dəstəklənir';
    }

    return null;
  };

  const handleFileUpload = async (files: File[], type: 'images' | 'videos' | 'documents') => {
    setUploading(true);
    const expectedType = type === 'images' ? 'image' : type === 'videos' ? 'video' : 'document';
    
    try {
      const validFiles: FileItem[] = [];
      const errors: string[] = [];

      for (const file of files) {
        const error = validateFile(file, expectedType);
        if (error) {
          errors.push(`${file.name}: ${error}`);
          continue;
        }

        validFiles.push({
          file,
          preview: createFilePreview(file),
          type: expectedType
        });
      }

      if (errors.length > 0) {
        // TODO: Show error messages to user
        console.error('File validation errors:', errors);
      }

      if (validFiles.length > 0) {
        const currentFiles = form.getValues(type) || [];
        form.setValue(type, [...currentFiles, ...validFiles]);
      }

    } catch (error) {
      console.error('File upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (type: 'images' | 'videos' | 'documents', index: number) => {
    const currentFiles = form.getValues(type) || [];
    const newFiles = currentFiles.filter((_, i) => i !== index);
    form.setValue(type, newFiles);

    // Clean up preview URL
    const fileItem = currentFiles[index] as FileItem;
    if (fileItem?.preview) {
      URL.revokeObjectURL(fileItem.preview);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent, type: 'images' | 'videos' | 'documents') => {
    e.preventDefault();
    setDragOver(null);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files, type);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDragEnter = useCallback((type: 'images' | 'videos' | 'documents') => {
    setDragOver(type);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(null);
  }, []);

  const FileUploadZone = ({ 
    type, 
    title, 
    description, 
    files, 
    icon: Icon 
  }: {
    type: 'images' | 'videos' | 'documents';
    title: string;
    description: string;
    files: FileItem[];
    icon: any;
  }) => (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragOver === type 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={(e) => handleDrop(e, type)}
        onDragOver={handleDragOver}
        onDragEnter={() => handleDragEnter(type)}
        onDragLeave={handleDragLeave}
      >
        <div className="text-center">
          <Icon className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <label
              htmlFor={`${type}-upload`}
              className="cursor-pointer rounded-md bg-white font-medium text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 hover:text-blue-500"
            >
              <span>{title}</span>
              <Input
                id={`${type}-upload`}
                type="file"
                className="sr-only"
                multiple
                accept={
                  type === 'images' ? ACCEPTED_IMAGE_TYPES.join(',') :
                  type === 'videos' ? ACCEPTED_VIDEO_TYPES.join(',') :
                  ACCEPTED_DOCUMENT_TYPES.join(',')
                }
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length > 0) {
                    handleFileUpload(files, type);
                  }
                }}
              />
            </label>
            <p className="pl-1">və ya faylları bura atın</p>
          </div>
          <p className="text-xs text-gray-500 mt-2">{description}</p>
        </div>
      </div>

      {/* File Preview Grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {files.map((fileItem, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                {type === 'images' && fileItem.preview ? (
                  <img 
                    src={fileItem.preview} 
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Icon className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                
                {/* File overlay with actions */}
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="flex space-x-2">
                    {type === 'images' && fileItem.preview && (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => window.open(fileItem.preview, '_blank')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => removeFile(type, index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* File name */}
              <p className="text-xs text-gray-600 mt-1 truncate">
                {fileItem.file.name}
              </p>
              
              {/* File size */}
              <p className="text-xs text-gray-400">
                {(fileItem.file.size / 1024 / 1024).toFixed(1)} MB
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Media və Sənədlər</CardTitle>
        <CardDescription>
          Əmlakın şəkillərini, videolarını və sənədlərini yükləyin
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Images Section */}
        <div>
          <h4 className="text-lg font-medium mb-4 flex items-center">
            <ImageIcon className="h-5 w-5 mr-2" />
            Şəkillər
            {watchImages.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {watchImages.length}
              </Badge>
            )}
          </h4>
          <FileUploadZone
            type="images"
            title="Şəkil yüklə"
            description="JPG, PNG, WebP (maks. 10MB hər fayl)"
            files={watchImages}
            icon={ImageIcon}
          />
        </div>

        {/* Videos Section */}
        <div>
          <h4 className="text-lg font-medium mb-4 flex items-center">
            <Video className="h-5 w-5 mr-2" />
            Videolar
            {watchVideos.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {watchVideos.length}
              </Badge>
            )}
          </h4>
          <FileUploadZone
            type="videos"
            title="Video yüklə"
            description="MP4, WebM, MOV (maks. 10MB hər fayl)"
            files={watchVideos}
            icon={Video}
          />
        </div>

        {/* Documents Section */}
        <div>
          <h4 className="text-lg font-medium mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Sənədlər
            {watchDocuments.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {watchDocuments.length}
              </Badge>
            )}
          </h4>
          <FileUploadZone
            type="documents"
            title="Sənəd yüklə"
            description="PDF, Word (maks. 10MB hər fayl)"
            files={watchDocuments}
            icon={FileText}
          />
        </div>

        {/* Upload Guidelines */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">Media Yükləmə Qaydaları</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <strong>Şəkillər:</strong> Əmlakın fərqli bucaqlarını, otaqları və görünüşünü əks etdirin</li>
            <li>• <strong>Videolar:</strong> Virtual tur və ya əmlakın ümumi görünüşü üçün istifadə edin</li>
            <li>• <strong>Sənədlər:</strong> Mülkiyyət sənədləri, planı və digər rəsmi kağızlar</li>
            <li>• Faylların ölçüsü 10MB-dan çox olmamalıdır</li>
            <li>• Keyfiyyətli və aydın şəkillər əmlakın satışını sürətləndirir</li>
            <li>• Minimum 5-10 şəkil tövsiyə edilir</li>
          </ul>
        </div>

        {/* Total File Count */}
        {(watchImages.length + watchVideos.length + watchDocuments.length) > 0 && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">Yükləmə Statistikası</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <p className="font-semibold text-green-900">{watchImages.length}</p>
                <p className="text-green-700">Şəkil</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-green-900">{watchVideos.length}</p>
                <p className="text-green-700">Video</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-green-900">{watchDocuments.length}</p>
                <p className="text-green-700">Sənəd</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}