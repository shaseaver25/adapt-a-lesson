import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Pencil, Trash2, Languages, GripVertical, FolderOpen } from 'lucide-react';
import { getStudentFriendlyName, getStudentFriendlyIcon, getReadingLevelColor } from '@/lib/readingLevelNames';
import { cn } from '@/lib/utils';
import type { StudentGroup } from '@/types/studentGroup';

interface DraggableStudentGroupCardProps {
  group: StudentGroup & { id: string };
  onEdit: () => void;
  onDelete: () => void;
  isDragging?: boolean;
  compact?: boolean;
  folderName?: string;
  folderColor?: string;
}

export function DraggableStudentGroupCard({ 
  group, 
  onEdit, 
  onDelete, 
  isDragging,
  compact = false,
  folderName,
  folderColor = 'blue'
}: DraggableStudentGroupCardProps) {
  const readingLevelColorClass = getReadingLevelColor(group.readingLevelLabel);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('groupId', group.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  if (compact) {
    return (
      <div
        draggable
        onDragStart={handleDragStart}
        className={cn(
          'flex items-center gap-3 p-3 bg-card rounded-lg border border-border cursor-grab active:cursor-grabbing transition-all hover:shadow-md',
          isDragging && 'opacity-50'
        )}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground truncate">{group.groupName}</span>
            <Badge variant="secondary" className={cn('text-xs', readingLevelColorClass)}>
              {getStudentFriendlyIcon(group.readingLevelLabel)} {getStudentFriendlyName(group.readingLevelLabel)}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{group.numStudents} students</p>
        </div>
      </div>
    );
  }

  const folderColorClasses: Record<string, string> = {
    blue: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
    green: 'bg-green-500/20 text-green-700 dark:text-green-400',
    purple: 'bg-purple-500/20 text-purple-700 dark:text-purple-400',
    orange: 'bg-orange-500/20 text-orange-700 dark:text-orange-400',
    red: 'bg-red-500/20 text-red-700 dark:text-red-400',
    teal: 'bg-teal-500/20 text-teal-700 dark:text-teal-400',
  };

  return (
    <Card 
      draggable
      onDragStart={handleDragStart}
      className={cn(
        'group hover:shadow-lg transition-all cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-50 scale-95'
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-bold text-foreground">{group.groupName}</h3>
              <p className="text-sm text-muted-foreground">{group.numStudents} student{group.numStudents !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {/* Class/Folder Label */}
        {folderName && (
          <Badge variant="secondary" className={cn('mt-2 w-fit text-xs', folderColorClasses[folderColor] || folderColorClasses.blue)}>
            <FolderOpen className="h-3 w-3 mr-1" />
            {folderName}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Reading Level & ELL Status */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className={readingLevelColorClass}>
            <span className="mr-1">{getStudentFriendlyIcon(group.readingLevelLabel)}</span>
            {getStudentFriendlyName(group.readingLevelLabel)}
          </Badge>
          {group.ellStatus !== 'None' && (
            <Badge variant="secondary" className="bg-sky-500/20 text-sky-700 dark:text-sky-400">
              <Languages className="h-3 w-3 mr-1" />
              ELL: {group.ellStatus}
            </Badge>
          )}
          {group.iep504Status !== 'None' && (
            <Badge variant="secondary" className="bg-pink-500/20 text-pink-700 dark:text-pink-400">
              {group.iep504Status}
            </Badge>
          )}
        </div>

        {/* Accommodations */}
        {group.accommodations.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {group.accommodations.slice(0, 3).map((acc) => (
              <Badge key={acc} variant="outline" className="text-xs">
                {acc}
              </Badge>
            ))}
            {group.accommodations.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{group.accommodations.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Home Language */}
        {group.homeLanguage !== 'English' && (
          <p className="text-sm text-muted-foreground">
            Home Language: {group.homeLanguage}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
