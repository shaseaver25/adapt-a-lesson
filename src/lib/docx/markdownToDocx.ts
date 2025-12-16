import {
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  convertInchesToTwip,
  ImageRun,
} from 'docx';

// Document styling constants
const DOC_STYLES = {
  title: { size: 32, bold: true, font: 'Arial' },
  heading1: { size: 28, bold: true, font: 'Arial' },
  heading2: { size: 24, bold: true, font: 'Arial' },
  heading3: { size: 22, bold: true, font: 'Arial' },
  body: { size: 24, font: 'Arial' },
  caption: { size: 20, italics: true, font: 'Arial' },
};

type DocxChild = Paragraph | Table;

// Map to store graphic organizer images for embedding
// Key: description or identifier, Value: image URL
let graphicOrganizerImages: Map<string, string> = new Map();

/**
 * Set graphic organizer images to be embedded during DOCX generation
 */
function setGraphicOrganizerImages(images: Map<string, string> | Record<string, string>): void {
  if (images instanceof Map) {
    graphicOrganizerImages = images;
  } else {
    graphicOrganizerImages = new Map(Object.entries(images));
  }
}

/**
 * Clear graphic organizer images
 */
function clearGraphicOrganizerImages(): void {
  graphicOrganizerImages.clear();
}

/**
 * Parse inline markdown formatting to TextRun array
 * Handles: **bold**, *italic*, __underline__, `code`, and combinations
 */
function parseInlineFormatting(text: string): TextRun[] {
  const runs: TextRun[] = [];
  
  // First, remove any literal \n and replace with space
  text = text.replace(/\\n/g, ' ');
  
  // Regex to match inline formatting patterns
  // Order matters: check bold (**) before italic (*) to avoid conflicts
  const regex = /(\*\*\*(.+?)\*\*\*)|(\*\*(.+?)\*\*)|(\*(.+?)\*)|(__(.+?)__)|(`(.+?)`)|([^*_`]+)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match[2]) {
      // ***bold italic***
      runs.push(new TextRun({ 
        text: match[2], 
        bold: true, 
        italics: true,
        size: DOC_STYLES.body.size,
        font: DOC_STYLES.body.font,
      }));
    } else if (match[4]) {
      // **bold**
      runs.push(new TextRun({ 
        text: match[4], 
        bold: true,
        size: DOC_STYLES.body.size,
        font: DOC_STYLES.body.font,
      }));
    } else if (match[6]) {
      // *italic*
      runs.push(new TextRun({ 
        text: match[6], 
        italics: true,
        size: DOC_STYLES.body.size,
        font: DOC_STYLES.body.font,
      }));
    } else if (match[8]) {
      // __underline__
      runs.push(new TextRun({ 
        text: match[8], 
        underline: {},
        size: DOC_STYLES.body.size,
        font: DOC_STYLES.body.font,
      }));
    } else if (match[10]) {
      // `code`
      runs.push(new TextRun({ 
        text: match[10], 
        font: 'Courier New',
        size: DOC_STYLES.body.size,
        shading: { fill: 'F3F4F6' },
      }));
    } else if (match[11]) {
      // plain text
      runs.push(new TextRun({ 
        text: match[11],
        size: DOC_STYLES.body.size,
        font: DOC_STYLES.body.font,
      }));
    }
  }

  // Fallback if no matches
  if (runs.length === 0) {
    runs.push(new TextRun({ 
      text, 
      size: DOC_STYLES.body.size,
      font: DOC_STYLES.body.font,
    }));
  }

  return runs;
}

/**
 * Create a heading paragraph
 */
function createHeading(text: string, level: number): Paragraph {
  const headingLevels = [
    HeadingLevel.HEADING_1,
    HeadingLevel.HEADING_2,
    HeadingLevel.HEADING_3,
    HeadingLevel.HEADING_4,
    HeadingLevel.HEADING_5,
    HeadingLevel.HEADING_6,
  ];
  
  const sizes = [32, 28, 24, 22, 20, 18];
  const spacingBefore = [400, 300, 200, 150, 120, 100];
  const spacingAfter = [200, 150, 100, 80, 60, 50];

  // Remove any remaining markdown from heading text
  const cleanText = text.replace(/[#*_`]/g, '').trim();

  return new Paragraph({
    heading: headingLevels[Math.min(level - 1, 5)],
    children: [
      new TextRun({
        text: cleanText,
        bold: true,
        size: sizes[Math.min(level - 1, 5)] * 2,
        font: 'Arial',
      }),
    ],
    spacing: { 
      before: spacingBefore[Math.min(level - 1, 5)], 
      after: spacingAfter[Math.min(level - 1, 5)] 
    },
  });
}

/**
 * Create a regular paragraph with inline formatting
 */
function createParagraph(text: string): Paragraph {
  return new Paragraph({
    children: parseInlineFormatting(text),
    spacing: { after: 200 },
  });
}

