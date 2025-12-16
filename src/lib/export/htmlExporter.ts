import { marked } from 'marked';

interface StudentGroup {
  id: string;
  groupName: string;
  readingLevelLabel: string;
  homeLanguage: string;
}

interface LessonExportData {
  title: string;
  content: string;
  group: StudentGroup;
  generatedDate: string;
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
  const { title, content, group, generatedDate } = data;
  
  // Detect RTL languages
  const rtlLanguages = ['Arabic', 'Hebrew', 'Farsi', 'Urdu', 'العربية'];
  const isRTL = rtlLanguages.some(lang => 
    group.homeLanguage.toLowerCase().includes(lang.toLowerCase())
  );
  const direction = isRTL ? 'rtl' : 'ltr';
  const textAlign = isRTL ? 'right' : 'left';
  
  // Process content
  let processedContent = content;
  
  // Convert [VISUAL: ...] to styled placeholders
  processedContent = processedContent.replace(
    /\[VISUAL:\s*(.+?)\]/g,
    '<div class="visual-placeholder"><span class="visual-icon">📊</span><span class="visual-label">$1</span></div>'
  );
  
  // Convert answer lines to input-like boxes
  processedContent = processedContent.replace(/_{10,}/g, '<div class="answer-line"></div>');
  
  // Parse markdown to HTML
  const contentHTML = marked.parse(processedContent);
  
  // Get level styling
  const levelKey = getLevelKey(group.readingLevelLabel);
  const levelColors = getLevelColors(levelKey);
  
  return `<!DOCTYPE html>
<html lang="en" dir="${direction}">
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
      direction: ${direction};
      text-align: ${textAlign};
      padding: 0;
      margin: 0;
    }
    
    .lesson-container {
      max-width: 800px;
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
    
    .lesson-content h1, .lesson-content h2, .lesson-content h3, .lesson-content h4 {
      font-weight: 600;
      line-height: 1.3;
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
      color: var(--color-text);
    }
    
    .lesson-content h1 { font-size: 1.75rem; }
    .lesson-content h2 { 
      font-size: 1.375rem; 
      padding-bottom: 0.5rem;
      border-bottom: 2px solid var(--color-border);
    }
    .lesson-content h3 { font-size: 1.125rem; }
    .lesson-content h4 { font-size: 1rem; }
    
    .lesson-content p { margin-bottom: 1rem; }
    .lesson-content strong, .lesson-content b { font-weight: 600; }
    .lesson-content em, .lesson-content i { font-style: italic; }
    
    .lesson-content ul, .lesson-content ol {
      margin-bottom: 1rem;
      padding-${isRTL ? 'right' : 'left'}: 1.5rem;
    }
    
    .lesson-content li { margin-bottom: 0.375rem; }
    .lesson-content li::marker { color: var(--color-primary); }
    
    .lesson-content table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5rem 0;
      font-size: 0.9375rem;
    }
    
    .lesson-content th, .lesson-content td {
      padding: 0.75rem 1rem;
      text-align: ${textAlign};
      border: 1px solid var(--color-border);
    }
    
    .lesson-content th {
      background: var(--color-bg-subtle);
      font-weight: 600;
    }
    
    .lesson-content tr:nth-child(even) td {
      background: var(--color-bg-subtle);
    }
    
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
    
    .visual-icon { font-size: 2rem; margin-bottom: 0.5rem; }
    .visual-label { font-size: 0.875rem; color: var(--color-text-muted); font-style: italic; }
    
    .answer-line {
      border-bottom: 2px solid var(--color-border);
      height: 2.5rem;
      margin: 0.75rem 0;
      background: linear-gradient(to bottom, transparent 90%, var(--color-bg-subtle) 90%);
    }
    
    .lesson-footer {
      margin-top: 3rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--color-border);
      text-align: center;
      font-size: 0.75rem;
      color: var(--color-text-muted);
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
    
    @media print {
      body { font-size: 11pt; line-height: 1.4; }
      .lesson-container { max-width: 100%; padding: 0; }
      .visual-placeholder { border-style: solid; }
      h2, h3 { page-break-after: avoid; }
      table { page-break-inside: avoid; }
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
          <span>${escapeHtml(group.homeLanguage)}</span>
        </span>
      </div>
    </header>
    
    <main class="lesson-content">
      ${contentHTML}
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
  group: StudentGroup
): void {
  const html = generateStudentHTML({
    title,
    content,
    group,
    generatedDate: new Date().toLocaleDateString()
  });
  downloadHTML(html, `${title}_${group.groupName}`);
}

/**
 * Download all groups as a ZIP file
 */
export async function downloadAllAsZip(
  title: string,
  groupContents: { group: StudentGroup; content: string }[]
): Promise<void> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  const generatedDate = new Date().toLocaleDateString();
  
  groupContents.forEach(({ group, content }) => {
    const html = generateStudentHTML({ title, content, group, generatedDate });
    const filename = `${sanitizeFilename(title)}_${sanitizeFilename(group.groupName)}.html`;
    zip.file(filename, html);
  });
  
  // Add README
  const readme = `# ${title}

Generated by Authentic Learning Studio
Date: ${generatedDate}

## Contents

${groupContents.map(({ group }) => `- ${group.groupName}.html (${group.readingLevelLabel}, ${group.homeLanguage})`).join('\n')}

## How to Use

1. Upload these HTML files to your LMS (Canvas, Schoology, Google Classroom)
2. Assign each file to the appropriate student group
3. Students click the file to view their personalized lesson
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
