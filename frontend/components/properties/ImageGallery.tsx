'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Expand, 
  Play, 
  Image as ImageIcon,
  Video,
  X
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ImageGalleryProps {
  images: any[];
  videos: any[];
  propertyCode: string;
}

interface MediaItem {
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  title?: string;
  index: number;
}

export default function ImageGallery({ images, videos, propertyCode }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Combine images and videos into media items
  const mediaItems: MediaItem[] = [
    ...images.map((img: any, index: number) => ({
      type: 'image' as const,
      url: img.url || img.preview || '',
      thumbnail: img.thumbnail || img.url || img.preview,
      title: img.title || `Şəkil ${index + 1}`,
      index
    })),
    ...videos.map((video: any, index: number) => ({
      type: 'video' as const,
      url: video.url || video.preview || '',
      thumbnail: video.thumbnail || video.url || video.preview,
      title: video.title || `Video ${index + 1}`,
      index: images.length + index
    }))
  ];

  // If no media, show placeholder
  if (mediaItems.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="aspect-video bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Şəkil mövcud deyil</h3>
              <p className="text-gray-500">Bu əmlak üçün hələ şəkil yüklənməyib</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentMedia = mediaItems[currentIndex];

  const handlePrevious = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? mediaItems.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) => 
      prev === mediaItems.length - 1 ? 0 : prev + 1
    );
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleLightboxPrevious = () => {
    setLightboxIndex((prev) => 
      prev === 0 ? mediaItems.length - 1 : prev - 1
    );
  };

  const handleLightboxNext = () => {
    setLightboxIndex((prev) => 
      prev === mediaItems.length - 1 ? 0 : prev + 1
    );
  };

  const lightboxMedia = mediaItems[lightboxIndex];

  return (
    <div className="space-y-4">
      {/* Main Image/Video Display */}
      <Card>
        <CardContent className="p-0">
          <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
            {currentMedia.type === 'image' ? (
              <img
                src={currentMedia.url || '/placeholder-property.jpg'}
                alt={currentMedia.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-property.jpg';
                }}
              />
            ) : (
              <div className="relative w-full h-full">
                <video
                  src={currentMedia.url}
                  className="w-full h-full object-cover"
                  controls={false}
                  muted
                  loop
                  poster={currentMedia.thumbnail}
                />
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                  <Button
                    size="lg"
                    className="bg-white bg-opacity-90 text-black hover:bg-opacity-100"
                    onClick={() => {
                      const video = document.querySelector('video') as HTMLVideoElement;
                      if (video) {
                        if (video.paused) {
                          video.play();
                        } else {
                          video.pause();
                        }
                      }
                    }}
                  >
                    <Play className="h-6 w-6" />
                  </Button>
                </div>
              </div>
            )}

            {/* Navigation Arrows */}
            {mediaItems.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white"
                  onClick={handleNext}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}

            {/* Expand Button */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white"
              onClick={() => openLightbox(currentIndex)}
            >
              <Expand className="h-4 w-4" />
            </Button>

            {/* Media Type Badge */}
            <Badge 
              className="absolute top-2 left-2 bg-black bg-opacity-70 text-white border-none"
            >
              {currentMedia.type === 'video' ? (
                <><Video className="h-3 w-3 mr-1" /> Video</>
              ) : (
                <><ImageIcon className="h-3 w-3 mr-1" /> Şəkil</>
              )}
            </Badge>

            {/* Counter */}
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm">
              {currentIndex + 1} / {mediaItems.length}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Thumbnail Navigation */}
      {mediaItems.length > 1 && (
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {mediaItems.map((media, index) => (
            <button
              key={index}
              className={`relative flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex
                  ? 'border-blue-500 opacity-100'
                  : 'border-gray-200 opacity-70 hover:opacity-100'
              }`}
              onClick={() => setCurrentIndex(index)}
            >
              {media.type === 'image' ? (
                <img
                  src={media.thumbnail || '/placeholder-property.jpg'}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-property.jpg';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <Play className="h-4 w-4 text-gray-600" />
                </div>
              )}
              {media.type === 'video' && (
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                  <Play className="h-3 w-3 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-7xl w-full h-full max-h-screen p-0 overflow-hidden">
          <DialogHeader className="absolute top-0 left-0 right-0 z-10 bg-black bg-opacity-70 text-white p-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg">
                {lightboxMedia?.title} - {propertyCode}
              </DialogTitle>
              <div className="flex items-center space-x-2">
                <span className="text-sm">
                  {lightboxIndex + 1} / {mediaItems.length}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white hover:bg-opacity-20"
                  onClick={() => setLightboxOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="relative w-full h-full flex items-center justify-center bg-black">
            {lightboxMedia?.type === 'image' ? (
              <img
                src={lightboxMedia.url}
                alt={lightboxMedia.title}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <video
                src={lightboxMedia?.url}
                className="max-w-full max-h-full object-contain"
                controls
                autoPlay
              />
            )}

            {/* Lightbox Navigation */}
            {mediaItems.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white"
                  onClick={handleLightboxPrevious}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white"
                  onClick={handleLightboxNext}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}