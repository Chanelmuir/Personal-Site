// A small C++ highlighter: enough for the code on these pages, without pulling in a full grammar.
export type TokenKind = 'comment' | 'string' | 'number' | 'keyword' | 'type' | 'preprocessor' | 'function' | 'plain'
export type Token = { kind: TokenKind; text: string }

const KEYWORDS = new Set([
  'auto', 'break', 'case', 'catch', 'class', 'const', 'constexpr', 'continue', 'default', 'delete', 'do',
  'else', 'for', 'if', 'new', 'noexcept', 'nullptr', 'operator', 'private', 'protected', 'public',
  'return', 'static', 'struct', 'template', 'this', 'throw', 'true', 'false', 'try', 'typename', 'using', 'while',
])
const TYPES = new Set(['bool', 'char', 'double', 'float', 'int', 'long', 'size_t', 'std', 'T', 'void', 'unsigned'])

const PATTERN = /(\/\/.*)|("(?:[^"\\]|\\.)*")|(^\s*#.*)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)(?=\s*\()|([A-Za-z_]\w*)/g

export function highlightLine(line: string): Token[] {
  const tokens: Token[] = []
  let last = 0
  for (const m of line.matchAll(PATTERN)) {
    if (m.index > last) tokens.push({ kind: 'plain', text: line.slice(last, m.index) })
    const [text, comment, string, pre, num, call, word] = m
    let kind: TokenKind = 'plain'
    if (comment) kind = 'comment'
    else if (string) kind = 'string'
    else if (pre) kind = 'preprocessor'
    else if (num) kind = 'number'
    else if (call) kind = KEYWORDS.has(call) ? 'keyword' : 'function'
    else if (word) kind = KEYWORDS.has(word) ? 'keyword' : TYPES.has(word) || /^[A-Z]/.test(word) ? 'type' : 'plain'
    tokens.push({ kind, text })
    last = m.index + text.length
  }
  if (last < line.length) tokens.push({ kind: 'plain', text: line.slice(last) })
  return tokens
}

// The lines [start, end] of the function defined as `name(...)`, found by counting braces.
// The visualiser uses these to light up whichever function is running.
export function functionRange(lines: string[], name: string): [number, number] | null {
  // A definition, not a call: `void grow() {` rather than `if (full) grow();`
  const definition = new RegExp(`^\\s*[\\w:&<>*\\s]+\\b${name}\\(`)
  const start = lines.findIndex((l) => definition.test(l) && !/^\s*(if|for|while|return)\b/.test(l) && !l.trim().endsWith(';'))
  if (start < 0) return null
  let depth = 0
  let opened = false
  for (let i = start; i < lines.length; i++) {
    for (const ch of lines[i].replace(/\/\/.*$/, '')) {
      if (ch === '{') { depth++; opened = true }
      if (ch === '}') depth--
    }
    if (opened && depth <= 0) {
      // Include the comment lines sitting directly above the function
      let top = start
      while (top > 0 && lines[top - 1].trim().startsWith('//')) top--
      return [top, i]
    }
  }
  return null
}
