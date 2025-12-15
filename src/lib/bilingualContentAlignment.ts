import { supabase } from '@/integrations/supabase/client';

export interface BilingualRow {
  id: string;
  type: 'heading' | 'instruction' | 'question' | 'answer-line' | 'answer-box' | 'drawing-space' | 'spacer' | 'content' | 'vocabulary';
  homeLanguage: {
    text: string;
    lineCount: number;
  };
  english: {
    text: string;
    lineCount: number;
  };
  alignedLineCount: number;
  drawingHeight?: number; // Height for drawing spaces in lines
}

export interface AlignedBilingualContent {
  rows: BilingualRow[];
  totalLines: number;
}

export interface ParsedElement {
  id: string;
  type: 'heading' | 'instruction' | 'question' | 'content' | 'vocabulary' | 'drawing-instruction';
  text: string;
  answerType?: 'short' | 'long' | 'multiple-choice' | 'drawing';
  answerLines?: number;
  drawingHeight?: number;
}

export interface ParsedAssignmentContent {
  title?: string;
  elements: ParsedElement[];
}

// Approximate characters per column line in landscape orientation
const COLUMN_WIDTH_CHARS = 55;

/**
 * Calculate line count based on text length and column width
 */
export function calculateLineCount(text: string, columnWidthChars: number = COLUMN_WIDTH_CHARS): number {
  if (!text || text.trim() === '') return 0;
  
  const words = text.split(/\s+/);
  let currentLineLength = 0;
  let lines = 1;
  
  for (const word of words) {
    if (currentLineLength + word.length + 1 > columnWidthChars) {
      lines++;
      currentLineLength = word.length;
    } else {
      currentLineLength += word.length + 1;
    }
  }
  
  return Math.max(1, lines);
}

/**
 * Parse markdown/text content into structured elements
 */
export function parseAssignmentContent(content: string): ParsedAssignmentContent {
  const elements: ParsedElement[] = [];
  const lines = content.split('\n');
  let elementId = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    elementId++;
    const id = `elem-${elementId}`;
    
    // Detect headings
    if (line.startsWith('#') || line.startsWith('##') || line.startsWith('###')) {
      elements.push({
        id,
        type: 'heading',
        text: line.replace(/^#+\s*/, ''),
      });
    }
    // Detect questions (numbered items or lines ending with ?)
    else if (/^\d+[\.\)]\s/.test(line) || line.endsWith('?')) {
      const questionText = line.replace(/^\d+[\.\)]\s*/, '');
      elements.push({
        id,
        type: 'question',
        text: questionText,
        answerType: questionText.length > 100 ? 'long' : 'short',
        answerLines: questionText.length > 100 ? 4 : 2,
      });
    }
    // Detect vocabulary (lines with : or - definitions)
    else if (line.includes(':') && line.indexOf(':') < 30) {
      elements.push({
        id,
        type: 'vocabulary',
        text: line,
      });
    }
    // Detect drawing instructions (Draw, Sketch, Illustrate, etc.)
    else if (/^(Draw|Sketch|Illustrate|Diagram|Chart|Graph|Map|Create a drawing|Make a drawing)/i.test(line)) {
      elements.push({
        id,
        type: 'drawing-instruction',
        text: line,
        answerType: 'drawing',
        drawingHeight: 6, // Default 6 lines of drawing space
      });
    }
    // Detect instructions (imperative/directive sentences)
    else if (/^(Write|Read|Answer|Complete|Circle|List|Describe|Explain|Show)/i.test(line)) {
      elements.push({
        id,
        type: 'instruction',
        text: line,
      });
    }
    // Default to content
    else {
      elements.push({
        id,
        type: 'content',
        text: line,
      });
    }
  }
  
  return { elements };
}

/**
 * Translate text using Lovable AI
 */
async function translateText(text: string, targetLanguage: string): Promise<string> {
  if (!text || text.trim() === '') return '';
  if (targetLanguage === 'English') return text;
  
  try {
    const { data, error } = await supabase.functions.invoke('translate-content', {
      body: { text, targetLanguage },
    });
    
    if (error) {
      console.error('Translation error:', error);
      return text; // Fall back to original text
    }
    
    return data?.translatedText || text;
  } catch (error) {
    console.error('Translation API error:', error);
    return text; // Fall back to original text
  }
}

/**
 * Generate aligned bilingual content with matching line counts
 */
