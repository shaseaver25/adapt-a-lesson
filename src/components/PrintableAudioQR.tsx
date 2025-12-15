import React, { useEffect, useState } from 'react';
import { generateQRCode, getSectionLabel } from '@/lib/audioQRCode';
import { Volume2 } from 'lucide-react';

interface PrintableAudioQRProps {
  sectionType: string;
  audioUrl: string;
  language?: string;
  size?: 'sm' | 'md' | 'lg';
}

interface BilingualPrintableAudioQRProps {
  sectionType: string;
  englishAudioUrl?: string;
  homeLanguageAudioUrl?: string;
  homeLanguage?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 60,
  md: 80,
  lg: 100,
};

const getLanguageFlag = (language: string): string => {
  const flags: Record<string, string> = {
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
  };
  return flags[language] || '🌐';
};

export const PrintableAudioQR: React.FC<PrintableAudioQRProps> = ({
  sectionType,
  audioUrl,
  language = 'English',
  size = 'md',
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateQR = async () => {
      try {
        const qrUrl = await generateQRCode(audioUrl, sizeMap[size]);
        setQrCodeUrl(qrUrl);
      } catch (error) {
        console.error('Failed to generate QR code:', error);
      } finally {
        setLoading(false);
      }
    };
    generateQR();
  }, [audioUrl, size]);

  if (loading) {
    return (
      <div className="printable-audio-qr animate-pulse">
        <div className="w-20 h-20 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="printable-audio-qr print:break-inside-avoid">
      <div className="flex items-center gap-3 p-3 border border-dashed border-amber-300 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 print:bg-white print:border-gray-400">
        <div className="flex-shrink-0">
          {qrCodeUrl ? (
            <img 
              src={qrCodeUrl} 
              alt={`QR code for ${getSectionLabel(sectionType)} audio`}
              className="rounded"
              style={{ width: sizeMap[size], height: sizeMap[size] }}
            />
          ) : (
            <div 
              className="bg-muted rounded flex items-center justify-center"
              style={{ width: sizeMap[size], height: sizeMap[size] }}
            >
              <Volume2 className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1 text-sm">
          <div className="flex items-center gap-1.5 font-medium text-amber-800 dark:text-amber-400 print:text-black">
            <Volume2 className="w-4 h-4" />
            <span>Listen to this section</span>
          </div>
          <div className="text-amber-700 dark:text-amber-500 text-xs print:text-gray-600">
            {getSectionLabel(sectionType)}
            {language !== 'English' && (
              <span className="ml-1">
                {getLanguageFlag(language)} ({language})
              </span>
            )}
          </div>
          <div className="text-muted-foreground text-xs truncate max-w-[200px] print:max-w-none">
            Scan QR or visit link
          </div>
        </div>
      </div>
    </div>
  );
};

// Bilingual version with two QR codes side by side
export const BilingualPrintableAudioQR: React.FC<BilingualPrintableAudioQRProps> = ({
  sectionType,
  englishAudioUrl,
  homeLanguageAudioUrl,
  homeLanguage,
  size = 'sm',
}) => {
  const [englishQR, setEnglishQR] = useState<string>('');
  const [homeLanguageQR, setHomeLanguageQR] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateQRs = async () => {
      try {
        const promises: Promise<void>[] = [];
        
        if (englishAudioUrl) {
          promises.push(
            generateQRCode(englishAudioUrl, sizeMap[size]).then(setEnglishQR)
          );
        }
        
        if (homeLanguageAudioUrl) {
          promises.push(
            generateQRCode(homeLanguageAudioUrl, sizeMap[size]).then(setHomeLanguageQR)
          );
        }
        
        await Promise.all(promises);
      } catch (error) {
        console.error('Failed to generate QR codes:', error);
      } finally {
        setLoading(false);
      }
    };
    generateQRs();
  }, [englishAudioUrl, homeLanguageAudioUrl, size]);

  if (loading) {
    return (
      <div className="animate-pulse flex gap-4">
        <div className="w-20 h-20 bg-muted rounded" />
        {homeLanguageAudioUrl && <div className="w-20 h-20 bg-muted rounded" />}
      </div>
    );
  }

  const hasHomeLanguage = homeLanguageAudioUrl && homeLanguage && homeLanguage !== 'English';

  return (
    <div className="bilingual-audio-qr print:break-inside-avoid my-3">
      <div className="border border-dashed border-amber-300 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 print:bg-white print:border-gray-400 p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3 text-amber-800 dark:text-amber-400 print:text-black font-medium">
          <Volume2 className="w-5 h-5" />
          <span>🔊 LISTEN TO THIS SECTION</span>
        </div>
        
        <div className="text-xs text-muted-foreground mb-3 print:text-gray-600">
          {getSectionLabel(sectionType)}
        </div>

        {/* QR Codes Row */}
        <div className={`grid gap-6 ${hasHomeLanguage ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {/* English QR */}
          {englishQR && (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <span>{getLanguageFlag('English')}</span>
                <span>English</span>
              </div>
              <img 
                src={englishQR} 
                alt="English audio QR code"
                className="rounded border border-gray-200"
                style={{ width: sizeMap[size], height: sizeMap[size] }}
              />
              {englishAudioUrl && (
                <a 
                  href={englishAudioUrl}
                  className="text-xs text-primary hover:underline truncate max-w-[120px] print:text-gray-700"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Tap to listen
                </a>
              )}
            </div>
          )}

          {/* Home Language QR */}
          {hasHomeLanguage && homeLanguageQR && (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <span>{getLanguageFlag(homeLanguage)}</span>
                <span>{homeLanguage}</span>
              </div>
              <img 
                src={homeLanguageQR} 
                alt={`${homeLanguage} audio QR code`}
                className="rounded border border-gray-200"
                style={{ width: sizeMap[size], height: sizeMap[size] }}
              />
              {homeLanguageAudioUrl && (
                <a 
                  href={homeLanguageAudioUrl}
                  className="text-xs text-primary hover:underline truncate max-w-[120px] print:text-gray-700"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Tap to listen
                </a>
              )}
            </div>
          )}
        </div>

        {/* Hint */}
        {hasHomeLanguage && (
          <div className="mt-3 text-xs text-center text-muted-foreground print:text-gray-500">
            🎧 Listen in both languages to learn vocabulary!
          </div>
        )}
      </div>
    </div>
  );
};

// Inline version for embedding within content
export const InlineAudioQR: React.FC<PrintableAudioQRProps> = ({
  sectionType,
  audioUrl,
  language,
  size = 'sm',
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    generateQRCode(audioUrl, sizeMap[size]).then(setQrCodeUrl).catch(console.error);
  }, [audioUrl, size]);

  if (!qrCodeUrl) return null;

  return (
    <span className="inline-flex items-center gap-2 align-middle mx-1">
      <img 
        src={qrCodeUrl} 
        alt="Audio QR"
        className="inline-block rounded"
        style={{ width: sizeMap[size], height: sizeMap[size] }}
      />
      <span className="text-xs text-amber-700 dark:text-amber-500 print:text-black">
        🔊 Scan to listen {language && language !== 'English' && `(${language})`}
      </span>
    </span>
  );
};

// Compact bilingual row for vocabulary cards
export const VocabularyAudioQR: React.FC<{
  term: string;
  englishAudioUrl?: string;
  homeLanguageAudioUrl?: string;
  homeLanguage?: string;
}> = ({ term, englishAudioUrl, homeLanguageAudioUrl, homeLanguage }) => {
  const [englishQR, setEnglishQR] = useState<string>('');
  const [homeLanguageQR, setHomeLanguageQR] = useState<string>('');

  useEffect(() => {
    if (englishAudioUrl) {
      generateQRCode(englishAudioUrl, 50).then(setEnglishQR).catch(console.error);
    }
    if (homeLanguageAudioUrl) {
      generateQRCode(homeLanguageAudioUrl, 50).then(setHomeLanguageQR).catch(console.error);
    }
  }, [englishAudioUrl, homeLanguageAudioUrl]);

  const hasHomeLanguage = homeLanguageAudioUrl && homeLanguage && homeLanguage !== 'English';

  return (
    <div className="vocab-audio-qr flex items-center gap-3 py-2 print:break-inside-avoid">
      <span className="font-medium text-sm min-w-[80px]">{term}</span>
      <div className="flex gap-2">
        {englishQR && (
          <div className="flex flex-col items-center">
            <img src={englishQR} alt="EN" className="w-[50px] h-[50px] rounded" />
            <span className="text-[10px] text-muted-foreground">EN</span>
          </div>
        )}
        {hasHomeLanguage && homeLanguageQR && (
          <div className="flex flex-col items-center">
            <img src={homeLanguageQR} alt={homeLanguage} className="w-[50px] h-[50px] rounded" />
            <span className="text-[10px] text-muted-foreground">{homeLanguage?.slice(0, 2).toUpperCase()}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrintableAudioQR;
