import React, { useEffect, useState } from 'react';
import { generateQRCode, getSectionLabel } from '@/lib/audioQRCode';
import { Volume2 } from 'lucide-react';

interface PrintableAudioQRProps {
  sectionType: string;
  audioUrl: string;
  language?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 60,
  md: 80,
  lg: 100,
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
      <div className="flex items-center gap-3 p-3 border border-dashed border-amber-300 rounded-lg bg-amber-50/50 print:bg-white">
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
          <div className="flex items-center gap-1.5 font-medium text-amber-800">
            <Volume2 className="w-4 h-4" />
            <span>Listen to this section</span>
          </div>
          <div className="text-amber-700 text-xs">
            {getSectionLabel(sectionType)}
            {language !== 'English' && (
              <span className="ml-1 text-amber-600">({language})</span>
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
      <span className="text-xs text-amber-700 print:text-black">
        🔊 Scan to listen
      </span>
    </span>
  );
};

export default PrintableAudioQR;
