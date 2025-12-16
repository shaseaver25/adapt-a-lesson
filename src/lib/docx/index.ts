// Markdown to DOCX conversion
export { 
  parseMarkdownToDocx, 
  markdownToParagraphs, 
  markdownToDocxChildren,
  DOC_STYLES 
} from './markdownToDocx';

// Lesson export functions
export {
  exportLessonToDocx,
  exportStudentHandoutToDocx,
  exportCombinedLessonToDocx,
} from './lessonExporter';

// QR code generation for audio
export {
  generateQRCodeDataUrl,
  generateQRCodeBuffer,
  createQRCodeParagraph,
  createBilingualQRHeader,
  createAudioPlaceholder,
  hasValidAudioUrls,
} from './qrCodeGenerator';
