import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Pencil, Trash2, Languages } from 'lucide-react';
import { getStudentFriendlyName, getStudentFriendlyIcon, getReadingLevelColor } from '@/lib/readingLevelNames';
import type { StudentGroup } from '@/types/studentGroup';

interface StudentGroupCardProps {
  group: StudentGroup & { id: string };
  onEdit: () => void;
  onDelete: () => void;
}

export function StudentGroupCard({ group, onEdit, onDelete }: StudentGroupCardProps) {
  const readingLevelColorClass = getReadingLevelColor(group.readingLevelLabel);

  return (
    <Card className="group hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
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
