import { marked } from 'marked';
import { getISOCode, isRTLLanguage } from '@/lib/languageCodes';

interface StudentGroup {
  id: string;
  groupName: string;
  readingLevelLabel: string;
  homeLanguage: string;
  content?: string;
  englishContent?: string;
}

interface LessonExportData {
  title: string;
  content: string;
  englishContent?: string;
  group: StudentGroup;
  generatedDate: string;
  imageMap?: Map<string, string>; // Map of visual description -> image URL
}

/**
 * Map reading level to internal level key
 */
function getLevelKey(readingLevel: string): string {
  const levelMap: Record<string, string> = {
    'Below Grade': 'embers',
    'On Grade': 'flames',
    'Above Grade': 'blazers',
    'Advanced': 'supernovas'
  };
  return levelMap[readingLevel] || 'flames';
}

/**
 * Reverse map: internal level key -> human-readable reading level label.
 * Used when callers (e.g. Canvas push) only have the level key.
 */
export function readingLevelLabelFromKey(level: string): string {
  const labels: Record<string, string> = {
    embers: 'Below Grade',
    sparks: 'Below Grade',
    flames: 'On Grade',
    blazers: 'Above Grade',
    supernovas: 'Advanced',
  };
  return labels[level] || 'On Grade';
}

/**
 * Build just the inner-body HTML fragment for one lesson section
 * (heading + bilingual <table> or single-column <div>). Reused by the
 * Canvas push flow so what we send matches the direct HTML export — same
 * <table>, <caption>, <th scope="col">, <td lang="..."> structure.
 *
 * No <html>/<head>/<style> wrapper; intended to be embedded inside another
 * document (a Canvas Page body, a parent HTML doc, etc.).
 */
export function buildLessonSectionHTML(data: {
  heading: string;
  content: string;
  englishContent?: string;
  homeLanguage: string;
  imageMap?: Map<string, string>;
}): string {
  const { heading, content, englishContent, homeLanguage, imageMap } = data;
  const isBilingual =
    homeLanguage !== 'English' && !!englishContent && englishContent.trim().length > 0;

  const translatedLangCode = getISOCode(homeLanguage);
  const isRTL = isRTLLanguage(translatedLangCode);
  const dirAttr = isRTL ? 'rtl' : 'ltr';

  const processMarkdown = (md: string): string => {
    let processed = md;
    const findImageUrl = (description: string): string | undefined => {
      const trimmedDesc = description.trim();
      if (imageMap?.has(trimmedDesc)) return imageMap.get(trimmedDesc);
      if (imageMap) {
        const lowerDesc = trimmedDesc.toLowerCase();
        for (const [key, url] of imageMap.entries()) {
          if (key.toLowerCase() === lowerDesc) return url;
        }
      }
      return undefined;
    };
    const replaceVisual = (_m: string, description: string) => {
      const imageUrl = findImageUrl(description);
      if (imageUrl) {
        return `<figure class="lesson-figure">
          <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(description)}" class="lesson-image" loading="lazy" />
          <figcaption>${escapeHtml(description)}</figcaption>
        </figure>`;
      }
      return `<div class="visual-placeholder">
        <span class="visual-icon">📐</span>
        <span class="visual-label">${escapeHtml(description)}</span>
        <span class="teacher-note">Teacher: Insert diagram or use whiteboard</span>
      </div>`;
    };
    processed = processed.replace(/\[VISUAL:\s*(.+?)\]/g, replaceVisual);
    processed = processed.replace(/\[NANOBANANA:\s*"(.+?)"\]/g, replaceVisual);
    processed = processed.replace(/_{10,}/g, '<div class="answer-line"></div>');
    return marked.parse(processed) as string;
  };

  const translatedHTML = processMarkdown(content);
  const englishHTML = isBilingual && englishContent ? processMarkdown(englishContent) : '';

  const body = isBilingual
    ? `
      <table class="bilingual-container" role="table" aria-describedby="bilingual-desc-${escapeHtml(translatedLangCode)}">
        <caption id="bilingual-desc-${escapeHtml(translatedLangCode)}" class="sr-only">
          Side-by-side bilingual handout. Left column: ${escapeHtml(homeLanguage)}. Right column: English. The two columns present the same lesson content in parallel.
        </caption>
        <thead>
          <tr>
            <th scope="col" lang="${translatedLangCode}" dir="${dirAttr}" class="bilingual-header translated">
              <span class="column-flag" aria-hidden="true">🌍</span>
              ${escapeHtml(homeLanguage)}
            </th>
            <th scope="col" lang="en" dir="ltr" class="bilingual-header english">
              <span class="column-flag" aria-hidden="true">🇺🇸</span>
              English
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td lang="${translatedLangCode}" dir="${dirAttr}" class="bilingual-cell translated">
              <div class="column-content">${translatedHTML}</div>
            </td>
            <td lang="en" dir="ltr" class="bilingual-cell english">
              <div class="column-content">${englishHTML}</div>
            </td>
          </tr>
        </tbody>
      </table>
    `
    : `<div class="single-column-content" lang="${translatedLangCode}" dir="${dirAttr}">${translatedHTML}</div>`;

  return `<section class="lesson-section"><h2>${escapeHtml(heading)}</h2>${body}</section>`;
}

