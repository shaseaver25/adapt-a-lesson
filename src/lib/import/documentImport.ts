/**
 * Bringing an existing lesson plan in from Word or Google Docs.
 *
 * Two routes, for a reason worth stating: a .docx is read entirely in the
 * browser, so the file never leaves the teacher's machine — lesson plans carry
 * student names often enough that not uploading them is the safer default. A
 * Google Doc has to go through an edge function instead, because the browser
 * cannot fetch docs.google.com directly (CORS) .
 */

import { htmlToMarkdown } from './htmlToMarkdown';

/** Matches the server-side cap in differentiate-lesson. */
export const MAX_IMPORT_CHARS = 50000;
/** Word files above this are almost certainly not a single lesson plan. */
export const MAX_IMPORT_BYTES = 10 * 1024 * 1024;

export const ACCEPTED_FILE_EXTENSIONS = ['.docx', '.md', '.markdown', '.txt'] as const;

export interface ImportResult {
  markdown: string;
  /** Where it came from, for the status message a teacher reads. */
  sourceLabel: string;
  /** Non-fatal things the teacher should know about the import. */
  warnings: string[];
}

export class ImportError extends Error {}

/**
 * Pull the document id out of a Google Docs URL.
 *
 * Returns the id only — never a URL. The caller builds the export address from
 * the id itself, so a pasted link can never steer a server-side fetch at an
 * arbitrary host.
 */
export function parseGoogleDocId(input: string): string | null {
  const raw = String(input ?? '').trim();
  if (!raw) return null;

  // A bare id pasted on its own.
  if (/^[a-zA-Z0-9_-]{20,120}$/.test(raw)) return raw;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;
  if (url.hostname !== 'docs.google.com' && url.hostname !== 'drive.google.com') return null;

  // https://docs.google.com/document/d/<id>/edit
  const inPath = url.pathname.match(/\/(?:document|file)\/d\/([a-zA-Z0-9_-]{20,120})/);
  if (inPath) return inPath[1];

  // https://drive.google.com/open?id=<id>
  const inQuery = url.searchParams.get('id');
  if (inQuery && /^[a-zA-Z0-9_-]{20,120}$/.test(inQuery)) return inQuery;

  return null;
}

/**
 * Google serves a sign-in page instead of an error when a document is not
 * shared, so a 200 response is not on its own proof that we got the document.
 */
export function looksLikeGoogleSignIn(html: string): boolean {
  const head = String(html ?? '').slice(0, 4000);
  return (
    /accounts\.google\.com\/(?:v3\/signin|ServiceLogin)/i.test(head) ||
    /<title>[^<]*(?:Sign in|Meet Google|Request access)[^<]*<\/title>/i.test(head)
  );
}

function tooLong(markdown: string): string[] {
  return markdown.length > MAX_IMPORT_CHARS
    ? [
        `The document is ${markdown.length.toLocaleString()} characters and was trimmed to the ${MAX_IMPORT_CHARS.toLocaleString()}-character limit. Check the end of the lesson content.`,
      ]
    : [];
}

function finish(markdown: string, sourceLabel: string, warnings: string[]): ImportResult {
  const trimmed = markdown.trim();
  if (!trimmed) {
    throw new ImportError(
      'That document appears to be empty. If it is mostly images or text boxes, copy the text in by hand — those do not carry across.',
    );
  }
  return {
    markdown: trimmed.slice(0, MAX_IMPORT_CHARS),
    sourceLabel,
    warnings: [...warnings, ...tooLong(trimmed)],
  };
}

/**
 * Read a file the teacher picked. .docx is parsed in the browser with mammoth,
 * loaded on demand so it stays out of the main bundle.
 */
export async function importFromFile(file: File): Promise<ImportResult> {
  if (file.size > MAX_IMPORT_BYTES) {
    throw new ImportError(
      `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is ${MAX_IMPORT_BYTES / 1024 / 1024} MB.`,
    );
  }

  const name = file.name.toLowerCase();

  if (name.endsWith('.docx')) {
    const mammoth = await import('mammoth');
    const buffer = await file.arrayBuffer();
    const { value, messages } = await mammoth.convertToHtml({ arrayBuffer: buffer });
    const warnings = messages
      .filter((m) => m.type === 'warning')
      .some((m) => /image/i.test(m.message))
      ? ['Images in the document were not imported. Add them back with a [VISUAL: description] tag where you want them.']
      : [];
    return finish(htmlToMarkdown(value), file.name, warnings);
  }

  if (name.endsWith('.md') || name.endsWith('.markdown') || name.endsWith('.txt')) {
    return finish(await file.text(), file.name, []);
  }

  if (name.endsWith('.doc')) {
    throw new ImportError(
      'That is the older .doc format, which cannot be read here. Open it in Word and use Save As to make a .docx, then try again.',
    );
  }
  if (name.endsWith('.pdf')) {
    throw new ImportError(
      'PDFs are not supported. If the PDF came from a Word document, import that document instead.',
    );
  }
  throw new ImportError(
    `That file type cannot be read. Use a Word .docx, a .md, or a .txt file.`,
  );
}

/**
 * Turn the HTML an edge function fetched for a Google Doc into markdown.
 * Split out from the network call so it can be tested without one.
 */
export function importFromGoogleDocHtml(html: string, sourceLabel: string): ImportResult {
  if (looksLikeGoogleSignIn(html)) {
    throw new ImportError(
      'That document is not shared. In Google Docs choose Share, set General access to "Anyone with the link", then paste the link again.',
    );
  }
  return finish(htmlToMarkdown(html), sourceLabel, []);
}
