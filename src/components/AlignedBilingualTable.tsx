import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { BilingualRow, AlignedBilingualContent } from '@/lib/bilingualContentAlignment';

interface AlignedBilingualTableProps {
  content: AlignedBilingualContent;
  homeLanguage: string;
  showLineNumbers?: boolean;
}

const LANGUAGE_FLAGS: Record<string, string> = {
  'English': '🇺🇸',
  'Spanish': '🇪🇸',
  'Somali': '🇸🇴',
  'Hmong': '🇱🇦',
  'Vietnamese': '🇻🇳',
  'Arabic': '🇸🇦',
  'Karen': '🇲🇲',
  'Oromo': '🇪🇹',
  'Mandarin': '🇨🇳',
  'Chinese': '🇨🇳',
  'Russian': '🇷🇺',
  'Swahili': '🇹🇿',
  'French': '🇫🇷',
  'Portuguese': '🇧🇷',
  'Tagalog': '🇵🇭',
  'Korean': '🇰🇷',
  'Haitian Creole': '🇭🇹',
};

const getFlag = (language: string): string => LANGUAGE_FLAGS[language] || '🌐';

function getRowTypeStyles(type: BilingualRow['type']): string {
  switch (type) {
    case 'heading':
      return 'font-bold text-base bg-muted/50';
    case 'instruction':
      return 'text-primary font-medium';
    case 'question':
      return 'font-medium';
    case 'answer-line':
      return 'border-b-2 border-dashed border-muted-foreground/40 min-h-[2rem]';
    case 'answer-box':
      return 'border border-muted-foreground/30 rounded min-h-[4rem] bg-muted/10';
    case 'vocabulary':
      return 'italic';
    default:
      return '';
  }
}

function RowContent({ row, isHomeLanguage }: { row: BilingualRow; isHomeLanguage: boolean }) {
  const content = isHomeLanguage ? row.homeLanguage : row.english;
  const baseStyles = getRowTypeStyles(row.type);
  
  // Answer lines/boxes show empty content with proper styling
  if (row.type === 'answer-line' || row.type === 'answer-box') {
    return (
      <div 
        className={`${baseStyles}`}
        style={{ minHeight: `${row.alignedLineCount * 1.5}rem` }}
      />
    );
  }
  
  return (
    <div 
      className={`${baseStyles} leading-relaxed`}
      style={{ minHeight: `${row.alignedLineCount * 1.5}rem` }}
    >
      {content.text}
    </div>
  );
}

export function AlignedBilingualTable({ 
  content, 
  homeLanguage,
  showLineNumbers = false 
}: AlignedBilingualTableProps) {
  if (!content.rows || content.rows.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No content to display
      </div>
    );
  }
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="py-3 px-4 bg-muted/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getFlag(homeLanguage)}</span>
              <span className="font-medium text-sm">{homeLanguage}</span>
            </div>
            <div className="w-px h-5 bg-border" />
            <div className="flex items-center gap-2">
              <span className="text-lg">{getFlag('English')}</span>
              <span className="font-medium text-sm">English</span>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {content.totalLines} lines
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-2 divide-x">
          {/* Home Language Column */}
          <div className="bg-muted/20">
            <div className="divide-y divide-border/50">
              {content.rows.map((row, index) => (
                <div key={`home-${row.id}`} className="p-3">
                  {showLineNumbers && (
                    <span className="text-xs text-muted-foreground mr-2">
                      {index + 1}.
                    </span>
                  )}
                  <RowContent row={row} isHomeLanguage={true} />
                </div>
              ))}
            </div>
          </div>
          
          {/* English Column */}
          <div className="bg-background">
            <div className="divide-y divide-border/50">
              {content.rows.map((row, index) => (
                <div key={`eng-${row.id}`} className="p-3">
                  {showLineNumbers && (
                    <span className="text-xs text-muted-foreground mr-2">
                      {index + 1}.
                    </span>
                  )}
                  <RowContent row={row} isHomeLanguage={false} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact version for preview/export
 */
export function AlignedBilingualTableCompact({ 
  content, 
  homeLanguage 
}: Omit<AlignedBilingualTableProps, 'showLineNumbers'>) {
  return (
    <div className="border rounded-lg overflow-hidden text-sm">
      {/* Header */}
      <div className="grid grid-cols-2 divide-x bg-muted/50 border-b">
        <div className="p-2 font-medium flex items-center gap-2">
          <span>{getFlag(homeLanguage)}</span>
          <span>{homeLanguage}</span>
        </div>
        <div className="p-2 font-medium flex items-center gap-2">
          <span>{getFlag('English')}</span>
          <span>English</span>
        </div>
      </div>
      
      {/* Content */}
      <div className="grid grid-cols-2 divide-x">
        <div className="divide-y divide-border/30">
          {content.rows.map((row) => (
            <div 
              key={`compact-home-${row.id}`} 
              className={`p-2 ${getRowTypeStyles(row.type)}`}
              style={{ minHeight: `${row.alignedLineCount * 1.25}rem` }}
            >
              {row.homeLanguage.text}
            </div>
          ))}
        </div>
        <div className="divide-y divide-border/30">
          {content.rows.map((row) => (
            <div 
              key={`compact-eng-${row.id}`} 
              className={`p-2 ${getRowTypeStyles(row.type)}`}
              style={{ minHeight: `${row.alignedLineCount * 1.25}rem` }}
            >
              {row.english.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