/**
 * Create bullet list items
 */
function createBulletList(items: string[]): Paragraph[] {
  return items.map((item) =>
    new Paragraph({
      children: parseInlineFormatting(item),
      bullet: { level: 0 },
      spacing: { after: 100 },
      indent: { left: convertInchesToTwip(0.25) },
    })
  );
}

/**
 * Create numbered list items
 */
function createNumberedList(items: string[]): Paragraph[] {
  return items.map((item, index) =>
    new Paragraph({
      children: [
        new TextRun({ 
          text: `${index + 1}. `, 
          bold: true,
          size: DOC_STYLES.body.size,
          font: DOC_STYLES.body.font,
        }),
        ...parseInlineFormatting(item),
      ],
      spacing: { after: 100 },
      indent: { left: convertInchesToTwip(0.25) },
    })
  );
}

/**
 * Create a horizontal rule
 */
function createHorizontalRule(): Paragraph {
  return new Paragraph({
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CCCCCC' },
    },
    spacing: { before: 200, after: 200 },
  });
}

/**
 * Parse markdown table lines into a Table
 */
function createTable(lines: string[]): Table {
  // Filter out separator lines (|---|---|)
  const dataLines = lines.filter((line) => !/^\|[\s\-:|]+\|$/.test(line.trim()));

  const rows = dataLines.map((line, rowIndex) => {
    const cells = line
      .split('|')
      .filter((cell) => cell.trim() !== '')
      .map((cell) => cell.trim());

    return new TableRow({
      children: cells.map((cellText) =>
        new TableCell({
          children: [
            new Paragraph({
              children: parseInlineFormatting(cellText),
            }),
          ],
          shading: rowIndex === 0 ? { fill: 'F3F4F6' } : undefined,
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
            left: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
            right: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
          },
          margins: {
            top: 50,
            bottom: 50,
            left: 100,
            right: 100,
          },
        })
      ),
    });
  });

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

/**
 * Create a visual placeholder block (sync version)
 */
function createVisualPlaceholder(description: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: `📊 [Diagram: ${description}]`,
        italics: true,
        color: '6B7280',
        size: DOC_STYLES.body.size,
        font: DOC_STYLES.body.font,
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
 * Create an embedded image paragraph from a URL or base64
 */
async function createEmbeddedImage(
  imageUrl: string,
  description: string,
  width: number = 500,
  height: number = 375
): Promise<Paragraph[]> {
  const paragraphs: Paragraph[] = [];

  try {
    let imageBuffer: Uint8Array;

    if (imageUrl.startsWith('data:image/')) {
      // Handle base64 data URL
      const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, '');
      imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    } else {
      // Fetch remote image
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      imageBuffer = new Uint8Array(arrayBuffer);
    }

    // Add the image
    paragraphs.push(
      new Paragraph({
        children: [
          new ImageRun({
            data: imageBuffer,
            transformation: { width, height },
            type: 'png',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 100 },
      })
    );

    // Add caption
    if (description) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `📊 ${description}`,
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
  } catch (error) {
    console.error('Error embedding image:', error);
    // Fallback to placeholder
    paragraphs.push(createVisualPlaceholder(description));
  }

  return paragraphs;
}

/**
 * Create an answer line placeholder
 */
function createAnswerLine(count: number = 1): Paragraph[] {
  const lines: Paragraph[] = [];
  for (let i = 0; i < count; i++) {
    lines.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '_'.repeat(60),
            size: DOC_STYLES.body.size,
            font: DOC_STYLES.body.font,
            color: 'CCCCCC',
          }),
        ],
        spacing: { before: 100, after: 100 },
      })
    );
  }
  return lines;
}

/**
 * Parse box drawing characters and convert to styled section
 */
function handleBoxDrawing(line: string): Paragraph | null {
  const textContent = line.replace(/[┌┐└┘├┤┬┴┼─│═║╔╗╚╝╠╣╦╩╬]/g, '').trim();
  if (!textContent) {
    return null;
  }
  
  return new Paragraph({
    children: [
      new TextRun({
        text: textContent,
        size: DOC_STYLES.body.size,
        font: DOC_STYLES.body.font,
        bold: textContent.includes('📚') || textContent.includes('🚀') || textContent.includes('🎯'),
      }),
    ],
    border: {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    },
    shading: { fill: 'F5F5F5' },
    spacing: { before: 50, after: 50 },
  });
}

/**
 * Main function: Parse markdown text into docx-compatible elements
 */
