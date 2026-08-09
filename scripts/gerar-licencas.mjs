/**
 * Gera src/lib/licenses.generated.ts a partir dos arquivos LICENSE reais que
 * estão em node_modules.
 *
 * Escrever texto de licença à mão é pedir para introduzir erro; aqui o
 * conteúdo vem sempre da fonte. Rode de novo depois de mexer nas
 * dependências que vão dentro do APK:
 *
 *     node scripts/gerar-licencas.mjs
 */

import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const modules = join(root, 'node_modules')

/**
 * Só o que é EMPACOTADO no app entra aqui. Ferramentas de build (Vite,
 * TypeScript, o CLI do Capacitor) não vão para o APK, então não geram
 * obrigação de atribuição.
 */
const SHIPPED = [
  { pkg: 'react', name: 'React', note: 'Interface do app' },
  { pkg: '@capacitor/core', name: 'Capacitor', note: 'Ponte com o Android' },
  { pkg: 'lucide-react', name: 'Lucide', note: 'Ícones' },
  { pkg: 'jspdf', name: 'jsPDF', note: 'Geração do relatório em PDF' },
  { pkg: '@fontsource/public-sans', name: 'Public Sans', note: 'Tipografia da interface' },
  { pkg: '@fontsource/source-serif-4', name: 'Source Serif 4', note: 'Títulos e números editoriais' },
  { pkg: '@fontsource/ibm-plex-mono', name: 'IBM Plex Mono', note: 'Dígitos do cronômetro' },
]

function findLicenseFile(pkgDir) {
  const entries = readdirSync(pkgDir, { withFileTypes: true })
  const match = entries.find(
    (e) => e.isFile() && /^licen[sc]e/i.test(e.name),
  )
  return match ? join(pkgDir, match.name) : null
}

function firstCopyrightLine(text) {
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (/^copyright/i.test(trimmed) && trimmed.length > 'copyright'.length + 2) {
      // Os fontsource repetem o copyright para cada arquivo .ttf; fica só o primeiro.
      return trimmed.split(/\.ttf:/)[0].trim()
    }
  }
  return null
}

const items = []

for (const entry of SHIPPED) {
  const pkgDir = join(modules, entry.pkg)
  const pkgJson = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'))
  const licensePath = findLicenseFile(pkgDir)
  const text = licensePath ? readFileSync(licensePath, 'utf8').trim() : ''

  items.push({
    name: entry.name,
    pkg: entry.pkg,
    note: entry.note,
    license: pkgJson.license ?? 'desconhecida',
    version: pkgJson.version,
    copyright: firstCopyrightLine(text),
    text,
  })
}

const banner = `/**
 * ARQUIVO GERADO: não edite à mão.
 * Fonte: os arquivos LICENSE em node_modules.
 * Regenere com: node scripts/gerar-licencas.mjs
 */

export interface ThirdPartyLicense {
  name: string
  pkg: string
  note: string
  license: string
  version: string
  copyright: string | null
  text: string
}

export const THIRD_PARTY_LICENSES: ThirdPartyLicense[] = `

mkdirSync(join(root, 'src', 'lib'), { recursive: true })
writeFileSync(
  join(root, 'src', 'lib', 'licenses.generated.ts'),
  banner + JSON.stringify(items, null, 2) + '\n',
  'utf8',
)

console.log(`${items.length} licenças gravadas em src/lib/licenses.generated.ts`)
for (const i of items) {
  console.log(`  ${i.name.padEnd(18)} ${i.license.padEnd(10)} ${i.text.length} chars`)
}
