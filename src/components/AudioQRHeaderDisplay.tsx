import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Volume2 } from 'lucide-react';
import type { AudioQRHeader } from '@/lib/audioQRHeader';

interface AudioQRHeaderDisplayProps {
  header: AudioQRHeader;
  compact?: boolean;
}

export function AudioQRHeaderDisplay({ header, compact = false }: AudioQRHeaderDisplayProps) {
  const hasAudio = Object.keys(header.audioLinks).length > 0;
  
  if (!hasAudio) return null;
  
  return (
    <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
      <CardContent className={compact ? 'p-3' : 'p-4'}>
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <Volume2 className="h-5 w-5 text-amber-600" />
          <span className="font-semibold text-amber-800 dark:text-amber-200">
            🔊 Audio Support
          </span>
          <Badge variant="outline" className="text-xs ml-auto">
            {header.sectionTitle}
          </Badge>
        </div>
        
        <p className="text-xs text-amber-700 dark:text-amber-300 mb-3">
          Scan QR codes to listen to this section
        </p>
        
        {/* QR Codes Grid */}
        <div className={`grid gap-3 ${compact ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {/* Home Language QR */}
          {header.audioLinks.homeLanguage && (
            <div className="flex flex-col items-center gap-2 p-2 bg-white dark:bg-background rounded-lg border">
              <img 
                src={header.audioLinks.homeLanguage.qrDataUrl} 
                alt={`QR code for ${header.audioLinks.homeLanguage.language}`}
                className="w-16 h-16"
              />
              <span className="text-xs font-medium text-center">
                {header.audioLinks.homeLanguage.label}
              </span>
            </div>
          )}
          
          {/* English QR */}
          {header.audioLinks.english && (
            <div className="flex flex-col items-center gap-2 p-2 bg-white dark:bg-background rounded-lg border">
              <img 
                src={header.audioLinks.english.qrDataUrl} 
                alt="QR code for English"
                className="w-16 h-16"
              />
              <span className="text-xs font-medium text-center">
                {header.audioLinks.english.label}
              </span>
            </div>
          )}
          
          {/* Read Aloud QR */}
          {header.audioLinks.readAloud && (
            <div className="flex flex-col items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200">
              <img 
                src={header.audioLinks.readAloud.qrDataUrl} 
                alt="QR code for Read Aloud"
                className="w-16 h-16"
              />
              <span className="text-xs font-medium text-center text-blue-700 dark:text-blue-300">
                {header.audioLinks.readAloud.label}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Multiple headers display component for all sections
 */
interface MultipleAudioQRHeadersProps {
  headers: AudioQRHeader[];
  title?: string;
}

export function MultipleAudioQRHeaders({ headers, title }: MultipleAudioQRHeadersProps) {
  const validHeaders = headers.filter(h => Object.keys(h.audioLinks).length > 0);
  
  if (validHeaders.length === 0) return null;
  
  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
      {/* Main Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-amber-200 dark:border-amber-700">
        <Volume2 className="h-6 w-6 text-amber-600" />
        <h3 className="font-bold text-amber-800 dark:text-amber-200">
          🔊 {title || 'Audio Support for All Sections'}
        </h3>
      </div>
      
      <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
        Scan QR codes to hear each section. Each section has audio available in multiple languages.
      </p>
      
      {/* All Section QR Codes */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {validHeaders.map((header, index) => (
          <div key={index} className="bg-white dark:bg-background rounded-lg border p-3">
            <h4 className="font-semibold text-sm mb-2 text-center border-b pb-2">
              {header.sectionTitle}
            </h4>
            <div className="flex justify-center gap-2 flex-wrap">
              {header.audioLinks.homeLanguage && (
                <div className="flex flex-col items-center gap-1">
                  <img 
                    src={header.audioLinks.homeLanguage.qrDataUrl} 
                    alt={`${header.sectionTitle} - ${header.audioLinks.homeLanguage.language}`}
                    className="w-12 h-12"
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {header.audioLinks.homeLanguage.language}
                  </span>
                </div>
              )}
              {header.audioLinks.english && (
                <div className="flex flex-col items-center gap-1">
                  <img 
                    src={header.audioLinks.english.qrDataUrl} 
                    alt={`${header.sectionTitle} - English`}
                    className="w-12 h-12"
                  />
                  <span className="text-[10px] text-muted-foreground">
                    English
                  </span>
                </div>
              )}
              {header.audioLinks.readAloud && (
                <div className="flex flex-col items-center gap-1">
                  <img 
                    src={header.audioLinks.readAloud.qrDataUrl} 
                    alt={`${header.sectionTitle} - Read Aloud`}
                    className="w-12 h-12"
                  />
                  <span className="text-[10px] text-blue-600">
                    Slow
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
