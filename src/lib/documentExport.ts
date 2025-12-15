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

// Export Student Handouts only as .docx
export async function exportStudentHandoutsDocx(
  content: string,
  title: string,
  groups: StudentGroupInfo[]
): Promise<void> {
  const { studentHandouts } = parseMarkdownContent(content);
  
  if (!studentHandouts.length) {
    throw new Error('No Student Handouts section found in content');
  }

  const children: Paragraph[] = [
    new Paragraph({
      text: 'STUDENT HANDOUTS',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 400 },
    }),
  ];

  studentHandouts.forEach((handout, index) => {
    if (index > 0) {
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }
    children.push(...markdownToParagraphs(handout.content));
  });

  const doc = new Document({
    creator: 'Educator Tools',
    title: `${title} - Student Handouts`,
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
  const filename = `${title || 'lesson'}-student-handouts.docx`
    .replace(/[^a-z0-9-_.]/gi, '-')
    .toLowerCase();
  saveAs(blob, filename);
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
