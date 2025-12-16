import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  PageBreak,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  convertInchesToTwip,
  PageOrientation,
  ImageRun,
  ExternalHyperlink,
  ShadingType,
} from 'docx';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { generateQRCode } from './audioQRCode';

// Document styling constants
const DOC_STYLES = {
  title: { size: 32, bold: true, font: 'Arial' },
  heading1: { size: 28, bold: true, font: 'Arial' },
  heading2: { size: 24, bold: true, font: 'Arial' },
  body: { size: 24, font: 'Arial' }, // 12pt = size 24 in docx
  caption: { size: 20, italics: true, font: 'Arial' },
};

interface StudentGroupInfo {
  id: string;
  groupName: string;
  readingLevelLabel: string;
}

export interface AudioSection {
  groupId: string;
  groupName: string;
  audioUrl: string;
  language: string;
}

export interface BilingualAudioSection {
  groupId: string;
  groupName: string;
  sectionType: string;
  englishAudioUrl?: string;
  homeLanguageAudioUrl?: string;
  homeLanguage?: string;
}

/**
 * Convert base64 data URL to ArrayBuffer for docx ImageRun
 */
async function dataUrlToArrayBuffer(dataUrl: string): Promise<ArrayBuffer> {
  const base64 = dataUrl.split(',')[1];
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Create an audio access block paragraph with QR code for docx
 */
async function createAudioBlockParagraph(
  audioUrl: string,
  language: string = 'English'
): Promise<Paragraph[]> {
  try {
    const qrCodeDataUrl = await generateQRCode(audioUrl, 60);
    const qrImageBuffer = await dataUrlToArrayBuffer(qrCodeDataUrl);
    
    return [
      new Paragraph({
        children: [
          new TextRun({ text: '🔊 ', size: 24 }),
          new TextRun({ 
            text: 'LISTEN TO THIS SECTION', 
            bold: true, 
            size: 20,
            font: 'Arial'
          }),
          new TextRun({ 
            text: language !== 'English' ? ` (${language})` : '',
            size: 18,
            italics: true,
            font: 'Arial'
          }),
        ],
        spacing: { before: 200, after: 100 },
        shading: {
          type: ShadingType.SOLID,
          color: 'FFF8E7', // Light amber background
        },
      }),
      new Paragraph({
        children: [
          new ImageRun({
            type: 'png',
            data: qrImageBuffer,
            transformation: { width: 60, height: 60 },
          }),
          new TextRun({ text: '  ', size: 20 }),
          new TextRun({ 
            text: 'Scan QR code or visit: ',
            size: 18,
            font: 'Arial'
          }),
          new ExternalHyperlink({
            children: [
              new TextRun({
                text: audioUrl.length > 50 ? audioUrl.slice(0, 50) + '...' : audioUrl,
                style: 'Hyperlink',
                size: 18,
                font: 'Arial',
              }),
            ],
            link: audioUrl,
          }),
        ],
        spacing: { after: 200 },
        shading: {
          type: ShadingType.SOLID,
          color: 'FFF8E7',
        },
      }),
    ];
  } catch (error) {
    console.error('Failed to create audio block:', error);
    // Fallback without QR code
    return [
      new Paragraph({
        children: [
          new TextRun({ text: '🔊 ', size: 24 }),
          new TextRun({ 
            text: 'LISTEN: ', 
            bold: true, 
            size: 20,
            font: 'Arial'
          }),
          new ExternalHyperlink({
            children: [
              new TextRun({
                text: audioUrl,
                style: 'Hyperlink',
                size: 18,
                font: 'Arial',
              }),
            ],
            link: audioUrl,
          }),
        ],
        spacing: { before: 200, after: 200 },
      }),
    ];
  }
}

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

/**
 * Create a bilingual audio block with two QR codes side by side
 */
async function createBilingualAudioBlockParagraph(
  sectionType: string,
  englishAudioUrl?: string,
  homeLanguageAudioUrl?: string,
  homeLanguage?: string
): Promise<Paragraph[]> {
  const paragraphs: Paragraph[] = [];
  const hasHomeLanguage = homeLanguageAudioUrl && homeLanguage && homeLanguage !== 'English';
  
  // Header
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({ text: '🔊 ', size: 28 }),
        new TextRun({ 
          text: 'LISTEN TO THIS SECTION', 
          bold: true, 
          size: 22,
          font: 'Arial'
        }),
      ],
      spacing: { before: 200, after: 100 },
      shading: {
        type: ShadingType.SOLID,
        color: 'FFF8E7',
      },
    })
  );

  // Section type label
  const sectionLabels: Record<string, string> = {
    'learning-target': '🎯 Learning Target',
    'instructions': '📋 Instructions',
    'vocabulary': '📚 Vocabulary',
    'content': '📖 Content',
    'reflection-prompt': '💭 Reflection',
  };
  
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: sectionLabels[sectionType] || sectionType,
          size: 18,
          italics: true,
          font: 'Arial',
        }),
      ],
      spacing: { after: 150 },
      shading: {
        type: ShadingType.SOLID,
        color: 'FFF8E7',
      },
    })
  );

  try {
    // Create table with QR codes
    const qrCells: TableCell[] = [];

    // English QR
    if (englishAudioUrl) {
      const englishQR = await generateQRCode(englishAudioUrl, 70);
      const englishQRBuffer = await dataUrlToArrayBuffer(englishQR);
      
      qrCells.push(
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: `${getLanguageFlag('English')} English`, bold: true, size: 18, font: 'Arial' }),
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
                new ExternalHyperlink({
                  children: [
                    new TextRun({
                      text: 'Tap to listen',
                      style: 'Hyperlink',
                      size: 16,
                      font: 'Arial',
                    }),
                  ],
                  link: englishAudioUrl,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 60 },
            }),
          ],
          width: { size: 50, type: WidthType.PERCENTAGE },
          shading: { fill: 'FFF8E7' },
          margins: { top: 100, bottom: 100, left: 100, right: 100 },
        })
      );
    }

    // Home Language QR
    if (hasHomeLanguage) {
      const homeLanguageQR = await generateQRCode(homeLanguageAudioUrl, 70);
      const homeLanguageQRBuffer = await dataUrlToArrayBuffer(homeLanguageQR);
      
      qrCells.push(
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: `${getLanguageFlag(homeLanguage)} ${homeLanguage}`, bold: true, size: 18, font: 'Arial' }),
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
                new ExternalHyperlink({
                  children: [
                    new TextRun({
                      text: 'Tap to listen',
                      style: 'Hyperlink',
                      size: 16,
                      font: 'Arial',
                    }),
                  ],
                  link: homeLanguageAudioUrl,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 60 },
            }),
          ],
          width: { size: 50, type: WidthType.PERCENTAGE },
          shading: { fill: 'FFF8E7' },
          margins: { top: 100, bottom: 100, left: 100, right: 100 },
        })
      );
    }

    if (qrCells.length > 0) {
      const qrTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: qrCells,
          }),
        ],
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: 'E5E5E5' },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E5E5E5' },
          left: { style: BorderStyle.SINGLE, size: 1, color: 'E5E5E5' },
          right: { style: BorderStyle.SINGLE, size: 1, color: 'E5E5E5' },
        },
      });

      // Add table as paragraph (convert to array format)
      paragraphs.push(
        new Paragraph({ text: '', spacing: { after: 50 } }),
      );
      
      // Return paragraphs plus table
      return [...paragraphs, qrTable as any, new Paragraph({ text: '', spacing: { after: 200 } })];
    }
  } catch (error) {
    console.error('Failed to create bilingual audio block:', error);
  }

  // Fallback with links only
  if (englishAudioUrl) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${getLanguageFlag('English')} English: `, size: 18, font: 'Arial' }),
          new ExternalHyperlink({
            children: [new TextRun({ text: englishAudioUrl, style: 'Hyperlink', size: 18, font: 'Arial' })],
            link: englishAudioUrl,
          }),
        ],
        spacing: { after: 100 },
      })
    );
  }
  
  if (hasHomeLanguage) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${getLanguageFlag(homeLanguage)} ${homeLanguage}: `, size: 18, font: 'Arial' }),
          new ExternalHyperlink({
            children: [new TextRun({ text: homeLanguageAudioUrl, style: 'Hyperlink', size: 18, font: 'Arial' })],
            link: homeLanguageAudioUrl,
          }),
        ],
        spacing: { after: 200 },
      })
    );
  }

  return paragraphs;
}