export function parseMarkdownToDocx(markdown: string): DocxChild[] {
  const elements: DocxChild[] = [];
  const lines = markdown.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Skip empty lines but add spacing
    if (!trimmedLine) {
      elements.push(new Paragraph({ text: '', spacing: { after: 100 } }));
      i++;
      continue;
    }

    // Horizontal rule --- or ***
    if (/^[-*_]{3,}$/.test(trimmedLine)) {
      elements.push(createHorizontalRule());
      i++;
      continue;
    }

    // Separator lines (═══ or ───)
    if (/^[═─]{3,}$/.test(trimmedLine)) {
      elements.push(
        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' } },
          spacing: { before: 200, after: 200 },
        })
      );
      i++;
      continue;
    }

    // Headers # ## ### etc
    const headerMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const text = headerMatch[2];
      elements.push(createHeading(text, level));
      i++;
      continue;
    }

    // Box drawing characters
    if (/[┌┐└┘├┤┬┴┼─│═║╔╗╚╝╠╣╦╩╬]/.test(trimmedLine)) {
      const boxParagraph = handleBoxDrawing(trimmedLine);
      if (boxParagraph) {
        elements.push(boxParagraph);
      }
      i++;
      continue;
    }

    // Bullet lists - or * (not bold markers)
    if (/^[-*•]\s+/.test(trimmedLine) && !/^\*\*/.test(trimmedLine)) {
      const listItems: string[] = [];
      while (i < lines.length) {
        const currentLine = lines[i].trim();
        if (/^[-*•]\s+/.test(currentLine) && !/^\*\*/.test(currentLine)) {
          listItems.push(currentLine.replace(/^[-*•]\s+/, ''));
          i++;
        } else {
          break;
        }
      }
      elements.push(...createBulletList(listItems));
      continue;
    }

    // Numbered lists 1. 2. etc
    if (/^\d+\.\s+/.test(trimmedLine)) {
      const listItems: string[] = [];
      while (i < lines.length) {
        const currentLine = lines[i].trim();
        if (/^\d+\.\s+/.test(currentLine)) {
          listItems.push(currentLine.replace(/^\d+\.\s+/, ''));
          i++;
        } else {
          break;
        }
      }
      elements.push(...createNumberedList(listItems));
      continue;
    }

    // Tables | col1 | col2 |
    if (trimmedLine.includes('|') && (trimmedLine.startsWith('|') || trimmedLine.endsWith('|'))) {
      const tableLines: string[] = [];
      while (i < lines.length) {
        const currentLine = lines[i].trim();
        if (currentLine.includes('|')) {
          tableLines.push(currentLine);
          i++;
        } else {
          break;
        }
      }
      if (tableLines.length > 0) {
        elements.push(createTable(tableLines));
        elements.push(new Paragraph({ text: '', spacing: { after: 200 } }));
      }
      continue;
    }

    // [VISUAL: ...] placeholder
    const visualMatch = trimmedLine.match(/\[VISUAL:\s*(.+?)\]/i);
    if (visualMatch) {
      elements.push(createVisualPlaceholder(visualMatch[1]));
      i++;
      continue;
    }

    // [ANSWER LINES: N] or similar placeholder
    const answerMatch = trimmedLine.match(/\[ANSWER\s*LINES?:\s*(\d+)\]/i);
    if (answerMatch) {
      elements.push(...createAnswerLine(parseInt(answerMatch[1], 10)));
      i++;
      continue;
    }

    // Answer line placeholder (underscores)
    if (/^_{5,}$/.test(trimmedLine)) {
      elements.push(...createAnswerLine(1));
      i++;
      continue;
    }

    // Regular paragraph with inline formatting
    elements.push(createParagraph(trimmedLine));
    i++;
  }

  return elements;
}

/**
 * Convert markdown to docx Paragraph array (backward compatible)
 * Flattens tables into paragraph representations for simpler use cases
 */
export function markdownToParagraphs(markdown: string): Paragraph[] {
  const elements = parseMarkdownToDocx(markdown);
  
  // Filter to only Paragraph elements, flatten arrays
  const paragraphs: Paragraph[] = [];
  for (const element of elements) {
    if (element instanceof Paragraph) {
      paragraphs.push(element);
    } else if (element instanceof Table) {
      // For backward compatibility, add a placeholder paragraph for tables
      // The actual table will be handled separately
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '[Table]',
              italics: true,
              color: '9CA3AF',
              size: DOC_STYLES.body.size,
              font: DOC_STYLES.body.font,
            }),
          ],
          spacing: { after: 200 },
        })
      );
    }
  }
  
  return paragraphs;
}

/**
 * Get all docx children including tables
 */
export function markdownToDocxChildren(markdown: string): (Paragraph | Table)[] {
  return parseMarkdownToDocx(markdown);
}

/**
 * Async version of parseMarkdownToDocx that embeds actual images
 * Uses graphicOrganizerImages map set via setGraphicOrganizerImages()
 */
