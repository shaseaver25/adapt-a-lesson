import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { FOLDER_COLORS, type ClassFolder } from './ClassFolderCard';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { folder_name: string; color: string }) => void;
  initialData?: ClassFolder;
  isLoading?: boolean;
}

const COLOR_OPTIONS = Object.keys(FOLDER_COLORS);

export function CreateFolderModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData,
  isLoading 
}: CreateFolderModalProps) {
  const [folderName, setFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState('blue');

  useEffect(() => {
    if (initialData) {
      setFolderName(initialData.folder_name);
      setSelectedColor(initialData.color);
    } else {
      setFolderName('');
      setSelectedColor('blue');
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (folderName.trim()) {
      onSave({ folder_name: folderName.trim(), color: selectedColor });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {initialData ? 'Edit Class' : 'Create New Class'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="folderName">Class Name</Label>
            <Input
              id="folderName"
              placeholder="e.g., Period 1, Morning Class, Mrs. Smith's Class"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    'w-8 h-8 rounded-full transition-all',
                    color === 'blue' && 'bg-blue-500',
                    color === 'green' && 'bg-green-500',
                    color === 'purple' && 'bg-purple-500',
                    color === 'orange' && 'bg-orange-500',
                    color === 'pink' && 'bg-pink-500',
                    color === 'yellow' && 'bg-yellow-500',
                    selectedColor === color 
                      ? 'ring-2 ring-offset-2 ring-foreground scale-110' 
                      : 'hover:scale-105'
                  )}
                  aria-label={`Select ${color} color`}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!folderName.trim() || isLoading}>
              {isLoading ? 'Saving...' : initialData ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
