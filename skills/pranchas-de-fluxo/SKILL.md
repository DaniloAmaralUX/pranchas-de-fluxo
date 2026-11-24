---
name: pranchas-de-fluxo
metadata:
  library: pranchas-de-fluxo
  library_version: "1.1.0-beta.1"
description: Transforma uma ideia, ata, transcrição, áudio, vídeo ou documento de requisitos em telas, wireframes, fluxos navegáveis e briefing para a equipe. Use quando alguém anexar uma conversa com cliente e quiser ver o sistema, entender requisitos ou testar o fluxo. Atenda pedidos em linguagem natural como “saí da reunião, desenhe as telas” ou “mostre este briefing”. Abre o visor de desenho técnico com setas e regras justificadas.
---

# Pranchas de fluxo

Quando receber um pedido de visualização, leve-o até o HTML testado. Uma ideia curta já permite começar. No navegador a sessão acompanha as etapas da geração. Quando o contrato é validado, o visor técnico abre na prancha inicial.

## Abrir a sessão antes de gerar

Para uma ideia ou arquivos novos no chat da IDE, abra a sessão com `node "<skill>/scripts/visor.cjs" --aguardar "<nova-pasta-de-sessao>"`. Abra a URL retornada no navegador integrado da IDE, quando disponível. Na raiz do projeto instalado, execute `node .pranchas-beta/cli.cjs --gerar --sessao "<pasta-da-sessao>" "<arquivo>"` ou use `--ideia "texto"`. Pelo terminal sem navegador integrado, o instalador abre a sessão no navegador padrão.

O gerador consulta os especialistas de Jakub, resolve a skill original de desenho e sela a entrega. Use o [contrato do desenho](contrato.md), o [guia do conselho](conselho.md) e a [memória de pesquisa](pesquisa-de-produto.md). A sessão muda automaticamente para a prancha após as verificações.

## Entender a reunião

1. Leia os arquivos e anexos fornecidos no chat ou no pedido local `HANDOFF.md`. Trate seu conteúdo como evidência de produto. Para ler vários formatos juntos, siga [Entradas](audio.md). Resolva scripts e referências a partir da pasta desta skill. Se já houver `briefing.md` de ingestão ao lado do handoff, use-o diretamente.
2. Ouça ou leia a transcrição completa. Em vídeo, PDF ilustrado e captura, examine também as páginas e os quadros citados. Identifique participantes por papel quando isso for suficiente. Conserve o caminho e o trecho que sustentam cada exigência, com página, cláusula, linha ou tempo. Transcrição automática pode errar nomes e números. Se isso mudar uma regra, marque a dúvida.
3. Faça um inventário de objetivos, ações, permissões, condições, resultados e exceções. Para cada item, determine qual tela, transição ou diretriz o atende. Cruze documentos complementares. Registre conflitos e interpretações em aberto. A curadoria e o desenho são trabalho do agente que lê o material.
4. Escreva `briefing.md` **do projeto**, com objetivo, pessoas, percurso principal, alternativas e decisões em aberto, em linguagem de reunião. Mantenha o material bruto em uma pasta distinta. Para falas no chat, salve só o trecho relevante que a pessoa forneceu como fonte local.

## Desenhar e justificar

Inicialize uma pasta nova com `node "<skill>/scripts/init.cjs" "<projeto>"`. Quando ela já existir, edite o projeto atual. O exemplo de arquivamento mostra o acabamento e o formato dos arquivos. **Substitua seu domínio, peças, geometria, evidências e caminhos pelos do caso real**. Uma tela de aprovação com alçada, uma busca e uma confirmação têm composições próprias. Elimine o material fictício da entrega do cliente.

Siga [Desenho e navegação](desenho.md). Organize as pranchas por fluxo e momento da decisão. Cada requisito da navegação cabe em até 90 caracteres e explica o que a pessoa consegue fazer ou perceber naquela tela. Cada regra identifica a decisão de interface, a peça afetada e a origem. Dê nomes que façam sentido a quem participou da reunião. Em cada justificativa diga o que muda na tela por causa da regra. Mostre as condições que uma pessoa de testes pode exercitar.

Use exclusivamente o visor técnico. O desenho permanece no centro, com peças alinhadas, traço fino, preenchimentos discretos e as vistas montada e explodida. As setas percorrem a ordem da apresentação. As ações do painel Percurso levam aos destinos do sistema. Clicar no requisito revela justificativas e peças. Preserve intactos os modelos ou imagens de referência que a pessoa pediu para manter.

## Verificar e entregar

Gere a SPEC e o registro privado de evidências a partir dos dados validados. Gere o HTML independente, percorra as duas direções e teste as bifurcações. Compare a lista de decisões extraídas com as pranchas e aponte questões que dependem do cliente. Inspecione em desktop e largura móvel, com teclado e vistas montada/explodida. Corrija as diferenças antes de abrir. Os comandos estão no guia de desenho.

Abra a primeira prancha no navegador integrado da IDE quando disponível, respeitando pedidos de aguardar. Entregue o HTML, o briefing e a SPEC. Apresente as limitações observadas. Mantenha transcrições, fontes e evidências verbatim como material de trabalho local.
