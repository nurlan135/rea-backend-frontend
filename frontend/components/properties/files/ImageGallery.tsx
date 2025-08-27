'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Maximize2, 
  RotateCw, 
  ZoomIn, 
  ZoomOut,
  X,
  Eye,
  Image as ImageIcon,
  Grid3X3,
  Play,
  Pause
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageFile {
  id: string;
  original_name: string;
  file_path: string;
  thumbnail_path?: string;
  file_size: number;
  created_at: string;
  description?: string;
  tags?: string[];
}

interface ImageGalleryProps {
  images: ImageFile[];
  propertyId?: string;
  showUpload?: boolean;
  className?: string;
}

export default function ImageGallery({ 
  images, 
  propertyId,
  showUpload = false,
  className 
}: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isSlideshow, setIsSlideshow] = useState(false);
  const [slideshowInterval, setSlideshowInterval] = useState<NodeJS.Timeout | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (selectedImage) {
      const index = images.findIndex(img => img.id === selectedImage.id);
      setCurrentIndex(index);
    }
  }, [selectedImage, images]);

  useEffect(() => {
    if (isSlideshow) {
      const interval = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % images.length);
      }, 3000);
      setSlideshowInterval(interval);
    } else if (slideshowInterval) {
      clearInterval(slideshowInterval);
      setSlideshowInterval(null);
    }

    return () => {
      if (slideshowInterval) {
        clearInterval(slideshowInterval);
      }
    };
  }, [isSlideshow, images.length]);

  const handlePrevious = () => {
    if (images.length === 0) return;
    const newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
    setCurrentIndex(newIndex);
    setSelectedImage(images[newIndex]);
    resetImageTransform();
  };

  const handleNext = () => {
    if (images.length === 0) return;
    const newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(newIndex);
    setSelectedImage(images[newIndex]);
    resetImageTransform();
  };

  const resetImageTransform = () => {
    setRotation(0);
    setZoom(1);
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.5));
  };

  const handleDownload = async (image: ImageFile) => {
    try {
      const response = await fetch(`/api/files/${image.id}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = image.original_name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const GridView = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {images.map((image, index) => (
        <Dialog key={image.id}>
          <DialogTrigger asChild>
            <Card className="group cursor-pointer hover:shadow-lg transition-all duration-200">
              <CardContent className="p-2">
                <div className="relative aspect-square overflow-hidden rounded-lg">
                  <img
                    src={image.thumbnail_path || `/api/files/${image.id}/thumbnail`}
                    alt={image.original_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-image.png';
                    }}
                  />
                  
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="bg-white rounded-full p-2">
                        <Eye className="h-5 w-5 text-gray-700" />
                      </div>
                    </div>
                  </div>

                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="text-xs">
                      {index + 1}
                    </Badge>
                  </div>
                </div>

                <div className="mt-2 space-y-1">
                  <p className="text-xs font-medium truncate" title={image.original_name}>
                    {image.original_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(image.file_size)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </DialogTrigger>

          <DialogContent className="max-w-4xl w-full h-[90vh] p-0">
            <div className="relative w-full h-full bg-black">
              {/* Header Controls */}
              <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">
                    {currentIndex + 1} / {images.length}
                  </Badge>
                  <h3 className="text-white font-medium max-w-md truncate">
                    {selectedImage?.original_name || image.original_name}
                  </h3>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setIsSlideshow(!isSlideshow)}
                  >
                    {isSlideshow ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleDownload(selectedImage || image)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Image Display */}
              <div className="absolute inset-0 flex items-center justify-center p-16">
                <div 
                  className="relative max-w-full max-h-full"
                  style={{
                    transform: `rotate(${rotation}deg) scale(${zoom})`,
                    transition: 'transform 0.3s ease'
                  }}
                >
                  <img
                    src={images[currentIndex]?.file_path || `/api/files/${images[currentIndex]?.id}`}
                    alt={images[currentIndex]?.original_name}
                    className="max-w-full max-h-full object-contain"
                    onLoad={() => setSelectedImage(images[currentIndex])}
                  />
                </div>
              </div>

              {/* Navigation */}
              {images.length > 1 && (
                <>
                  <Button
                    size="lg"
                    variant="secondary"
                    className="absolute left-4 top-1/2 transform -translate-y-1/2"
                    onClick={handlePrevious}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  
                  <Button
                    size="lg"
                    variant="secondary"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2"
                    onClick={handleNext}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}

              {/* Bottom Controls */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <div className="flex items-center space-x-2 bg-black bg-opacity-50 rounded-lg p-2">
                  <Button size="sm" variant="secondary" onClick={handleZoomOut}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  
                  <span className="text-white text-sm min-w-[4rem] text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  
                  <Button size="sm" variant="secondary" onClick={handleZoomIn}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  
                  <Button size="sm" variant="secondary" onClick={handleRotate}>
                    <RotateCw className="h-4 w-4" />
                  </Button>
                  
                  <Button size="sm" variant="secondary" onClick={resetImageTransform}>
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Thumbnail Strip */}
              {images.length > 1 && (
                <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
                  <div className="flex space-x-2 max-w-lg overflow-x-auto p-2 bg-black bg-opacity-50 rounded-lg">
                    {images.map((img, idx) => (
                      <button
                        key={img.id}
                        onClick={() => {
                          setCurrentIndex(idx);
                          setSelectedImage(img);
                          resetImageTransform();
                        }}
                        className={cn(
                          "flex-shrink-0 w-12 h-12 rounded border-2 overflow-hidden",
                          idx === currentIndex 
                            ? "border-white" 
                            : "border-transparent opacity-70 hover:opacity-100"
                        )}
                      >
                        <img
                          src={img.thumbnail_path || `/api/files/${img.id}/thumbnail`}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      ))}
    </div>
  );

  const ListView = () => (
    <div className="space-y-3">
      {images.map((image, index) => (
        <Card key={image.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-lg overflow-hidden">
                  <img
                    src={image.thumbnail_path || `/api/files/${image.id}/thumbnail`}
                    alt={image.original_name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-medium truncate">{image.original_name}</h4>
                  <Badge variant="outline" className="text-xs">
                    {index + 1}
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>{formatFileSize(image.file_size)}</span>
                  <span>{new Date(image.created_at).toLocaleDateString('az-AZ')}</span>
                </div>

                {image.description && (
                  <p className="text-sm text-gray-600 mt-1">{image.description}</p>
                )}

                {image.tags && image.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {image.tags.map((tag, tagIndex) => (
                      <Badge key={tagIndex} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl w-full h-[90vh] p-0">
                    {/* Same dialog content as GridView */}
                  </DialogContent>
                </Dialog>

                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleDownload(image)}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (images.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-12 text-center">
          <ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Şəkil yoxdur
          </h3>
          <p className="text-gray-500 mb-4">
            Bu əmlakla bağlı hələ şəkil yüklənməyib
          </p>
          {showUpload && (
            <Button>
              <ImageIcon className="h-4 w-4 mr-2" />
              Şəkil yüklə
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold">
            Şəkillər ({images.length})
          </h3>
          
          {images.length > 1 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsSlideshow(!isSlideshow)}
            >
              {isSlideshow ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              Slayd şou
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          
          <Button
            size="sm"
            variant={viewMode === 'list' ? 'default' : 'outline'}
            onClick={() => setViewMode('list')}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Image Display */}
      {viewMode === 'grid' ? <GridView /> : <ListView />}
    </div>
  );
}