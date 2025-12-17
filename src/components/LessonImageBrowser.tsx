import { useState, useEffect } from 'react';
import { useLessonImagesDB } from '@/hooks/useLessonImagesDB';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Image as ImageIcon, 
  Download, 
  X, 
  Loader2,
  RefreshCw,
  Calendar,
  FileImage
} from 'lucide-react';
import { format } from 'date-fns';

interface LessonImageBrowserProps {
  lessonId: string;
  lessonTitle?: string;
  onClose?: () => void;
}

export function LessonImageBrowser({ lessonId, lessonTitle, onClose }: LessonImageBrowserProps) {
  const { images, isLoading, error, fetchImages, refreshSignedUrl } = useLessonImagesDB();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedDescription, setSelectedDescription] = useState<string | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  useEffect(() => {
    fetchImages(lessonId);
  }, [lessonId, fetchImages]);

  const handleDownload = async (signedUrl: string, description: string) => {
    try {
      const response = await fetch(signedUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `diagram-${description.substring(0, 30).replace(/[^a-z0-9]/gi, '-')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const handleRefreshUrl = async (imageId: string, storagePath: string) => {
    setRefreshingId(imageId);
    await refreshSignedUrl(storagePath);
    await fetchImages(lessonId);
    setRefreshingId(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            Lesson Images
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="py-6 text-center">
          <p className="text-destructive">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => fetchImages(lessonId)}
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (images.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <FileImage className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No images generated for this lesson yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <ImageIcon className="h-5 w-5 text-primary" />
              Lesson Images
              <Badge variant="secondary" className="ml-2">{images.length}</Badge>
            </CardTitle>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {lessonTitle && (
            <p className="text-sm text-muted-foreground">{lessonTitle}</p>
          )}
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[60vh]">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {images.map((img) => (
                <div 
                  key={img.id} 
                  className="group relative aspect-square rounded-lg overflow-hidden border bg-muted"
                >
                  {img.signedUrl ? (
                    <>
                      <img
                        src={img.signedUrl}
                        alt={img.alt_text || 'Lesson diagram'}
                        className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
                        onClick={() => {
                          setSelectedImage(img.signedUrl || null);
                          setSelectedDescription(img.description || null);
                        }}
                      />
                      {/* Overlay with actions */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                        <div className="text-white text-xs line-clamp-2">
                          {img.description || 'No description'}
                        </div>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(img.signedUrl!, img.description || 'diagram');
                            }}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRefreshUrl(img.id, img.storage_path);
                            }}
                            disabled={refreshingId === img.id}
                          >
                            {refreshingId === img.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
          
          {/* Image metadata */}
          <div className="mt-3 pt-3 border-t text-xs text-muted-foreground flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {images[0] && format(new Date(images[0].created_at), 'MMM d, yyyy')}
            </span>
            <span>
              {images.reduce((acc, img) => acc + (img.file_size || 0), 0) > 1024 * 1024 
                ? `${(images.reduce((acc, img) => acc + (img.file_size || 0), 0) / (1024 * 1024)).toFixed(1)} MB`
                : `${(images.reduce((acc, img) => acc + (img.file_size || 0), 0) / 1024).toFixed(0)} KB`
              } total
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Full-size image viewer */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-normal text-muted-foreground line-clamp-2">
              {selectedDescription || 'Image Preview'}
            </DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="relative">
              <img
                src={selectedImage}
                alt={selectedDescription || 'Full size diagram'}
                className="w-full h-auto rounded-lg"
              />
              <Button
                variant="secondary"
                size="sm"
                className="absolute bottom-4 right-4 gap-2"
                onClick={() => handleDownload(selectedImage, selectedDescription || 'diagram')}
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
