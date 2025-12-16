// Markdown to DOCX conversion
export { 
  parseMarkdownToDocx, 
  markdownToParagraphs, 
  markdownToDocxChildren,
  parseMarkdownToDocxWithImages,
  markdownToDocxChildrenWithImages,
  setGraphicOrganizerImages,
  clearGraphicOrganizerImages,
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

// Image embedding for graphic organizers
export {
  fetchImageAsBuffer,
  createImageParagraph,
  createImagePlaceholder,
  parseVisualMarker,
  isImageUrl,
} from './imageEmbedder';
