import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Download, FileCode, FolderArchive, ChevronDown, Loader2 } from 'lucide-react';
import { downloadGroupHTML, downloadAllAsZip } from '@/lib/export/htmlExporter';
import { useToast } from '@/hooks/use-toast';
import type { StudentGroup } from '@/types/studentGroup';

interface ExportForLMSButtonProps {
  groups: (StudentGroup & { id: string })[];
  lessonTitle: string;
  getGroupContent: (groupName: string) => string;
}

export function ExportForLMSButton({
  groups,
  lessonTitle,
  getGroupContent
}: ExportForLMSButtonProps) {
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  // Level indicator colors
  const levelStyles: Record<string, string> = {
    'Below Grade': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'On Grade': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'Above Grade': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'Advanced': 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
  };

  const handleExportSingle = (group: StudentGroup & { id: string }) => {
    try {
      const content = getGroupContent(group.groupName);
      downloadGroupHTML(lessonTitle, content, group);
      
      toast({
        title: 'Downloaded!',
        description: `${group.groupName} handout ready for LMS upload.`
      });
    } catch (error: any) {
      toast({
        title: 'Export failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleExportAll = async () => {
    setExporting(true);
    try {
      const groupContents = groups.map(group => ({
        group,
        content: getGroupContent(group.groupName)
      }));
      await downloadAllAsZip(lessonTitle, groupContents);
      
      toast({
        title: 'Downloaded!',
        description: `All ${groups.length} handouts exported. Upload to Canvas, Schoology, or Google Classroom.`
      });
    } catch (error: any) {
      toast({
        title: 'Export failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" disabled={exporting || groups.length === 0}>
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Export for LMS
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-72 bg-popover border shadow-lg z-50">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Download HTML files to upload to Canvas, Schoology, or Google Classroom
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Individual Handouts
        </DropdownMenuLabel>
        
        {groups.map(group => (
          <DropdownMenuItem
            key={group.id}
            onClick={() => handleExportSingle(group)}
            className="gap-2 cursor-pointer"
          >
            <FileCode className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1 truncate">{group.groupName}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${levelStyles[group.readingLevelLabel] || 'bg-muted'}`}>
              {group.readingLevelLabel}
            </span>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handleExportAll} 
          className="gap-2 cursor-pointer"
          disabled={exporting}
        >
          <FolderArchive className="h-4 w-4 flex-shrink-0" />
          <span className="flex-1">Download All as ZIP</span>
          <span className="text-xs text-muted-foreground">{groups.length} files</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
