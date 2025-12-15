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
} from 'docx';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

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
