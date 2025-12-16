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
import { Download, FileCode, FolderArchive, ChevronDown, Loader2, Languages } from 'lucide-react';
import { downloadGroupHTML, downloadAllAsZip } from '@/lib/export/htmlExporter';
import { useToast } from '@/hooks/use-toast';
import type { StudentGroup } from '@/types/studentGroup';

interface ExportForLMSButtonProps {
  groups: (StudentGroup & { id: string })[];
  lessonTitle: string;
  getGroupContent: (groupName: string) => string;
  getGroupEnglishContent?: (groupName: string) => string;
  imageMap?: Map<string, string>;
}

export function ExportForLMSButton({
  groups,
  lessonTitle,
  getGroupContent,
  getGroupEnglishContent,
  imageMap
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
      const englishContent = getGroupEnglishContent?.(group.groupName);
      const isBilingual = group.homeLanguage !== 'English' && englishContent;
      
      console.log('Export - Group:', group.groupName, 'Content length:', content?.length, 'English length:', englishContent?.length);
      
      if (!content || content.trim().length === 0) {
        toast({
          title: 'No content found',
          description: `Could not find content for ${group.groupName}. Check if the lesson was generated correctly.`,
          variant: 'destructive'
        });
        return;
      }
      
      downloadGroupHTML(lessonTitle, content, group, englishContent, imageMap);
      
      toast({
        title: 'Downloaded!',
        description: isBilingual 
          ? `${group.groupName} bilingual handout (${group.homeLanguage} + English) ready for LMS upload.`
          : `${group.groupName} handout ready for LMS upload.`
      });
    } catch (error: any) {
      console.error('Export error:', error);
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
        content: getGroupContent(group.groupName),
        englishContent: getGroupEnglishContent?.(group.groupName)
      }));
      await downloadAllAsZip(lessonTitle, groupContents, imageMap);
      
      const bilingualCount = groupContents.filter(g => g.group.homeLanguage !== 'English' && g.englishContent).length;
      
      toast({
        title: 'Downloaded!',
        description: bilingualCount > 0 
          ? `All ${groups.length} handouts exported (${bilingualCount} bilingual). Upload to Canvas, Schoology, or Google Classroom.`
          : `All ${groups.length} handouts exported. Upload to Canvas, Schoology, or Google Classroom.`
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

  // Check if any group is bilingual
  const hasBilingualGroups = groups.some(g => g.homeLanguage !== 'English');

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
        
        {hasBilingualGroups && (
          <div className="px-2 py-1.5 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/30 mx-2 rounded">
            <Languages className="h-3 w-3" />
            Bilingual groups show side-by-side layout
          </div>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Individual Handouts
        </DropdownMenuLabel>
        
        {groups.map(group => {
          const isBilingual = group.homeLanguage !== 'English';
          return (
            <DropdownMenuItem
              key={group.id}
              onClick={() => handleExportSingle(group)}
              className="gap-2 cursor-pointer"
            >
              <FileCode className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1 truncate">{group.groupName}</span>
              <div className="flex items-center gap-1">
                {isBilingual && (
                  <span className="text-xs px-1 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    2-col
                  </span>
                )}
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${levelStyles[group.readingLevelLabel] || 'bg-muted'}`}>
                  {group.readingLevelLabel}
                </span>
              </div>
            </DropdownMenuItem>
          );
        })}
        
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
