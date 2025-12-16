import { marked } from 'marked';

interface StudentGroup {
  id: string;
  name: string;
  level: 'embers' | 'sparks' | 'flames' | 'blazers' | 'supernovas';
  language: string;
  content: string;
}

interface LessonMetadata {
  title: string;
  subject: string;
  grade: string;
  duration: string;
  learningObjective: string;
  generatedDate: string;
}

/**
 * Generate a standalone HTML file for a student group
 * All CSS is inline - no external dependencies except Google Fonts CDN
 */
export function generateStudentHTML(
  group: StudentGroup,
  metadata: LessonMetadata
): string {
  const rtlLanguages = ['Arabic', 'Hebrew', 'Farsi', 'Urdu'];
  const isRTL = rtlLanguages.includes(group.language);
  const direction = isRTL ? 'rtl' : 'ltr';
  const textAlign = isRTL ? 'right' : 'left';
  
  let processedContent = group.content;
  
  // Convert [VISUAL: ...] to styled placeholders
  processedContent = processedContent.replace(
    /\[VISUAL:\s*(.+?)\]/g,
    '<div class="visual-placeholder"><span class="visual-icon">📊</span><span class="visual-label">$1</span></div>'
  );
  
  // Convert ASCII tables to HTML tables
  processedContent = convertAsciiTables(processedContent);
  
  // Parse markdown to HTML
  const contentHTML = marked.parse(processedContent);
  
  const levelColors = getLevelColors(group.level);
  
  return `<!DOCTYPE html>
<html lang="${group.language === 'English' ? 'en' : group.language.toLowerCase().slice(0, 2)}" dir="${direction}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(metadata.title)} - ${escapeHtml(group.name)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&family=Noto+Sans+Arabic:wght@400;500;600;700&family=Noto+Color+Emoji&display=swap" rel="stylesheet">
  
  <style>
    /* ===== CSS RESET ===== */
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    /* ===== ROOT VARIABLES ===== */
    :root {
      --color-primary: ${levelColors.primary};
      --color-primary-light: ${levelColors.light};
      --color-primary-dark: ${levelColors.dark};
      --color-text: #1f2937;
      --color-text-muted: #6b7280;
      --color-bg: #ffffff;
      --color-bg-subtle: #f9fafb;
      --color-border: #e5e7eb;
      --font-main: 'Noto Sans', 'Noto Sans Arabic', system-ui, sans-serif;
      --font-emoji: 'Noto Color Emoji', 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif;
    }
    
    /* ===== BASE STYLES ===== */
    html {
      font-size: 16px;
      scroll-behavior: smooth;
    }
    
    body {
      font-family: var(--font-main);
      font-size: 1rem;
      line-height: 1.6;
      color: var(--color-text);
      background: var(--color-bg);
      direction: ${direction};
      text-align: ${textAlign};
      padding: 0;
      margin: 0;
    }
    
    /* ===== LAYOUT ===== */
    .lesson-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem 1.5rem;
    }
    
    @media (max-width: 640px) {
      .lesson-container {
        padding: 1rem;
      }
    }
    
    /* ===== HEADER ===== */
    .lesson-header {
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 3px solid var(--color-primary);
    }
    
    .lesson-badge {
      display: inline-block;
      background: var(--color-primary-light);
      color: var(--color-primary-dark);
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.75rem;
    }
    
    .lesson-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--color-text);
      margin-bottom: 0.5rem;
      line-height: 1.2;
    }
    
    .lesson-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      font-size: 0.875rem;
      color: var(--color-text-muted);
    }
    
    .lesson-meta-item {
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }
    
    .lesson-meta-icon {
      font-family: var(--font-emoji);
    }
    
    /* ===== LEARNING TARGET ===== */
    .learning-target {
      background: var(--color-primary-light);
      border-${isRTL ? 'right' : 'left'}: 4px solid var(--color-primary);
      padding: 1rem 1.25rem;
      border-radius: 0.5rem;
      margin-bottom: 2rem;
    }
    
    .learning-target-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-primary-dark);
      margin-bottom: 0.25rem;
    }
    
    .learning-target-text {
      font-size: 1rem;
      font-weight: 500;
      color: var(--color-text);
    }
    
    /* ===== TYPOGRAPHY ===== */
    h1, h2, h3, h4, h5, h6 {
      font-family: var(--font-main), var(--font-emoji);
      font-weight: 600;
      line-height: 1.3;
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
      color: var(--color-text);
    }
    
    h1 { font-size: 1.75rem; }
    h2 { 
      font-size: 1.375rem; 
      padding-bottom: 0.5rem;
      border-bottom: 2px solid var(--color-border);
    }
    h3 { font-size: 1.125rem; }
    h4 { font-size: 1rem; }
    
    p {
      margin-bottom: 1rem;
    }
    
    strong, b {
      font-weight: 600;
    }
    
    em, i {
      font-style: italic;
    }
    
    /* ===== LISTS ===== */
    ul, ol {
      margin-bottom: 1rem;
      padding-${isRTL ? 'right' : 'left'}: 1.5rem;
    }
    
    li {
      margin-bottom: 0.375rem;
    }
    
    li::marker {
      color: var(--color-primary);
    }
    
    /* ===== TABLES ===== */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5rem 0;
      font-size: 0.9375rem;
    }
    
    th, td {
      padding: 0.75rem 1rem;
      text-align: ${textAlign};
      border: 1px solid var(--color-border);
    }
    
    th {
      background: var(--color-bg-subtle);
      font-weight: 600;
      color: var(--color-text);
    }
    
    tr:nth-child(even) td {
      background: var(--color-bg-subtle);
    }
    
    /* ===== VISUAL PLACEHOLDERS ===== */
    .visual-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      margin: 1.5rem 0;
      background: var(--color-bg-subtle);
      border: 2px dashed var(--color-border);
      border-radius: 0.75rem;
      text-align: center;
    }
    
    .visual-icon {
      font-family: var(--font-emoji);
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }
    
    .visual-label {
      font-size: 0.875rem;
      color: var(--color-text-muted);
      font-style: italic;
    }
    
    /* ===== GRAPHIC ORGANIZERS ===== */
    .graphic-organizer {
      background: var(--color-bg-subtle);
      border: 2px solid var(--color-primary);
      border-radius: 0.75rem;
      padding: 1.5rem;
      margin: 1.5rem 0;
    }
    
    .graphic-organizer-title {
      font-weight: 600;
      color: var(--color-primary-dark);
      text-align: center;
      margin-bottom: 1rem;
      font-size: 1rem;
    }
    
    /* ===== SENTENCE STARTERS ===== */
    .sentence-starter {
      font-style: italic;
      color: var(--color-text-muted);
      margin-bottom: 0.25rem;
      font-size: 0.9375rem;
    }
    
    /* ===== ANSWER AREAS ===== */
    .answer-area {
      border: 1px solid var(--color-border);
      border-radius: 0.5rem;
      padding: 1rem;
      margin: 0.75rem 0;
      min-height: 80px;
      background: var(--color-bg);
    }
    
    .answer-line {
      border-bottom: 1px solid var(--color-border);
      height: 2rem;
      margin: 0.5rem 0;
    }
    
    /* ===== CALLOUT BOXES ===== */
    .callout {
      padding: 1rem 1.25rem;
      border-radius: 0.5rem;
      margin: 1rem 0;
    }
    
    .callout-tip {
      background: #ecfdf5;
      border-${isRTL ? 'right' : 'left'}: 4px solid #10b981;
    }
    
    .callout-warning {
      background: #fffbeb;
      border-${isRTL ? 'right' : 'left'}: 4px solid #f59e0b;
    }
    
    .callout-info {
      background: #eff6ff;
      border-${isRTL ? 'right' : 'left'}: 4px solid #3b82f6;
    }
    
    /* ===== KEY VOCABULARY ===== */
    .vocab-term {
      font-weight: 600;
      color: var(--color-primary-dark);
    }
    
    .vocab-definition {
      margin-${isRTL ? 'right' : 'left'}: 1rem;
      padding-${isRTL ? 'right' : 'left'}: 1rem;
      border-${isRTL ? 'right' : 'left'}: 2px solid var(--color-primary-light);
      color: var(--color-text-muted);
    }
    
    /* ===== REFLECTION SECTION ===== */
    .reflection-section {
      background: linear-gradient(135deg, var(--color-primary-light) 0%, #fef3c7 100%);
      border-radius: 0.75rem;
      padding: 1.5rem;
      margin: 2rem 0;
    }
    
    .reflection-section h3 {
      color: var(--color-primary-dark);
      margin-top: 0;
    }
    
    /* ===== ENCOURAGEMENT BANNER ===== */
    .encouragement {
      text-align: center;
      padding: 1rem;
      margin: 2rem 0;
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
      border-radius: 0.75rem;
      font-weight: 500;
      color: #065f46;
    }
    
    .encouragement-emoji {
      font-family: var(--font-emoji);
      font-size: 1.25rem;
    }
    
    /* ===== FOOTER ===== */
    .lesson-footer {
      margin-top: 3rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--color-border);
      text-align: center;
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }
    
    /* ===== PRINT STYLES ===== */
    @media print {
      body {
        font-size: 11pt;
        line-height: 1.4;
      }
      
      .lesson-container {
        max-width: 100%;
        padding: 0;
      }
      
      .visual-placeholder {
        border-style: solid;
      }
      
      h2, h3 {
        page-break-after: avoid;
      }
      
      .graphic-organizer, table {
        page-break-inside: avoid;
      }
    }
    
    /* ===== ACCESSIBILITY ===== */
    @media (prefers-reduced-motion: reduce) {
      html {
        scroll-behavior: auto;
      }
    }
    
    @media (prefers-color-scheme: dark) {
      :root {
        --color-text: #f3f4f6;
        --color-text-muted: #9ca3af;
        --color-bg: #111827;
        --color-bg-subtle: #1f2937;
        --color-border: #374151;
      }
    }
  </style>
</head>
<body>
  <article class="lesson-container">
    <!-- Header -->
    <header class="lesson-header">
      <span class="lesson-badge">${escapeHtml(group.name)}</span>
      <h1 class="lesson-title">${escapeHtml(metadata.title)}</h1>
      <div class="lesson-meta">
        <span class="lesson-meta-item">
          <span class="lesson-meta-icon">📚</span>
          ${escapeHtml(metadata.subject)}
        </span>
        <span class="lesson-meta-item">
          <span class="lesson-meta-icon">🎓</span>
          ${escapeHtml(metadata.grade)}
        </span>
        <span class="lesson-meta-item">
          <span class="lesson-meta-icon">⏱️</span>
          ${escapeHtml(metadata.duration)}
        </span>
      </div>
    </header>

    <!-- Learning Target -->
    <section class="learning-target">
      <div class="learning-target-label">🎯 Learning Target</div>
      <p class="learning-target-text">${escapeHtml(metadata.learningObjective)}</p>
    </section>

    <!-- Main Content -->
    <main class="lesson-content">
      ${contentHTML}
    </main>

    <!-- Footer -->
    <footer class="lesson-footer">
      Generated by Authentic Learning Studio • ${escapeHtml(metadata.generatedDate)}
    </footer>
  </article>
</body>
</html>`;
}