/**
 * Get color scheme based on student level
 */
function getLevelColors(level: string): { primary: string; light: string; dark: string } {
  const colors: Record<string, { primary: string; light: string; dark: string }> = {
    embers: { primary: '#ef4444', light: '#fef2f2', dark: '#b91c1c' },
    sparks: { primary: '#f97316', light: '#fff7ed', dark: '#c2410c' },
    flames: { primary: '#f59e0b', light: '#fffbeb', dark: '#b45309' },
    blazers: { primary: '#10b981', light: '#ecfdf5', dark: '#047857' },
    supernovas: { primary: '#8b5cf6', light: '#f5f3ff', dark: '#6d28d9' }
  };
  return colors[level] || colors.flames;
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
 * Sanitize filename for download
 */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 100);
}

/**
 * Generate a standalone HTML file for a student group
 */
export function generateStudentHTML(data: LessonExportData): string {
  const { title, content, englishContent, group, generatedDate, imageMap } = data;
  
  // Detect if this is a bilingual export
  const isBilingual = group.homeLanguage !== 'English' && englishContent && englishContent.trim().length > 0;

  // Language codes + direction
  const translatedLangCode = getISOCode(group.homeLanguage);
  const isRTL = isRTLLanguage(translatedLangCode);
  const dirAttr = isRTL ? 'rtl' : 'ltr';
  const direction = dirAttr;
  const textAlign = isRTL ? 'right' : 'left';
  
  // Process content - convert [VISUAL: ...] and [NANOBANANA: "..."] to images or styled placeholders
  const processMarkdown = (md: string): string => {
    let processed = md;
    
    // Find image URL - now uses simple exact match since [VISUAL:] tags are always in English
    const findImageUrl = (description: string): string | undefined => {
      const trimmedDesc = description.trim();
      
      // Exact match (keys are now always English)
      if (imageMap?.has(trimmedDesc)) {
        return imageMap.get(trimmedDesc);
      }
      
      // Fallback: case-insensitive match
      if (imageMap) {
        const lowerDesc = trimmedDesc.toLowerCase();
        for (const [key, url] of imageMap.entries()) {
          if (key.toLowerCase() === lowerDesc) {
            return url;
          }
        }
      }
      
      return undefined;
    };
    
    const replaceVisual = (match: string, description: string) => {
      const imageUrl = findImageUrl(description);
      
      if (imageUrl) {
        return `<figure class="lesson-figure">
          <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(description)}" class="lesson-image" loading="lazy" />
          <figcaption>${escapeHtml(description)}</figcaption>
        </figure>`;
      }
      
      // Fallback to styled placeholder
      return `<div class="visual-placeholder">
        <span class="visual-icon">📐</span>
        <span class="visual-label">${escapeHtml(description)}</span>
        <span class="teacher-note">Teacher: Insert diagram or use whiteboard</span>
      </div>`;
    };
    
    // Replace both [VISUAL: ...] and [NANOBANANA: "..."] formats
    processed = processed.replace(/\[VISUAL:\s*(.+?)\]/g, replaceVisual);
    processed = processed.replace(/\[NANOBANANA:\s*"(.+?)"\]/g, replaceVisual);
    
    processed = processed.replace(/_{10,}/g, '<div class="answer-line"></div>');
    return marked.parse(processed) as string;
  };
  
  const translatedHTML = processMarkdown(content);
  const englishHTML = isBilingual && englishContent ? processMarkdown(englishContent) : '';
  
  // Get level styling
  const levelKey = getLevelKey(group.readingLevelLabel);
  const levelColors = getLevelColors(levelKey);
  
  // Build body content based on bilingual or single-column
  // Bilingual uses a semantic <table> for WCAG 2.1 AA (SC 1.3.1 Info & Relationships)
  // with per-cell `lang` attributes (SC 3.1.2 Language of Parts).
  const bodyContent = isBilingual
    ? `
      <table class="bilingual-container" role="table" aria-describedby="bilingual-desc">
        <caption id="bilingual-desc" class="sr-only">
          Side-by-side bilingual handout. Left column: ${escapeHtml(group.homeLanguage)}. Right column: English. The two columns present the same lesson content in parallel.
        </caption>
        <thead>
          <tr>
            <th scope="col" lang="${translatedLangCode}" dir="${dirAttr}" class="bilingual-header translated">
              <span class="column-flag" aria-hidden="true">🌍</span>
              ${escapeHtml(group.homeLanguage)}
            </th>
            <th scope="col" lang="en" dir="ltr" class="bilingual-header english">
              <span class="column-flag" aria-hidden="true">🇺🇸</span>
              English
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td lang="${translatedLangCode}" dir="${dirAttr}" class="bilingual-cell translated">
              <div class="column-content">${translatedHTML}</div>
            </td>
            <td lang="en" dir="ltr" class="bilingual-cell english">
              <div class="column-content">${englishHTML}</div>
            </td>
          </tr>
        </tbody>
      </table>
    `
    : `<div class="single-column-content">${translatedHTML}</div>`;
  
  const languageDisplay = isBilingual 
    ? `${escapeHtml(group.homeLanguage)} + English` 
    : escapeHtml(group.homeLanguage);

  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} - ${escapeHtml(group.groupName)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700&family=Noto+Sans+Arabic:wght@400;500;600;700&family=Noto+Color+Emoji&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    
    :root {
      --color-primary: ${levelColors.primary};
      --color-primary-light: ${levelColors.light};
      --color-primary-dark: ${levelColors.dark};
      --color-text: #1f2937;
      --color-text-muted: #6b7280;
      --color-bg: #ffffff;
      --color-bg-subtle: #f9fafb;
      --color-border: #e5e7eb;
      --color-english: #3b82f6;
      --color-english-light: #eff6ff;
      --font-main: 'Nunito', 'Noto Sans Arabic', system-ui, sans-serif;
      --font-emoji: 'Noto Color Emoji', 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif;
    }
    
    html { font-size: 16px; scroll-behavior: smooth; }
    
    body {
      font-family: var(--font-main);
      font-size: 1rem;
      line-height: 1.6;
      color: var(--color-text);
      background: var(--color-bg);
      padding: 0;
      margin: 0;
    }
    
    .lesson-container {
      max-width: ${isBilingual ? '1200px' : '800px'};
      margin: 0 auto;
      padding: 2rem 1.5rem;
    }
    
    @media (max-width: 640px) {
      .lesson-container { padding: 1rem; }
    }
    
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
    
    /* ===== BILINGUAL LAYOUT ===== */
    .bilingual-container {
      width: 100%;
      border-collapse: separate;
      border-spacing: 2rem 0;
      margin-top: 1.5rem;
      table-layout: fixed;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    .bilingual-container th,
    .bilingual-container td {
      width: 50%;
      vertical-align: top;
      padding: 1.5rem;
      border-radius: 0.75rem;
    }

    .bilingual-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-muted);
      padding: 0.75rem 1.5rem;
      border-bottom: 1px solid var(--color-border);
      text-align: left;
    }

    .bilingual-cell {
      background: var(--color-bg);
      min-height: 400px;
    }

    .bilingual-cell.translated {
      border-left: 4px solid var(--color-primary);
      background: var(--color-primary-light);
    }

    .bilingual-cell.english {
      border-left: 4px solid var(--color-english);
      background: var(--color-english-light);
    }

    .column-flag {
      font-size: 1rem;
    }
    
    /* Single column for English-only */
    .single-column-content {
      direction: ${direction};
      text-align: ${textAlign};
    }
    
    /* Content styling */
    .column-content h1, .column-content h2, .column-content h3, .column-content h4,
    .single-column-content h1, .single-column-content h2, .single-column-content h3, .single-column-content h4 {
      font-weight: 600;
      line-height: 1.3;
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
      color: var(--color-text);
    }
    
    .column-content h1, .single-column-content h1 { font-size: 1.5rem; }
    .column-content h2, .single-column-content h2 { 
      font-size: 1.25rem; 
      padding-bottom: 0.5rem;
      border-bottom: 2px solid var(--color-border);
    }
    .column-content h3, .single-column-content h3 { font-size: 1.125rem; }
    .column-content h4, .single-column-content h4 { font-size: 1rem; }
    
    .column-content p, .single-column-content p { margin-bottom: 1rem; }
    .column-content strong, .single-column-content strong { font-weight: 600; }
    .column-content em, .single-column-content em { font-style: italic; }
    
    .column-content ul, .column-content ol,
    .single-column-content ul, .single-column-content ol {
      margin-bottom: 1rem;
      padding-left: 1.5rem;
    }
    
    [dir="rtl"] .column-content ul, [dir="rtl"] .column-content ol {
      padding-left: 0;
      padding-right: 1.5rem;
    }
    
    .column-content li, .single-column-content li { margin-bottom: 0.375rem; }
    .column-content li::marker, .single-column-content li::marker { color: var(--color-primary); }
    
    .column-content table, .single-column-content table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5rem 0;
      font-size: 0.9rem;
    }
    
    .column-content th, .column-content td,
    .single-column-content th, .single-column-content td {
      padding: 0.625rem 0.75rem;
      text-align: left;
      border: 1px solid var(--color-border);
    }
    
    [dir="rtl"] .column-content th, [dir="rtl"] .column-content td {
      text-align: right;
    }
    
    .column-content th, .single-column-content th {
      background: rgba(0,0,0,0.03);
      font-weight: 600;
    }
    
    /* Lesson figures - generated images */
    .lesson-figure {
      margin: 2rem auto;
      text-align: center;
      max-width: 100%;
      background: var(--color-bg);
      padding: 1rem;
      border-radius: 0.75rem;
      border: 1px solid var(--color-border);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    
    .lesson-image {
      display: block;
      max-width: 100%;
      height: auto;
      border-radius: 0.4rem;
      margin: 0 auto;
    }
    
    .lesson-figure figcaption {
      margin-top: 0.75rem;
      font-size: 0.85rem;
      color: var(--color-text-muted);
      font-weight: 500;
      line-height: 1.4;
    }
    
    /* Visual placeholders - fallback when no image */
    .visual-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      margin: 1.5rem 0;
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border: 2px dashed #0ea5e9;
      border-radius: 0.75rem;
      text-align: center;
      min-height: 150px;
    }
    
    .visual-icon { 
      font-size: 2.5rem; 
      margin-bottom: 0.75rem; 
    }
    
    .visual-label { 
      font-size: 0.9rem; 
      color: #0369a1;
      font-weight: 500;
      max-width: 400px;
    }
    
    .teacher-note {
      font-size: 0.75rem;
      color: #64748b;
      margin-top: 0.5rem;
      font-style: italic;
    }
    
    .answer-line {
      border-bottom: 2px solid var(--color-border);
      height: 2.5rem;
      margin: 0.75rem 0;
      background: linear-gradient(to bottom, transparent 90%, rgba(0,0,0,0.02) 90%);
    }
    
    .lesson-footer {
      margin-top: 3rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--color-border);
      text-align: center;
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }
    
    /* Mobile: Stack table cells vertically while preserving semantics */
    @media (max-width: 768px) {
      .bilingual-container,
      .bilingual-container thead,
      .bilingual-container tbody,
      .bilingual-container tr,
      .bilingual-container th,
      .bilingual-container td {
        display: block;
        width: 100%;
      }
      .bilingual-container { border-spacing: 0; }
      .bilingual-container thead { margin-bottom: 1rem; }
      .bilingual-container td { margin-bottom: 1.5rem; }
      .bilingual-container tbody td { min-height: auto; }
    }

    /* Print: keep table semantics, allow cell breaks */
    @media print {
      body { font-size: 10pt; }
      .lesson-container { max-width: 100%; padding: 0; }
      .bilingual-container { border-spacing: 1rem 0; }
      .bilingual-container td {
        padding: 0.75rem;
        font-size: 9pt;
        page-break-inside: avoid;
      }
      .visual-placeholder { border-style: solid; }
      .lesson-figure {
        page-break-inside: avoid;
        border: 1px solid #ccc;
        box-shadow: none;
      }
      h2, h3 { page-break-after: avoid; }
      table { page-break-inside: avoid; }
    }

    /* Dark mode */
    @media (prefers-color-scheme: dark) {
      :root {
        --color-text: #f3f4f6;
        --color-text-muted: #9ca3af;
        --color-bg: #111827;
        --color-bg-subtle: #1f2937;
        --color-border: #374151;
      }
      .bilingual-cell.translated {
        background: rgba(239, 68, 68, 0.1);
      }
      .bilingual-cell.english {
        background: rgba(59, 130, 246, 0.1);
      }
    }
  </style>