// Parse markdown content into structured sections
function parseMarkdownContent(content: string): {
  teacherGuide: string;
  studentHandouts: { groupName: string; content: string }[];
} {
  const teacherGuideMatch = content.match(
    /TEACHER GUIDE[\s\S]*?(?=═{3,}[\s\S]*?STUDENT HANDOUTS|$)/i
  );
  const teacherGuide = teacherGuideMatch ? teacherGuideMatch[0] : '';

  const studentHandoutsSection = content.match(
    /STUDENT HANDOUTS[\s\S]*/i
  );
  
  const handouts: { groupName: string; content: string }[] = [];
  
  if (studentHandoutsSection) {
    // Split by group sections (look for patterns like "Group:" or level names)
    const groupPattern = /(?:═{3,}[\s\S]*?(?:✨|🔥|💫|🌟).*?(?:Edition|Edición|版本|Phiên Bản)[\s\S]*?(?=═{3,}[\s\S]*?(?:✨|🔥|💫|🌟)|$))/gi;
    const matches = studentHandoutsSection[0].match(groupPattern);
    
    if (matches) {
      matches.forEach((match, index) => {
        handouts.push({
          groupName: `Group ${index + 1}`,
          content: match.trim(),
        });
      });
    } else {
      // Fallback: treat entire section as one handout
      handouts.push({
        groupName: 'All Groups',
        content: studentHandoutsSection[0],
      });
    }
  }

  return { teacherGuide, studentHandouts: handouts };
}

// Convert markdown text to docx paragraphs
function markdownToParagraphs(text: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) {
      paragraphs.push(new Paragraph({ text: '' }));
      continue;
    }

    // Handle headers
    if (trimmedLine.startsWith('###')) {
      paragraphs.push(
        new Paragraph({
          text: trimmedLine.replace(/^###\s*/, ''),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 },
        })
      );
    } else if (trimmedLine.startsWith('##')) {
      paragraphs.push(
        new Paragraph({
          text: trimmedLine.replace(/^##\s*/, ''),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 150 },
        })
      );
    } else if (trimmedLine.startsWith('#')) {
      paragraphs.push(
        new Paragraph({
          text: trimmedLine.replace(/^#\s*/, ''),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        })
      );
    }
    // Handle bullet points
    else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('• ')) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '• ' + trimmedLine.replace(/^[-•]\s*/, ''),
              size: DOC_STYLES.body.size,
              font: DOC_STYLES.body.font,
            }),
          ],
          indent: { left: convertInchesToTwip(0.25) },
          spacing: { before: 50, after: 50 },
        })
      );
    }
    // Handle numbered lists
    else if (/^\d+\.\s/.test(trimmedLine)) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmedLine,
              size: DOC_STYLES.body.size,
              font: DOC_STYLES.body.font,
            }),
          ],
          indent: { left: convertInchesToTwip(0.25) },
          spacing: { before: 50, after: 50 },
        })
      );
    }
    // Handle box drawing characters (convert to styled section)
    else if (/[┌┐└┘├┤┬┴┼─│═║╔╗╚╝╠╣╦╩╬]/.test(trimmedLine)) {
      // Skip box drawing lines but preserve text content
      const textContent = trimmedLine.replace(/[┌┐└┘├┤┬┴┼─│═║╔╗╚╝╠╣╦╩╬]/g, '').trim();
      if (textContent) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: textContent,
                size: DOC_STYLES.body.size,
                font: DOC_STYLES.body.font,
                bold: textContent.includes('📚') || textContent.includes('🚀'),
              }),
            ],
            border: {
              top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
            },
            shading: { fill: 'F5F5F5' },
            spacing: { before: 50, after: 50 },
          })
        );
      }
    }
    // Handle bold text (**text**)
    else if (/\*\*.*?\*\*/.test(trimmedLine)) {
      const parts = trimmedLine.split(/(\*\*.*?\*\*)/);
      const children = parts.map((part) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return new TextRun({
            text: part.slice(2, -2),
            bold: true,
            size: DOC_STYLES.body.size,
            font: DOC_STYLES.body.font,
          });
        }
        return new TextRun({
          text: part,
          size: DOC_STYLES.body.size,
          font: DOC_STYLES.body.font,
        });
      });
      paragraphs.push(new Paragraph({ children, spacing: { before: 100, after: 100 } }));
    }
    // Handle separator lines
    else if (/^[═─]{3,}$/.test(trimmedLine)) {
      paragraphs.push(
        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' } },
          spacing: { before: 200, after: 200 },
        })
      );
    }
    // Regular text
    else {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmedLine,
              size: DOC_STYLES.body.size,
              font: DOC_STYLES.body.font,
            }),
          ],
          spacing: { before: 100, after: 100 },
        })
      );
    }
  }

  return paragraphs;
}

// Generate a complete Word document from markdown content
function generateDocument(content: string, title: string): Document {
  const paragraphs = markdownToParagraphs(content);

  return new Document({
    creator: 'Educator Tools',
    title: title,
    description: 'Differentiated Lesson Plan',
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
            },
          },
        },
        children: paragraphs,
      },
    ],
  });
}

// Generate combined document with page breaks between sections
function generateCombinedDocument(
  content: string,
  title: string,
  groups: StudentGroupInfo[]
): Document {
  const { teacherGuide, studentHandouts } = parseMarkdownContent(content);
  const children: Paragraph[] = [];

  // Title page
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: title || 'Differentiated Lesson Plan',
          bold: true,
          size: 48,
          font: 'Arial',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 2000, after: 400 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Generated: ${new Date().toLocaleDateString()}`,
          size: 24,
          font: 'Arial',
          italics: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Groups: ${groups.map((g) => g.groupName).join(', ')}`,
          size: 24,
          font: 'Arial',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 1000 },
    })
  );

  // Teacher Guide Section
  if (teacherGuide) {
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(
      new Paragraph({
        text: 'TEACHER GUIDE',
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 400 },
      })
    );
    children.push(...markdownToParagraphs(teacherGuide));
  }

  // Student Handouts - each group on new page
  if (studentHandouts.length > 0) {
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(
      new Paragraph({
        text: 'STUDENT HANDOUTS',
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 400 },
      }),
      new Paragraph({
        text: '(Print from here for student distribution)',
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
        children: [
          new TextRun({
            text: '(Print from here for student distribution)',
            italics: true,
            size: 22,
          }),
        ],
      })
    );

    studentHandouts.forEach((handout, index) => {
      if (index > 0) {
        children.push(new Paragraph({ children: [new PageBreak()] }));
      }
      children.push(...markdownToParagraphs(handout.content));
    });
  }

  return new Document({
    creator: 'Educator Tools',
    title: title,
    description: 'Differentiated Lesson Plan',
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
            },
          },
        },
        children,
      },
    ],
  });
}

// Export as combined .docx file
export async function exportAsDocx(
  content: string,
  title: string,
  groups: StudentGroupInfo[]
): Promise<void> {
  const doc = generateCombinedDocument(content, title, groups);
  const blob = await Packer.toBlob(doc);
  const filename = `${title || 'differentiated-lesson'}-combined.docx`
    .replace(/[^a-z0-9-_.]/gi, '-')
    .toLowerCase();
  saveAs(blob, filename);
}

// Export as separate .docx files in a ZIP
export async function exportAsSeparateDocx(
  content: string,
  title: string,
  groups: StudentGroupInfo[]
): Promise<void> {
  const { teacherGuide, studentHandouts } = parseMarkdownContent(content);
  const zip = new JSZip();

  // Add Teacher Guide
  if (teacherGuide) {
    const teacherDoc = new Document({
      creator: 'Educator Tools',
      title: `${title} - Teacher Guide`,
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: convertInchesToTwip(1),
                bottom: convertInchesToTwip(1),
                left: convertInchesToTwip(1),
                right: convertInchesToTwip(1),
              },
            },
          },
          children: markdownToParagraphs(teacherGuide),
        },
      ],
    });
    const teacherBlob = await Packer.toBlob(teacherDoc);
    zip.file('Teacher-Guide.docx', teacherBlob);
  }

  // Add each student handout
  for (let i = 0; i < studentHandouts.length; i++) {
    const handout = studentHandouts[i];
    const groupName = groups[i]?.groupName || handout.groupName;
    const safeGroupName = groupName.replace(/[^a-z0-9-_]/gi, '-');

    const handoutDoc = new Document({
      creator: 'Educator Tools',
      title: `${title} - ${groupName}`,
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: convertInchesToTwip(1),
                bottom: convertInchesToTwip(1),
                left: convertInchesToTwip(1),
                right: convertInchesToTwip(1),
              },
            },
          },
          children: markdownToParagraphs(handout.content),
        },
      ],
    });
    const handoutBlob = await Packer.toBlob(handoutDoc);
    zip.file(`Student-Handout-${safeGroupName}.docx`, handoutBlob);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const filename = `${title || 'differentiated-lesson'}-files.zip`
    .replace(/[^a-z0-9-_.]/gi, '-')
    .toLowerCase();
  saveAs(zipBlob, filename);
}

