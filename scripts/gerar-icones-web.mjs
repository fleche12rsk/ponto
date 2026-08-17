/**
 * Gera os ícones PNG do PWA em `public/`.
 *
 * PWA exige PNG rasterizado. Em vez de trazer uma biblioteca de imagem só
 * para desenhar dois círculos, o script escreve o PNG na mão: o formato é
 * simples e o `zlib` já vem no Node.
 *
 *     npm run icones:web
 */

import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')

// Cores do §5.1, as mesmas do ícone adaptável do Android.
const FUNDO = [0x12, 0x11, 0x0e]
const AMBAR = [0xff, 0xb0, 0x20]

const TABELA_CRC = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let c = -1
  for (let i = 0; i < buf.length; i++) c = TABELA_CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return c ^ -1
}

/** Um pedaço de PNG: tamanho, tipo, dados e o CRC de tudo isso. */
function chunk(tipo, dados) {
  const tamanho = Buffer.alloc(4)
  tamanho.writeUInt32BE(dados.length)
  const corpo = Buffer.concat([Buffer.from(tipo, 'ascii'), dados])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(corpo) >>> 0)
  return Buffer.concat([tamanho, corpo, crc])
}

/** Dois pontos âmbar centralizados sobre o fundo escuro (§12). */
function desenhar(lado, proporcao) {
  const linhas = []
  const centro = lado / 2
  const raio = lado * proporcao
  const separacao = raio * 2.1
  const cy1 = centro - separacao / 2
  const cy2 = centro + separacao / 2

  for (let y = 0; y < lado; y++) {
    // Cada linha de PNG começa com um byte de filtro; 0 = sem filtro.
    const linha = Buffer.alloc(1 + lado * 3)
    for (let x = 0; x < lado; x++) {
      const distancia = Math.min(
        Math.hypot(x - centro, y - cy1),
        Math.hypot(x - centro, y - cy2),
      )
      // Suaviza a borda em 1px, senão o círculo fica serrilhado.
      const cobertura = Math.max(0, Math.min(1, raio - distancia + 0.5))
      for (let canal = 0; canal < 3; canal++) {
        linha.writeUInt8(
          Math.round(FUNDO[canal] + (AMBAR[canal] - FUNDO[canal]) * cobertura),
          1 + x * 3 + canal,
        )
      }
    }
    linhas.push(linha)
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(lado, 0)
  ihdr.writeUInt32BE(lado, 4)
  ihdr.writeUInt8(8, 8) // 8 bits por canal
  ihdr.writeUInt8(2, 9) // tipo 2 = RGB sem transparência
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(Buffer.concat(linhas), { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const saidas = [
  // Tamanhos que o manifesto pede.
  { arquivo: 'icone-192.png', lado: 192, proporcao: 0.11 },
  { arquivo: 'icone-512.png', lado: 512, proporcao: 0.11 },
  /*
    "Maskable": o Android recorta o ícone em círculo ou losango conforme o
    aparelho. O glifo precisa caber na zona segura central, então vai menor.
  */
  { arquivo: 'icone-512-maskable.png', lado: 512, proporcao: 0.075 },
  // O iOS ignora o manifesto e usa esta tag; sem ela, inventa uma letra.
  { arquivo: 'apple-touch-icon.png', lado: 180, proporcao: 0.11 },
  // Aba do navegador. Sem isto, o console reclama de favicon.ico ausente.
  { arquivo: 'favicon.png', lado: 32, proporcao: 0.13 },
]

/*
  Vão para `public-web/`, não `public/`. Tudo que está em `public/` é copiado
  para dentro do APK, e ícone de PWA não tem o que fazer lá — o app nativo usa
  os ícones adaptáveis do Android.
*/
const destino = join(raiz, 'public-web')
mkdirSync(destino, { recursive: true })
for (const s of saidas) {
  const png = desenhar(s.lado, s.proporcao)
  writeFileSync(join(destino, s.arquivo), png)
  console.log(`public-web/${s.arquivo}  ${s.lado}×${s.lado}  ${(png.length / 1024).toFixed(1)} KB`)
}
