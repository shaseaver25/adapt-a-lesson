import { Paragraph, ImageRun, TextRun, AlignmentType, BorderStyle } from 'docx';

/**
 * Fetch an image and convert it to a buffer suitable for DOCX embedding
 */
export async function fetchImageAsBuffer(imageUrl: string): Promise<Uint8Array | null> {
  try {
    // Handle base64 data URLs
    if (imageUrl.startsWith('data:image/')) {
      const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, '');
      return Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    }

    // Fetch remote image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.status}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (error) {
    console.error('Error fetching image:', error);
    return null;
  }
}

/**
 * Create a DOCX paragraph containing an embedded image
 */
export async function createImageParagraph(
  imageUrl: string,
  caption?: string,
  width: number = 500,
  height: number = 375
): Promise<Paragraph[]> {
  const paragraphs: Paragraph[] = [];
  
  const imageBuffer = await fetchImageAsBuffer(imageUrl);
  
  if (imageBuffer) {
    // Add the image
    paragraphs.push(
      new Paragraph({
        children: [
          new ImageRun({
            data: imageBuffer,
            transformation: {
              width,
              height,
            },
            type: 'png',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 100 },
      })
    );

    // Add caption if provided
    if (caption) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: caption,
              italics: true,
              size: 20,
              color: '6B7280',
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        })
      );
    }
  } else {
    // Fallback placeholder if image fetch fails
    paragraphs.push(createImagePlaceholder(caption || 'Graphic Organizer'));
  }

  return paragraphs;
}

/**
 * Create a styled placeholder for when images can't be loaded
 */
export function createImagePlaceholder(description: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: `📊 [Graphic Organizer: ${description}]`,
        italics: true,
        color: '6B7280',
        size: 24,
        font: 'Arial',
      }),
    ],
    alignment: AlignmentType.CENTER,
    border: {
      top: { style: BorderStyle.DASHED, size: 1, color: '9CA3AF' },
      bottom: { style: BorderStyle.DASHED, size: 1, color: '9CA3AF' },
      left: { style: BorderStyle.DASHED, size: 1, color: '9CA3AF' },
      right: { style: BorderStyle.DASHED, size: 1, color: '9CA3AF' },
    },
    shading: { fill: 'F9FAFB' },
    spacing: { before: 200, after: 200 },
  });
}

/**
 * Parse a visual marker with potential image URL
 * Format: [VISUAL: description] or [VISUAL: description | imageUrl]
 */
export function parseVisualMarker(text: string): { description: string; imageUrl?: string } {
  const match = text.match(/\[VISUAL:\s*(.+?)\]/i);
  if (!match) {
    return { description: text };
  }

  const content = match[1];
  
  // Check for image URL after pipe
  if (content.includes('|')) {
    const [description, imageUrl] = content.split('|').map(s => s.trim());
    return { description, imageUrl };
  }

  // Check if the description itself is a URL
  if (content.startsWith('http') || content.startsWith('data:image/')) {
    return { description: 'Graphic Organizer', imageUrl: content };
  }

  return { description: content };
}

/**
 * Check if a URL is likely an image
 */
export function isImageUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith('data:image/')) return true;
  
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'];
  const lowercaseUrl = url.toLowerCase();
  
  return imageExtensions.some(ext => lowercaseUrl.includes(ext));
}