// Export Teacher Guide only as .docx
export async function exportTeacherGuideDocx(
  content: string,
  title: string
): Promise<void> {
  const { teacherGuide } = parseMarkdownContent(content);
  
  if (!teacherGuide) {
    throw new Error('No Teacher Guide section found in content');
  }

  const doc = new Document({
    creator: 'Educator Tools',
    title: `${title} - Teacher Guide`,
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
            },
          },
        },
        children: [
          new Paragraph({
            text: 'TEACHER GUIDE',
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 400 },
          }),
          ...markdownToParagraphs(teacherGuide),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const filename = `${title || 'lesson'}-teacher-guide.docx`
    .replace(/[^a-z0-9-_.]/gi, '-')
    .toLowerCase();
  saveAs(blob, filename);
}

// Extended StudentGroupInfo with audio and language support
export interface ExtendedStudentGroupInfo extends StudentGroupInfo {
  homeLanguage?: string;
  accommodations?: string[];
  preGeneratedAudio?: Array<{
    section_type: string;
    section_id: string;
    audio_url: string;
    language: string;
  }>;
}

// Export Student Handouts only as .docx with landscape orientation and QR codes
export async function exportStudentHandoutsDocx(
  content: string,
  title: string,
  groups: StudentGroupInfo[] | ExtendedStudentGroupInfo[]
): Promise<void> {
  const { studentHandouts } = parseMarkdownContent(content);
  
  if (!studentHandouts.length) {
    throw new Error('No Student Handouts section found in content');
  }

  const children: (Paragraph | Table)[] = [
    new Paragraph({
      text: 'STUDENT HANDOUTS',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Print from here for student distribution',
          italics: true,
          size: 20,
          font: 'Arial',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'ORDER: Handouts are arranged from lowest to highest reading level',
          size: 18,
          font: 'Arial',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
  ];

  for (let index = 0; index < studentHandouts.length; index++) {
    const handout = studentHandouts[index];
    const groupInfo = groups[index] as ExtendedStudentGroupInfo | undefined;
    
    if (index > 0) {
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }
    
    // Check if this is a bilingual group (non-English home language)
    const isBilingual = groupInfo?.homeLanguage && groupInfo.homeLanguage !== 'English';
    const hasReadAloud = groupInfo?.accommodations?.includes('Read Aloud');
    
    // Add QR code header for audio if pre-generated audio exists
    if (groupInfo?.preGeneratedAudio && groupInfo.preGeneratedAudio.length > 0) {
      const qrHeader = await createGroupAudioQRHeader(
        groupInfo.groupName,
        groupInfo.homeLanguage || 'English',
        groupInfo.preGeneratedAudio,
        hasReadAloud
      );
      children.push(...qrHeader);
    }
    
    // Add bilingual indicator if applicable
    if (isBilingual) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `📚 Bilingual: ${getLanguageFlag(groupInfo.homeLanguage!)} ${groupInfo.homeLanguage} | ${getLanguageFlag('English')} English`,
              bold: true,
              size: 22,
              font: 'Arial',
            }),
          ],
          alignment: AlignmentType.CENTER,
          shading: { type: ShadingType.SOLID, color: 'FFF3CD' },
          spacing: { before: 100, after: 200 },
        })
      );
    }
    
    // Add handout content
    children.push(...markdownToParagraphs(handout.content));
  }

  const doc = new Document({
    creator: 'Educator Tools',
    title: `${title} - Student Handouts`,
    sections: [
      {
        properties: {
          page: {
            size: {
              // LANDSCAPE: width > height (11" x 8.5")
              orientation: PageOrientation.LANDSCAPE,
              width: convertInchesToTwip(11),
              height: convertInchesToTwip(8.5),
            },
            margin: {
              top: convertInchesToTwip(1.0),
              bottom: convertInchesToTwip(0.75),
              left: convertInchesToTwip(0.5),
              right: convertInchesToTwip(0.5),
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const filename = `${title || 'lesson'}-student-handouts.docx`
    .replace(/[^a-z0-9-_.]/gi, '-')
    .toLowerCase();
  saveAs(blob, filename);
}

/**
 * Create placeholder QR header when audio is not yet generated
 */
function createPlaceholderAudioHeader(
  groupName: string,
  homeLanguage: string,
  hasReadAloud?: boolean
): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];
  
  elements.push(
    new Paragraph({
      children: [
        new TextRun({ text: '🔊 ', size: 28 }),
        new TextRun({
          text: 'AUDIO SUPPORT',
          bold: true,
          size: 24,
          font: 'Arial',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 100 },
      shading: { type: ShadingType.SOLID, color: 'FFF8E7' },
    })
  );
  
  elements.push(
    new Paragraph({
      children: [
        new TextRun({
          text: '⏳ Audio not yet generated - Use "Generate Audio" button then re-export',
          size: 20,
          font: 'Arial',
          italics: true,
          color: '9CA3AF',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      shading: { type: ShadingType.SOLID, color: 'FFF8E7' },
    })
  );
  
  return elements;
}

/**
 * Create QR code header block for a student group's audio
 */
async function createGroupAudioQRHeader(
  groupName: string,
  homeLanguage: string,
  audioRecords: Array<{ section_type: string; section_id: string; audio_url: string; language: string }>,
  hasReadAloud?: boolean
): Promise<(Paragraph | Table)[]> {
  // If no audio records, return placeholder
  if (!audioRecords || audioRecords.length === 0) {
    return createPlaceholderAudioHeader(groupName, homeLanguage, hasReadAloud);
  }
  
  const elements: (Paragraph | Table)[] = [];
  
  // Header
  elements.push(
    new Paragraph({
      children: [
        new TextRun({ text: '🔊 ', size: 28 }),
        new TextRun({
          text: 'AUDIO SUPPORT - Scan QR codes to listen',
          bold: true,
          size: 24,
          font: 'Arial',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 150 },
      shading: { type: ShadingType.SOLID, color: 'FFF8E7' },
    })
  );
  
  // Group audio by section type
  const sectionGroups = new Map<string, { english?: string; homeLanguage?: string }>();
  
  for (const audio of audioRecords) {
    const key = audio.section_type;
    if (!sectionGroups.has(key)) {
      sectionGroups.set(key, {});
    }
    const group = sectionGroups.get(key)!;
    if (audio.language === 'English') {
      group.english = audio.audio_url;
    } else {
      group.homeLanguage = audio.audio_url;
    }
  }
  
  // Create QR cells for each section
  const qrCells: TableCell[] = [];
  const sectionLabels: Record<string, string> = {
    'learning-target': '🎯 Learning Target',
    'instructions': '📋 Instructions',
    'vocabulary': '📚 Vocabulary',
    'content': '📖 Content',
    'practice': '✏️ Practice',
    'reflection-prompt': '💭 Reflection',
    'independent-practice': '✏️ Practice',
    'exit-ticket': '📝 Exit Ticket',
  };
  
  for (const [sectionType, urls] of sectionGroups) {
    if (!urls.english && !urls.homeLanguage) continue;
    
    const cellContent: Paragraph[] = [
      new Paragraph({
        children: [
          new TextRun({
            text: sectionLabels[sectionType] || sectionType,
            bold: true,
            size: 18,
            font: 'Arial',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
      }),
    ];
    
    // Add QR codes
    const qrElements: (ImageRun | TextRun)[] = [];
    
    // Home language QR (if bilingual)
    if (urls.homeLanguage && homeLanguage !== 'English') {
      try {
        const homeQR = await generateQRCode(urls.homeLanguage, 50);
        const homeQRBuffer = await dataUrlToArrayBuffer(homeQR);
        qrElements.push(
          new ImageRun({
            type: 'png',
            data: homeQRBuffer,
            transformation: { width: 50, height: 50 },
          })
        );
        qrElements.push(new TextRun({ text: ' ' }));
      } catch (e) {
        console.error('Failed to generate home language QR:', e);
      }
    }
    
    // English QR
    if (urls.english) {
      try {
        const engQR = await generateQRCode(urls.english, 50);
        const engQRBuffer = await dataUrlToArrayBuffer(engQR);
        qrElements.push(
          new ImageRun({
            type: 'png',
            data: engQRBuffer,
            transformation: { width: 50, height: 50 },
          })
        );
      } catch (e) {
        console.error('Failed to generate English QR:', e);
      }
    }
    
    if (qrElements.length > 0) {
      cellContent.push(
        new Paragraph({
          children: qrElements,
          alignment: AlignmentType.CENTER,
        })
      );
      
      // Language labels
      const langLabel = homeLanguage !== 'English' && urls.homeLanguage
        ? `${getLanguageFlag(homeLanguage)} / ${getLanguageFlag('English')}`
        : `${getLanguageFlag('English')} English`;
      
      cellContent.push(
        new Paragraph({
          children: [
            new TextRun({
              text: langLabel,
              size: 14,
              font: 'Arial',
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 40 },
        })
      );
    }
    
    qrCells.push(
      new TableCell({
        children: cellContent,
        width: { size: 25, type: WidthType.PERCENTAGE },
        shading: { fill: 'FFF8E7' },
        margins: { top: 80, bottom: 80, left: 60, right: 60 },
      })
    );
  }
  
  if (qrCells.length > 0) {
    // Split into rows of 4
    const rows: TableRow[] = [];
    for (let i = 0; i < qrCells.length; i += 4) {
      const rowCells = qrCells.slice(i, i + 4);
      // Pad row to 4 cells if needed
      while (rowCells.length < 4) {
        rowCells.push(
          new TableCell({
            children: [new Paragraph({ text: '' })],
            shading: { fill: 'FFF8E7' },
            width: { size: 25, type: WidthType.PERCENTAGE },
          })
        );
      }
      rows.push(new TableRow({ children: rowCells }));
    }
    
    elements.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows,
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: 'E5C07B' },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E5C07B' },
          left: { style: BorderStyle.SINGLE, size: 1, color: 'E5C07B' },
          right: { style: BorderStyle.SINGLE, size: 1, color: 'E5C07B' },
        },
      })
    );
  }
  
  elements.push(new Paragraph({ text: '', spacing: { after: 200 } }));
  
  return elements;
}

/**
 * Export Student Handouts with embedded audio QR codes
 */
export async function exportStudentHandoutsWithAudioDocx(
  content: string,
  title: string,
  groups: StudentGroupInfo[],
  audioSections: AudioSection[]
): Promise<void> {
  const { studentHandouts } = parseMarkdownContent(content);
  
  if (!studentHandouts.length) {
    throw new Error('No Student Handouts section found in content');
  }

  const children: (Paragraph | Table)[] = [
    new Paragraph({
      text: 'STUDENT HANDOUTS',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 400 },
    }),
  ];

  for (let index = 0; index < studentHandouts.length; index++) {
    const handout = studentHandouts[index];
    const groupInfo = groups[index];
    
    if (index > 0) {
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }
    
    // Find audio for this group
    const audio = audioSections.find(
      a => a.groupId === groupInfo?.id || a.groupName === groupInfo?.groupName
    );
    
    // Add audio block at top of handout if audio exists
    if (audio) {
      const audioBlocks = await createAudioBlockParagraph(audio.audioUrl, audio.language);
      children.push(...audioBlocks);
    }
    
    // Add handout content
    children.push(...markdownToParagraphs(handout.content));
  }

  const doc = new Document({
    creator: 'Educator Tools',
    title: `${title} - Student Handouts with Audio`,
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const filename = `${title || 'lesson'}-student-handouts-with-audio.docx`
    .replace(/[^a-z0-9-_.]/gi, '-')
    .toLowerCase();
  saveAs(blob, filename);
}

// Parse markdown tables to structured data
function parseMarkdownTable(tableText: string): { headers: string[]; rows: string[][] } {
  const lines = tableText.trim().split('\n').filter(line => line.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  const parseRow = (line: string): string[] => {
    return line
      .split('|')
      .map(cell => cell.trim())
      .filter(cell => cell && !cell.match(/^[-:]+$/));
  };

  const headers = parseRow(lines[0]);
  const rows = lines.slice(2).map(parseRow); // Skip header and separator

  return { headers, rows };
}

// Generate Word document for rubric
function generateRubricDocument(
  rubricContent: string,
  assessmentDescription: string,
  learningObjectives: string[],
  gradeLevel?: string,
  aiVulnerabilityScore?: number | null
): Document {
  const children: Paragraph[] = [];

  // Title
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Assessment Rubric',
          bold: true,
          size: 48,
          font: 'Arial',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 200 },
    })
  );

  // Metadata
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Generated: ${new Date().toLocaleDateString()}`,
          size: 22,
          font: 'Arial',
          italics: true,
        }),
        ...(gradeLevel ? [
          new TextRun({ text: '  |  ', size: 22, font: 'Arial' }),
          new TextRun({ text: `Grade: ${gradeLevel}`, size: 22, font: 'Arial', italics: true }),
        ] : []),
        ...(aiVulnerabilityScore !== null && aiVulnerabilityScore !== undefined ? [
          new TextRun({ text: '  |  ', size: 22, font: 'Arial' }),
          new TextRun({ 
            text: `AI Vulnerability Score: ${aiVulnerabilityScore}`, 
            size: 22, 
            font: 'Arial', 
            italics: true 
          }),
        ] : []),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  // Assessment Description
  children.push(
    new Paragraph({
      text: 'Assessment Description',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 150 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: assessmentDescription,
          size: DOC_STYLES.body.size,
          font: DOC_STYLES.body.font,
        }),
      ],
      spacing: { after: 300 },
    })
  );

  // Learning Objectives
  children.push(
    new Paragraph({
      text: 'Learning Objectives',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 150 },
    })
  );
  
  learningObjectives.forEach((obj, index) => {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${index + 1}. ${obj}`,
            size: DOC_STYLES.body.size,
            font: DOC_STYLES.body.font,
          }),
        ],
        spacing: { before: 50, after: 50 },
      })
    );
  });

  // Rubric Content
  children.push(
    new Paragraph({
      text: 'Rubric',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 200 },
    })
  );

  // Parse and convert rubric markdown content
  const rubricParagraphs = markdownToParagraphs(rubricContent);
  children.push(...rubricParagraphs);

  return new Document({
    creator: 'Educator Tools',
    title: 'Assessment Rubric',
    description: assessmentDescription,
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.LANDSCAPE,
            },
            margin: {
              top: convertInchesToTwip(0.5),
              bottom: convertInchesToTwip(0.5),
              left: convertInchesToTwip(0.5),
              right: convertInchesToTwip(0.5),
            },
          },
        },
        children,
      },
    ],
  });
}

