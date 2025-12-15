import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  FileDown, 
  ExternalLink, 
  Volume2, 
  Languages,
  QrCode,
  Loader2
} from 'lucide-react';
import type { StudentGroup } from '@/types/studentGroup';

export interface ExportOptions {
  format: 'docx' | 'pdf' | 'google-docs';
  sections: ('independent-practice' | 'exit-ticket' | 'learning-target' | 'vocabulary' | 'content' | 'all')[];
  bilingualLayout: boolean;
  includeAudioQRCodes: boolean;
  includeReadAloudQR: boolean;
}

interface BilingualExportOptionsProps {
  group: StudentGroup & { id: string };
  onExport: (options: ExportOptions) => Promise<void>;
  isExporting?: boolean;
  availableSections?: string[];
}

const LANGUAGE_FLAGS: Record<string, string> = {
  'English': '🇺🇸',
  'Spanish': '🇲🇽',
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
};

const getFlag = (language: string): string => LANGUAGE_FLAGS[language] || '🌐';

export function BilingualExportOptions({
  group,
  onExport,
  isExporting = false,
  availableSections = ['independent-practice', 'exit-ticket'],
}: BilingualExportOptionsProps) {
  const isBilingual = group.homeLanguage !== 'English';
  const hasReadAloud = group.accommodations?.includes('Read Aloud') || false;

  const [selectedSections, setSelectedSections] = useState<Set<string>>(
    new Set(availableSections)
  );
  const [includeQRCodes, setIncludeQRCodes] = useState(true);
  const [includeReadAloud, setIncludeReadAloud] = useState(hasReadAloud);

  const toggleSection = (section: string) => {
    const newSections = new Set(selectedSections);
    if (newSections.has(section)) {
      newSections.delete(section);
    } else {
      newSections.add(section);
    }
    setSelectedSections(newSections);
  };

  const handleExport = async (format: ExportOptions['format']) => {
    const sections = selectedSections.size === availableSections.length 
      ? ['all' as const]
      : Array.from(selectedSections) as ExportOptions['sections'];

    await onExport({
      format,
      sections,
      bilingualLayout: isBilingual,
      includeAudioQRCodes: includeQRCodes,
      includeReadAloudQR: includeReadAloud && hasReadAloud,
    });
  };

  const sectionLabels: Record<string, string> = {
    'independent-practice': '✏️ Independent Practice',
    'exit-ticket': '🎫 Exit Ticket',
    'learning-target': '🎯 Learning Target',
    'vocabulary': '📚 Vocabulary',
    'content': '📖 Content',
  };

  return (
    <Card className="border-accent/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileDown className="h-4 w-4" />
          Export Student Materials
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Bilingual Layout Info */}
        {isBilingual && (
          <div className="bg-gradient-to-r from-amber-50 to-blue-50 dark:from-amber-950/30 dark:to-blue-950/30 rounded-lg p-4 border border-amber-200/50 dark:border-amber-800/50">
            <div className="flex items-center gap-2 mb-2">
              <Languages className="h-4 w-4 text-amber-600" />
              <Badge variant="outline" className="bg-background">
                Side-by-Side Bilingual Layout
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium">
              <span>{getFlag(group.homeLanguage)} {group.homeLanguage}</span>
              <span className="text-muted-foreground">|</span>
              <span>{getFlag('English')} English</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Materials will be printed in landscape orientation with {group.homeLanguage} on the left and English on the right.
            </p>
          </div>
        )}

        {/* Section Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Include Sections</Label>
          <div className="space-y-2">
            {availableSections.map((section) => (
              <div key={section} className="flex items-center gap-2">
                <Checkbox
                  id={`section-${section}`}
                  checked={selectedSections.has(section)}
                  onCheckedChange={() => toggleSection(section)}
                />
                <Label
                  htmlFor={`section-${section}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {sectionLabels[section] || section}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Audio QR Options */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Audio Access</Label>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="include-qr"
                checked={includeQRCodes}
                onCheckedChange={(checked) => setIncludeQRCodes(checked === true)}
              />
              <Label htmlFor="include-qr" className="text-sm font-normal cursor-pointer flex items-center gap-1">
                <QrCode className="h-3 w-3" />
                Include audio QR codes at top of page
              </Label>
            </div>

            {hasReadAloud && (
              <div className="flex items-center gap-2 ml-6">
                <Checkbox
                  id="include-read-aloud"
                  checked={includeReadAloud}
                  onCheckedChange={(checked) => setIncludeReadAloud(checked === true)}
                  disabled={!includeQRCodes}
                />
                <Label 
                  htmlFor="include-read-aloud" 
                  className={`text-sm font-normal cursor-pointer flex items-center gap-1 ${!includeQRCodes ? 'text-muted-foreground' : ''}`}
                >
                  🔊 Include Read Aloud QR (slower pace)
                </Label>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Export Buttons */}
        <div className="space-y-2">
          <Button
            className="w-full justify-start gap-2"
            onClick={() => handleExport('docx')}
            disabled={isExporting || selectedSections.size === 0}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            Download Word Document (.docx)
            {isBilingual && (
              <Badge variant="secondary" className="ml-auto text-xs">
                Landscape
              </Badge>
            )}
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => handleExport('pdf')}
            disabled={isExporting || selectedSections.size === 0}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            Download PDF
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => handleExport('google-docs')}
            disabled={isExporting || selectedSections.size === 0}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4" />
            )}
            Open in Google Docs
            <Badge variant="outline" className="ml-auto text-xs">
              Coming Soon
            </Badge>
          </Button>
        </div>

        {selectedSections.size === 0 && (
          <p className="text-xs text-destructive text-center">
            Please select at least one section to export
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default BilingualExportOptions;
