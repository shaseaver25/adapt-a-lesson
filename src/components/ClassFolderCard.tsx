import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FolderOpen, Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StudentGroup } from '@/types/studentGroup';

interface ClassFolder {
  id: string;
  folder_name: string;
  color: string;
}

interface ClassFolderCardProps {
  folder: ClassFolder;
  groups: (StudentGroup & { id: string })[];
  onEdit: () => void;
  onDelete: () => void;
  onDrop: (groupId: string) => void;
  onRemoveGroup: (groupId: string) => void;
  renderGroup: (group: StudentGroup & { id: string }) => React.ReactNode;
}

const FOLDER_COLORS: Record<string, string> = {
  blue: 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30',
  green: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30',
  purple: 'bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30',
  orange: 'bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/30',
  pink: 'bg-pink-500/20 text-pink-700 dark:text-pink-400 border-pink-500/30',
  yellow: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
};

export function ClassFolderCard({ 
  folder, 
  groups, 
  onEdit, 
  onDelete, 
  onDrop,
  onRemoveGroup,
  renderGroup 
}: ClassFolderCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);

  const colorClass = FOLDER_COLORS[folder.color] || FOLDER_COLORS.blue;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const groupId = e.dataTransfer.getData('groupId');
    if (groupId) {
      onDrop(groupId);
    }
  };

  return (
    <Card 
      className={cn(
        'transition-all border-2',
        isDragOver ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border',
        colorClass.split(' ')[0]
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <div className={cn('p-2 rounded-lg', colorClass)}>
              <FolderOpen className="h-4 w-4" />
            </div>
            <div className="text-left">
              <h3 className="font-display font-bold text-foreground">{folder.folder_name}</h3>
              <p className="text-sm text-muted-foreground">
                {groups.length} group{groups.length !== 1 ? 's' : ''}
              </p>
            </div>
          </button>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-destructive hover:text-destructive" 
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-2">
          {groups.length === 0 ? (
            <div className={cn(
              'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
              isDragOver ? 'border-primary bg-primary/10' : 'border-muted'
            )}>
              <p className="text-sm text-muted-foreground">
                Drag groups here to add them to this class
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {groups.map((group) => (
                <div key={group.id} className="relative group/item">
                  {renderGroup(group)}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover/item:opacity-100 transition-opacity text-xs"
                    onClick={() => onRemoveGroup(group.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export { FOLDER_COLORS };
export type { ClassFolder };