// Export rubric as .docx file
export async function exportRubricAsDocx(
  rubricContent: string,
  assessmentDescription: string,
  learningObjectives: string[],
  gradeLevel?: string,
  aiVulnerabilityScore?: number | null
): Promise<void> {
  const doc = generateRubricDocument(
    rubricContent,
    assessmentDescription,
    learningObjectives,
    gradeLevel,
    aiVulnerabilityScore
  );
  
  const blob = await Packer.toBlob(doc);
  const filename = `rubric-${assessmentDescription.slice(0, 30).replace(/[^a-z0-9]/gi, '-')}.docx`
    .toLowerCase();
  saveAs(blob, filename);
}

// Export rubric as markdown file
export function exportRubricAsMarkdown(
  rubricContent: string,
  assessmentDescription: string,
  learningObjectives: string[],
  gradeLevel?: string,
  aiVulnerabilityScore?: number | null
): void {
  let content = `# Assessment Rubric\n\n`;
  content += `**Generated:** ${new Date().toLocaleDateString()}\n`;
  if (gradeLevel) content += `**Grade Level:** ${gradeLevel}\n`;
  if (aiVulnerabilityScore !== null && aiVulnerabilityScore !== undefined) {
    content += `**AI Vulnerability Score:** ${aiVulnerabilityScore}\n`;
  }
  content += `\n## Assessment Description\n\n${assessmentDescription}\n\n`;
  content += `## Learning Objectives\n\n`;
  learningObjectives.forEach((obj, i) => {
    content += `${i + 1}. ${obj}\n`;
  });
  content += `\n## Rubric\n\n${rubricContent}`;

  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const filename = `rubric-${assessmentDescription.slice(0, 30).replace(/[^a-z0-9]/gi, '-')}.md`
    .toLowerCase();
  saveAs(blob, filename);
}

