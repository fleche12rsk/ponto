# Prompt para o Claude Design

> Copie tudo abaixo da linha e envie ao Claude Design.

---

Preciso que você crie o **documento base de design** de um aplicativo mobile. Não escreva código — o resultado deve ser um documento em Markdown, detalhado o suficiente para um desenvolvedor implementar sem precisar tomar decisões visuais.

## O produto

**Nome de trabalho:** Horas
**Plataforma:** Android primeiro, iOS depois (mesmo código, via Capacitor — React + Vite + TypeScript, renderizado em WebView)
**Idioma da interface:** Português do Brasil
**Público:** freelancers de tecnologia e design no Brasil — desenvolvedores, designers, redatores, editores de vídeo. Pessoas que trabalham sozinhas, atendem de 2 a 6 clientes ao mesmo tempo e cobram por hora ou por projeto.

**O problema que resolve:** o freelancer não sabe quanto tempo realmente gasta em cada projeto. Ele orça 15 horas, trabalha 40, e só descobre no fim que ganhou menos que o combinado por hora. Também não tem como comprovar as horas para o cliente na hora de cobrar.

**A promessa:** apertar um botão quando começa a trabalhar, apertar de novo quando para, e no fim do mês saber exatamente quanto cobrar de cada cliente — com um relatório em PDF pra enviar junto.

## Funcionalidades que precisam estar no design

**Cronômetro (tela principal)**
- Escolher o projeto e dar play. Timer grande e legível rodando na tela.
- Pausar, retomar, encerrar. Ao encerrar, opção de escrever uma nota curta do que foi feito.
- O cronômetro precisa continuar contando com o app fechado e com a tela desligada — pense em como comunicar isso visualmente (notificação persistente na barra do Android).
- Estado de "nenhum timer rodando" precisa convidar a começar, não parecer uma tela vazia quebrada.

**Lançamento manual**
- Registrar horas que a pessoa esqueceu de cronometrar ("ontem trabalhei das 14h às 17h30").
- Editar ou apagar um registro existente.

**Clientes e projetos**
- Cliente: nome, cor de identificação, valor/hora padrão.
- Projeto: pertence a um cliente, pode ter valor/hora próprio, e uma estimativa de horas orçadas.
- Quando as horas trabalhadas passam do orçado, o app precisa avisar de forma clara mas sem alarmismo.

**Resumo e histórico**
- Ver por período (semana, mês, personalizado): total de horas e total em R$.
- Quebrar por cliente e por projeto.
- Ver o histórico dia a dia.
- Marcar horas como "já faturadas" para separar do que ainda falta cobrar.

**Relatório**
- Gerar um PDF com as horas detalhadas de um cliente num período, para enviar junto com a cobrança. Esse PDF é um documento que o cliente vai ler — precisa de layout próprio, com aparência profissional e sóbria.
- Exportar também em CSV.

**Ajustes**
- Valor/hora padrão, moeda, primeiro dia da semana, tema claro/escuro.
- Tela "Sobre" com crédito e link para **micio.dev**.

**Notificações**
- Timer rodando há muito tempo ("você está há 6h em Projeto X — esqueceu de parar?").
- Lembrete no fim do dia se nenhuma hora foi registrada.

## O que eu preciso no documento

1. **Conceito e posicionamento** — em um parágrafo, o que esse app é e o que ele deliberadamente não é. Três alternativas de nome além de "Horas", com justificativa curta.

2. **Fluxos principais** — descreva passo a passo os quatro caminhos críticos: primeiro uso do app, começar a cronometrar, lançar horas manualmente, e fechar o mês gerando um relatório. Onde o usuário pode se perder e como o design evita isso.

3. **Mapa de telas** — lista completa de telas, como elas se conectam, e qual é a estrutura de navegação (aba inferior? quantas abas? o que fica em cada uma?).

4. **Cada tela em detalhe** — para toda tela: o que aparece, hierarquia visual (o que o olho vê primeiro, segundo, terceiro), quais ações existem e onde ficam. Descreva os estados: vazio, carregando, com poucos dados, com muitos dados, erro.

5. **Sistema visual**
   - Paleta completa em tema claro e escuro, com os códigos hex e o papel de cada cor. Verifique o contraste (mínimo AA da WCAG) e diga os valores.
   - Tipografia: escolha fontes gratuitas, defina a escala completa (tamanho, peso, entrelinha, espaçamento entre letras) e qual estilo usar em cada situação. O número grande do cronômetro merece tratamento especial — considere fonte monoespaçada para os dígitos não "pularem" enquanto o tempo corre.
   - Escala de espaçamento, raios de canto, elevação/sombras, larguras de borda.
   - Estilo dos ícones e onde buscá-los.

6. **Componentes** — especifique cada peça reutilizável com todos os seus estados (normal, pressionado, desabilitado, carregando, erro): botões nas suas variações, campos de formulário, seletor de data e hora, cartão de cliente, linha de registro de horas, o display do cronômetro, navegação inferior, modais e confirmações, avisos.

7. **Movimento** — que animações e microinterações existem, em quais telas, com duração e curva de aceleração. Diga qual é a intenção de cada uma (dar feedback? orientar? só deleite?). Quero um app que pareça vivo, mas **nada de animação que atrapalhe quem usa o app 20 vezes por dia** — transições rápidas, nada de esperar. Respeite a preferência de "reduzir movimento" do sistema.

8. **Texto da interface** — escreva o texto real de todos os botões, títulos, mensagens de estado vazio, confirmações e erros. Em português brasileiro, direto, sem infantilizar e sem jargão corporativo. Nada de "lorem ipsum".

9. **Modelo de dados** — quais entidades existem, seus campos e como se relacionam. Tudo fica salvo no próprio celular, sem servidor.

10. **Layout do PDF do relatório** — estrutura da página, o que vai no cabeçalho, como as horas são listadas, como aparece o total.

11. **Acessibilidade e ergonomia** — área mínima de toque, alcance do polegar em telas grandes, área segura do Android (barra de status e barra de gestos), comportamento com fonte aumentada pelo sistema, leitor de tela.

12. **Ícone do app e tela de abertura** — descreva o conceito.

## Direção estética

Não quero um app corporativo cinza, nem um app "fofinho" com ilustrações. Quero algo com **personalidade e contraste forte**: fundo escuro profundo como base, uma cor de destaque saturada e viva, tipografia com presença. Sóbrio onde é ferramenta, expressivo onde é momento.

Referências de vocabulário visual: apps que tratam número como elemento gráfico e não como dado (o timer deve ser bonito de olhar), interfaces com respiro generoso, e um toque editorial — considere uma serifa para os números grandes ou títulos de seção, contrastando com uma sans-serif no resto.

Cada cliente tem uma cor. Pense em como essa cor entra na interface de forma consistente e sem virar carnaval quando existem 6 clientes na mesma tela.

## Restrições técnicas que afetam o design

- Roda em WebView, então evite efeitos que dependam de recursos exclusivos de iOS ou Android nativo.
- Funciona sem internet. Não existe tela de login nem sincronização na nuvem.
- Precisa ser confortável de usar com uma mão só, em pé, com pressa.
- O usuário abre esse app várias vezes por dia por poucos segundos. Otimize para velocidade de uso, não para exploração.

## Formato da entrega

Documento único em Markdown, organizado nas seções acima, com tabelas onde couber (paleta, escala tipográfica, espaçamentos, componentes). Descreva o visual com precisão suficiente para eu implementar sem inventar nada. Não escreva código.
