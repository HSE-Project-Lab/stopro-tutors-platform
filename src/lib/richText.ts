import DOMPurify from 'dompurify';

const ALLOWED_TAGS = ['b', 'strong', 'i', 'em', 'u', 's', 'strike', 'br', 'p', 'div', 'ul', 'ol', 'li', 'span'];
const ALLOWED_ATTR = ['class'];
const ALLOWED_CLASSES = new Set(['cw-list-plain']);

export function sanitizeRichHtml(html: string): string {
  const clean = DOMPurify.sanitize(html ?? '', {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    KEEP_CONTENT: true,
  });
  const container = document.createElement('div');
  container.innerHTML = clean;
  container.querySelectorAll('[class]').forEach((el) => {
    const kept = Array.from(el.classList).filter((c) => ALLOWED_CLASSES.has(c));
    if (kept.length === 0) el.removeAttribute('class');
    else el.setAttribute('class', kept.join(' '));
  });
  return container.innerHTML;
}

export function htmlToPlainText(html: string): string {
  const prepared = sanitizeRichHtml(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li)>/gi, '\n');
  const container = document.createElement('div');
  container.innerHTML = prepared;
  return (container.textContent ?? '').replace(/\n{3,}/g, '\n\n').trim();
}

export function htmlToInlineText(html: string): string {
  return htmlToPlainText(html).replace(/\s+/g, ' ').trim();
}

export function isRichHtmlEmpty(html: string): boolean {
  return htmlToPlainText(html).length === 0;
}