// Download assessment template for teachers to fill out
export function downloadAssessmentTemplate(): void {
  const template = `# Assessment Description Template

Use this template to prepare your assessment description. Fill out each section, then upload this file or copy-paste the content into the Rubric Generator.

---

## Assessment Title
[Enter a clear, descriptive title for your assessment]

## Assessment Description
[Describe what students will create, produce, or demonstrate. Be specific about:
- The format/product (essay, poster, presentation, project, etc.)
- Required components or elements
- Any specific requirements (length, number of sources, etc.)]

Example: "Students will create a food web poster showing at least 10 organisms from their local ecosystem, including producers, primary consumers, secondary consumers, and decomposers. They must include arrows showing energy flow and write a paragraph explaining one example of interdependence."

## Grade Level
[Enter the grade level: e.g., 5th Grade, High School, etc.]

## Subject Area
[Enter the subject: e.g., Science, English Language Arts, Math, Social Studies, etc.]

## Learning Objectives
List the specific learning objectives this assessment addresses:

1. [First learning objective]
2. [Second learning objective]
3. [Third learning objective]
4. [Add more as needed]

## AI-Resistant Elements (Optional)
Consider including elements that make this assessment harder for AI to complete:

- [ ] Requires local/community-specific knowledge
- [ ] Requires physical artifacts (photos, handwritten notes, etc.)
- [ ] Includes live presentation or Q&A component
- [ ] Requires personal reflection on specific experiences
- [ ] Involves primary research (interviews, surveys, observations)
- [ ] Requires process documentation (drafts, research logs)

## Additional Notes
[Any other context that would help generate a better rubric]

---

Once completed, upload this file using the "Upload File" button or copy the content into the Assessment Description field.
`;

  const blob = new Blob([template], { type: 'text/markdown;charset=utf-8' });
  saveAs(blob, 'assessment-template.md');
}

/**
 * Interface for bilingual content sections
 */
export interface BilingualSection {
  sectionType: string;
  sectionLabel: string;
  englishContent: string;
  homeLanguageContent: string;
  englishAudioUrl?: string;
  homeLanguageAudioUrl?: string;
}

export interface BilingualDocumentConfig {
  homeLanguage: string;
  groupName: string;
  readingLevel?: string;
}

/**
 * Border helper functions for bilingual table styling
 */
function noBorders() {
  return {
    top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  };
}

function leftColumnBorders() {
  return {
    top: { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' },
    left: { style: BorderStyle.SINGLE, size: 8, color: 'D97706' },
    right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  };
}

function rightColumnBorders() {
  return {
    top: { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' },
    left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    right: { style: BorderStyle.SINGLE, size: 8, color: '1E40AF' },
  };
}

function gutterBorders() {
  return {
    top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    left: { style: BorderStyle.DASHED, size: 4, color: 'D1D5DB' },
    right: { style: BorderStyle.DASHED, size: 4, color: 'D1D5DB' },
  };
}

function cellMargins() {
  return {
    top: convertInchesToTwip(0.1),
    bottom: convertInchesToTwip(0.1),
    left: convertInchesToTwip(0.15),
    right: convertInchesToTwip(0.15),
  };
}

/**
 * Create a side-by-side bilingual table for DOCX with 3-column layout (home language LEFT, gutter, English RIGHT)
 */
async function createBilingualContentTable(
  englishContent: string,
  homeLanguageContent: string,
  homeLanguage: string
): Promise<Table> {
  const englishLines = englishContent.split('\n').filter(l => l.trim());
  const homeLanguageLines = homeLanguageContent.split('\n').filter(l => l.trim());
  const maxLines = Math.max(englishLines.length, homeLanguageLines.length);
  
  const rows: TableRow[] = [];
  
  // Header row with language labels - HOME LANGUAGE LEFT, ENGLISH RIGHT
  rows.push(
    new TableRow({
      tableHeader: true,
      children: [
        // LEFT COLUMN: Home Language
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: `${getLanguageFlag(homeLanguage)} ${homeLanguage}`,
                  bold: true,
                  size: 24,
                  font: 'Arial',
                  color: 'FFFFFF',
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
          width: { size: 48, type: WidthType.PERCENTAGE },
          shading: { fill: 'D97706' }, // Amber background
          margins: cellMargins(),
        }),
        // GUTTER (thin middle column)
        new TableCell({
          children: [new Paragraph({ text: '' })],
          width: { size: 4, type: WidthType.PERCENTAGE },
          borders: noBorders(),
          shading: { fill: 'F3F4F6' },
        }),
        // RIGHT COLUMN: English
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: `${getLanguageFlag('English')} English`,
                  bold: true,
                  size: 24,
                  font: 'Arial',
                  color: 'FFFFFF',
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
          width: { size: 48, type: WidthType.PERCENTAGE },
          shading: { fill: '1E40AF' }, // Blue background
          margins: cellMargins(),
        }),
      ],
    })
  );
  
  // Content rows - aligned line by line with gutter
  for (let i = 0; i < maxLines; i++) {
    const homeText = homeLanguageLines[i] || '';
    const engText = englishLines[i] || '';
    
    rows.push(
      new TableRow({
        children: [
          // LEFT: Home Language content
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: homeText,
                    size: 22,
                    font: 'Arial',
                  }),
                ],
              }),
            ],
            width: { size: 48, type: WidthType.PERCENTAGE },
            borders: leftColumnBorders(),
            margins: cellMargins(),
            shading: { fill: 'FFFBEB' }, // Light amber tint
          }),
          // GUTTER
          new TableCell({
            children: [new Paragraph({ text: '' })],
            width: { size: 4, type: WidthType.PERCENTAGE },
            borders: gutterBorders(),
            shading: { fill: 'F3F4F6' },
          }),
          // RIGHT: English content
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: engText,
                    size: 22,
                    font: 'Arial',
                  }),
                ],
              }),
            ],
            width: { size: 48, type: WidthType.PERCENTAGE },
            borders: rightColumnBorders(),
            margins: cellMargins(),
            shading: { fill: 'EFF6FF' }, // Light blue tint
          }),
        ],
      })
    );
  }
  
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows,
  });
}

/**
 * Create QR codes header block for bilingual document
 * Shows placeholder message if no audio is available
 */
