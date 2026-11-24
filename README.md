# Pranchas de fluxo

Transforme uma reunião em telas navegáveis com um requisito por tela. Use as setas para percorrer o desenho e abra **Ver regras** para encontrar a justificativa, a peça da interface e a fonte.

## Primeira reunião

Abra o terminal da IDE na pasta do material. Com Node.js 22.20 ou superior e uma conta autenticada no Codex, rode este comando trocando o nome do arquivo pelo seu.

```sh
npx --yes https://github.com/DaniloAmaralUX/pranchas-de-fluxo/releases/download/v1.0.0/pranchas-de-fluxo-1.0.0.tgz --gerar "reuniao.mp4"
```

O mesmo comando aceita uma transcrição, um PDF ou vários arquivos juntos. Para começar com uma ideia escrita, substitua o arquivo por `--ideia "A gerente aprova o pedido antes de emitir o contrato."` A instalação prepara as dependências sob demanda. A extração de voz e quadros ocorre localmente. A geração pelo agente usa o provedor de IA configurado na sua conta.

O resultado inclui um HTML que abre offline, um briefing e a especificação dos fluxos. A validação automática do desenho usa Chrome ou Chromium. As setas revisam a sequência de telas. As ações em **Percurso** permitem experimentar escolhas e exceções.

## Próxima reunião

Anexe o material em uma nova conversa de uma IDE compatível com Agent Skills e peça “desenhe as telas desta reunião”. Pelo terminal da mesma pasta, o atalho da instalação também aceita o próximo arquivo.

```sh
node .pranchas/cli.cjs --gerar "ata.md"
```

[Guia do instalador e autenticação](tools/pranchas-cli/README.md) · [Formatos de entrada](skills/pranchas-de-fluxo/audio.md) · [Créditos do desenho](skills/pranchas-de-fluxo/NOTICE.md)

## Reproduzir a distribuição

```sh
npm --prefix tools/pranchas-cli run bundle
npm --prefix tools/pranchas-cli run verify
```
