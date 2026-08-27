import { describe, expect, it } from 'vitest';
import { marked } from 'marked';
import { htmlToMarkdown, inlineToMarkdown } from '../htmlToMarkdown';
import {
  ImportError,
  importFromGoogleDocHtml,
  looksLikeGoogleSignIn,
  parseGoogleDocId,
  MAX_IMPORT_CHARS,
} from '../documentImport';
import { normalizeMarkdownTables } from '../../../../supabase/functions/_shared/lessonHtmlRenderer.ts';

describe('parseGoogleDocId only ever yields an id, never a host', () => {
  it('reads the id out of the usual document URLs', () => {
    const id = '1a2B3c4D5e6F7g8H9i0J1k2L3m4N5o6P7q8R9s0T';
    for (const url of [
      `https://docs.google.com/document/d/${id}/edit`,
      `https://docs.google.com/document/d/${id}/edit?usp=sharing`,
      `https://docs.google.com/document/d/${id}/`,
      `https://drive.google.com/file/d/${id}/view`,
      `https://drive.google.com/open?id=${id}`,
    ]) {
      expect(parseGoogleDocId(url), url).toBe(id);
    }
  });

  it('accepts a bare id pasted on its own', () => {
    const id = '1a2B3c4D5e6F7g8H9i0J1k2L3m4N5o6P7q8R9s0T';
    expect(parseGoogleDocId(id)).toBe(id);
  });

  // The id is the only thing that reaches the server, and the export address is
  // rebuilt from it there. These are the inputs that would matter if it weren't.
  it('refuses anything that is not a Google host', () => {
    for (const hostile of [
      'https://evil.example.com/document/d/1a2B3c4D5e6F7g8H9i0J1k2L3m4N5o6P/edit',
      'https://docs.google.com.evil.example.com/document/d/1a2B3c4D5e6F7g8H9i0J1k2L3m4N/edit',
      'http://docs.google.com/document/d/1a2B3c4D5e6F7g8H9i0J1k2L3m4N5o6P/edit',
      'https://169.254.169.254/latest/meta-data/',
      'http://localhost:8000/',
      'file:///etc/passwd',
      'javascript:alert(1)',
      'not a url at all',
      '',
    ]) {
      expect(parseGoogleDocId(hostile), hostile).toBeNull();
    }
  });

  it('refuses a Google URL carrying no document id', () => {
    expect(parseGoogleDocId('https://docs.google.com/document/')).toBeNull();
    expect(parseGoogleDocId('https://drive.google.com/open?id=short')).toBeNull();
  });
});

describe('an unshared document is recognised rather than imported', () => {
  it('spots the sign-in page Google serves instead of a 403', () => {
    const signIn =
      '<html><head><title>Sign in - Google Accounts</title></head><body>' +
      '<form action="https://accounts.google.com/v3/signin/identifier"></form></body></html>';
    expect(looksLikeGoogleSignIn(signIn)).toBe(true);
    expect(() => importFromGoogleDocHtml(signIn, 'doc')).toThrow(ImportError);
    expect(() => importFromGoogleDocHtml(signIn, 'doc')).toThrow(/not shared/i);
  });

  it('does not mistake a real document for a sign-in page', () => {
    const doc = '<html><body><h1>Photosynthesis</h1><p>Plants make food.</p></body></html>';
    expect(looksLikeGoogleSignIn(doc)).toBe(false);
    expect(importFromGoogleDocHtml(doc, 'doc').markdown).toContain('# Photosynthesis');
  });

  it('rejects an empty document with advice rather than importing nothing', () => {
    expect(() => importFromGoogleDocHtml('<html><body></body></html>', 'doc')).toThrow(/empty/i);
  });

  it('trims a document past the generator limit and says so', () => {
    const long = `<body><p>${'word '.repeat(MAX_IMPORT_CHARS)}</p></body>`;
    const result = importFromGoogleDocHtml(long, 'doc');
    expect(result.markdown.length).toBeLessThanOrEqual(MAX_IMPORT_CHARS);
    expect(result.warnings.join(' ')).toMatch(/trimmed/i);
  });
});

