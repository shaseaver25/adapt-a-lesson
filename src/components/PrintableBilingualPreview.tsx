import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Printer, Download, Eye, EyeOff } from 'lucide-react';
import { getStudentFriendlyName, getStudentFriendlyIcon } from '@/lib/readingLevelNames';
import type { BilingualRow } from '@/lib/bilingualContentAlignment';
import type { AudioQRHeader } from '@/lib/audioQRHeader';

interface PrintableBilingualPreviewProps {
  title: string;
  readingLevel: string;
  groupName: string;
  homeLanguage: string;
  rows: BilingualRow[];
  qrHeaders?: AudioQRHeader[];
  showQRCodes?: boolean;
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

export function PrintableBilingualPreview({
  title,
  readingLevel,
  groupName,
  homeLanguage,
  rows,
  qrHeaders = [],
  showQRCodes = true,
}: PrintableBilingualPreviewProps) {
  const [showPreview, setShowPreview] = useState(true);
  const levelName = getStudentFriendlyName(readingLevel);
  const levelIcon = getStudentFriendlyIcon(readingLevel);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Card className="overflow-hidden print:shadow-none print:border-none">
      {/* Preview Controls - Hidden in print */}
      <div className="flex items-center justify-between p-3 bg-muted/50 border-b print:hidden">
        <div className="flex items-center gap-2">
          <Badge variant="outline">Print Preview</Badge>
          <span className="text-sm text-muted-foreground">
            {groupName} • {levelIcon} {levelName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
            {showPreview ? 'Hide' : 'Show'}
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1" />
            Print
          </Button>
        </div>
      </div>

      {showPreview && (
        <div className="p-6 print:p-0 bg-white dark:bg-background">
          {/* Document Header */}
          <div className="text-center mb-6 print:mb-4">
            <h1 className="text-2xl font-bold print:text-xl">{title}</h1>
            <p className="text-lg text-amber-600 dark:text-amber-500 print:text-base">
              {levelIcon} {levelName} Edition {levelIcon}
            </p>
          </div>

          {/* QR Codes Section */}
          {showQRCodes && qrHeaders.length > 0 && (
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800 print:bg-transparent print:border-2 print:border-gray-300">
              <p className="text-center font-medium mb-4 print:text-sm">
                🎧 Scan a QR code to listen to instructions:
              </p>
              <div className="flex justify-center gap-8 flex-wrap">
                {qrHeaders.map((header, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2">
                    {header.audioLinks.homeLanguage && (
                      <div className="text-center">
                        {header.audioLinks.homeLanguage.qrDataUrl ? (
                          <img
                            src={header.audioLinks.homeLanguage.qrDataUrl}
                            alt={`QR code for ${homeLanguage}`}
                            className="w-16 h-16 print:w-20 print:h-20 mx-auto"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 flex items-center justify-center text-xs">QR</div>
                        )}
                        <p className="text-xs mt-1">
                          {getFlag(homeLanguage)} {header.audioLinks.homeLanguage.label}
                        </p>
                        <p className="text-xs text-muted-foreground print:text-gray-500">
                          {header.audioLinks.homeLanguage.shortUrl}
                        </p>
                      </div>
                    )}
                    {header.audioLinks.english && (
                      <div className="text-center">
                        {header.audioLinks.english.qrDataUrl ? (
                          <img
                            src={header.audioLinks.english.qrDataUrl}
                            alt="QR code for English"
                            className="w-16 h-16 print:w-20 print:h-20 mx-auto"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 flex items-center justify-center text-xs">QR</div>
                        )}
                        <p className="text-xs mt-1">
                          {getFlag('English')} {header.audioLinks.english.label}
                        </p>
                        <p className="text-xs text-muted-foreground print:text-gray-500">
                          {header.audioLinks.english.shortUrl}
                        </p>
                      </div>
                    )}
                    {header.audioLinks.readAloud && (
                      <div className="text-center bg-blue-50 dark:bg-blue-950/30 p-2 rounded print:bg-transparent">
                        {header.audioLinks.readAloud.qrDataUrl ? (
                          <img
                            src={header.audioLinks.readAloud.qrDataUrl}
                            alt="QR code for Read Aloud"
                            className="w-16 h-16 print:w-20 print:h-20 mx-auto"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-blue-200 flex items-center justify-center text-xs">QR</div>
                        )}
                        <p className="text-xs mt-1 font-medium text-blue-700 dark:text-blue-300 print:text-gray-700">
                          🔊 {header.audioLinks.readAloud.label}
                        </p>
                        <p className="text-xs text-muted-foreground print:text-gray-500">
                          {header.audioLinks.readAloud.shortUrl}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Divider */}
          <hr className="border-t-2 border-amber-500 mb-4 print:border-gray-400" />

          {/* Student Info Row */}
          <div className="flex gap-4 mb-6 print:mb-4 font-mono text-sm">
            <span>Name: <span className="border-b border-gray-400 inline-block w-48 print:w-40">&nbsp;</span></span>
            <span>Date: <span className="border-b border-gray-400 inline-block w-24 print:w-20">&nbsp;</span></span>
            <span>Period: <span className="border-b border-gray-400 inline-block w-12 print:w-10">&nbsp;</span></span>
          </div>

          {/* Side-by-Side Content Table */}
          <div className="border-2 border-gray-300 rounded-lg overflow-hidden print:rounded-none">
            {/* Column Headers */}
            <div className="grid grid-cols-[1fr_8px_1fr]">
              <div className="bg-amber-500 text-white font-bold text-center py-2 print:py-1">
                {getFlag(homeLanguage)} {homeLanguage.toUpperCase()}
              </div>
              <div className="bg-gray-200" />
              <div className="bg-blue-700 text-white font-bold text-center py-2 print:py-1">
                {getFlag('English')} ENGLISH
              </div>
            </div>

            {/* Content Rows */}
            {rows.map((row, idx) => (
              <BilingualContentRow key={row.id} row={row} homeLanguage={homeLanguage} isEven={idx % 2 === 0} />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

interface BilingualContentRowProps {
  row: BilingualRow;
  homeLanguage: string;
  isEven: boolean;
}

function BilingualContentRow({ row, homeLanguage, isEven }: BilingualContentRowProps) {
  const isAnswerSpace = row.type === 'answer-line' || row.type === 'answer-box';
  const isDrawingSpace = row.type === 'drawing-space';
  const isHeading = row.type === 'heading';
  const isQuestion = row.type === 'question';

  // Calculate min height based on aligned line count
  const minHeight = row.alignedLineCount * 24; // ~24px per line
  const drawingHeight = row.drawingHeight ? row.drawingHeight * 24 : 120;

  return (
    <div 
      className="grid grid-cols-[1fr_8px_1fr] border-t border-gray-200 print:border-gray-300"
      style={{ minHeight: isDrawingSpace ? drawingHeight : minHeight }}
    >
      {/* Home Language Column (LEFT) */}
      <div className={`p-3 print:p-2 border-l-4 border-l-amber-500 ${isEven ? 'bg-amber-50/50' : 'bg-amber-50/30'} dark:bg-amber-950/20 print:bg-transparent`}>
        {isAnswerSpace ? (
          <AnswerLines lines={row.alignedLineCount} />
        ) : isDrawingSpace ? (
          <DrawingSpace height={row.drawingHeight || 5} />
        ) : (
          <p className={`text-sm print:text-xs leading-relaxed ${isHeading ? 'font-bold text-base print:text-sm' : ''} ${isQuestion ? 'font-medium' : ''}`}>
            {row.homeLanguage.text}
          </p>
        )}
      </div>

      {/* Gutter (Center Divider) */}
      <div className="bg-gray-100 border-l border-r border-dashed border-gray-300 print:bg-gray-50" />

      {/* English Column (RIGHT) */}
      <div className={`p-3 print:p-2 border-r-4 border-r-blue-700 ${isEven ? 'bg-blue-50/50' : 'bg-blue-50/30'} dark:bg-blue-950/20 print:bg-transparent`}>
        {isAnswerSpace ? (
          <AnswerLines lines={row.alignedLineCount} />
        ) : isDrawingSpace ? (
          <DrawingSpace height={row.drawingHeight || 5} />
        ) : (
          <p className={`text-sm print:text-xs leading-relaxed ${isHeading ? 'font-bold text-base print:text-sm' : ''} ${isQuestion ? 'font-medium' : ''}`}>
            {row.english.text}
          </p>
        )}
      </div>
    </div>
  );
}

function AnswerLines({ lines }: { lines: number }) {
  return (
    <div className="space-y-3 pt-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="border-b border-gray-400 w-full" style={{ height: '20px' }} />
      ))}
    </div>
  );
}

function DrawingSpace({ height }: { height: number }) {
  return (
    <div 
      className="border-2 border-dashed border-gray-300 rounded bg-white dark:bg-gray-50 print:bg-white"
      style={{ minHeight: height * 24 }}
    >
      <div className="text-center text-gray-400 text-xs pt-2 print:text-gray-500">
        [DRAWING SPACE]
      </div>
    </div>
  );
}

export default PrintableBilingualPreview;