</head>
<body>
  <div class="lesson-container">
    <header class="lesson-header">
      <span class="lesson-badge">${escapeHtml(group.groupName)}</span>
      <h1 class="lesson-title">${escapeHtml(title)}</h1>
      <div class="lesson-meta">
        <span class="lesson-meta-item">
          <span>📚</span>
          <span>${escapeHtml(group.readingLevelLabel)}</span>
        </span>
        <span class="lesson-meta-item">
          <span>🌐</span>
          <span>${languageDisplay}</span>
        </span>
      </div>
    </header>
    
    <main class="lesson-content">
      ${bodyContent}
    </main>
    
    <footer class="lesson-footer">
      Generated by Authentic Learning Studio • ${escapeHtml(generatedDate)}
    </footer>
  </div>
</body>
</html>`;
}

/**
 * Trigger download of HTML file
 */
export function downloadHTML(html: string, filename: string): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${sanitizeFilename(filename)}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Download a single group's lesson as HTML
 */
export function downloadGroupHTML(
  title: string,
  content: string,
  group: StudentGroup,
  englishContent?: string,
  imageMap?: Map<string, string>
): void {
  const html = generateStudentHTML({
    title,
    content,
    englishContent,
    group,
    generatedDate: new Date().toLocaleDateString(),
    imageMap
  });
  downloadHTML(html, `${title}_${group.groupName}`);
}

/**
 * Download all groups as a ZIP file
 */
export async function downloadAllAsZip(
  title: string,
  groupContents: { group: StudentGroup; content: string; englishContent?: string }[],
  imageMap?: Map<string, string>
): Promise<void> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  const generatedDate = new Date().toLocaleDateString();
  
  groupContents.forEach(({ group, content, englishContent }) => {
    const html = generateStudentHTML({ title, content, englishContent, group, generatedDate, imageMap });
    const filename = `${sanitizeFilename(title)}_${sanitizeFilename(group.groupName)}.html`;
    zip.file(filename, html);
  });
  
  // Add README
  const bilingualGroups = groupContents.filter(g => g.group.homeLanguage !== 'English' && g.englishContent);
  const readme = `# ${title}

Generated by Authentic Learning Studio
Date: ${generatedDate}

## Contents

${groupContents.map(({ group }) => {
  const isBilingual = group.homeLanguage !== 'English';
  return `- ${group.groupName}.html (${group.readingLevelLabel}, ${group.homeLanguage}${isBilingual ? ' + English bilingual' : ''})`;
}).join('\n')}

## How to Use

1. Upload these HTML files to your LMS (Canvas, Schoology, Google Classroom)
2. Assign each file to the appropriate student group
3. Students click the file to view their personalized lesson
${bilingualGroups.length > 0 ? '\n## Bilingual Layout\n\nFiles for non-English groups display content side-by-side:\n- Left column: Content in student\'s home language\n- Right column: English version\n' : ''}
`;
  
  zip.file('README.txt', readme);
  
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${sanitizeFilename(title)}_All_Groups.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
