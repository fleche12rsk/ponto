# Horas

Controle de tempo para freelancers. Cronômetro que vira dinheiro: aperta play quando começa, aperta de novo quando para, e no fim do mês sai um PDF sóbrio para mandar junto da cobrança.

Tudo fica no celular. Sem servidor, sem login, sem internet.

- **Stack:** React 18 + TypeScript + Vite, empacotado com Capacitor 7
- **Plataformas:** Android (pronto), iOS (mesmo código, falta só compilar num Mac)
- **Design:** implementação literal de [`docs/design.md`](docs/design.md)

---

## Rodar no navegador

```bash
npm install && npm run dev
```

Abre em `http://localhost:5173`. Serve para desenvolver e testar tudo menos as notificações — no navegador elas viram no-op, e o compartilhamento de PDF/CSV vira download.

## Gerar o APK

O código já está pronto; o que falta é o compilador do Android. Escolha um caminho:

### Caminho A — build local (precisa do Android Studio)

Instale o [Android Studio](https://developer.android.com/studio) (~6 GB) e deixe o SDK 35 marcado na instalação. Depois:

```bash
npm run apk
```

O APK de debug sai em `android/app/build/outputs/apk/debug/app-debug.apk`. Copie para o celular e instale (é preciso liberar "instalar de fontes desconhecidas").

Para um APK assinado, de release:

```bash
keytool -genkey -v -keystore horas.keystore -alias horas -keyalg RSA -keysize 2048 -validity 10000
```

Guarde o `.keystore` e a senha — sem eles não dá para publicar atualizações do mesmo app. Depois configure `android/keystore.properties` e rode `cd android && gradlew.bat assembleRelease`.

### Caminho B — build na nuvem (não instala nada)

Suba o projeto para o GitHub e use o workflow em `.github/workflows/android.yml`. A cada push ele compila e deixa o APK para download na aba Actions.

### Caminho C — iOS, mais para frente

```bash
npm install @capacitor/ios && npx cap add ios && npx cap sync ios
```

O `ios/` gerado abre no Xcode. Precisa de um Mac (físico ou alugado por minuto no Codemagic/GitHub Actions) e de conta de desenvolvedor Apple para instalar no aparelho. Nada do código muda.

---

## Estrutura

```
src/
  lib/          regras puras, sem React
    types.ts      modelo de dados (§9)
    db.ts         persistência via Capacitor Preferences
    time.ts       formatação, períodos, parsing de duração
    money.ts      centavos inteiros, nunca float
    calc.ts       agregações por cliente, projeto e dia
    report.ts     modelo do relatório (alimenta preview, PDF e CSV)
    pdf.ts        desenho do PDF em jsPDF (§10)
    share.ts      escrever arquivo + folha de compartilhamento
    notifications.ts
    backstack.ts  pilha do botão voltar do Android
  store/        estado observável + hooks
  components/   primitivas (§6)
  sheets/       folhas inferiores
  screens/      telas (§4)
  styles/       tokens.css (§5), base.css, components.css
```

---

## Decisões de implementação

Onde o documento de design deixou espaço técnico, estas foram as escolhas — e o porquê.

**O cronômetro nunca acumula por tick.** O tempo decorrido é sempre calculado a partir de `started_at`. Fechar o app, apagar a tela ou o WebView ser descartado pelo sistema não perde um segundo. Verificado: com o timer rodando, um reload completo da página retoma a contagem no valor certo.

**Sem serviço nativo em primeiro plano.** Como a contagem não depende de um processo vivo, não há necessidade de um foreground service. A notificação persistente é informativa e mostra o horário de início (`Contando — Projeto · desde 14:32`) em vez de um relógio que ficaria congelado enquanto o app dorme.

**A pré-visualização do relatório é HTML, não o PDF embutido.** O WebView do Android não abre PDF em `<iframe>`. Em vez de embutir um leitor de PDF inteiro no app, a pré-visualização é uma renderização em HTML do **mesmo modelo** que gera o PDF (`lib/report.ts`) — o que aparece na tela é o que sai no arquivo.

**Fontes do PDF.** O PDF usa Times/Helvetica/Courier em vez de Source Serif 4 / Public Sans / IBM Plex Mono. São vetoriais, universais e não somam megabytes de fonte embutida ao APK; o papel de cada uma (serifada nos títulos, mono nos números tabulares) é o mesmo do §5.4. A interface do app usa as fontes especificadas, empacotadas localmente.

**Persistência em JSON, não SQLite.** O §9 permitia os dois. Um freelancer gera algo como mil registros por ano — guardar o banco inteiro como um JSON no Capacitor Preferences é suficiente, mantém a leitura síncrona e evita a complexidade de migrações de schema. A troca por SQLite, se um dia fizer sentido, é isolada em `lib/db.ts`.

**`minSdk 26` (Android 8).** Piso do ícone adaptável, e cobre praticamente todo aparelho em uso.

**Tarifa congelada no registro.** `rate_cents_snapshot` guarda o valor/hora no momento em que a hora foi lançada, então aumentar o preço de um cliente não reescreve o histórico nem os relatórios já enviados.

---

Feito por [micio.dev](https://micio.dev).
