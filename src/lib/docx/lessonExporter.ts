import { Document, Packer, Paragraph, TextRun, PageBreak, Table, AlignmentType, convertInchesToTwip, PageOrientation } from 'docx';
import { parseMarkdownToDocx, DOC_STYLES } from './markdownToDocx';
import { createQRCodeParagraph, createBilingualQRHeader } from './qrCodeGenerator';

interface LessonMetadata {
  title: string;
  subject?: string;
  grade?: string;
  groupName?: string;
  readingLevel?: string;
  date?: string;
}

interface AudioUrls {
  englishUrl?: string;
  homeLanguageUrl?: string;
  homeLanguage?: string;
}

/**
 * Export lesson content to DOCX buffer with proper markdown parsing
 */
export async function exportLessonToDocx(
  lessonContent: string,
  metadata: LessonMetadata,
  audioUrls?: AudioUrls
): Promise<Blob> {
  // Parse markdown BEFORE creating document
  const parsedElements = parseMarkdownToDocx(lessonContent);

  // Build document children array
  const documentChildren: (Paragraph | Table)[] = [];

  // Title
  documentChildren.push(
    new Paragraph({
      children: [
        new TextRun({
          text: metadata.title || 'Differentiated Lesson',
          bold: true,
          size: 48,
          color: '1F2937',
          font: 'Arial',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  );

  // Metadata line
  const metaParts: string[] = [];
  if (metadata.grade) metaParts.push(metadata.grade);
  if (metadata.subject) metaParts.push(metadata.subject);
  if (metadata.groupName) metaParts.push(metadata.groupName);
  if (metadata.readingLevel) metaParts.push(metadata.readingLevel);

  if (metaParts.length > 0) {
    documentChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: metaParts.join(' • '),
            italics: true,
            color: '6B7280',
            size: DOC_STYLES.body.size,
            font: 'Arial',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );
  }

  // Date
  documentChildren.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Generated: ${metadata.date || new Date().toLocaleDateString()}`,
          italics: true,
          color: '9CA3AF',
          size: 20,
          font: 'Arial',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  // Add QR code header if audio URLs exist
  if (audioUrls?.englishUrl || audioUrls?.homeLanguageUrl) {
    try {
      if (audioUrls.homeLanguageUrl && audioUrls.homeLanguage && audioUrls.homeLanguage !== 'English') {
        // Bilingual QR header
        const qrHeader = await createBilingualQRHeader(
          audioUrls.englishUrl,
          audioUrls.homeLanguageUrl,
          audioUrls.homeLanguage
        );
        documentChildren.push(...qrHeader);
      } else if (audioUrls.englishUrl) {
        // English-only QR
        const qrParagraph = await createQRCodeParagraph(audioUrls.englishUrl, 'Listen to this lesson');
        documentChildren.push(qrParagraph);
      }
    } catch (error) {
      console.error('Failed to generate QR codes:', error);
      // Continue without QR codes
    }
  }

  // Add parsed content
  documentChildren.push(...parsedElements);

  const doc = new Document({
    creator: 'TailorEDU',
    title: metadata.title,
    description: 'Differentiated Lesson Plan',
    styles: {
      default: {
        document: {
          run: { font: 'Arial', size: 24 },
        },
      },
    },
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
        children: documentChildren,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

/**
 * Export student handout to landscape DOCX with bilingual support
 */
export async function exportStudentHandoutToDocx(
  content: string,
  metadata: LessonMetadata,
  audioUrls?: AudioUrls,
  options?: { landscape?: boolean }
): Promise<Blob> {
  const parsedElements = parseMarkdownToDocx(content);
  const documentChildren: (Paragraph | Table)[] = [];

  // Student info header
  documentChildren.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Name: ', bold: true, size: DOC_STYLES.body.size, font: 'Arial' }),
        new TextRun({ text: '_'.repeat(30) + '  ', size: DOC_STYLES.body.size, font: 'Arial', color: 'CCCCCC' }),
        new TextRun({ text: 'Date: ', bold: true, size: DOC_STYLES.body.size, font: 'Arial' }),
        new TextRun({ text: '_'.repeat(15) + '  ', size: DOC_STYLES.body.size, font: 'Arial', color: 'CCCCCC' }),
        new TextRun({ text: 'Period: ', bold: true, size: DOC_STYLES.body.size, font: 'Arial' }),
        new TextRun({ text: '_'.repeat(5), size: DOC_STYLES.body.size, font: 'Arial', color: 'CCCCCC' }),
      ],
      spacing: { after: 300 },
    })
  );

  // Title with reading level badge
  const titleParts: TextRun[] = [
    new TextRun({
      text: metadata.title || 'Student Handout',
      bold: true,
      size: 36,
      font: 'Arial',
    }),
  ];
  
  if (metadata.readingLevel) {
    titleParts.push(
      new TextRun({ text: '  ', size: 36 }),
      new TextRun({
        text: metadata.readingLevel,
        bold: true,
        size: 24,
        color: 'F59E0B',
        font: 'Arial',
      })
    );
  }

  documentChildren.push(
    new Paragraph({
      children: titleParts,
      spacing: { after: 200 },
    })
  );

  // QR codes for audio (if available)
  if (audioUrls?.englishUrl || audioUrls?.homeLanguageUrl) {
    try {
      if (audioUrls.homeLanguageUrl && audioUrls.homeLanguage && audioUrls.homeLanguage !== 'English') {
        const qrHeader = await createBilingualQRHeader(
          audioUrls.englishUrl,
          audioUrls.homeLanguageUrl,
          audioUrls.homeLanguage
        );
        documentChildren.push(...qrHeader);
      } else if (audioUrls.englishUrl) {
        const qrParagraph = await createQRCodeParagraph(audioUrls.englishUrl, '🎧 Scan to listen');
        documentChildren.push(qrParagraph);
      }
    } catch (error) {
      console.error('Failed to generate QR codes for handout:', error);
    }
  }

  // Add parsed content
  documentChildren.push(...parsedElements);

  const doc = new Document({
    creator: 'TailorEDU',
    title: `${metadata.title} - Student Handout`,
    sections: [
      {
        properties: {
          page: {
            size: options?.landscape 
              ? { orientation: PageOrientation.LANDSCAPE }
              : undefined,
            margin: {
              top: convertInchesToTwip(0.75),
              bottom: convertInchesToTwip(0.75),
              left: convertInchesToTwip(0.75),
              right: convertInchesToTwip(0.75),
            },
          },
        },
        children: documentChildren,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

/**
 * Export combined lesson with teacher guide and student handouts
 */
export async function exportCombinedLessonToDocx(
  teacherGuide: string,
  studentHandouts: { groupName: string; content: string; audioUrls?: AudioUrls }[],
  metadata: LessonMetadata
): Promise<Blob> {
  const allChildren: (Paragraph | Table)[] = [];

  // Title page
  allChildren.push(
    new Paragraph({
      children: [
        new TextRun({
          text: metadata.title || 'Differentiated Lesson Plan',
          bold: true,
          size: 56,
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
          italics: true,
          size: 24,
          font: 'Arial',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 1000 },
    })
  );

  // Teacher Guide
  if (teacherGuide) {
    allChildren.push(new Paragraph({ children: [new PageBreak()] }));
    allChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '📋 TEACHER GUIDE',
            bold: true,
            size: 36,
            font: 'Arial',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );
    allChildren.push(...parseMarkdownToDocx(teacherGuide));
  }

  // Student Handouts
  if (studentHandouts.length > 0) {
    allChildren.push(new Paragraph({ children: [new PageBreak()] }));
    allChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '📄 STUDENT HANDOUTS',
            bold: true,
            size: 36,
            font: 'Arial',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: '(Print from here for student distribution)',
            italics: true,
            size: 22,
            color: '6B7280',
            font: 'Arial',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );

    for (let i = 0; i < studentHandouts.length; i++) {
      const handout = studentHandouts[i];
      
      if (i > 0) {
        allChildren.push(new Paragraph({ children: [new PageBreak()] }));
      }

      // Group header
      allChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: handout.groupName,
              bold: true,
              size: 28,
              font: 'Arial',
            }),
          ],
          spacing: { after: 200 },
        })
      );

      // QR codes if audio exists
      if (handout.audioUrls?.englishUrl || handout.audioUrls?.homeLanguageUrl) {
        try {
          if (handout.audioUrls.homeLanguageUrl && handout.audioUrls.homeLanguage) {
            const qrHeader = await createBilingualQRHeader(
              handout.audioUrls.englishUrl,
              handout.audioUrls.homeLanguageUrl,
              handout.audioUrls.homeLanguage
            );
            allChildren.push(...qrHeader);
          } else if (handout.audioUrls.englishUrl) {
            const qrParagraph = await createQRCodeParagraph(handout.audioUrls.englishUrl, '🎧 Listen');
            allChildren.push(qrParagraph);
          }
        } catch (error) {
          console.error('Failed to generate QR for handout:', error);
        }
      }

      // Parsed content
      allChildren.push(...parseMarkdownToDocx(handout.content));
    }
  }

  const doc = new Document({
    creator: 'TailorEDU',
    title: metadata.title,
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
        children: allChildren,
      },
    ],
  });

  return await Packer.toBlob(doc);
}