async function createBilingualQRHeader(
  sections: BilingualSection[],
  homeLanguage: string
): Promise<(Paragraph | Table)[]> {
  const elements: (Paragraph | Table)[] = [];
  
  // Check if any sections have audio
  const hasAnyAudio = sections.some(s => s.englishAudioUrl || s.homeLanguageAudioUrl);
  
  // Header
  elements.push(
    new Paragraph({
      children: [
        new TextRun({ text: '🔊 ', size: 28 }),
        new TextRun({
          text: 'AUDIO SUPPORT',
          bold: true,
          size: 24,
          font: 'Arial',
        }),
        new TextRun({
          text: hasAnyAudio ? ' - Scan QR codes to listen' : '',
          size: 24,
          font: 'Arial',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 150 },
      shading: { type: ShadingType.SOLID, color: 'FFF8E7' },
    })
  );
  
  // Show placeholder if no audio
  if (!hasAnyAudio) {
    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '⏳ Audio not yet generated',
            size: 20,
            font: 'Arial',
            italics: true,
            color: '9CA3AF',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
        shading: { type: ShadingType.SOLID, color: 'FFF8E7' },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'Use "Generate Audio" button then re-export to add QR codes',
            size: 18,
            font: 'Arial',
            italics: true,
            color: '9CA3AF',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        shading: { type: ShadingType.SOLID, color: 'FFF8E7' },
      })
    );
    return elements;
  }
  
  // Create QR code cells for each section with audio
  const qrCells: TableCell[] = [];
  
  for (const section of sections) {
    if (!section.englishAudioUrl && !section.homeLanguageAudioUrl) continue;
    
    const cellContent: Paragraph[] = [
      new Paragraph({
        children: [
          new TextRun({
            text: section.sectionLabel,
            bold: true,
            size: 18,
            font: 'Arial',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
      }),
    ];
    
    // Add QR codes side by side
    const qrElements: (ImageRun | TextRun)[] = [];
    
    if (section.homeLanguageAudioUrl) {
      try {
        const homeQR = await generateQRCode(section.homeLanguageAudioUrl, 50);
        const homeQRBuffer = await dataUrlToArrayBuffer(homeQR);
        qrElements.push(
          new ImageRun({
            type: 'png',
            data: homeQRBuffer,
            transformation: { width: 50, height: 50 },
          })
        );
        qrElements.push(new TextRun({ text: ' ' }));
      } catch (e) {
        console.error('Failed to generate home language QR:', e);
      }
    }
    
    if (section.englishAudioUrl) {
      try {
        const engQR = await generateQRCode(section.englishAudioUrl, 50);
        const engQRBuffer = await dataUrlToArrayBuffer(engQR);
        qrElements.push(
          new ImageRun({
            type: 'png',
            data: engQRBuffer,
            transformation: { width: 50, height: 50 },
          })
        );
      } catch (e) {
        console.error('Failed to generate English QR:', e);
      }
    }
    
    if (qrElements.length > 0) {
      cellContent.push(
        new Paragraph({
          children: qrElements,
          alignment: AlignmentType.CENTER,
        })
      );
      
      cellContent.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${getLanguageFlag(homeLanguage)} / ${getLanguageFlag('English')}`,
              size: 14,
              font: 'Arial',
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 40 },
        })
      );
    }
    
    qrCells.push(
      new TableCell({
        children: cellContent,
        width: { size: Math.floor(100 / Math.min(sections.length, 4)), type: WidthType.PERCENTAGE },
        shading: { fill: 'FFF8E7' },
        margins: { top: 80, bottom: 80, left: 60, right: 60 },
      })
    );
  }
  
  if (qrCells.length > 0) {
    // Split into rows of 4
    const rows: TableRow[] = [];
    for (let i = 0; i < qrCells.length; i += 4) {
      const rowCells = qrCells.slice(i, i + 4);
      // Pad to 4 cells if needed
      while (rowCells.length < 4 && qrCells.length > 4) {
        rowCells.push(
          new TableCell({
            children: [new Paragraph({ text: '' })],
            shading: { fill: 'FFF8E7' },
          })
        );
      }
      rows.push(new TableRow({ children: rowCells }));
    }
    
    elements.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows,
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: 'E5C07B' },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E5C07B' },
          left: { style: BorderStyle.SINGLE, size: 1, color: 'E5C07B' },
          right: { style: BorderStyle.SINGLE, size: 1, color: 'E5C07B' },
        },
      })
    );
  }
  
  elements.push(
    new Paragraph({ text: '', spacing: { after: 300 } })
  );
  
  return elements;
}

/**
 * Export bilingual student handout as LANDSCAPE DOCX with side-by-side 3-column layout
 * Home language on LEFT (amber), gutter in middle, English on RIGHT (blue)
 */
export async function exportBilingualHandoutDocx(
  sections: BilingualSection[],
  config: BilingualDocumentConfig,
  title: string
): Promise<void> {
  const children: (Paragraph | Table)[] = [];
  
  // Title with reading level
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: title || 'Student Handout',
          bold: true,
          size: 36,
          font: 'Arial',
        }),
        ...(config.readingLevel ? [
          new TextRun({
            text: `  •  ${config.readingLevel} Edition`,
            size: 28,
            font: 'Arial',
            color: 'D97706',
          }),
        ] : []),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 150 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Bilingual: ${getLanguageFlag(config.homeLanguage)} ${config.homeLanguage} / ${getLanguageFlag('English')} English`,
          size: 22,
          font: 'Arial',
          italics: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 250 },
    })
  );
  
  // Add QR codes header at TOP
  const qrHeader = await createBilingualQRHeader(sections, config.homeLanguage);
  children.push(...qrHeader);
  
  // Divider line after QR codes
  children.push(
    new Paragraph({
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 12, color: 'D97706' },
      },
      spacing: { after: 250 },
    })
  );
  
  // Student info row (Name, Date, Period)
  children.push(generateStudentInfoRow());
  
  // Add each section with side-by-side layout
  for (const section of sections) {
    // Section label
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: section.sectionLabel,
            bold: true,
            size: 26,
            font: 'Arial',
          }),
        ],
        spacing: { before: 300, after: 150 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 2, color: '000000' },
        },
      })
    );
    
    // Side-by-side content table with 3 columns (home lang LEFT, gutter, English RIGHT)
    const contentTable = await createBilingualContentTable(
      section.englishContent,
      section.homeLanguageContent,
      config.homeLanguage
    );
    children.push(contentTable);
    children.push(new Paragraph({ text: '', spacing: { after: 200 } }));
  }
  
  const doc = new Document({
    creator: 'Educator Tools',
    title: `${title} - Bilingual Handout`,
    sections: [
      {
        properties: {
          page: {
            size: {
              // LANDSCAPE: width > height (11" x 8.5")
              orientation: PageOrientation.LANDSCAPE,
              width: convertInchesToTwip(11),
              height: convertInchesToTwip(8.5),
            },
            margin: {
              top: convertInchesToTwip(1.0),   // Extra space for QR header
              bottom: convertInchesToTwip(0.75),
              left: convertInchesToTwip(0.5),
              right: convertInchesToTwip(0.5),
            },
          },
        },
        children,
      },
    ],
  });
  
  const blob = await Packer.toBlob(doc);
  const safeTitle = (title || 'handout').replace(/[^a-z0-9]/gi, '-').toLowerCase();
  const safeGroup = config.groupName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  saveAs(blob, `${safeTitle}-${safeGroup}-bilingual.docx`);
}

/**
 * Interface for aligned bilingual row
 */
export interface AlignedRow {
  id: string;
  type: 'heading' | 'instruction' | 'question' | 'answer-line' | 'answer-box' | 'drawing-space' | 'spacer' | 'content' | 'vocabulary';
  homeLanguage: { text: string; lineCount: number };
  english: { text: string; lineCount: number };
  alignedLineCount: number;
  drawingHeight?: number;
}

/**
 * Get cell style based on row type
 */
function getCellStyleForType(type: AlignedRow['type']): { fontSize: number; bold: boolean } {
  switch (type) {
    case 'heading':
      return { fontSize: 26, bold: true };
    case 'instruction':
      return { fontSize: 22, bold: false };
    case 'question':
      return { fontSize: 22, bold: false };
    case 'vocabulary':
      return { fontSize: 20, bold: false };
    default:
      return { fontSize: 22, bold: false };
  }
}

/**
 * Generate answer space paragraph for DOCX
 */
function generateAnswerSpaceParagraph(lines: number, type: 'answer-line' | 'answer-box'): Paragraph {
  if (type === 'answer-line') {
    return new Paragraph({
      children: [
        new TextRun({
          text: '_'.repeat(50),
          size: 22,
          font: 'Arial',
          color: '9CA3AF',
        }),
      ],
      spacing: { before: 100, after: 100 },
    });
  } else {
    const lineTexts: TextRun[] = [];
    for (let i = 0; i < lines; i++) {
      lineTexts.push(
        new TextRun({
          text: '_'.repeat(50),
          size: 22,
          font: 'Arial',
          color: '9CA3AF',
        })
      );
      if (i < lines - 1) {
        lineTexts.push(new TextRun({ text: '\n', size: 22 }));
      }
    }
    return new Paragraph({
      children: lineTexts,
      spacing: { before: 100, after: 100 },
    });
  }
}

/**
 * Generate drawing space paragraph for DOCX
 */
