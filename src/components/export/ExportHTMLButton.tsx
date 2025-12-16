import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileCode, FolderArchive, ChevronDown, Loader2 } from 'lucide-react';
import { generateStudentHTML, downloadHTML, downloadAllAsZip, type StudentGroup, type LessonMetadata } from '@/lib/export/htmlExporter';
import { useToast } from '@/hooks/use-toast';

interface ExportHTMLButtonProps {
  groups: StudentGroup[];
  lessonTitle: string;
  subject: string;
  grade: string;
  duration: string;
  learningObjective: string;
}

export function ExportHTMLButton({
  groups,
  lessonTitle,
  subject,
  grade,
  duration,
  learningObjective
}: ExportHTMLButtonProps) {
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();
  
  const metadata: LessonMetadata = {
    title: lessonTitle,
    subject,
    grade,
    duration,
    learningObjective,
    generatedDate: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  };

  const handleExportSingle = (group: StudentGroup) => {
    try {
      const html = generateStudentHTML(group, metadata);
      const filename = `${lessonTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${group.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
      downloadHTML(html, filename);
      
      toast({
        title: 'Downloaded!',
        description: `${group.name} handout exported as HTML.`
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  };

  const handleExportAll = async () => {
    setExporting(true);
    try {
      await downloadAllAsZip(groups, metadata);
      
      toast({
        title: 'Downloaded!',
        description: `All ${groups.length} handouts exported as ZIP.`
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setExporting(false);
    }
  };

  const levelColors: Record<string, string> = {
    embers: 'bg-red-100 text-red-700',
    sparks: 'bg-orange-100 text-orange-700',
    flames: 'bg-amber-100 text-amber-700',
    blazers: 'bg-emerald-100 text-emerald-700',
    supernovas: 'bg-violet-100 text-violet-700'
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={exporting || groups.length === 0}>
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Export for LMS
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 bg-background z-50">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Individual Handouts
        </DropdownMenuLabel>
        
        {groups.map(group => (
          <DropdownMenuItem
            key={group.id}
            onClick={() => handleExportSingle(group)}
            className="gap-2 cursor-pointer"
          >
            <FileCode className="h-4 w-4" />
            <span className="flex-1">{group.name}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${levelColors[group.level] || ''}`}>
              {group.level}
            </span>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleExportAll} className="gap-2 cursor-pointer">
          <FolderArchive className="h-4 w-4" />
          <span className="flex-1">Download All as ZIP</span>
          <span className="text-xs text-muted-foreground">{groups.length} files</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
