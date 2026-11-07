// Fails when a label in the site's code is not read from CAPTION. Run: npm run check:labels
const fs = require('fs')
const path = require('path')
const ts = require('typescript')

const TEXT_ATTRS = new Set(['label', 'title', 'description', 'message', 'hint', 'placeholder', 'aria-label', 'alt', 'note', 'text'])
const TEXT_PROPS = new Set(['label', 'title', 'description', 'note', 'error', 'notice', 'group', 'hint', 'message', 'ALL', 'OWN', 'selfie', 'proof'])
const TEXT_ARRAYS = new Set(['PLANNED', 'GROUPS', 'MONTHS', 'WEEKDAYS'])
const SKIP_ATTRS = new Set(['className', 'href', 'key', 'name', 'value', 'id', 'type', 'src', 'htmlFor', 'd', 'action'])
// Text that is not a label: developer errors nobody using the site sees.
const EXCEPTIONS = [/^API_BASE_URL and ADMIN_API_KEY/, /^Invalid money value/]

const sentence = text => /^[A-Z←→]/.test(text) && /[a-z]/.test(text) && !/^[A-Z][a-z]+([A-Z][A-Za-z0-9]*)+$/.test(text) && !/^(ERR_|UI_)/.test(text)
const hasWords = text => /[A-Za-z]{2}/.test(text) && !/^(ERR_|UI_|image\/)/.test(text)
const cssLike = text => /\b(bg|text|flex|grid|border|rounded|px|py|mt|mb|ml|mr|hover|focus)[-:]/.test(text)
const textAttr = name => TEXT_ATTRS.has(name) || /(Label|Text|Title|Message)$/.test(name)

function attrName(node) {
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (ts.isJsxAttribute(parent)) return parent.name.getText()
    if (ts.isJsxElement(parent) || ts.isJsxSelfClosingElement(parent) || ts.isBlock(parent)) return null
  }
  return null
}

function insideCaptionCall(node) {
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (ts.isCallExpression(parent) && parent.expression.getText() === 't') return true
  }
  return false
}

function insideDeveloperError(node) {
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (ts.isNewExpression(parent) && parent.expression.getText() !== 'Response') return true
  }
  return false
}

function isLabelString(node) {
  const text = node.text
  const parent = node.parent
  const attr = attrName(node)
  if (attr && SKIP_ATTRS.has(attr)) return false
  if (ts.isJsxAttribute(parent)) return hasWords(text) && textAttr(attr)
  if (ts.isJsxExpression(parent)) return hasWords(text) && (attr ? textAttr(attr) : true)
  if (ts.isPropertyAssignment(parent) && parent.initializer === node) {
    const key = parent.name.getText()
    return hasWords(text) && !cssLike(text) && (TEXT_PROPS.has(key) || (key === 'id' && /^JPG/.test(text)))
  }
  if (ts.isConditionalExpression(parent) && parent.condition !== node) return sentence(text)
  if (ts.isBinaryExpression(parent) && parent.right === node && ['&&', '||', '??'].includes(parent.operatorToken.getText())) return sentence(text)
  if (ts.isCallExpression(parent) && parent.expression !== node) return sentence(text) && text.includes(' ')
  if (ts.isNewExpression(parent)) return parent.expression.getText() === 'Response'
  if (ts.isVariableDeclaration(parent) && parent.initializer === node) return sentence(text) && text.includes(' ')
  if (ts.isReturnStatement(parent)) return sentence(text) && text.includes(' ')
  if (ts.isArrayLiteralExpression(parent) && ts.isVariableDeclaration(parent.parent)) return hasWords(text) && TEXT_ARRAYS.has(parent.parent.name.getText())
  return false
}

function isLabelTemplate(node) {
  const words = [node.head.text, ...node.templateSpans.map(span => span.literal.text)].join(' ')
  const attr = attrName(node)
  if (attr && SKIP_ATTRS.has(attr)) return false
  if (node.head.text.startsWith('/') || node.head.text.startsWith('?')) return false
  return /[A-Za-z]{2}/.test(words) && !cssLike(words) && !/[?&]\w+=/.test(words)
}

// Every piece of label text in one source file.
function findLabels(sourceFile) {
  const found = []
  const visit = node => {
    if (ts.isTypeNode(node) || ts.isImportDeclaration(node)) return
    if (insideCaptionCall(node) || insideDeveloperError(node)) return
    if (ts.isJsxText(node) && /[A-Za-z]{2}/.test(node.text)) found.push({ node, kind: 'jsx' })
    else if (ts.isStringLiteralLike(node) && isLabelString(node)) found.push({ node, kind: 'string' })
    else if (ts.isTemplateExpression(node) && isLabelTemplate(node)) found.push({ node, kind: 'template' })
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return found.filter(({ node }) => !EXCEPTIONS.some(rule => rule.test(node.text ?? '')))
}

function sourceFiles(root) {
  const walk = (dir, list = []) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      const name = full.replace(/\\/g, '/')
      if (entry.isDirectory()) walk(full, list)
      else if (/\.tsx?$/.test(entry.name) && !/lib\/api\/messages\.ts$|lib\/captions\//.test(name)) list.push(full)
    }
    return list
  }
  return ['app', 'components', 'lib'].flatMap(dir => walk(path.join(root, dir)))
}

function parse(file) {
  const kind = file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  return ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, kind)
}

if (require.main === module) {
  const root = path.join(__dirname, '..')
  let total = 0
  for (const file of sourceFiles(root)) {
    const sourceFile = parse(file)
    for (const { node } of findLabels(sourceFile)) {
      const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart())
      console.log(`${path.relative(root, file)}:${line + 1}  ${node.getText().replace(/\s+/g, ' ').trim().slice(0, 70)}`)
      total++
    }
  }
  console.log(total === 0 ? 'No hardcoded labels.' : `${total} hardcoded labels. Use t() with a UI_ code.`)
  process.exit(total === 0 ? 0 : 1)
}

module.exports = { findLabels, sourceFiles, parse, ts }
