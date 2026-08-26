/**
 * Convert the HTML that Word and Google Docs produce into the markdown the
 * lesson content field expects.
 *
 * Deliberately dependency-free and DOM-free so it runs in the browser, in a
 * Deno edge function, and under the node test runner without a shim — the same
 * constraint the shared lesson renderer works under.
 *
 * This is not a general HTML converter. It targets the narrow, well-behaved
 * subset those two exporters emit: headings, paragraphs, lists, tables, and
 * inline emphasis. Anything it does not recognise degrades to its text.
 */

const BLOCK_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'table', 'blockquote', 'pre', 'div'];

/**
 * Find the close tag matching the element that opened at `from`, counting
 * nested opens of the same name.
 *
 * A non-greedy regex cannot do this: given `<li>a<ul><li>b</li></ul></li>` it
 * stops at the inner `</li>` and swallows half the structure. Lists nest by
 * nature, so the scan has to track depth.
 */
function findMatchingClose(html: string, tag: string, from: number): number {
  const re = new RegExp(`<(/?)(${tag})\\b[^>]*?(/?)>`, 'gi');
  re.lastIndex = from;
  let depth = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const isClose = m[1] === '/';
    const selfClosing = m[3] === '/';
    if (selfClosing) continue;
    if (isClose) {
      depth -= 1;
      if (depth === 0) return m.index;
    } else {
      depth += 1;
    }
  }
  return -1;
}

/** Split a list's inner HTML into its top-level <li> bodies. */
function topLevelListItems(html: string): string[] {
  const items: string[] = [];
  const openRe = /<li\b[^>]*>/gi;
  let m: RegExpExecArray | null;
  let cursor = 0;
  while ((m = openRe.exec(html)) !== null) {
    if (m.index < cursor) continue;
    const contentStart = m.index + m[0].length;
    const close = findMatchingClose(html, 'li', m.index);
    const end = close === -1 ? html.length : close;
    items.push(html.slice(contentStart, end));
    cursor = end;
    openRe.lastIndex = end;
  }
  return items;
}

/** Decode the handful of entities these exporters actually emit. */
export function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_m, d) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_m, h) => String.fromCharCode(parseInt(h, 16)));
}

