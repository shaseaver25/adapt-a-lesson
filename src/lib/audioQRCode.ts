import QRCode from 'qrcode';

export interface PrintableAudioSection {
  sectionId: string;
  sectionType: string;
  qrCodeDataUrl: string;
  audioUrl: string;
  language: string;
}

/**
 * Generate QR codes for audio sections to embed in printable documents
 */
export async function generateAudioQRCodes(
  audioSections: Array<{
    sectionId: string;
    sectionType: string;
    audioUrl: string;
    language: string;
  }>
): Promise<PrintableAudioSection[]> {
  const results: PrintableAudioSection[] = [];
  
  for (const section of audioSections) {
    try {
      // Generate QR code as data URL (compact size for print)
      const qrCodeDataUrl = await QRCode.toDataURL(section.audioUrl, {
        width: 80,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
      
      results.push({
        sectionId: section.sectionId,
        sectionType: section.sectionType,
        qrCodeDataUrl,
        audioUrl: section.audioUrl,
        language: section.language
      });
    } catch (error) {
      console.error(`Failed to generate QR code for section ${section.sectionId}:`, error);
    }
  }
  
  return results;
}

/**
 * Generate a single QR code for a URL
 */
export async function generateQRCode(url: string, size: number = 80): Promise<string> {
  return QRCode.toDataURL(url, {
    width: size,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'M'
  });
}

/**
 * Get section label for display
 */
export function getSectionLabel(sectionType: string): string {
  const labels: Record<string, string> = {
    'learning-target': '🎯 Learning Target',
    'instructions': '📋 Instructions',
    'vocabulary': '📚 Vocabulary',
    'content': '📖 Content',
    'reflection-prompt': '💭 Reflection'
  };
  return labels[sectionType] || sectionType;
}

/**
 * Generate markdown block with QR code placeholder for print
 */
export function generatePrintAudioBlock(
  sectionType: string,
  audioUrl: string
): string {
  const label = getSectionLabel(sectionType);
  return `
---
🔊 **Listen to this section**
${label}
[Scan QR code or visit: ${audioUrl}]
---
`;
}
