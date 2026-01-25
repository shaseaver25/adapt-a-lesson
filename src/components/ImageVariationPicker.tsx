import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Check, RefreshCw, Loader2, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageVariation {
  url: string;
  index: number;
}

interface ImageVariationPickerProps {
  description: string;
  variations: ImageVariation[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  onRegenerate: () => void;
  isRegenerating: boolean;
}

export function ImageVariationPicker({
  description,
  variations,
  isOpen,
  onClose,
  onSelect,
  onRegenerate,
  isRegenerating,
}: ImageVariationPickerProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleConfirm = () => {
    if (selectedIndex !== null && variations[selectedIndex]) {
      onSelect(variations[selectedIndex].url);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            Choose the Best Image
          </DialogTitle>
          <DialogDescription className="text-sm">
            <span className="font-medium">Prompt:</span> {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {variations.map((variation, index) => (
              <Card
                key={index}
                className={cn(
                  'cursor-pointer transition-all hover:shadow-md overflow-hidden',
                  selectedIndex === index
                    ? 'ring-2 ring-primary border-primary'
                    : 'hover:border-primary/50'
                )}
                onClick={() => setSelectedIndex(index)}
              >
                <CardContent className="p-2 relative">
                  <div className="aspect-square bg-muted rounded overflow-hidden">
                    <img
                      src={variation.url}
                      alt={`Option ${index + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  {selectedIndex === index && (
                    <div className="absolute top-4 right-4 bg-primary text-primary-foreground rounded-full p-1">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                  <p className="text-center text-sm text-muted-foreground mt-2">
                    Option {index + 1}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Loading placeholders while regenerating */}
          {isRegenerating && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Generating new options...</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="gap-2"
            >
              <RefreshCw className={cn('h-4 w-4', isRegenerating && 'animate-spin')} />
              Generate New Options
            </Button>

            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={selectedIndex === null || isRegenerating}
              >
                Use Selected Image
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Inline picker for displaying in content
interface InlineImagePickerProps {
  description: string;
  currentUrl?: string;
  onRequestVariations: () => void;
  isLoading?: boolean;
}

export function InlineImagePicker({
  description,
  currentUrl,
  onRequestVariations,
  isLoading,
}: InlineImagePickerProps) {
  return (
    <figure className="my-6 mx-auto max-w-[600px]">
      <div className="relative w-full aspect-[3/2] bg-muted border-4 border-primary/20 rounded-lg shadow-soft overflow-hidden group">
        {currentUrl ? (
          <img
            src={currentUrl}
            alt={description || 'Lesson diagram'}
            className="absolute inset-0 w-full h-full object-contain p-2"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <ImageIcon className="h-12 w-12" />
          </div>
        )}
        
        {/* Hover overlay with regenerate button */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button
            variant="secondary"
            size="sm"
            onClick={onRequestVariations}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {currentUrl ? 'Try Different Options' : 'Generate Options'}
          </Button>
        </div>
      </div>
      {description && (
        <figcaption className="text-center text-sm text-muted-foreground mt-2 italic">
          {description}
        </figcaption>
      )}
    </figure>
  );
}
