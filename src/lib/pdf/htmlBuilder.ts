/**
 * HTML Builder for PDF Generation
 * Converts markdown lesson content to styled HTML for PDF export
 */

interface PDFOptions {
  title: string;
  subject?: string;
  grade?: string;
  groupName?: string;
  isRTL?: boolean;
  createdAt?: string;
}

/**
 * Convert lesson markdown to styled HTML for PDF generation
 */
export function buildLessonHTML(markdown: string, options: PDFOptions): string {
  let processedContent = markdown;
  
  // 1. Convert ASCII tables to HTML tables
  processedContent = convertAsciiTablesToHtml(processedContent);
  
  // 2. Replace [VISUAL: ...] placeholders with styled boxes
  processedContent = replaceVisualPlaceholders(processedContent);
  
  // 3. Convert markdown to HTML
  const contentHtml = convertMarkdownToHtml(processedContent);
  
  // 4. Wrap in full HTML document with fonts & styles
  return wrapInHtmlDocument(contentHtml, options);
}

/**
 * Convert ASCII/Unicode box tables to proper HTML tables
 */
function convertAsciiTablesToHtml(text: string): string {
  // Pattern to match markdown tables (lines with | separators)
  const lines = text.split('\n');
  const result: string[] = [];
  let inTable = false;
  let tableRows: string[][] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if this looks like a table row (contains | but not just borders)
    const isTableRow = line.includes('|') && !/^[|\-\s+:]+$/.test(line.trim());
    const isSeparatorRow = /^[|\-\s+:]+$/.test(line.trim()) && line.includes('|');
    
    if (isTableRow) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      
      // Extract cells from the line
      const cells = line
        .split('|')
        .map(cell => cell.trim())
        .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1 || (arr.length === 2 && idx === 0));
      
      if (cells.length > 0) {
        tableRows.push(cells);
      }
    } else if (isSeparatorRow && inTable) {
      // Skip separator rows in tables
      continue;
    } else {
      // Not a table row - flush any accumulated table
      if (inTable && tableRows.length > 0) {
        result.push(buildHtmlTable(tableRows));
        tableRows = [];
        inTable = false;
      }
      result.push(line);
    }
  }
  
  // Flush any remaining table
  if (inTable && tableRows.length > 0) {
    result.push(buildHtmlTable(tableRows));
  }
  
  return result.join('\n');
}

/**
 * Build HTML table from rows
 */
function buildHtmlTable(rows: string[][]): string {
  if (rows.length === 0) return '';
  
  let html = '<table class="data-table">\n';
  
  rows.forEach((row, index) => {
    const tag = index === 0 ? 'th' : 'td';
    html += '  <tr>\n';
    row.forEach(cell => {
      html += `    <${tag}>${escapeHtml(cell)}</${tag}>\n`;
    });
    html += '  </tr>\n';
  });
  
  html += '</table>\n';
  return html;
}

/**
 * Replace [VISUAL: description] with styled placeholder boxes
 */
function replaceVisualPlaceholders(text: string): string {
  return text.replace(/\[VISUAL:\s*(.+?)\]/g, (_, description) => {
    return `<div class="visual-placeholder">
      <div class="visual-icon">📊</div>
      <div class="visual-text">Diagram: ${escapeHtml(description)}</div>
    </div>`;
  });
}

/**
 * Simple markdown to HTML converter
 */
function convertMarkdownToHtml(markdown: string): string {
  let html = markdown;
  
  // Headers
  html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
  html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
  html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');
  
  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/__(.+?)__/g, '<u>$1</u>');
  
  // Code
  html = html.replace(/`(.+?)`/g, '<code>$1</code>');
  
  // Horizontal rules
  html = html.replace(/^---+$/gm, '<hr>');
  
  // Unordered lists
  html = html.replace(/^[\s]*[-*]\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
  
  // Ordered lists
  html = html.replace(/^[\s]*\d+\.\s+(.+)$/gm, '<li>$1</li>');
  
  // Paragraphs (lines that aren't already wrapped)
  const lines = html.split('\n');
  const processedLines = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('<')) return line;
    return `<p>${line}</p>`;
  });
  html = processedLines.join('\n');
  
  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '');
  
  return html;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Wrap content in full HTML document with proper fonts and styling
 */