function generateDrawingSpaceParagraph(height: number = 5): Paragraph {
  // Create a bordered box for drawing
  return new Paragraph({
    children: [
      new TextRun({
        text: '[DRAWING SPACE]',
        size: 18,
        font: 'Arial',
        color: '9CA3AF',
        italics: true,
      }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { before: 100, after: 100 },
    border: {
      top: { style: BorderStyle.DASHED, size: 8, color: 'D1D5DB' },
      bottom: { style: BorderStyle.DASHED, size: 8, color: 'D1D5DB' },
      left: { style: BorderStyle.DASHED, size: 8, color: 'D1D5DB' },
      right: { style: BorderStyle.DASHED, size: 8, color: 'D1D5DB' },
    },
  });
}

/**
 * Generate student info row (Name, Date, Period fields)
 */
function generateStudentInfoRow(): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: 'Name: ', size: 22, font: 'Arial' }),
      new TextRun({ text: '_'.repeat(30), size: 22, font: 'Arial' }),
      new TextRun({ text: '     Date: ', size: 22, font: 'Arial' }),
      new TextRun({ text: '_'.repeat(15), size: 22, font: 'Arial' }),
      new TextRun({ text: '     Period: ', size: 22, font: 'Arial' }),
      new TextRun({ text: '_'.repeat(8), size: 22, font: 'Arial' }),
    ],
    spacing: { before: 200, after: 300 },
  });
}

/**
 * Audio QR Header interface for DOCX generation
 */
export interface AudioQRHeaderData {
  sectionTitle: string;
  studentGroup: string;
  audioLinks: {
    homeLanguage?: {
      language: string;
      qrDataUrl: string;
      shortUrl: string;
      label: string;
    };
    english: {
      qrDataUrl: string;
      shortUrl: string;
      label: string;
    };
    readAloud?: {
      qrDataUrl: string;
      shortUrl: string;
      label: string;
    };
  };
}

/**
 * Generate QR header section for bilingual DOCX
 */
