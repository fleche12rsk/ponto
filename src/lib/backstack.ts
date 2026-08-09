/**
 * Pilha de "voltar". O botão físico de voltar do Android fecha o que estiver
 * por cima (diálogo → folha → tela empilhada) antes de pensar em sair do app.
 */

type Handler = () => void

const stack: Handler[] = []

export function pushBackHandler(handler: Handler): () => void {
  stack.push(handler)
  return () => {
    const i = stack.lastIndexOf(handler)
    if (i >= 0) stack.splice(i, 1)
  }
}

/** Retorna false quando não havia nada para fechar. */
export function handleBack(): boolean {
  const top = stack[stack.length - 1]
  if (!top) return false
  top()
  return true
}