function wrapInHtmlDocument(content: string, options: PDFOptions): string {
  const direction = options.isRTL ? 'rtl' : 'ltr';
  const fontFamily = options.isRTL 
    ? "'Noto Sans Arabic', 'Segoe UI', Arial, sans-serif"
    : "'Nunito', 'Segoe UI', Arial, sans-serif";

  return `<!DOCTYPE html>
<html lang="${options.isRTL ? 'ar' : 'en'}" dir="${direction}">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&family=Noto+Sans+Arabic:wght@400;600;700&family=Noto+Color+Emoji&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
    }
    
    body {
      font-family: ${fontFamily};
      font-size: 11pt;
      line-height: 1.6;
      color: #1f2937;
      direction: ${direction};
      margin: 0;
      padding: 20px;
      background: white;
    }
    
    h1, h2, h3, h4, h5, h6 {
      font-family: 'Noto Color Emoji', ${fontFamily};
    }
    
    h1 {
      font-size: 20pt;
      font-weight: 700;
      color: #1e3a5f;
      margin: 0 0 8pt 0;
      padding-bottom: 6pt;
      border-bottom: 2px solid #f97316;
    }
    
    h2 {
      font-size: 15pt;
      font-weight: 700;
      color: #1e3a5f;
      margin: 16pt 0 8pt 0;
      padding-bottom: 4pt;
      border-bottom: 1px solid #e5e7eb;
    }
    
    h3 {
      font-size: 12pt;
      font-weight: 600;
      color: #374151;
      margin: 12pt 0 6pt 0;
    }
    
    h4 {
      font-size: 11pt;
      font-weight: 600;
      color: #4b5563;
      margin: 10pt 0 4pt 0;
    }
    
    p {
      margin: 0 0 8pt 0;
    }
    
    ul, ol {
      margin: 0 0 10pt 0;
      padding-${options.isRTL ? 'right' : 'left'}: 20pt;
    }
    
    li {
      margin-bottom: 4pt;
    }
    
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 12pt 0;
      font-size: 10pt;
    }
    
    .data-table th,
    .data-table td {
      border: 1px solid #d1d5db;
      padding: 6pt 8pt;
      text-align: ${options.isRTL ? 'right' : 'left'};
      vertical-align: top;
    }
    
    .data-table th {
      background-color: #f3f4f6;
      font-weight: 600;
      color: #1f2937;
    }
    
    .data-table tr:nth-child(even) td {
      background-color: #f9fafb;
    }
    
    .visual-placeholder {
      border: 2px dashed #9ca3af;
      border-radius: 8pt;
      padding: 16pt;
      margin: 12pt 0;
      background-color: #f9fafb;
      text-align: center;
    }
    
    .visual-icon {
      font-size: 24pt;
      margin-bottom: 6pt;
    }
    
    .visual-text {
      font-style: italic;
      color: #6b7280;
      font-size: 10pt;
    }
    
    hr {
      border: none;
      border-top: 1px solid #e5e7eb;
      margin: 16pt 0;
    }
    
    code {
      background-color: #f3f4f6;
      padding: 2pt 4pt;
      border-radius: 3pt;
      font-family: monospace;
      font-size: 10pt;
    }
    
    .document-header {
      margin-bottom: 16pt;
    }
    
    .document-title {
      font-size: 20pt;
      font-weight: 700;
      color: #1e3a5f;
      margin: 0 0 4pt 0;
    }
    
    .document-meta {
      font-size: 10pt;
      color: #6b7280;
    }
    
    .group-badge {
      display: inline-block;
      padding: 2pt 8pt;
      border-radius: 4pt;
      font-size: 9pt;
      font-weight: 600;
      background-color: #fff7ed;
      color: #ea580c;
      border: 1px solid #fed7aa;
      margin-${options.isRTL ? 'left' : 'right'}: 8pt;
    }
    
    .page-break {
      page-break-after: always;
    }
    
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .page-break {
        page-break-after: always;
      }
    }
  </style>
</head>
<body>
  <div class="document-header">
    <div class="document-title">${escapeHtml(options.title)}</div>
    <div class="document-meta">
      ${options.createdAt ? `Created: ${options.createdAt}` : ''}
      ${options.grade ? ` • ${escapeHtml(options.grade)}` : ''}
      ${options.subject ? ` • ${escapeHtml(options.subject)}` : ''}
      ${options.groupName ? `<span class="group-badge">${escapeHtml(options.groupName)}</span>` : ''}
    </div>
  </div>
  
  <div class="document-content">
    ${content}
  </div>
</body>
</html>`;
}

/**
 * Detect if content is primarily Arabic or RTL
 */
export function isArabicContent(text: string): boolean {
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
  const arabicMatches = (text.match(arabicPattern) || []).length;
  const totalChars = text.replace(/\s/g, '').length;
  return totalChars > 0 && arabicMatches / totalChars > 0.3;
}