describe('htmlToMarkdown handles what Word and Google Docs emit', () => {
  it('converts headings, paragraphs and emphasis', () => {
    const md = htmlToMarkdown(
      '<h1>Water Cycle</h1><p>Water <strong>evaporates</strong> and then <em>condenses</em>.</p><h2>Step one</h2>',
    );
    expect(md).toContain('# Water Cycle');
    expect(md).toContain('**evaporates**');
    expect(md).toContain('*condenses*');
    expect(md).toContain('## Step one');
  });

  it('reads Google Docs inline-styled bold and italic', () => {
    const md = inlineToMarkdown(
      '<span style="font-weight:700">Melody</span> and <span style="font-style:italic">pitch</span>',
    );
    expect(md).toBe('**Melody** and *pitch*');
  });

  it('unwraps the Google redirect that wraps every link', () => {
    const md = inlineToMarkdown(
      '<a href="https://www.google.com/url?q=https://nasa.gov/water&amp;sa=D">NASA water cycle</a>',
    );
    expect(md).toBe('[NASA water cycle](https://nasa.gov/water)');
  });

  it('converts ordered and unordered lists, including nesting', () => {
    const md = htmlToMarkdown(
      '<ul><li>Sounds<ul><li>High</li><li>Low</li></ul></li></ul><ol><li>First</li><li>Second</li></ol>',
    );
    expect(md).toContain('- Sounds');
    expect(md).toContain('  - High');
    expect(md).toContain('1. First');
    expect(md).toContain('2. Second');
  });

  it('decodes entities', () => {
    expect(htmlToMarkdown('<p>Tom &amp; Jerry&nbsp;&#39;s &lt;lesson&gt;</p>')).toBe(
      "Tom & Jerry 's <lesson>",
    );
  });

  it('keeps pipe characters inside a cell from breaking the row', () => {
    const md = htmlToMarkdown('<table><tr><th>A</th><th>B</th></tr><tr><td>x|y</td><td>z</td></tr></table>');
    expect(md).toContain('x\\|y');
    expect(/<table/.test(marked.parse(md) as string)).toBe(true);
  });
});

describe('an imported table survives all the way to rendered HTML', () => {
  // The point of the whole import: a vocabulary table in a teacher's Word file
  // has to come out the other end as a real table, not a run of pipes.
  const wordTable =
    '<h2>Vocabulary</h2>' +
    '<table><tr><th>Word</th><th>Meaning</th></tr>' +
    '<tr><td>Melody</td><td>A group of sounds</td></tr>' +
    '<tr><td>Pitch</td><td>How high or low a sound is</td></tr></table>';

  it('produces a table with a delimiter row', () => {
    const md = htmlToMarkdown(wordTable);
    expect(md).toMatch(/\| Word \| Meaning \|\n\|(?: --- \|)+/);
  });

  it('parses as a real table, and the normaliser leaves it alone', () => {
    const md = htmlToMarkdown(wordTable);
    expect(/<table/.test(marked.parse(md) as string)).toBe(true);
    expect(normalizeMarkdownTables(md)).toBe(md);
  });

  it('pads a ragged row so the table still parses', () => {
    const ragged =
      '<table><tr><th>A</th><th>B</th><th>C</th></tr><tr><td>1</td></tr></table>';
    const html = marked.parse(htmlToMarkdown(ragged)) as string;
    expect(/<table/.test(html)).toBe(true);
  });
});

describe('nesting the regex approach would have broken', () => {
  it('keeps a block wrapped in nested divs whole', () => {
    // Google Docs wraps almost everything in layers of <div>.
    const md = htmlToMarkdown(
      '<div><div><h1>Title</h1><p>Body text.</p></div><p>After.</p></div>',
    );
    expect(md).toContain('# Title');
    expect(md).toContain('Body text.');
    expect(md).toContain('After.');
  });

  it('keeps a table wrapped in divs parseable', () => {
    const md = htmlToMarkdown(
      '<div><div><table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table></div></div>',
    );
    expect(/<table/.test(marked.parse(md) as string)).toBe(true);
  });

  it('indents three levels of nested list correctly', () => {
    const md = htmlToMarkdown(
      '<ul><li>One<ul><li>Two<ul><li>Three</li></ul></li></ul></li></ul>',
    );
    expect(md).toContain('- One');
    expect(md).toContain('  - Two');
    expect(md).toContain('    - Three');
  });

  it('does not merge a nested item into its parent line', () => {
    const md = htmlToMarkdown('<ul><li>Sounds<ul><li>High</li></ul></li></ul>');
    expect(md).not.toContain('SoundsHigh');
  });
});