/**
 * Get color scheme based on student level
 */
function getLevelColors(level: string): { primary: string; light: string; dark: string } {
  const colors: Record<string, { primary: string; light: string; dark: string }> = {
    embers: {
      primary: '#ef4444',
      light: '#fef2f2',
      dark: '#b91c1c'
    },
    sparks: {
      primary: '#f97316',
      light: '#fff7ed',
      dark: '#c2410c'
    },
    flames: {
      primary: '#f59e0b',
      light: '#fffbeb',
      dark: '#b45309'
    },
    blazers: {
      primary: '#10b981',
      light: '#ecfdf5',
      dark: '#047857'
    },
    supernovas: {
      primary: '#8b5cf6',
      light: '#f5f3ff',
      dark: '#6d28d9'
    }
  };
  
  return colors[level] || colors.flames;
}

/**
 * Convert ASCII/Unicode box tables to HTML tables
 */
function convertAsciiTables(text: string): string {
  const tableBlockRegex = /(?:^[│|%+┌┐└┘├┤┬┴┼─].*$\n?)+/gm;
  
  return text.replace(tableBlockRegex, (block) => {
    const lines = block.trim().split('\n');
    const dataRows: string[][] = [];
    
    for (const line of lines) {
      if (/^[─┬┴┼┌┐└┘├┤%\-+|]+$/.test(line.replace(/\s/g, ''))) continue;
      
      const cells = line
        .split(/[│|%]/)
        .map(c => c.trim())
        .filter(c => c && !/^[-─]+$/.test(c));
      
      if (cells.length > 0) {
        dataRows.push(cells);
      }
    }
    
    if (dataRows.length === 0) return block;
    
    let html = '<table>\n';
    dataRows.forEach((row, idx) => {
      const tag = idx === 0 ? 'th' : 'td';
      html += '  <tr>\n';
      row.forEach(cell => {
        html += `    <${tag}>${escapeHtml(cell)}</${tag}>\n`;
      });
      html += '  </tr>\n';
    });
    html += '</table>\n';
    
    return html;
  });
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Trigger download of HTML file
 */
export function downloadHTML(html: string, filename: string): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Download all groups as a ZIP file
 */
export async function downloadAllAsZip(
  groups: StudentGroup[],
  metadata: LessonMetadata
): Promise<void> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  
  groups.forEach(group => {
    const html = generateStudentHTML(group, metadata);
    const filename = `${metadata.title.replace(/[^a-zA-Z0-9]/g, '_')}_${group.name.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
    zip.file(filename, html);
  });
  
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${metadata.title.replace(/[^a-zA-Z0-9]/g, '_')}_All_Groups.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export type { StudentGroup, LessonMetadata };