async function generateQRHeaderSection(
  qrHeader: AudioQRHeaderData,
  readingLevel?: string
): Promise<(Paragraph | Table)[]> {
  const elements: (Paragraph | Table)[] = [];

  // Title with reading level
  elements.push(
    new Paragraph({
      children: [
        new TextRun({
          text: qrHeader.sectionTitle,
          bold: true,
          size: 36,
          font: 'Arial',
        }),
        ...(readingLevel ? [
          new TextRun({
            text: `  •  ${readingLevel} Edition`,
            size: 28,
            font: 'Arial',
            color: 'D97706',
          }),
        ] : []),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  );

  // Audio instruction
  elements.push(
    new Paragraph({
      children: [
        new TextRun({
          text: '🎧 Scan a QR code to listen to instructions:',
          size: 22,
          font: 'Arial',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  );

  // Build QR code cells
  const qrCells: TableCell[] = [];

  // Home Language QR (if exists)
  if (qrHeader.audioLinks.homeLanguage) {
    try {
      const qrImageBuffer = await dataUrlToArrayBuffer(qrHeader.audioLinks.homeLanguage.qrDataUrl);
      qrCells.push(
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new ImageRun({
                  type: 'png',
                  data: qrImageBuffer,
                  transformation: { width: 70, height: 70 },
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: qrHeader.audioLinks.homeLanguage.label,
                  size: 18,
                  font: 'Arial',
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: qrHeader.audioLinks.homeLanguage.shortUrl,
                  size: 14,
                  font: 'Arial',
                  color: '6B7280',
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
          width: { size: 25, type: WidthType.PERCENTAGE },
          borders: noBorders(),
          margins: { top: 80, bottom: 80, left: 60, right: 60 },
        })
      );
    } catch (e) {
      console.error('Failed to create home language QR cell:', e);
    }
  }

  // English QR (always present)
  try {
    const englishQRBuffer = await dataUrlToArrayBuffer(qrHeader.audioLinks.english.qrDataUrl);
    qrCells.push(
      new TableCell({
        children: [
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
                text: qrHeader.audioLinks.english.label,
                size: 18,
                font: 'Arial',
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: qrHeader.audioLinks.english.shortUrl,
                size: 14,
                font: 'Arial',
                color: '6B7280',
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
        ],
        width: { size: 25, type: WidthType.PERCENTAGE },
        borders: noBorders(),
        margins: { top: 80, bottom: 80, left: 60, right: 60 },
      })
    );
  } catch (e) {
    console.error('Failed to create English QR cell:', e);
  }

  // Read Aloud QR (if accommodation selected)
  if (qrHeader.audioLinks.readAloud) {
    try {
      const readAloudQRBuffer = await dataUrlToArrayBuffer(qrHeader.audioLinks.readAloud.qrDataUrl);
      qrCells.push(
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new ImageRun({
                  type: 'png',
                  data: readAloudQRBuffer,
                  transformation: { width: 70, height: 70 },
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: qrHeader.audioLinks.readAloud.label,
                  size: 18,
                  font: 'Arial',
                  bold: true,
                  color: '1E40AF',
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: qrHeader.audioLinks.readAloud.shortUrl,
                  size: 14,
                  font: 'Arial',
                  color: '6B7280',
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
          width: { size: 25, type: WidthType.PERCENTAGE },
          borders: noBorders(),
          shading: { fill: 'EFF6FF' },
          margins: { top: 80, bottom: 80, left: 60, right: 60 },
        })
      );
    } catch (e) {
      console.error('Failed to create read aloud QR cell:', e);
    }
  }

  // Add spacer cells to center QR codes
  if (qrCells.length > 0 && qrCells.length < 4) {
    const spacerWidth = Math.floor((100 - qrCells.length * 25) / 2);
    qrCells.unshift(
      new TableCell({
        children: [new Paragraph({ text: '' })],
        width: { size: spacerWidth, type: WidthType.PERCENTAGE },
        borders: noBorders(),
      })
    );
    qrCells.push(
      new TableCell({
        children: [new Paragraph({ text: '' })],
        width: { size: spacerWidth, type: WidthType.PERCENTAGE },
        borders: noBorders(),
      })
    );
  }

  if (qrCells.length > 0) {
    elements.push(
      new Table({
        rows: [new TableRow({ children: qrCells })],
        width: { size: 100, type: WidthType.PERCENTAGE },
      })
    );
  }

  return elements;
}

/**
 * Generate enhanced bilingual content table with gutter and color-coded columns
 */
async function generateEnhancedBilingualContentTable(
  rows: AlignedRow[],
  homeLanguage: string
): Promise<Table> {
  const tableRows: TableRow[] = [];

  // Column headers with color coding
  tableRows.push(
    new TableRow({
      tableHeader: true,
      children: [
        // Home Language Header (LEFT)
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: `${getLanguageFlag(homeLanguage)} ${homeLanguage}`,
                  bold: true,
                  size: 24,
                  font: 'Arial',
                  color: 'FFFFFF',
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
          width: { size: 48, type: WidthType.PERCENTAGE },
          shading: { fill: 'D97706' }, // Amber background
          margins: cellMargins(),
        }),
        // Gutter
        new TableCell({
          children: [new Paragraph({ text: '' })],
          width: { size: 4, type: WidthType.PERCENTAGE },
          borders: noBorders(),
        }),
        // English Header (RIGHT)
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: '🇺🇸 English',
                  bold: true,
                  size: 24,
                  font: 'Arial',
                  color: 'FFFFFF',
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
          width: { size: 48, type: WidthType.PERCENTAGE },
          shading: { fill: '1E40AF' }, // Blue background
          margins: cellMargins(),
        }),
      ],
    })
  );

  // Content rows
  for (const row of rows) {
    const cellStyle = getCellStyleForType(row.type);
    const isAnswerSpace = row.type === 'answer-line' || row.type === 'answer-box';
    const isDrawingSpace = row.type === 'drawing-space';
    const minHeight = isDrawingSpace ? (row.drawingHeight || 5) * 300 : row.alignedLineCount * 300;

    const getContentParagraph = (text: string) => {
      if (isDrawingSpace) {
        return generateDrawingSpaceParagraph(row.drawingHeight || 5);
      }
      if (isAnswerSpace) {
        return generateAnswerSpaceParagraph(row.alignedLineCount, row.type as 'answer-line' | 'answer-box');
      }
      return new Paragraph({
        children: [
          new TextRun({
            text,
            size: cellStyle.fontSize,
            font: 'Arial',
            bold: cellStyle.bold,
          }),
        ],
        spacing: { after: 100 },
      });
    };

    tableRows.push(
      new TableRow({
        children: [
          // Home Language Column (LEFT)
          new TableCell({
            children: [getContentParagraph(row.homeLanguage.text)],
            width: { size: 48, type: WidthType.PERCENTAGE },
            borders: leftColumnBorders(),
            margins: cellMargins(),
            shading: { fill: 'FFFBEB' }, // Light amber tint
          }),
          // Gutter (middle divider)
          new TableCell({
            children: [new Paragraph({ text: '' })],
            width: { size: 4, type: WidthType.PERCENTAGE },
            borders: gutterBorders(),
            shading: { fill: 'F3F4F6' },
          }),
          // English Column (RIGHT)
          new TableCell({
            children: [getContentParagraph(row.english.text)],
            width: { size: 48, type: WidthType.PERCENTAGE },
            borders: rightColumnBorders(),
            margins: cellMargins(),
            shading: { fill: 'EFF6FF' }, // Light blue tint
          }),
        ],
        height: { value: minHeight, rule: 'atLeast' as any },
      })
    );
  }

  return new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

/**
 * Generate complete bilingual assignment DOCX with QR header, student info, and aligned content
 */
export async function generateBilingualAssignmentDocx(
  sectionTitle: string,
  alignedRows: AlignedRow[],
  qrHeader: AudioQRHeaderData | null,
  config: BilingualDocumentConfig,
  title?: string
): Promise<Document> {
  const children: (Paragraph | Table)[] = [];

  // QR Code Header (if available)
  if (qrHeader) {
    const qrHeaderElements = await generateQRHeaderSection(qrHeader, config.readingLevel);
    children.push(...qrHeaderElements);

    // Divider line
    children.push(
      new Paragraph({
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 12, color: 'D97706' },
        },
        spacing: { after: 300 },
      })
    );
  } else {
    // Title without QR header
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: title || sectionTitle || 'Student Assignment',
            bold: true,
            size: 36,
            font: 'Arial',
          }),
          ...(config.readingLevel ? [
            new TextRun({
              text: `  •  ${config.readingLevel} Edition`,
              size: 28,
              font: 'Arial',
              color: 'D97706',
            }),
          ] : []),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Bilingual: ${getLanguageFlag(config.homeLanguage)} ${config.homeLanguage} / ${getLanguageFlag('English')} English`,
            size: 22,
            font: 'Arial',
            italics: true,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
      })
    );
  }

  // Student info line (Name, Date, Period)
  children.push(generateStudentInfoRow());

  // Main bilingual content table
  const contentTable = await generateEnhancedBilingualContentTable(alignedRows, config.homeLanguage);
  children.push(contentTable);

  return new Document({
    creator: 'Educator Tools',
    title: `${title || sectionTitle} - Bilingual Assignment`,
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.LANDSCAPE,
              width: convertInchesToTwip(11),
              height: convertInchesToTwip(8.5),
            },
            margin: {
              top: convertInchesToTwip(1.5),
              bottom: convertInchesToTwip(0.75),
              left: convertInchesToTwip(0.75),
              right: convertInchesToTwip(0.75),
            },
          },
        },
        children,
      },
    ],
  });
}

/**
 * Export bilingual assignment as DOCX file
 */
export async function exportBilingualAssignmentDocx(
  sectionTitle: string,
  alignedRows: AlignedRow[],
  qrHeader: AudioQRHeaderData | null,
  config: BilingualDocumentConfig,
  title?: string
): Promise<void> {
  const doc = await generateBilingualAssignmentDocx(sectionTitle, alignedRows, qrHeader, config, title);
  const blob = await Packer.toBlob(doc);
  const safeTitle = (title || sectionTitle || 'assignment').replace(/[^a-z0-9]/gi, '-').toLowerCase();
  const safeGroup = config.groupName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  saveAs(blob, `${safeTitle}-${safeGroup}-bilingual.docx`);
}

/**
 * Create aligned bilingual table from pre-aligned content with 3-column layout (home lang LEFT, gutter, English RIGHT)
 */
async function createAlignedBilingualTable(
  rows: AlignedRow[],
  homeLanguage: string
): Promise<Table> {
  const tableRows: TableRow[] = [];

  // Header row with color-coded columns - HOME LANGUAGE LEFT, ENGLISH RIGHT
  tableRows.push(
    new TableRow({
      tableHeader: true,
      children: [
        // LEFT: Home Language
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: `${getLanguageFlag(homeLanguage)} ${homeLanguage}`,
                  bold: true,
                  size: 24,
                  font: 'Arial',
                  color: 'FFFFFF',
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
          width: { size: 48, type: WidthType.PERCENTAGE },
          shading: { fill: 'D97706' }, // Amber
          margins: cellMargins(),
        }),
        // GUTTER
        new TableCell({
          children: [new Paragraph({ text: '' })],
          width: { size: 4, type: WidthType.PERCENTAGE },
          borders: noBorders(),
          shading: { fill: 'F3F4F6' },
        }),
        // RIGHT: English
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: `${getLanguageFlag('English')} English`,
                  bold: true,
                  size: 24,
                  font: 'Arial',
                  color: 'FFFFFF',
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
          width: { size: 48, type: WidthType.PERCENTAGE },
          shading: { fill: '1E40AF' }, // Blue
          margins: cellMargins(),
        }),
      ],
    })
  );

  // Content rows with type-based styling
  for (const row of rows) {
    const isHeading = row.type === 'heading';
    const isQuestion = row.type === 'question';
    const isAnswerSpace = row.type === 'answer-line' || row.type === 'answer-box';
    const minHeight = row.alignedLineCount * 300;

    tableRows.push(
      new TableRow({
        children: [
          // LEFT: Home Language column
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: isAnswerSpace ? '' : row.homeLanguage.text,
                    size: isHeading ? 26 : 22,
                    bold: isHeading || isQuestion,
                    font: 'Arial',
                  }),
                ],
              }),
            ],
            width: { size: 48, type: WidthType.PERCENTAGE },
            borders: leftColumnBorders(),
            margins: cellMargins(),
            shading: isAnswerSpace ? { fill: 'FAFAFA' } : { fill: 'FFFBEB' },
          }),
          // GUTTER
          new TableCell({
            children: [new Paragraph({ text: '' })],
            width: { size: 4, type: WidthType.PERCENTAGE },
            borders: gutterBorders(),
            shading: { fill: 'F3F4F6' },
          }),
          // RIGHT: English column
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: isAnswerSpace ? '' : row.english.text,
                    size: isHeading ? 26 : 22,
                    bold: isHeading || isQuestion,
                    font: 'Arial',
                  }),
                ],
              }),
            ],
            width: { size: 48, type: WidthType.PERCENTAGE },
            borders: rightColumnBorders(),
            margins: cellMargins(),
            shading: isAnswerSpace ? { fill: 'FAFAFA' } : { fill: 'EFF6FF' },
          }),
        ],
        height: { value: minHeight, rule: 'atLeast' as any },
      })
    );
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows,
  });
}

/**
 * Export aligned bilingual content as landscape DOCX
 */
export async function exportAlignedBilingualDocx(
  alignedRows: AlignedRow[],
  qrSections: BilingualSection[],
  config: BilingualDocumentConfig,
  title: string
): Promise<void> {
  const children: (Paragraph | Table)[] = [];

  // Title
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: title || 'Student Assignment',
          bold: true,
          size: 36,
          font: 'Arial',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `${config.groupName}`,
          size: 24,
          font: 'Arial',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Bilingual: ${getLanguageFlag(config.homeLanguage)} ${config.homeLanguage} / ${getLanguageFlag('English')} English`,
          size: 22,
          font: 'Arial',
          italics: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    })
  );

  // Add QR codes header at TOP (if available)
  if (qrSections.length > 0) {
    const qrHeader = await createBilingualQRHeader(qrSections, config.homeLanguage);
    children.push(...qrHeader);
  }

  // Add student info row
  children.push(generateStudentInfoRow());

  // Add aligned bilingual content table
  const contentTable = await createAlignedBilingualTable(alignedRows, config.homeLanguage);
  children.push(contentTable);

  const doc = new Document({
    creator: 'Educator Tools',
    title: `${title} - Aligned Bilingual`,
    sections: [
      {
        properties: {
          page: {
            size: {
              // LANDSCAPE: width > height (11" x 8.5")
              orientation: PageOrientation.LANDSCAPE,
              width: convertInchesToTwip(11),
              height: convertInchesToTwip(8.5),
            },
            margin: {
              top: convertInchesToTwip(1.0),
              bottom: convertInchesToTwip(0.75),
              left: convertInchesToTwip(0.5),
              right: convertInchesToTwip(0.5),
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const safeTitle = (title || 'assignment').replace(/[^a-z0-9]/gi, '-').toLowerCase();
  const safeGroup = config.groupName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  saveAs(blob, `${safeTitle}-${safeGroup}-aligned-bilingual.docx`);
}
