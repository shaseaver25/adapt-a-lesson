import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Copy, Download, Check, Users, ChevronDown, FileText, FolderArchive, Clipboard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { StudentGroup } from '@/types/studentGroup';

interface DifferentiatedLessonOutputProps {
  content: string;
  selectedGroups: (StudentGroup & { id: string })[];
  lessonTitle?: string;
}

export function DifferentiatedLessonOutput({ content, selectedGroups, lessonTitle = 'Lesson' }: DifferentiatedLessonOutputProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast({ title: 'Copied to clipboard', description: 'Full lesson plan copied as markdown' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lessonTitle.replace(/\s+/g, '-').toLowerCase()}-differentiated-all-groups.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Downloaded', description: 'Single markdown file with all groups' });
  };

  const handleDownloadSeparateFiles = async () => {
    // Parse content to find group sections
    const groupSections: { name: string; content: string }[] = [];
    const lines = content.split('\n');
    let currentGroup = '';
    let currentContent: string[] = [];
    let headerContent: string[] = [];
    let inHeader = true;
    
    for (const line of lines) {
      // Check for group headers (## Group: or ## 📚 Group:)
      const groupMatch = line.match(/^##\s*(?:📚\s*)?Group:\s*(.+)$/);
      if (groupMatch) {
        if (currentGroup) {
          groupSections.push({ name: currentGroup, content: [...headerContent, ...currentContent].join('\n') });
        }
        currentGroup = groupMatch[1].trim();
        currentContent = [line];
        inHeader = false;
      } else if (inHeader) {
        headerContent.push(line);
      } else if (currentGroup) {
        // Check if we hit the cross-group section
        if (line.match(/^##\s*(?:🎯\s*)?Cross-Group/)) {
          groupSections.push({ name: currentGroup, content: [...headerContent, ...currentContent].join('\n') });
          currentGroup = '';
          currentContent = [];
        } else {
          currentContent.push(line);
        }
      }
    }
    
    // Add last group if exists
    if (currentGroup) {
      groupSections.push({ name: currentGroup, content: [...headerContent, ...currentContent].join('\n') });
    }

    if (groupSections.length === 0) {
      // Fallback: download as single file
      handleDownloadMarkdown();
      return;
    }

    // Create zip-like download (multiple sequential downloads)
    for (const section of groupSections) {
      const blob = new Blob([section.content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${lessonTitle.replace(/\s+/g, '-').toLowerCase()}-${section.name.replace(/\s+/g, '-').toLowerCase()}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      await new Promise(resolve => setTimeout(resolve, 200)); // Small delay between downloads
    }
    
    toast({ 
      title: 'Downloaded', 
      description: `${groupSections.length} separate files created` 
    });
  };

  const handleCopyGroupSection = async (groupName: string) => {
    const lines = content.split('\n');
    let inGroup = false;
    let groupContent: string[] = [];
    
    for (const line of lines) {
      const groupMatch = line.match(/^##\s*(?:📚\s*)?Group:\s*(.+)$/);
      if (groupMatch) {
        if (inGroup) break; // End of current group
        if (groupMatch[1].trim() === groupName) {
          inGroup = true;
          groupContent.push(line);
        }
      } else if (inGroup) {
        if (line.match(/^##\s/)) break; // Next section
        groupContent.push(line);
      }
    }
    
    await navigator.clipboard.writeText(groupContent.join('\n'));
    toast({ title: 'Copied', description: `${groupName} section copied to clipboard` });
  };

  const readingLevelColor = (level: string) => ({
    'Below Grade': 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30',
    'On Grade': 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
    'Above Grade': 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30',
    'Advanced': 'bg-violet-500/20 text-violet-700 dark:text-violet-400 border-violet-500/30',
  }[level] || 'bg-muted text-muted-foreground border-border');

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="font-display text-xl">Differentiated Lesson Plan</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Generated for {selectedGroups.length} student group{selectedGroups.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyAll} className="gap-2">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy All'}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={handleDownloadMarkdown} className="gap-2">
                    <FileText className="h-4 w-4" />
                    <div>
                      <p className="font-medium">Single File</p>
                      <p className="text-xs text-muted-foreground">All groups in one markdown file</p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownloadSeparateFiles} className="gap-2">
                    <FolderArchive className="h-4 w-4" />
                    <div>
                      <p className="font-medium">Separate Files</p>
                      <p className="text-xs text-muted-foreground">One file per student group</p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {selectedGroups.map((group) => (
                    <DropdownMenuItem 
                      key={group.id} 
                      onClick={() => handleCopyGroupSection(group.groupName)}
                      className="gap-2"
                    >
                      <Clipboard className="h-4 w-4" />
                      <span className="truncate">Copy: {group.groupName}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Group summary badges */}
          <div className="flex flex-wrap gap-2">
            {selectedGroups.map((group) => (
              <Badge
                key={group.id}
                variant="outline"
                className={`${readingLevelColor(group.readingLevelLabel)}`}
              >
                <Users className="h-3 w-3 mr-1" />
                {group.groupName}
                <span className="ml-1 opacity-70">({group.numStudents})</span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <Card>
        <CardContent className="pt-6">
          <article className="prose prose-sm dark:prose-invert max-w-none 
            prose-headings:font-display prose-headings:font-bold 
            prose-h1:text-2xl prose-h1:border-b prose-h1:border-border prose-h1:pb-3 prose-h1:mb-6
            prose-h2:text-xl prose-h2:border-b prose-h2:border-border prose-h2:pb-2 prose-h2:mt-10 prose-h2:mb-4
            prose-h2:bg-gradient-to-r prose-h2:from-muted/50 prose-h2:to-transparent prose-h2:px-3 prose-h2:py-2 prose-h2:rounded-lg
            prose-h3:text-lg prose-h3:text-primary prose-h3:mt-6
            prose-p:leading-relaxed
            prose-ul:my-2 prose-li:my-0.5
            prose-table:border prose-table:border-border prose-table:rounded-lg prose-table:overflow-hidden
            prose-th:bg-muted prose-th:p-3 prose-th:text-left prose-th:font-semibold
            prose-td:p-3 prose-td:border prose-td:border-border
            prose-strong:text-primary prose-strong:font-semibold
            prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
            prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
          ">
            <ReactMarkdown>{content}</ReactMarkdown>
          </article>
        </CardContent>
      </Card>
    </div>
  );
}