export async function generateAlignedBilingualContent(
  englishContent: ParsedAssignmentContent,
  homeLanguage: string
): Promise<AlignedBilingualContent> {
  const rows: BilingualRow[] = [];
  let totalLines = 0;
  
  for (const element of englishContent.elements) {
    // Translate the content
    const translatedText = await translateText(element.text, homeLanguage);
    
    // Calculate line counts based on character length and column width
    const englishLines = calculateLineCount(element.text, COLUMN_WIDTH_CHARS);
    const translatedLines = calculateLineCount(translatedText, COLUMN_WIDTH_CHARS);
    
    // Use the maximum to keep alignment
    const alignedLineCount = Math.max(englishLines, translatedLines);
    
    // Map drawing-instruction to instruction type for the row
    const rowType: BilingualRow['type'] = element.type === 'drawing-instruction' ? 'instruction' : element.type;
    
    rows.push({
      id: element.id,
      type: rowType,
      homeLanguage: {
        text: translatedText,
        lineCount: translatedLines,
      },
      english: {
        text: element.text,
        lineCount: englishLines,
      },
      alignedLineCount,
    });
    
    totalLines += alignedLineCount;
    
    // If this is a drawing instruction, add drawing space
    if (element.type === 'drawing-instruction') {
      const drawingHeight = element.drawingHeight || 6;
      rows.push({
        id: `${element.id}-drawing`,
        type: 'drawing-space',
        homeLanguage: { text: '', lineCount: drawingHeight },
        english: { text: '', lineCount: drawingHeight },
        alignedLineCount: drawingHeight,
        drawingHeight,
      });
      totalLines += drawingHeight;
    }
    // If this is a question, add answer space
    else if (element.type === 'question' && element.answerType) {
      const answerLines = element.answerLines || 2;
      rows.push({
        id: `${element.id}-answer`,
        type: element.answerType === 'short' ? 'answer-line' : 'answer-box',
        homeLanguage: { text: '', lineCount: answerLines },
        english: { text: '', lineCount: answerLines },
        alignedLineCount: answerLines,
      });
      totalLines += answerLines;
    }
  }
  
  return { rows, totalLines };
}

/**
 * Generate aligned content from raw markdown without API translation
 * Uses placeholder translation for preview/testing
 */
export function generateAlignedBilingualContentSync(
  englishContent: string,
  translatedContent: string,
  homeLanguage: string
): AlignedBilingualContent {
  const rows: BilingualRow[] = [];
  let totalLines = 0;
  
  // Split both contents into paragraphs
  const englishParagraphs = englishContent.split('\n\n').filter(p => p.trim());
  const translatedParagraphs = translatedContent.split('\n\n').filter(p => p.trim());
  
  const maxLength = Math.max(englishParagraphs.length, translatedParagraphs.length);
  
  for (let i = 0; i < maxLength; i++) {
    const engText = englishParagraphs[i] || '';
    const transText = translatedParagraphs[i] || '';
    
    // Determine element type
    let type: BilingualRow['type'] = 'content';
    let isDrawingInstruction = false;
    
    if (engText.startsWith('#')) type = 'heading';
    else if (/^\d+[\.\)]/.test(engText) || engText.endsWith('?')) type = 'question';
    else if (/^(Draw|Sketch|Illustrate|Diagram|Chart|Graph|Map|Create a drawing|Make a drawing)/i.test(engText)) {
      type = 'instruction';
      isDrawingInstruction = true;
    }
    else if (/^(Write|Read|Answer|Complete|Circle|List|Describe|Explain|Show)/i.test(engText)) type = 'instruction';
    else if (engText.includes(':') && engText.indexOf(':') < 30) type = 'vocabulary';
    
    const englishLines = calculateLineCount(engText);
    const translatedLines = calculateLineCount(transText);
    const alignedLineCount = Math.max(englishLines, translatedLines, 1);
    
    rows.push({
      id: `row-${i}`,
      type,
      homeLanguage: {
        text: transText,
        lineCount: translatedLines,
      },
      english: {
        text: engText,
        lineCount: englishLines,
      },
      alignedLineCount,
    });
    
    totalLines += alignedLineCount;
    
    // Add drawing space after drawing instructions
    if (isDrawingInstruction) {
      const drawingHeight = 6;
      rows.push({
        id: `row-${i}-drawing`,
        type: 'drawing-space',
        homeLanguage: { text: '', lineCount: drawingHeight },
        english: { text: '', lineCount: drawingHeight },
        alignedLineCount: drawingHeight,
        drawingHeight,
      });
      totalLines += drawingHeight;
    }
    // Add answer space after questions
    else if (type === 'question') {
      const answerLines = engText.length > 100 ? 4 : 2;
      rows.push({
        id: `row-${i}-answer`,
        type: 'answer-line',
        homeLanguage: { text: '', lineCount: answerLines },
        english: { text: '', lineCount: answerLines },
        alignedLineCount: answerLines,
      });
      totalLines += answerLines;
    }
  }
  
  return { rows, totalLines };
}

/**
 * Convert aligned content to DOCX-compatible table rows
 */
export function alignedContentToTableData(
  content: AlignedBilingualContent
): { homeLanguageColumn: string[]; englishColumn: string[] } {
  const homeLanguageColumn: string[] = [];
  const englishColumn: string[] = [];
  
  for (const row of content.rows) {
    // Add the text content
    homeLanguageColumn.push(row.homeLanguage.text);
    englishColumn.push(row.english.text);
    
    // Add padding lines to align shorter columns
    const homePadding = row.alignedLineCount - row.homeLanguage.lineCount;
    const engPadding = row.alignedLineCount - row.english.lineCount;
    
    for (let i = 0; i < homePadding; i++) {
      homeLanguageColumn.push('');
    }
    for (let i = 0; i < engPadding; i++) {
      englishColumn.push('');
    }
  }
  
  return { homeLanguageColumn, englishColumn };
}
