import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Copy, Download, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface AudioScriptOutputProps {
  content: string;
  language?: string;
}

export function AudioScriptOutput({ content, language = 'English' }: AudioScriptOutputProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast({
      title: 'Copied!',
      description: 'Audio script copied to clipboard',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audio-script-${language.toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: 'Downloaded!',
      description: 'Audio script saved as text file',
    });
  };

  // Calculate estimated reading time (average 150 words per minute for clear speech)
  const wordCount = content.split(/\s+/).length;
  const estimatedMinutes = Math.ceil(wordCount / 150);

  return (
    <Card className="border-border shadow-medium">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{wordCount}</span> words
            <span className="mx-2">·</span>
            <span className="font-medium text-foreground">~{estimatedMinutes}</span> min read time
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="flex items-center gap-2"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-6 border border-border">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">
              {content}
            </p>
          </div>
        </div>

        <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Next step:</strong> Copy this script and paste it into a text-to-speech service like ElevenLabs, Google TTS, or Amazon Polly to generate the audio file.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
