# Horas — Documento Base de Design

> Especificação de design para implementação. Plataforma: Android (primeiro) e iOS via Capacitor — React + Vite + TypeScript em WebView. Interface em Português do Brasil. App local, sem servidor, offline-first.
>
> Este documento é a fonte da verdade visual e de comportamento. Onde ele especifica um valor (cor, tamanho, texto, duração), esse valor é para ser implementado literalmente. Nenhuma decisão visual foi deixada em aberto de propósito.

---

## Sumário

1. [Conceito e posicionamento](#1-conceito-e-posicionamento)
2. [Fluxos principais](#2-fluxos-principais)
3. [Mapa de telas e navegação](#3-mapa-de-telas-e-navegação)
4. [Cada tela em detalhe](#4-cada-tela-em-detalhe)
5. [Sistema visual](#5-sistema-visual)
6. [Componentes](#6-componentes)
7. [Movimento](#7-movimento)
8. [Texto da interface](#8-texto-da-interface)
9. [Modelo de dados](#9-modelo-de-dados)
10. [Layout do PDF do relatório](#10-layout-do-pdf-do-relatório)
11. [Acessibilidade e ergonomia](#11-acessibilidade-e-ergonomia)
12. [Ícone do app e tela de abertura](#12-ícone-do-app-e-tela-de-abertura)

---

## 1. Conceito e posicionamento

**Horas** é um cronômetro de trabalho que vira dinheiro. O freelancer aperta um botão quando começa, aperta de novo quando para, e no fim do mês sabe exatamente quanto cobrar de cada cliente — com um PDF sóbrio para enviar junto da cobrança. Tudo fica no celular, funciona sem internet, e foi feito para ser aberto dez vezes por dia por poucos segundos cada.

**O que Horas deliberadamente NÃO é:** não é um gerenciador de projetos (sem Kanban, sem tarefas, sem subtarefas, sem dependências). Não é um app de equipe (um usuário, um celular, zero login, zero nuvem). Não é uma ferramenta de produtividade com metas, gamificação ou "foco". Não emite nota fiscal nem faz cobrança — ele documenta horas e gera o comprovante; o pagamento acontece fora do app. A regra de corte para qualquer funcionalidade nova: *isso ajuda a medir o tempo ou a cobrar por ele?* Se não, fica de fora.

**A tensão de design que rege tudo:** sóbrio onde é ferramenta (cronometrar, lançar, revisar — rápido, previsível, sem distração), expressivo onde é momento (o timer em si, o fechamento do mês, o total em R$). O número é tratado como elemento gráfico, não como dado numa planilha.

### Nomes alternativos

| Nome | Justificativa |
|---|---|
| **Horas** (trabalho) | Direto, honesto, sem metáfora. Diz exatamente o que faz. Risco: genérico, difícil de buscar na loja e de virar marca. |
| **Ponto** | Curto, brasileiro, já significa "registro de trabalho" (bater ponto) no vocabulário do país. Duplo sentido bom: ponto de partida, ponto final. Forte para ícone (um único ponto âmbar). |
| **Talão** | Evoca o comprovante, o bloco de recibos — o lado "cobrança" do app. Tom editorial, memorável, pouco disputado nas lojas. Risco: soa mais "financeiro" que "tempo". |
| **Régua** | O app é a régua com que o freelancer mede o próprio trabalho e se protege de orçar errado. Metáfora de precisão e de justiça ("na régua"). Curto, concreto, ótimo para logo. |

Recomendação: **Ponto** como nome de produto se o objetivo for marca e loja; **Horas** se o objetivo for clareza imediata. O restante deste documento usa "Horas".

---

## 2. Fluxos principais

Para cada fluxo: os passos, onde o usuário se perde, e como o design evita isso.

### 2.1 Primeiro uso (onboarding)

**Objetivo:** sair da abertura com pelo menos um cliente e um projeto criados, e entender que o botão grande é o coração do app — sem tour, sem carrossel de slides.

1. Abertura (splash) → cai direto na tela **Cronômetro**, em estado vazio.
2. O estado vazio não é uma tela quebrada: mostra o botão grande **Começar** desabilitado com a legenda *"Escolha um projeto para começar"* e um botão âmbar **Criar primeiro cliente**.
3. Toque em **Criar primeiro cliente** → folha inferior (bottom sheet) com: nome, cor (grade de 8 cores pré-definidas, uma já selecionada), valor/hora. Só o nome é obrigatório; valor/hora vem pré-preenchido com o padrão dos Ajustes.
4. Ao salvar, uma segunda folha aparece automaticamente: *"Criar um projeto para {cliente}?"* com nome do projeto e (opcional) horas orçadas. Botão secundário **Agora não**.
5. Volta ao Cronômetro. Agora o seletor de projeto tem uma opção, o botão **Começar** está ativo e pulsa uma vez para chamar atenção.

**Onde se perde:** achar que precisa configurar muita coisa antes de usar. **Como o design evita:** só o nome do cliente é obrigatório; tudo mais tem padrão sensato. O caminho feliz do onboarding tem no máximo dois formulários curtos, encadeados, e termina exatamente na ação principal.

### 2.2 Começar a cronometrar

**Objetivo:** de app fechado a timer rodando em menos de três toques.

1. Abre o app → tela Cronômetro.
2. Toca no **seletor de projeto** (topo do card do timer) → folha com clientes e projetos, agrupados por cliente, com bolinha de cor. Busca aparece se houver mais de 8 projetos.
3. Escolhe o projeto → a folha fecha, o nome e a cor do projeto assumem o card, o botão grande vira **Começar**.
4. Toca em **Começar** → os dígitos começam a correr; o botão vira dois: **Pausar** (secundário) e **Encerrar** (âmbar). Surge a notificação persistente do Android.
5. **Encerrar** → folha com o tempo total já preenchido, campo de **nota** ("O que você fez?", opcional) e botão **Salvar registro**.

**Atalho:** se o usuário já cronometrou aquele projeto por último, ao abrir o app o seletor já vem preenchido com ele — dois toques (Começar → pronto).

**Onde se perde:** medo de que o tempo pare quando fecha o app ou apaga a tela. **Como o design evita:** ao iniciar, aparece por 2s um selo discreto *"Contando em segundo plano"* abaixo do timer, e a notificação persistente confirma que continua rodando. O timer nunca é reconstruído por "quanto tempo o app ficou aberto" — é calculado por `started_at` real, então fechar/reabrir mostra o valor correto na hora.

### 2.3 Lançar horas manualmente

**Objetivo:** registrar trabalho que não foi cronometrado, com o mínimo de digitação.

1. Cronômetro ou Histórico → botão **+** (canto superior direito no Cronômetro; FAB no Histórico) → **Lançar horas**.
2. Folha/tela com, nesta ordem visual: **projeto**, **data** (padrão: hoje), **início** e **fim** (seletores de hora nativos em roda), e **nota** opcional.
3. Abaixo dos campos de hora, a **duração calculada** aparece grande e ao vivo ("3h 30min") — o usuário confere sem fazer conta.
4. Alternativa: um botão de segmento no topo permite trocar de "Início e fim" para "**Duração**" (digita direto "3h30") quando a pessoa não lembra os horários exatos.
5. **Salvar** → volta e o novo registro aparece no topo do dia com um destaque breve.

**Onde se perde:** virada de meia-noite (das 23h às 1h) e fusos de "fim antes do início". **Como o design evita:** se o fim for anterior ao início, o app assume que passou da meia-noite e mostra abaixo *"Termina no dia seguinte"* em vez de erro; a duração calculada confirma o resultado. Só vira erro de verdade se a duração passar de 24h.

### 2.4 Fechar o mês (gerar relatório)

**Objetivo:** transformar um mês de registros no comprovante que vai junto da cobrança.

1. Aba **Resumo** → já mostra o mês atual, total de horas e total em R$, quebrado por cliente.
2. Toca no cliente que vai cobrar → tela de detalhe do cliente no período.
3. Botão **Gerar relatório** → tela de configuração: período (padrão: mês vigente), incluir/excluir notas, incluir horas já faturadas ou só as pendentes.
4. **Pré-visualizar** → mostra o PDF renderizado dentro do app, rolável.
5. **Compartilhar PDF** (folha de compartilhamento nativa) e/ou **Exportar CSV**.
6. Ao voltar, o app pergunta uma vez: *"Marcar essas horas como faturadas?"* — separando o que já foi cobrado do que falta.

**Onde se perde:** cobrar duas vezes as mesmas horas no mês seguinte. **Como o design evita:** o marcar-como-faturado é oferecido logo após gerar o relatório, e horas faturadas ganham um selo visual e somem do total "a cobrar" por padrão — mas continuam no histórico.

---

## 3. Mapa de telas e navegação

### Estrutura de navegação

**Barra de abas inferior fixa, com 4 abas.** Quatro é o certo: cobre as quatro coisas que o app faz (medir, revisar, cadastrar, ajustar) sem forçar o usuário a caçar. A aba ativa usa o âmbar; as inativas são texto terciário. A barra respeita a área segura de gestos do Android.

| Aba | Ícone | O que contém |
|---|---|---|
| **Agora** | cronômetro | Tela principal do timer. É onde o app abre sempre. |
| **Resumo** | gráfico/barras | Totais por período, quebra por cliente e projeto, "a cobrar" vs "faturado". |
| **Clientes** | pessoas | Lista de clientes → projetos. Cadastro e edição. |
| **Ajustes** | engrenagem | Preferências, tema, sobre. |

O **Histórico** (registros dia a dia) não é uma aba própria: mora dentro de **Resumo** como uma sub-visão ("Resumo / Histórico" alternável por segmento no topo), porque quase sempre se chega nele a partir de um total que se quer detalhar.

### Grafo de conexões

```
Splash
  └─> Agora (Cronômetro)  ← app sempre abre aqui
        ├─ seletor de projeto ─────────> [folha] Escolher projeto
        ├─ + ───────────────────────────> [folha] Lançar horas manual
        ├─ Encerrar ────────────────────> [folha] Finalizar registro (nota)
        └─ estado vazio ────────────────> [folha] Novo cliente → [folha] Novo projeto

Resumo
  ├─ segmento: Resumo | Histórico
  ├─ seletor de período ──────────────> [folha] Escolher período
  ├─ card de cliente ─────────────────> Detalhe do cliente (período)
  │       └─ Gerar relatório ─────────> Configurar relatório ─> Pré-visualizar PDF ─> Compartilhar
  └─ (Histórico) linha de registro ───> [folha] Editar registro

Clientes
  ├─ + ───────────────────────────────> [folha] Novo cliente
  ├─ cliente ─────────────────────────> Detalhe do cliente
  │       ├─ + projeto ───────────────> [folha] Novo/editar projeto
  │       └─ projeto ─────────────────> Detalhe do projeto (horas, orçado x real)
  └─ editar ──────────────────────────> [folha] Editar cliente

Ajustes
  ├─ Valor/hora padrão, moeda, 1º dia da semana
  ├─ Tema: claro | escuro | sistema
  └─ Sobre ───────────────────────────> Tela Sobre (crédito, link micio.dev)
```

Regra de navegação: ações rápidas e criação (cliente, projeto, lançamento, finalizar, período) abrem em **folha inferior** (não empurram tela nova) — dá para descartar arrastando para baixo, mantém o contexto e é confortável para o polegar. Só navegações que aprofundam de verdade (detalhe de cliente, configurar/pré-visualizar relatório, Sobre) empurram uma tela nova com voltar.

---

## 4. Cada tela em detalhe

Para cada tela: conteúdo, hierarquia visual (1º/2º/3º que o olho lê), ações e onde ficam, e estados.

### 4.1 Agora — Cronômetro (tela principal)

**Conteúdo e hierarquia:**
1. **O timer.** Ocupa o terço central-superior da tela. Dígitos gigantes em mono (`HH:MM:SS`), o `SS` levemente menor e em cor secundária para o olho pousar em horas/minutos. É a primeira e maior coisa da tela.
2. **O card do projeto ativo.** Logo acima ou abaixo do timer: bolinha de cor + nome do cliente + nome do projeto. Toque nele = trocar de projeto. Segundo na hierarquia.
3. **O botão de ação.** Grande, largura quase total, na zona baixa (alcance do polegar). Estado parado: **Começar** (âmbar). Estado rodando: par **Pausar** / **Encerrar**.
4. **Rodapé de contexto (terciário):** "Hoje: 4h 12min" — quanto já foi registrado no dia. Discreto.
5. **+** no canto superior direito → lançar horas manual.

**Estados:**
- **Vazio (sem clientes):** título editorial *"Comece a medir seu tempo"*, subtítulo curto, botão âmbar **Criar primeiro cliente**. Convida, não parece bug.
- **Pronto (parado):** timer em `00:00:00` esmaecido, projeto selecionado, botão **Começar** ativo.
- **Rodando:** dígitos correndo em âmbar/branco, selo *"Contando em segundo plano"* nos primeiros 2s, botões Pausar/Encerrar.
- **Pausado:** dígitos congelados em cor secundária, um traço de "pausa" piscando devagar, botões **Retomar** (âmbar) / **Encerrar**.
- **Muitos projetos:** o seletor vira busca; nada muda no timer.
- **Erro (raro):** se o relógio do sistema mudou para trás durante uma sessão, banner *"O horário do celular mudou; confira o registro ao encerrar."*

### 4.2 Folha: Escolher projeto
Lista agrupada por cliente (cabeçalho com bolinha de cor + nome), projetos como linhas. Topo: campo de busca (só se >8 projetos) e botão **Novo projeto**. Estado vazio: **Novo cliente**. O projeto usado por último aparece com um selo *"Recente"* no topo.

### 4.3 Folha: Finalizar registro
Aparece ao Encerrar. Hierarquia: (1) duração total já calculada, grande; (2) projeto; (3) campo **nota** ("O que você fez?"); (4) botões **Descartar** (texto, à esquerda) / **Salvar registro** (âmbar). Descartar pede confirmação.

### 4.4 Folha: Lançar horas manual
Segmento no topo: **Início e fim** | **Duração**. Campos: projeto, data (padrão hoje), início, fim (ou duração). Duração calculada ao vivo, grande, abaixo dos campos. Rodapé: **Cancelar** / **Salvar**. Estados: fim < início → nota "Termina no dia seguinte"; duração > 24h → erro inline.

### 4.5 Resumo
**Conteúdo e hierarquia:**
1. **Seletor de período** no topo (Semana | Mês | Personalizado) + o intervalo de datas.
2. **O par de totais**, em destaque editorial: **horas** e **R$** lado a lado, com o R$ em âmbar. É o que o olho procura.
3. **Alternância A cobrar / Faturado / Tudo** (segmento fino).
4. **Lista de clientes** com barra de proporção (quanto cada um representa), horas e R$ por cliente, respeitando a cor de cada cliente na barra.
5. Segmento no topo alterna **Resumo | Histórico**.

**Estados:** vazio (*"Nenhuma hora neste período"* + atalho para o Cronômetro); poucos dados (um cliente, barra cheia); muitos dados (rolagem, clientes ordenados por R$ desc); carregando (esqueleto das barras — some rápido pois é local).

### 4.6 Resumo / Histórico
Registros dia a dia, agrupados por data (cabeçalho de dia com total do dia à direita). Cada linha: cor do cliente, projeto, intervalo/duração, R$, selo "faturado" quando for o caso. Toque = editar; deslize para esquerda = apagar (com confirmação). Estado vazio igual ao Resumo.

### 4.7 Clientes (lista)
Lista de cartões de cliente: cor, nome, nº de projetos, total de horas do mês. **+** no topo. Estado vazio: ilustração tipográfica + **Criar primeiro cliente**. Muitos: busca no topo.

### 4.8 Detalhe do cliente
Cabeçalho com cor + nome + valor/hora + total no período. Abaixo: lista de projetos (cada um com orçado × real, barra de progresso na cor do cliente). Ações: **Editar cliente**, **Novo projeto**, **Gerar relatório**.

### 4.9 Detalhe do projeto
Nome, cliente, valor/hora efetivo, **orçado × trabalhado** com barra. Quando passa do orçado: a barra vira clay (não vermelho) e um aviso sóbrio *"12h acima do orçado"*. Lista de registros do projeto abaixo.

### 4.10 Configurar / Pré-visualizar relatório
Configuração: período, incluir notas (toggle), escopo (a cobrar / tudo). **Pré-visualizar** → render do PDF rolável dentro do app. Ações fixas no rodapé: **Compartilhar PDF**, **Exportar CSV**. Ao sair: prompt "Marcar como faturadas?".

### 4.11 Ajustes
Seções: **Padrões** (valor/hora, moeda, 1º dia da semana), **Aparência** (tema: Claro/Escuro/Sistema), **Notificações** (toggles), **Dados** (exportar tudo / apagar tudo), **Sobre**. Cada item é uma linha com rótulo à esquerda e valor/controle à direita.

### 4.12 Sobre
Ícone do app, nome, versão. Uma linha de crédito: *"Feito por micio.dev"* com o link tocável para **micio.dev**. Sóbrio, uma tela.

---

## 5. Sistema visual

Direção: fundo escuro profundo e quente como base, **âmbar** como única cor de destaque da marca (ações, timer, totais), tipografia editorial. Cada cliente tem sua própria cor, usada só como identidade (bolinhas, barras) — nunca compete com o âmbar por atenção de ação.

### 5.1 Paleta — Tema escuro (padrão)

| Papel | Hex | Uso | Contraste |
|---|---|---|---|
| Fundo base | `#12110E` | Fundo de toda tela | — |
| Superfície elevada | `#1B1A16` | Barra de abas, cabeçalhos | — |
| Card / folha | `#201E19` | Cartões, folhas inferiores | — |
| Linha / borda | `#2E2C26` | Divisórias, contornos 1px | — |
| Texto primário | `#F4F1EA` | Títulos, valores, corpo | 16.7:1 no fundo ✓ AAA |
| Texto secundário | `#B8B3A7` | Rótulos, apoio | 9.0:1 ✓ AAA |
| Texto terciário | `#8F8A7C` | Metadados, legendas | 5.5:1 ✓ AA |
| **Âmbar (marca)** | `#FFB020` | Ação primária, timer, R$, aba ativa | 10.3:1 ✓ AAA |
| Âmbar pressionado | `#E09600` | Estado :active do âmbar | — |
| Texto sobre âmbar | `#17160F` | Texto/ícone dentro de botão âmbar | 9.9:1 ✓ AAA |
| Aviso (acima do orçado) | `#E8956A` (clay) | Barra e aviso de estouro, sem alarme | 8.0:1 ✓ AAA |
| Perigo (apagar) | `#FF6B6B` | Ações destrutivas | 6.8:1 ✓ AA |
| Sucesso (faturado) | `#6FCF97` | Selo "faturado" | 9.9:1 ✓ AAA |

### 5.2 Paleta — Tema claro

| Papel | Hex | Uso | Contraste |
|---|---|---|---|
| Fundo base | `#F7F5F0` | Fundo (papel quente) | — |
| Superfície | `#FFFFFF` | Barra de abas, cabeçalhos | — |
| Card / folha | `#FFFFFF` | Cartões (com borda) | — |
| Linha / borda | `#E8E4DA` | Divisórias | — |
| Texto primário | `#1A1813` | Títulos, valores, corpo | 16.3:1 ✓ AAA |
| Texto secundário | `#565248` | Apoio | 7.2:1 ✓ AAA |
| Texto terciário | `#7C7768` | Metadados — **só ≥18px** | 4.1:1 ✓ AA Large |
| Âmbar (preenchimento) | `#F5A100` | Fundo de botão primário | texto escuro 8.4:1 ✓ |
| Âmbar (texto/ícone) | `#8A5A00` | Âmbar como texto sobre fundo claro | 5.4:1 ✓ AA |
| Aviso | `#B45309` | Estouro de orçado | 4.6:1 ✓ AA |
| Perigo | `#C62828` | Apagar | 5.2:1 ✓ AA |
| Sucesso | `#1E7A46` | Faturado | 4.9:1 ✓ AA |

> No tema claro, âmbar como **texto** usa `#8A5A00` (o `#FFB020` não tem contraste para texto sobre papel). Âmbar como **preenchimento de botão** usa `#F5A100` com texto escuro por cima. Ambos os temas dão AA ou melhor em todo texto essencial.

### 5.3 Cores de cliente

Paleta fixa de 8 cores para o usuário escolher (evita "carnaval" e garante contraste). Todas testadas como bolinha e como barra sobre os dois fundos. São **identidade**, nunca ação.

| Nome | Hex | | Nome | Hex |
|---|---|---|---|---|
| Índigo | `#6C7BFF` | | Verde-musgo | `#7FB069` |
| Rosa | `#F26D9C` | | Terracota | `#E08A5B` |
| Turquesa | `#3FC7C0` | | Violeta | `#B085F5` |
| Azul-aço | `#4F9DDE` | | Areia | `#D4A94E` |

**Disciplina de uso:** a cor do cliente aparece só como (1) bolinha de 8–10px ao lado do nome, (2) preenchimento de barras de proporção/progresso, (3) faixa lateral de 3px no cartão do cliente. Nunca em texto de corpo, nunca em botões, nunca como fundo de área grande. Numa tela com 6 clientes, o que organiza é a tipografia e o espaçamento; as cores são só âncoras de leitura. O âmbar continua sendo a única cor de ação.

### 5.4 Tipografia

Três famílias, todas gratuitas (Google Fonts):
- **Source Serif 4** — títulos de seção, números editoriais (totais em R$, duração calculada). Dá o "toque editorial", presença.
- **Public Sans** — toda a interface: rótulos, corpo, botões, listas. Neutra, legível, sem ser o Inter/Roboto de sempre.
- **IBM Plex Mono** — exclusivamente os dígitos do cronômetro (e horários em tabelas), com algarismos de largura fixa (`font-variant-numeric: tabular-nums`) para que o tempo não "pule" enquanto corre.

| Estilo | Família | Tam. | Peso | Entrelinha | Tracking | Onde |
|---|---|---|---|---|---|---|
| Timer | IBM Plex Mono | 72px | 500 | 1.0 | -0.02em | Dígitos do cronômetro |
| Timer segundos | IBM Plex Mono | 48px | 400 | 1.0 | -0.01em | `SS`, cor secundária |
| Display R$ | Source Serif 4 | 40px | 600 | 1.05 | 0 | Total em R$ (Resumo) |
| Display serif | Source Serif 4 | 34px | 600 | 1.1 | 0 | Duração calculada, hero de estado vazio |
| Título de tela (H1) | Source Serif 4 | 26px | 600 | 1.15 | 0 | Cabeçalho de tela |
| Título de seção (H2) | Public Sans | 15px | 700 | 1.3 | 0.04em (maiúsc.) | Rótulos de seção, cabeçalhos de grupo |
| Corpo | Public Sans | 16px | 400 | 1.5 | 0 | Texto padrão |
| Corpo forte | Public Sans | 16px | 600 | 1.5 | 0 | Nome de projeto/cliente em listas |
| Rótulo | Public Sans | 14px | 500 | 1.4 | 0 | Rótulos de campo, botões |
| Legenda | Public Sans | 13px | 400 | 1.4 | 0 | Metadados, "Hoje: …" |
| Micro | Public Sans | 11px | 600 | 1.3 | 0.06em (maiúsc.) | Selos ("FATURADO"), abas |
| Horários (tabela) | IBM Plex Mono | 14px | 400 | 1.4 | 0 | Colunas de hora no histórico/PDF |

Base de acessibilidade tipográfica: corpo nunca abaixo de 16px; nada essencial abaixo de 13px. A escala respeita o zoom de fonte do sistema (ver §11).

### 5.5 Espaçamento

Escala base 4px. Use apenas estes degraus:

| Token | px | Uso típico |
|---|---|---|
| `space-1` | 4 | Colagem fina (ícone↔texto) |
| `space-2` | 8 | Interno de chips/selos |
| `space-3` | 12 | Padding interno de linha |
| `space-4` | 16 | **Padding padrão de tela (margem lateral)**, gap entre campos |
| `space-5` | 24 | Entre grupos dentro de um card |
| `space-6` | 32 | Entre seções |
| `space-8` | 48 | Respiro em torno do timer, topo de estados vazios |
| `space-10` | 64 | Folga generosa em telas-momento |

Margem lateral de conteúdo: **16px**. Respiro é intencional: telas-ferramenta (Histórico) são densas; telas-momento (Cronômetro, total do Resumo) são arejadas (`space-8`+).

### 5.6 Raios de canto

| Token | Raio | Uso |
|---|---|---|
| `radius-sm` | 8px | Chips, selos, campos |
| `radius-md` | 12px | Botões, linhas de lista tocáveis |
| `radius-lg` | 20px | Cards, folhas inferiores (só cantos superiores) |
| `radius-pill` | 999px | Bolinhas de cor, botão de segmento |

### 5.7 Elevação / sombras

Em tema escuro, elevação é comunicada mais por **cor de superfície** (fundo → elevada → card) do que por sombra; sombras ficam sutis para não sujar o fundo profundo.

| Nível | Tema escuro | Tema claro |
|---|---|---|
| Card em repouso | sem sombra; distinção por cor de superfície + borda 1px `#2E2C26` | `0 1px 2px rgba(20,18,14,.06)` + borda `#E8E4DA` |
| Folha inferior | `0 -8px 32px rgba(0,0,0,.45)` | `0 -8px 32px rgba(20,18,14,.12)` |
| Botão âmbar (repouso) | `0 2px 8px rgba(255,176,32,.20)` (brilho quente sutil) | `0 2px 8px rgba(245,161,0,.25)` |
| Menu/popover | `0 12px 40px rgba(0,0,0,.5)` | `0 12px 40px rgba(20,18,14,.16)` |

### 5.8 Larguras de borda

1px para hairlines e contornos padrão. 2px só para foco de teclado/leitor e para a borda do campo em estado :focus. Barra de progresso: trilho 8px de altura, cheio na cor do cliente.

### 5.9 Ícones

**Família única: Lucide** (lucide.dev) — traço aberto, gratuito, licença ISC, ideal para WebView. Estilo: contorno (outline), traço **1.75px**, cantos arredondados, tamanho padrão **24px** (20px em linhas densas, 28px na barra de abas). Cor herda do texto (primário/secundário/âmbar quando ativo). Nunca preencher ícones exceto o glifo da aba ativa, que pode ganhar leve peso.

Mapa de ícones principais: `play` / `pause` / `square` (encerrar), `plus`, `timer` (aba Agora), `bar-chart-3` (Resumo), `users` (Clientes), `settings` (Ajustes), `calendar`, `clock`, `pencil` (editar), `trash-2` (apagar), `file-text` (relatório), `share-2`, `check` (faturado), `chevron-right`.

---

## 6. Componentes

Cada componente com todos os estados. Estados universais: **normal, pressionado (:active), desabilitado, carregando, erro** — descritos onde se aplicam.

### 6.1 Botões

| Variante | Uso | Normal | Pressionado | Desabilitado | Carregando |
|---|---|---|---|---|---|
| **Primário (âmbar)** | ação principal única por tela | fundo `#FFB020`, texto `#17160F`, radius-md, altura 52px, brilho sutil | fundo `#E09600`, escala 0.98 | fundo `#2E2C26`, texto terciário, sem sombra | spinner `#17160F` + rótulo esmaecido, largura mantida |
| **Grande (timer)** | Começar/Encerrar | igual primário, altura **64px**, largura quase total | escala 0.98 | idem | n/a |
| **Secundário** | Pausar, Agora não | fundo transparente, borda 1px `#2E2C26`, texto primário | fundo `#201E19` | texto terciário, borda esmaecida | spinner primário |
| **Texto** | Descartar, Cancelar | só texto secundário | texto primário | terciário | — |
| **Destrutivo** | Apagar | texto `#FF6B6B`; em confirmação vira fundo `#FF6B6B` + texto escuro | escurece 8% | — | spinner |

Toque mínimo 48×48px mesmo quando o rótulo é pequeno.

### 6.2 Campos de formulário

- **Texto/número:** rótulo acima (Rótulo 14/500), campo altura 52px, fundo `#1B1A16`, borda 1px `#2E2C26`, radius-sm, texto 16px (evita zoom automático).
- **Normal → foco:** borda vira `#FFB020` 2px. **Erro:** borda `#FF6B6B` + mensagem 13px abaixo em `#FF6B6B`. **Desabilitado:** fundo `#12110E`, texto terciário.
- **Valor/hora:** prefixo "R$" fixo em cor secundária dentro do campo; teclado numérico.
- **Nota:** textarea, cresce até 4 linhas, contador some (sem limite rígido).

### 6.3 Seletor de data e hora

- **Hora:** roda nativa (iOS wheel / Android time picker), 24h por padrão. Também aceita digitação. Início/fim lado a lado.
- **Data:** calendário em folha; atalhos "Hoje", "Ontem". Respeita 1º dia da semana dos Ajustes.
- **Período:** segmento Semana | Mês | Personalizado; personalizado abre intervalo (dois toques no calendário).

### 6.4 Cartão de cliente

Faixa lateral 3px na cor do cliente + bolinha + nome (Corpo forte) + linha de apoio "N projetos · Xh no mês". `chevron-right` à direita. Pressionado: fundo `#1B1A16`. Sem dados de mês: "Sem horas este mês" em terciário.

### 6.5 Linha de registro de horas

Layout: [cor] Projeto · Cliente | intervalo (mono) | R$ | selo. Toque = editar; deslize p/ esquerda revela **Apagar** (fundo perigo). Selo "FATURADO" (micro, verde) quando aplicável. Estado "sincronizando"/carregando não existe (é local); só há normal, pressionado e o de deslize.

### 6.6 Display do cronômetro

`HH:MM:SS` mono tabular. `HH:MM` em texto primário, `:SS` menor e secundário. Estados: **zerado** (esmaecido, `00:00:00`), **rodando** (primário, `:SS` pulsa suavíssimo a cada segundo — opacidade 0.6↔1, sem mover layout), **pausado** (tudo em secundário + traço piscando lento), **muito tempo** (após ~6h, os dígitos de hora ganham o âmbar como alerta gentil, combinando com a notificação de "esqueceu de parar?").

### 6.7 Navegação inferior (barra de abas)

Altura 56px + área segura de gestos. 4 itens: ícone 28px + micro-rótulo. Ativo: âmbar (ícone + rótulo). Inativo: terciário. Pressionado: fundo `#1B1A16` sutil. Sem badges numéricos. Fundo `#1B1A16` com hairline superior `#2E2C26`.

### 6.8 Folha inferior (bottom sheet)

Cantos superiores radius-lg, "puxador" (grabber) 36×4px no topo, fundo card, sombra de folha. Arrasta para baixo = descarta (com confirmação se houver dados não salvos). Título H2 no topo, ações fixas no rodapé. Backdrop `rgba(0,0,0,.5)`.

### 6.9 Modais e confirmações

Diálogo central (radius-lg, largura máx 320px) só para decisões que precisam de resposta imediata (apagar, descartar). Título curto + uma linha + dois botões (o destrutivo à direita, o seguro à esquerda). Nunca usar modal para fluxo — só para confirmação.

### 6.10 Avisos (banners / estouro de orçado)

- **Estouro de orçado:** dentro do card do projeto — barra vira clay `#E8956A`, texto *"Xh acima do orçado"* em clay. Sem ícone de alerta gritante, sem vermelho. É informação, não erro.
- **Banner de sistema** (raro): faixa fina no topo da tela, fundo `#201E19`, ícone + texto + fechar. Ex.: horário do celular mudou.
- **Toast:** confirmação efêmera (2.5s) no rodapé acima da barra de abas — "Registro salvo", "Marcado como faturado".

---

## 7. Movimento

Princípio: o app é aberto muitas vezes por dia por poucos segundos. **Nenhuma animação pode fazer o usuário esperar.** Transições são rápidas (120–240ms), servem para orientar e dar feedback, quase nunca para deleite puro. Curva padrão: `cubic-bezier(0.2, 0, 0, 1)` (saída rápida, chegada suave). Tudo respeita `prefers-reduced-motion`.

| Animação | Onde | Duração | Curva | Intenção |
|---|---|---|---|---|
| Troca de aba | barra inferior | 160ms | standard | Orientar (fade + 4px de deslize do conteúdo) |
| Abrir/fechar folha | folhas inferiores | 220ms entra / 180ms sai | standard | Orientar (sobe de baixo + backdrop fade) |
| Pressionar botão | todos os botões | 90ms | ease-out | Feedback tátil (escala 0.98) |
| Iniciar timer | botão Começar → Encerrar | 200ms | standard | Feedback (botão cresce e vira par; dígitos assumem cor) |
| Pulso do `:SS` | timer rodando | 1s por ciclo | ease-in-out | Sinal de vida — só opacidade, layout imóvel |
| Selo "background" | ao iniciar | aparece 150ms, fica 2s, some 300ms | standard | Reassegurar que conta em 2º plano |
| Salvar registro | folha → lista | 250ms | standard | Deleite contido (folha fecha, nova linha entra com realce âmbar que esmaece em 600ms) |
| Barra do Resumo | ao abrir Resumo | 400ms | ease-out | Deleite/orientar (barras crescem da esquerda, uma vez) |
| Marcar faturado | linha/selo | 200ms | standard | Feedback (selo aparece, linha esmaece um pouco) |
| Toast | rodapé | 200ms entra, 200ms sai, 2.5s visível | standard | Feedback |
| Pulso único "Começar" | fim do onboarding | 600ms, 1x | ease-out | Orientar o primeiro uso |

**Com `prefers-reduced-motion: reduce`:** todas as transições de posição viram cross-fade de ≤100ms ou desaparecem; o pulso do `:SS` e a animação das barras são desligados; o realce de novo registro vira um fundo estático que some sem movimento. O timer nunca depende de animação para funcionar.

**O que NÃO fazer:** nada de spinners longos (o app é local — dados aparecem na hora, use esqueletos só se algo passar de ~150ms), nada de transições de tela "empurrando" pesado, nada de confete, nada de parallax.

---

## 8. Texto da interface

Português do Brasil, direto, sem infantilizar, sem corporativês. "Você", nunca "usuário". Verbos no infinitivo para ações ("Começar", "Salvar", "Gerar relatório").

### Botões e ações

- `Começar` · `Pausar` · `Retomar` · `Encerrar` · `Salvar registro` · `Descartar`
- `Criar primeiro cliente` · `Novo cliente` · `Novo projeto` · `Lançar horas`
- `Gerar relatório` · `Pré-visualizar` · `Compartilhar PDF` · `Exportar CSV`
- `Editar` · `Apagar` · `Cancelar` · `Agora não` · `Salvar`

### Títulos de tela

- Agora · Resumo · Histórico · Clientes · Ajustes · Sobre
- `Escolher projeto` · `Finalizar registro` · `Lançar horas` · `Configurar relatório`

### Estados vazios

- **Cronômetro (sem clientes):** título *"Comece a medir seu tempo"* / apoio *"Crie um cliente e um projeto para dar o primeiro play."*
- **Cronômetro (pronto):** legenda no botão desabilitado *"Escolha um projeto para começar"*.
- **Resumo:** *"Nenhuma hora neste período."* / apoio *"Quando você registrar horas, o total aparece aqui."*
- **Histórico:** *"Nada registrado ainda."*
- **Clientes:** *"Você ainda não tem clientes."* / botão *"Criar primeiro cliente"*.
- **Projeto sem registros:** *"Sem horas neste projeto."*

### Placeholders de campo

- Nome do cliente: *"Ex.: Ateliê Rosa"*
- Nome do projeto: *"Ex.: Site institucional"*
- Valor/hora: *"R$ 0,00"*
- Nota do registro: *"O que você fez? (opcional)"*
- Horas orçadas: *"Ex.: 15h"*

### Confirmações

- **Apagar registro:** título *"Apagar este registro?"* / corpo *"Essa ação não pode ser desfeita."* / botões *"Cancelar"* / *"Apagar"*.
- **Descartar sessão:** *"Descartar o tempo cronometrado?"* / *"O tempo desta sessão será perdido."* / *"Voltar"* / *"Descartar"*.
- **Apagar cliente:** *"Apagar {cliente} e seus projetos?"* / *"Todos os registros deste cliente também serão apagados."* / *"Cancelar"* / *"Apagar tudo"*.
- **Marcar faturado (após relatório):** *"Marcar essas horas como faturadas?"* / *"Elas saem do total a cobrar, mas continuam no histórico."* / *"Agora não"* / *"Marcar faturado"*.

### Avisos

- **Estouro de orçado:** *"{X}h acima do orçado"* (ex.: "8h acima do orçado").
- **Timer longo (notificação):** título *"Ainda contando"* / corpo *"Você está há 6h em {Projeto}. Esqueceu de parar?"* / ações *"Encerrar"* · *"Continuar"*.
- **Lembrete de fim de dia (notificação):** *"Nenhuma hora hoje"* / *"Registrou algum trabalho de hoje?"*.
- **Notificação persistente (timer rodando):** *"Contando — {Projeto} · {HH:MM}"* com ações *"Pausar"* · *"Encerrar"*.
- **Meia-noite no manual:** *"Termina no dia seguinte"* (nota, não erro).
- **Duração inválida:** *"A duração passa de 24h. Confira os horários."*

### Toasts

- *"Registro salvo"* · *"Registro apagado"* · *"Marcado como faturado"* · *"PDF gerado"* · *"CSV exportado"*.

### Sobre

- *"Horas — controle de tempo para freelancers."*
- *"Feito por micio.dev"* (o "micio.dev" é o link).
- *"Versão {x.y.z}"*

---

## 9. Modelo de dados

Tudo local (SQLite via Capacitor, ou IndexedDB). Sem servidor, sem login, sem sincronização. Valores monetários guardados como **inteiro em centavos**; durações em **segundos**; datas/horas em **ISO 8601 com offset** para sobreviver a mudanças de fuso e horário de verão.

### Entidades

**Client (Cliente)**

| Campo | Tipo | Notas |
|---|---|---|
| `id` | string (uuid) | |
| `name` | string | obrigatório |
| `color` | string | uma das 8 cores fixas (hex) |
| `default_rate_cents` | int | valor/hora padrão do cliente, em centavos |
| `created_at` | ISO datetime | |
| `archived` | boolean | ocultar sem apagar (padrão false) |

**Project (Projeto)** — pertence a um Cliente

| Campo | Tipo | Notas |
|---|---|---|
| `id` | string (uuid) | |
| `client_id` | string | FK → Client |
| `name` | string | obrigatório |
| `rate_cents` | int \| null | se null, herda `default_rate_cents` do cliente |
| `budget_seconds` | int \| null | horas orçadas (opcional) |
| `created_at` | ISO datetime | |
| `archived` | boolean | |

**TimeEntry (Registro)** — pertence a um Projeto

| Campo | Tipo | Notas |
|---|---|---|
| `id` | string (uuid) | |
| `project_id` | string | FK → Project |
| `started_at` | ISO datetime | início real (fonte da verdade do timer) |
| `ended_at` | ISO datetime \| null | null enquanto roda |
| `duration_seconds` | int | derivado; persistido ao encerrar |
| `note` | string \| null | nota curta |
| `source` | enum | `timer` \| `manual` |
| `invoiced` | boolean | "já faturado" (padrão false) |
| `rate_cents_snapshot` | int | valor/hora congelado no momento do registro |
| `created_at` / `updated_at` | ISO datetime | |

**RunningTimer (Timer ativo)** — no máximo um

| Campo | Tipo | Notas |
|---|---|---|
| `project_id` | string | |
| `started_at` | ISO datetime | |
| `accumulated_seconds` | int | soma de trechos antes da pausa atual |
| `state` | enum | `running` \| `paused` |
| `paused_at` | ISO datetime \| null | |

**Settings (Ajustes)** — registro único

| Campo | Tipo | Notas |
|---|---|---|
| `default_rate_cents` | int | valor/hora padrão global |
| `currency` | string | ISO 4217, padrão `BRL` |
| `week_start` | enum | `sunday` \| `monday` (padrão `monday`) |
| `theme` | enum | `light` \| `dark` \| `system` (padrão `system`) |
| `notif_long_timer_hours` | int | limite p/ aviso "esqueceu de parar" (padrão 6) |
| `notif_end_of_day` | boolean | lembrete diário (padrão true) |

### Relações

`Client 1—N Project 1—N TimeEntry`. Apagar cliente → apaga projetos → apaga registros (cascata, com a confirmação de §8). `rate_cents_snapshot` no registro garante que relatórios antigos permaneçam corretos mesmo se o valor/hora do cliente ou projeto mudar depois. O R$ de um registro = `duration_seconds / 3600 × rate_cents_snapshot`, arredondado no fim.

---

## 10. Layout do PDF do relatório

O PDF é lido pelo **cliente do freelancer** — precisa parecer um documento profissional e sóbrio, **não** uma captura de tela do app. Portanto: **fundo branco, tipografia serif/sans limpa, sem o tema escuro, sem âmbar gritante** (o âmbar aparece só como um fio de destaque discreto). Página A4 (padrão BR), margens 20mm.

### Estrutura da página

**Cabeçalho (todas as páginas)**

- Esquerda: nome do freelancer (Source Serif 4, 18pt) e, abaixo, e-mail/contato (11pt, secundário) — configurável nos Ajustes.
- Direita: título *"Relatório de horas"* (11pt maiúsc., tracking) + período (ex.: *"01–31 de agosto de 2026"*).
- Fio horizontal fino (0.5pt) abaixo do cabeçalho.

**Bloco do cliente (primeira página)**

- *"Cliente:"* {nome} · *"Valor/hora:"* R$ XX,XX (se uniforme; senão, por projeto na tabela).
- Uma linha discreta de resumo grande: **Total: 42h 30min — R$ 4.250,00** (Source Serif 4, 22pt, o R$ com um fio âmbar 2px abaixo).

**Tabela de horas** (agrupada por projeto, depois por data)

| Data | Início–Fim | Duração | Descrição | Valor |
|---|---|---|---|---|
| 03/08 | 14:00–17:30 | 3h30 | Ajustes no layout | R$ 350,00 |
| 03/08 | 19:00–20:15 | 1h15 | Revisão de textos | R$ 125,00 |
| | | **Subtotal Projeto A** | 18h45 | **R$ 1.875,00** |

- Horários e durações em IBM Plex Mono (tabular), alinhados à direita nas colunas numéricas.
- Zebra sutil (linhas alternadas cinza 4%) para leitura.
- Coluna "Descrição" = nota do registro; se "incluir notas" estiver desligado, a coluna some e a tabela se rebalanceia.
- Subtotal por projeto ao fim de cada grupo.

**Total geral (fim)**

- Bloco à direita: linha *"Total de horas"* e linha **"Total a cobrar: R$ 4.250,00"** em destaque (Source Serif 4, 16pt, negrito), com fio âmbar acima.

**Rodapé (todas as páginas)**

- Esquerda: *"Gerado por Horas · {data de geração}"*.
- Direita: *"Página X de Y"*.
- 9pt, cor terciária.

Observações: se houver horas faturadas incluídas, elas ganham a marca *"(faturado)"* discreta ao lado da data. O CSV espelha a tabela (colunas: cliente, projeto, data, início, fim, duração_horas, valor_hora, valor, nota, faturado), codificação UTF-8, separador `;` (padrão BR/Excel), decimal com vírgula.

---

## 11. Acessibilidade e ergonomia

- **Área de toque:** mínimo **48×48px** para qualquer alvo, sempre, mesmo com rótulo pequeno; espaçamento mínimo de 8px entre alvos vizinhos.
- **Alcance do polegar:** todas as ações primárias na **metade inferior** da tela. O botão do timer fica na zona baixa; a barra de abas é a navegação primária (polegar). Ações no topo (o `+`, voltar) são secundárias e também alcançáveis; nada crítico só no topo. Folhas inferiores põem o conteúdo perto do polegar por design.
- **Uma mão, em pé, com pressa:** o caminho "abrir → Começar" cabe em dois toques na parte de baixo. Nada essencial exige as duas mãos.
- **Área segura Android:** respeitar `env(safe-area-inset-*)`. Barra de status: conteúdo nunca embaixo dela; cor da barra segue o tema (fundo base). Barra de gestos inferior: a barra de abas reserva `safe-area-inset-bottom`; o botão do timer nunca encosta na zona de gesto.
- **Fonte aumentada pelo sistema:** layouts usam unidades relativas e crescem sem cortar; testar até 200%. Os dígitos do timer têm teto de escala próprio (para não estourar a tela) mas continuam legíveis; textos de UI reflow em vez de truncar. Nada de altura fixa em containers de texto.
- **Contraste:** toda a paleta atende WCAG AA ou melhor (valores nas tabelas de §5). Estado nunca é comunicado só por cor: "faturado" tem selo + texto; estouro tem texto além da barra clay; aba ativa tem cor + peso.
- **Leitor de tela (TalkBack/VoiceOver):** cada controle com `aria-label` em PT-BR. O timer anuncia via `aria-live="polite"` em marcos (a cada minuto, não a cada segundo) e nos eventos (iniciado, pausado, encerrado). Ordem de foco lógica (topo→baixo). Ícones-só têm rótulo ("Apagar registro"). Folhas prendem o foco e devolvem ao elemento de origem ao fechar.
- **Reduzir movimento:** ver §7 — respeitar `prefers-reduced-motion`.
- **Toque e erro:** ações destrutivas sempre com confirmação; nada apaga em um toque acidental.

---

## 12. Ícone do app e tela de abertura

**Ícone do app.** Um único glifo forte: **os dois pontos de um relógio digital — `:` — em âmbar `#FFB020` sobre o fundo escuro `#12110E`**, centralizado, ocupando o terço central. É o pulso do cronômetro reduzido ao mínimo: dois pontos que "piscam" quando o tempo corre. Funciona minúsculo na grade de apps, é inconfundível e amarra com o nome alternativo "Ponto". Versão adaptável Android: camada de fundo = quadrado `#12110E`, camada de frente = o `:` âmbar (respeitando a máscara/safe zone da grade adaptável). Monocromático (Android 13+): o `:` em branco sobre transparente.

**Tela de abertura (splash).** Fundo `#12110E` cheio. Ao centro, o mesmo `:` âmbar; ao aparecer, o ponto de baixo faz um único pulso de opacidade (respeitando reduzir-movimento) — sinal de vida sutil, nunca uma animação longa. Abaixo, a palavra **Horas** em Source Serif 4, texto primário `#F4F1EA`. Sem barra de progresso (o app carrega instantâneo, é local). A splash existe só para cobrir o cold start do WebView e some assim que a tela Agora está pronta. Tema claro: mesmo layout com fundo `#F7F5F0`, o `:` em `#F5A100`, palavra em `#1A1813`.

---

*Fim do documento. Fonte da verdade para implementação de **Horas** v1.*
