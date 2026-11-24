# Pranchas de fluxo

Coloque o arquivo `pranchas-de-fluxo-1.1.0-beta.1.tgz` na pasta de trabalho. Abra o terminal da IDE nessa pasta e execute com Node.js 22.20 ou superior e npm com npx.

```sh
npx --yes ./pranchas-de-fluxo-1.1.0-beta.1.tgz
```

O instalador também aceita material no primeiro comando.

```sh
npx --yes ./pranchas-de-fluxo-1.1.0-beta.1.tgz "reuniao.mp4" "regras.docx"
```

Para gerar o visor na mesma execução, acrescente `--gerar`. Esse modo usa o Codex CLI local e a conta configurada. Na primeira execução em uma máquina sem o agente, npm baixa o pacote oficial no cache do usuário. Se o perfil precisar de autenticação, use `npx --yes @openai/codex@0.172.0 login`. Com `--gerar`, o agente pode ler as fontes e usar o provedor de IA dessa conta.

```sh
npx --yes ./pranchas-de-fluxo-1.1.0-beta.1.tgz --gerar "reuniao.mp4" "regras.docx"
```

No terminal, o visor local abre no começo do trabalho e acompanha a leitura das fontes, o conselho de especialistas, o desenho e a entrega. Sem argumentos, o visor apresenta uma entrada para sua ideia. No chat da IDE, a skill prefere o navegador integrado. Use `--sem-abrir` para executar a geração em segundo plano. O terminal sempre indica `prototipo/dist/index.html` e a documentação acompanha o modelo em `prototipo/`. O gerador usa a pasta do pedido com gravação restrita ao workspace e segue o perfil do Codex CLI. [Modo não interativo do Codex](https://developers.openai.com/codex/noninteractive/)

Chrome ou Chromium executa a prova visual das pranchas e salva capturas na pasta `prototipo/check`. Em uma máquina sem navegador compatível, o terminal indica o HTML para revisão manual e identifica a prova pendente.

O instalador registra pranchas-de-fluxo-beta nas pastas de skills do projeto usadas pelos agentes detectados. O atalho experimental fica em .pranchas-beta e o pacote versionado permanece no perfil do usuário. A seleção automática ocorre no chat de uma IDE com suporte a Agent Skills. Inicie uma nova conversa se a IDE carregar as skills ao abrir a sessão. Anexe um material e peça, por exemplo, “Desenhe o fluxo desta reunião e explique o requisito de cada tela”. Quem usa somente um terminal pode abrir o exemplo, preparar as fontes e levar o pedido gerado a uma IDE com agente para interpretar o briefing e produzir novas pranchas.

## Próximos briefings

Na pasta de trabalho onde rodou o instalador, o atalho usa a cópia persistente do perfil. Ele funciona depois que o pacote e o cache do npx forem removidos.

```sh
node .pranchas-beta/cli.cjs --ideia "A gerente aprova ou devolve a solicitação com um motivo."
node .pranchas-beta/cli.cjs "transcricao.txt" "processo.pdf"
```

Para enviar texto pela entrada padrão, encadeie o comando que gera a transcrição com `node .pranchas-beta/cli.cjs --stdin`. O terminal indica um `HANDOFF.md` dentro de `.pranchas-beta/entradas`. Peça ao agente da IDE para gerar as pranchas a partir desse arquivo. A pasta guarda as fontes, as extrações e o contexto para rastrear as regras. Mantenha-a em um espaço autorizado para os dados da reunião.

Texto puro funciona com Node. A leitura de documentos, PDF, áudio e vídeo pode baixar ferramentas e o modelo de transcrição no primeiro uso. Os leitores processam o conteúdo localmente. Use `--offline` para exigir os recursos já disponíveis no cache. O agente que você escolher para interpretar o briefing usa a configuração de privacidade da sua IDE.

## Abrir um exemplo

A instalação indica o endereço do HTML pronto no perfil. Para copiar o exemplo para uma pasta nova e abri-lo em seu navegador, execute o comando abaixo e abra o `index.html` indicado. O HTML funciona offline.

```sh
node .pranchas-beta/cli.cjs exemplo demonstracao
```

## Distribuir a partir do código-fonte

Na raiz do repositório execute `npm --prefix tools/pranchas-cli run bundle`. O empacotador usa as versões dos lockfiles para incluir a biblioteca de instalação, todos os recursos da skill e o HTML do exemplo. A saída fica em `tools/pranchas-cli/dist/pranchas-de-fluxo-1.1.0-beta.1.tgz`. Entregue o arquivo a quem for usar. Distribuir o pacote por um endereço público depende de disponibilizar essa versão em um canal acessível aos destinatários.

## Orientações versionadas no modo experimental

O primeiro comando instala também um consumidor privado do TanStack Intent em `~/.agents/pranchas-runtime/1.1.0-beta.1`. Esse diretório mantém a biblioteca e a cópia da skill publicada com seus modelos e referências. A política permite `pranchas-de-fluxo#pranchas-de-fluxo`. A cada `--gerar`, o SDK resolve essa identidade e fornece ao agente o texto e o diretório de apoio da versão instalada. Esse carregamento funciona offline depois de remover o cache do npx. A geração pelo provedor de IA continua usando a conexão configurada.

## Pareceres e reprodução

A geração inicia um especialista em modo de leitura para cada skill do conjunto versionado de Jakub Krehel. Cada um cita as fontes da reunião em seu parecer. Ao concluir o conselho, o orquestrador recebe as fontes originais, os pareceres e a skill técnica histórica. As decisões registram a disposição das recomendações e sua ligação com as peças nas telas. Após o teste do navegador, o contrato sela o projeto. Para reproduzir um projeto selado sem chamar o provedor, execute `node .pranchas-beta/cli.cjs --reproduzir "caminho/do/prototipo"`.
