import { marked } from 'marked'
import DOMPurify from 'dompurify'

// Renders markdown to HTML and strips anything that could execute script or
// exfiltrate data: <script>, inline event handlers (onerror, onclick...),
// javascript: URLs, <iframe>/<object>/<embed>, and <form> (used to prevent
// credential-harvesting forms rendered from untrusted markdown, e.g. AI
// assistant replies or imported note content).
//
// Every dangerouslySetInnerHTML in this codebase MUST go through this
// helper — never call marked.parse() directly into the DOM.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  // Force any surviving links to open safely.
  if (node.tagName === 'A') {
    node.setAttribute('rel', 'noopener noreferrer')
    if (node.getAttribute('target') === '_blank' || node.hasAttribute('href')) {
      node.setAttribute('target', '_blank')
    }
  }
})

export function renderSafeMarkdown(text) {
  const rawHtml = marked.parse(text ?? '', { async: false })
  return DOMPurify.sanitize(rawHtml, {
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'link', 'meta'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'srcdoc'],
    ALLOW_DATA_ATTR: false,
  })
}
