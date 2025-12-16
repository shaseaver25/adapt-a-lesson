import QRCode from 'qrcode';
import {
  Paragraph,
  TextRun,
  ImageRun,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
} from 'docx';

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
  'Chinese Simplified': '🇨🇳',
  'Russian': '🇷🇺',
  'Swahili': '🇹🇿',
  'French': '🇫🇷',
  'Portuguese': '🇧🇷',
};

/**
 * Generate QR code as data URL
 */
export async function generateQRCodeDataUrl(url: string, size: number = 100): Promise<string> {
  return await QRCode.toDataURL(url, {
    width: size,
    margin: 1,
    color: { dark: '#000000', light: '#FFFFFF' },
    errorCorrectionLevel: 'M',
  });
}

/**
 * Convert data URL to ArrayBuffer for DOCX ImageRun
 */
function dataUrlToArrayBuffer(dataUrl: string): ArrayBuffer {
  const base64 = dataUrl.split(',')[1];
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Generate QR code as ArrayBuffer for DOCX
 */
export async function generateQRCodeBuffer(url: string, size: number = 100): Promise<ArrayBuffer> {
  const dataUrl = await generateQRCodeDataUrl(url, size);
  return dataUrlToArrayBuffer(dataUrl);
}

/**
 * Create a single QR code paragraph with label
 */
export async function createQRCodeParagraph(
  audioUrl: string,
  label: string = '🎧 Scan to listen'
): Promise<Paragraph> {
  const qrBuffer = await generateQRCodeBuffer(audioUrl, 80);

  return new Paragraph({
    children: [
      new TextRun({ text: label + '  ', bold: true, size: 20, font: 'Arial' }),
      new ImageRun({
        type: 'png',
        data: qrBuffer,
        transformation: { width: 60, height: 60 },
      }),
    ],
    alignment: AlignmentType.LEFT,
    spacing: { before: 150, after: 150 },
    shading: {
      type: ShadingType.SOLID,
      color: 'FFF8E7',
    },
  });
}

/**
 * Create bilingual QR code header with two QR codes side by side
 */
export async function createBilingualQRHeader(
  englishUrl?: string,
  homeLanguageUrl?: string,
  homeLanguage?: string
): Promise<(Paragraph | Table)[]> {
  const elements: (Paragraph | Table)[] = [];
  
  // Header text
  elements.push(
    new Paragraph({
      children: [
        new TextRun({ text: '🎧 ', size: 28 }),
        new TextRun({
          text: 'Scan a QR code to listen to instructions:',
          bold: true,
          size: 22,
          font: 'Arial',
        }),
      ],
      spacing: { before: 100, after: 100 },
      shading: {
        type: ShadingType.SOLID,
        color: 'FFF8E7',
      },
    })
  );

  // Build QR code cells
  const qrCells: TableCell[] = [];

  // English QR
  if (englishUrl) {
    try {
      const englishQRBuffer = await generateQRCodeBuffer(englishUrl, 80);
      qrCells.push(
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: `${LANGUAGE_FLAGS['English']} English`,
                  bold: true,
                  size: 20,
                  font: 'Arial',
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 80 },
            }),
            new Paragraph({
              children: [
                new ImageRun({
                  type: 'png',
                  data: englishQRBuffer,
                  transformation: { width: 70, height: 70 },
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Tap to listen',
                  italics: true,
                  size: 16,
                  color: '6B7280',
                  font: 'Arial',
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 60 },
            }),
          ],
          width: { size: 50, type: WidthType.PERCENTAGE },
          shading: { fill: 'EFF6FF' }, // Light blue for English
          margins: { top: 100, bottom: 100, left: 100, right: 100 },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: 'BFDBFE' },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: 'BFDBFE' },
            left: { style: BorderStyle.SINGLE, size: 1, color: 'BFDBFE' },
            right: { style: BorderStyle.SINGLE, size: 1, color: 'BFDBFE' },
          },
        })
      );
    } catch (error) {
      console.error('Failed to generate English QR:', error);
    }
  }

  // Home Language QR
  if (homeLanguageUrl && homeLanguage && homeLanguage !== 'English') {
    try {
      const homeLanguageQRBuffer = await generateQRCodeBuffer(homeLanguageUrl, 80);
      const flag = LANGUAGE_FLAGS[homeLanguage] || '🌐';
      
      qrCells.push(
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: `${flag} ${homeLanguage}`,
                  bold: true,
                  size: 20,
                  font: 'Arial',
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 80 },
            }),
            new Paragraph({
              children: [
                new ImageRun({
                  type: 'png',
                  data: homeLanguageQRBuffer,
                  transformation: { width: 70, height: 70 },
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Tap to listen',
                  italics: true,
                  size: 16,
                  color: '6B7280',
                  font: 'Arial',
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 60 },
            }),
          ],
          width: { size: 50, type: WidthType.PERCENTAGE },
          shading: { fill: 'FFFBEB' }, // Light amber for home language
          margins: { top: 100, bottom: 100, left: 100, right: 100 },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: 'FDE68A' },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: 'FDE68A' },
            left: { style: BorderStyle.SINGLE, size: 1, color: 'FDE68A' },
            right: { style: BorderStyle.SINGLE, size: 1, color: 'FDE68A' },
          },
        })
      );
    } catch (error) {
      console.error('Failed to generate home language QR:', error);
    }
  }

  // Create table with QR codes if we have any
  if (qrCells.length > 0) {
    elements.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: qrCells,
          }),
        ],
        borders: {
          top: { style: BorderStyle.NONE },
          bottom: { style: BorderStyle.NONE },
          left: { style: BorderStyle.NONE },
          right: { style: BorderStyle.NONE },
          insideHorizontal: { style: BorderStyle.NONE },
          insideVertical: { style: BorderStyle.NONE },
        },
      })
    );
  }

  // Spacer after QR codes
  elements.push(
    new Paragraph({ text: '', spacing: { after: 200 } })
  );

  return elements;
}

/**
 * Create placeholder paragraph when audio is not yet available
 */
export function createAudioPlaceholder(): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: '🎧 Audio generating... QR codes will appear when ready.',
        italics: true,
        size: 18,
        color: '9CA3AF',
        font: 'Arial',
      }),
    ],
    spacing: { before: 100, after: 200 },
    shading: {
      type: ShadingType.SOLID,
      color: 'F3F4F6',
    },
  });
}

/**
 * Check if audio URLs are valid and ready for QR code generation
 */
export function hasValidAudioUrls(audioUrls?: { englishUrl?: string; homeLanguageUrl?: string }): boolean {
  if (!audioUrls) return false;
  return !!(audioUrls.englishUrl || audioUrls.homeLanguageUrl);
}
