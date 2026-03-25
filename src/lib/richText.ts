import sanitizeHtml from 'sanitize-html'

const ALLOWED_TAGS = ['p', 'strong', 'b', 'em', 'i', 'u', 'a', 'ul', 'ol', 'li', 'br']
const SANITIZE_CONFIG: sanitizeHtml.IOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  transformTags: {
    a: (_tagName: string, attribs: sanitizeHtml.Attributes) => ({
      tagName: 'a',
      attribs: {
        ...attribs,
        rel: attribs.rel ?? 'noopener noreferrer',
      },
    }),
  },
}

const ENTITY_MAP: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
}

const hasHtmlTags = (value: string) => /<\/?[a-z][\s\S]*>/i.test(value)

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const decodeEntities = (value: string): string => {
  if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
    const textarea = window.document.createElement('textarea')
    textarea.innerHTML = value
    return textarea.value
  }
  return value.replace(/&(nbsp|amp|lt|gt|quot|#39);/g, (_, entity: string) => ENTITY_MAP[`&${entity};`] ?? `&${entity};`)
}

export function sanitizeRichText(value: string): string {
  if (!value) return ''
  return sanitizeHtml(value, SANITIZE_CONFIG).trim()
}

export function normalizeRichTextInput(value: string): string {
  if (!value) return ''
  if (hasHtmlTags(value)) return sanitizeRichText(value)
  const trimmed = value.trim()
  if (!trimmed) return ''
  const paragraphs = trimmed.split(/\n\s*\n/)
  const html = paragraphs
    .map(paragraph => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br />')}</p>`)
    .join('')
  return sanitizeRichText(html)
}

export function getPlainTextFromHtml(value: string): string {
  if (!value) return ''
  const stripped = sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} })
  return decodeEntities(stripped).replace(/\s+/g, ' ').trim()
}

export function getRichTextPreview(value: string, maxLength = 140): string {
  const plain = getPlainTextFromHtml(value)
  if (plain.length <= maxLength) return plain
  return `${plain.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`
}

export function isRichTextEmpty(value: string): boolean {
  return getPlainTextFromHtml(value).length === 0
}