/** Escape the markdown characters that would otherwise change meaning. */
function escapeMarkdown(text: string): string {
  return text.replace(/([\\`*_[\]])/g, '\\$1');
}

/**
 * Convert the inline content of one block: emphasis, links, line breaks.
 * Google Docs expresses emphasis as inline styles rather than tags, so both
 * spellings are handled.
 */
export function inlineToMarkdown(html: string): string {
  let out = html;

  // Google Docs: <span style="font-weight:700">bold</span>
  out = out.replace(
    /<span[^>]*style="[^"]*font-weight:\s*(?:bold|[6-9]\d\d)[^"]*"[^>]*>([\s\S]*?)<\/span>/gi,
    '<strong>$1</strong>',
  );
  out = out.replace(
    /<span[^>]*style="[^"]*font-style:\s*italic[^"]*"[^>]*>([\s\S]*?)<\/span>/gi,
    '<em>$1</em>',
  );

  out = out.replace(/<br\s*\/?>/gi, '\n');
  out = out.replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _t, inner) => {
    const text = inlineToMarkdown(inner).trim();
    return text ? `**${text}**` : '';
  });
  out = out.replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _t, inner) => {
    const text = inlineToMarkdown(inner).trim();
    return text ? `*${text}*` : '';
  });
  out = out.replace(
    /<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi,
    (_m, href, inner) => {
      const text = inlineToMarkdown(inner).trim();
      // Google Docs wraps every link in a redirector; unwrap to the real target.
      const clean = /google\.com\/url\?/.test(href)
        ? decodeURIComponent((href.match(/[?&]q=([^&]+)/) ?? [])[1] ?? href)
        : href;
      if (!text) return '';
      return `[${text}](${decodeEntities(clean)})`;
    },
  );

  // Anything left is markup we do not translate: drop the tags, keep the words.
  out = out.replace(/<[^>]+>/g, '');
  return decodeEntities(out).replace(/[ \t]+/g, ' ');
}

/** Convert one <ul>/<ol> into markdown list items, handling nesting. */
function listToMarkdown(html: string, ordered: boolean, depth = 0): string {
  const items: string[] = [];
  const indent = '  '.repeat(depth);
  let index = 1;

  for (const rawItem of topLevelListItems(html)) {
    // Pull any nested list out of the item before reading its own text, so the
    // child bullets are not flattened into the parent's line.
    const nested: string[] = [];
    let inner = rawItem;
    let guard = 0;
    for (;;) {
      const open = inner.search(/<(ul|ol)\b[^>]*>/i);
      if (open === -1 || (guard += 1) > 50) break;
      const tag = (inner.slice(open).match(/<(ul|ol)\b/i) ?? [])[1]!.toLowerCase();
      const close = findMatchingClose(inner, tag, open);
      const openTagEnd = open + inner.slice(open).indexOf('>') + 1;
      const end = close === -1 ? inner.length : close;
      const body = inner.slice(openTagEnd, end);
      nested.push(listToMarkdown(body, tag === 'ol', depth + 1));
      const after = close === -1 ? inner.length : end + inner.slice(end).indexOf('>') + 1;
      inner = inner.slice(0, open) + inner.slice(after);
    }

    const text = inlineToMarkdown(inner).trim();
    const marker = ordered ? `${index}.` : '-';
    if (text) items.push(`${indent}${marker} ${text}`);
    if (nested.length) items.push(nested.filter(Boolean).join('\n'));
    index += 1;
  }
  return items.join('\n');
}

/**
 * Convert one <table> into a GFM table.
 *
 * The delimiter row is always written, and always with exactly one cell per
 * header column. A table missing it is not a table — it reaches the student as
 * a row of literal pipe characters.
 */
function tableToMarkdown(html: string): string {
  const rows: string[][] = [];
  const rowRe = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch: RegExpExecArray | null;
  while ((rowMatch = rowRe.exec(html)) !== null) {
    const cells: string[] = [];
    const cellRe = /<(t[hd])\b[^>]*>([\s\S]*?)<\/\1>/gi;
    let cellMatch: RegExpExecArray | null;
    while ((cellMatch = cellRe.exec(rowMatch[1])) !== null) {
      // A newline inside a cell would break the row, so flatten it.
      cells.push(inlineToMarkdown(cellMatch[2]).replace(/\s*\n\s*/g, ' ').replace(/\|/g, '\\|').trim());
    }
    if (cells.length) rows.push(cells);
  }
  if (rows.length === 0) return '';

  const width = Math.max(...rows.map((r) => r.length));
  const pad = (r: string[]) => {
    const copy = r.slice();
    while (copy.length < width) copy.push('');
    return copy;
  };

  const header = pad(rows[0]);
  const body = rows.slice(1).map(pad);
  const lines = [
    `| ${header.join(' | ')} |`,
    `|${' --- |'.repeat(width)}`,
    ...body.map((r) => `| ${r.join(' | ')} |`),
  ];
  return lines.join('\n');
}

/** Convert a block-level element to markdown. */
function blockToMarkdown(tag: string, inner: string): string {
  const name = tag.toLowerCase();

  if (/^h[1-6]$/.test(name)) {
    const text = inlineToMarkdown(inner).trim();
    return text ? `${'#'.repeat(Number(name[1]))} ${text}` : '';
  }
  if (name === 'ul' || name === 'ol') return listToMarkdown(inner, name === 'ol');
  if (name === 'table') return tableToMarkdown(inner);
  if (name === 'blockquote') {
    const text = htmlToMarkdown(inner).trim();
    return text ? text.split('\n').map((l) => (l ? `> ${l}` : '>')).join('\n') : '';
  }
  if (name === 'pre') {
    const text = decodeEntities(inner.replace(/<[^>]+>/g, '')).replace(/\n+$/, '');
    return text.trim() ? '```\n' + text + '\n```' : '';
  }
  // p and div
  const text = inlineToMarkdown(inner).trim();
  return text;
}

/**
 * Convert a document's HTML body into markdown.
 *
 * Blocks are emitted in source order, separated by a blank line — which is also
 * what keeps an imported table parseable, since a table needs to start its own
 * block.
 */
export function htmlToMarkdown(html: string): string {
  let source = String(html ?? '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, '')
    .replace(/\r\n?/g, '\n');

  // Work on the body only when a full document is supplied.
  const bodyMatch = source.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) source = bodyMatch[1];

  const blocks: string[] = [];
  const openRe = new RegExp(`<(${BLOCK_TAGS.join('|')})\\b[^>]*>`, 'gi');
  let lastIndex = 0;
  let m: RegExpExecArray | null;

  while ((m = openRe.exec(source)) !== null) {
    if (m.index < lastIndex) continue;
    const tag = m[1].toLowerCase();
    // Depth-aware, so a block wrapped in nested <div>s — which is most of what
    // Google Docs emits — is taken whole rather than cut at the first close.
    const close = findMatchingClose(source, tag, m.index);
    const contentStart = m.index + m[0].length;
    const end = close === -1 ? source.length : close;

    const between = inlineToMarkdown(source.slice(lastIndex, m.index)).trim();
    if (between) blocks.push(between);

    const inner = source.slice(contentStart, end);
    // A div is only a wrapper: recurse so the blocks inside it are kept.
    const converted = tag === 'div' ? htmlToMarkdown(inner) : blockToMarkdown(tag, inner);
    if (converted) blocks.push(converted);

    lastIndex = close === -1 ? source.length : end + source.slice(end).indexOf('>') + 1;
    openRe.lastIndex = lastIndex;
  }

  const tail = inlineToMarkdown(source.slice(lastIndex)).trim();
  if (tail) blocks.push(tail);

  return blocks
    .join('\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