export async function parseMarkdownToDocxWithImages(markdown: string): Promise<DocxChild[]> {
  const elements: DocxChild[] = [];
  const lines = markdown.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Skip empty lines but add spacing
    if (!trimmedLine) {
      elements.push(new Paragraph({ text: '', spacing: { after: 100 } }));
      i++;
      continue;
    }

    // Horizontal rule --- or ***
    if (/^[-*_]{3,}$/.test(trimmedLine)) {
      elements.push(createHorizontalRule());
      i++;
      continue;
    }

    // Separator lines (═══ or ───)
    if (/^[═─]{3,}$/.test(trimmedLine)) {
      elements.push(
        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' } },
          spacing: { before: 200, after: 200 },
        })
      );
      i++;
      continue;
    }

    // Headers # ## ### etc
    const headerMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const text = headerMatch[2];
      elements.push(createHeading(text, level));
      i++;
      continue;
    }

    // Box drawing characters
    if (/[┌┐└┘├┤┬┴┼─│═║╔╗╚╝╠╣╦╩╬]/.test(trimmedLine)) {
      const boxParagraph = handleBoxDrawing(trimmedLine);
      if (boxParagraph) {
        elements.push(boxParagraph);
      }
      i++;
      continue;
    }

    // Bullet lists - or * (not bold markers)
    if (/^[-*•]\s+/.test(trimmedLine) && !/^\*\*/.test(trimmedLine)) {
      const listItems: string[] = [];
      while (i < lines.length) {
        const currentLine = lines[i].trim();
        if (/^[-*•]\s+/.test(currentLine) && !/^\*\*/.test(currentLine)) {
          listItems.push(currentLine.replace(/^[-*•]\s+/, ''));
          i++;
        } else {
          break;
        }
      }
      elements.push(...createBulletList(listItems));
      continue;
    }

    // Numbered lists 1. 2. etc
    if (/^\d+\.\s+/.test(trimmedLine)) {
      const listItems: string[] = [];
      while (i < lines.length) {
        const currentLine = lines[i].trim();
        if (/^\d+\.\s+/.test(currentLine)) {
          listItems.push(currentLine.replace(/^\d+\.\s+/, ''));
          i++;
        } else {
          break;
        }
      }
      elements.push(...createNumberedList(listItems));
      continue;
    }

    // Tables | col1 | col2 |
    if (trimmedLine.includes('|') && (trimmedLine.startsWith('|') || trimmedLine.endsWith('|'))) {
      const tableLines: string[] = [];
      while (i < lines.length) {
        const currentLine = lines[i].trim();
        if (currentLine.includes('|')) {
          tableLines.push(currentLine);
          i++;
        } else {
          break;
        }
      }
      if (tableLines.length > 0) {
        elements.push(createTable(tableLines));
        elements.push(new Paragraph({ text: '', spacing: { after: 200 } }));
      }
      continue;
    }

    // [VISUAL: ...] - Check for image URL or stored image
    const visualMatch = trimmedLine.match(/\[VISUAL:\s*(.+?)\]/i);
    if (visualMatch) {
      const description = visualMatch[1];
      
      // Check if we have a stored image for this description
      const imageUrl = graphicOrganizerImages.get(description) || 
                       graphicOrganizerImages.get(description.toLowerCase());
      
      // Also check for URL embedded in description (format: [VISUAL: desc | url])
      let embeddedUrl = '';
      if (description.includes('|')) {
        const parts = description.split('|').map(s => s.trim());
        if (parts[1] && (parts[1].startsWith('http') || parts[1].startsWith('data:image/'))) {
          embeddedUrl = parts[1];
        }
      }
      
      const urlToUse = imageUrl || embeddedUrl;
      
      if (urlToUse) {
        // Embed the actual image
        const imageParagraphs = await createEmbeddedImage(urlToUse, description.split('|')[0].trim());
        elements.push(...imageParagraphs);
      } else {
        // Fallback to placeholder
        elements.push(createVisualPlaceholder(description));
      }
      i++;
      continue;
    }

    // [ANSWER LINES: N] or similar placeholder
    const answerMatch = trimmedLine.match(/\[ANSWER\s*LINES?:\s*(\d+)\]/i);
    if (answerMatch) {
      elements.push(...createAnswerLine(parseInt(answerMatch[1], 10)));
      i++;
      continue;
    }

    // Answer line placeholder (underscores)
    if (/^_{5,}$/.test(trimmedLine)) {
      elements.push(...createAnswerLine(1));
      i++;
      continue;
    }

    // Regular paragraph with inline formatting
    elements.push(createParagraph(trimmedLine));
    i++;
  }

  return elements;
}

/**
 * Async version of markdownToDocxChildren that supports image embedding
 */
export async function markdownToDocxChildrenWithImages(markdown: string): Promise<(Paragraph | Table)[]> {
  return parseMarkdownToDocxWithImages(markdown);
}

export { DOC_STYLES, setGraphicOrganizerImages, clearGraphicOrganizerImages };
