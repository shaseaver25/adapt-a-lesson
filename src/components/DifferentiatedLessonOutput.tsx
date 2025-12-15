import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Copy, Download, Check, ChevronDown, ChevronUp, Users, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { StudentGroup } from '@/types/studentGroup';

interface DifferentiatedLessonOutputProps {
  content: string;
  selectedGroups: (StudentGroup & { id: string })[];
  lessonTitle?: string;
}

export function DifferentiatedLessonOutput({ content, selectedGroups, lessonTitle = 'Lesson' }: DifferentiatedLessonOutputProps) {
  const [copied, setCopied] = useState(false);
  const [isOriginalExpanded, setIsOriginalExpanded] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast({ title: 'Copied to clipboard' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lessonTitle.replace(/\s+/g, '-').toLowerCase()}-differentiated.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Downloaded successfully' });
  };

  const readingLevelColor = (level: string) => ({
    'Below Grade': 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30',
    'On Grade': 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30',
    'Above Grade': 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30',
    'Advanced': 'bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30',
  }[level] || 'bg-muted text-muted-foreground border-border');

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="font-display text-xl">Differentiated Lesson Plan</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Generated for {selectedGroups.length} student group{selectedGroups.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
                <Download className="h-4 w-4" />
                Download
              </Button>
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
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <Card>
        <CardContent className="pt-6">
          <article className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-display prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h2:border-b prose-h2:border-border prose-h2:pb-2 prose-h2:mt-8 prose-h3:text-lg prose-table:border prose-table:border-border prose-th:bg-muted prose-th:p-2 prose-td:p-2 prose-td:border prose-td:border-border">
            <ReactMarkdown>{content}</ReactMarkdown>
          </article>
        </CardContent>
      </Card>
    </div>
  );
}
