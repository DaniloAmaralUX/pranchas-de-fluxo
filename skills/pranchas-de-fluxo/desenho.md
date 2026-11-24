# Modelar um fluxo

A pasta criada pelo inicializador contém um exemplo executável com quatro etapas e a geometria de referência da confirmação. O modelo e as ferramentas locais permitem criar novas composições. Consulte `tools/technical-drawing/geometry.md`, `geometry-library.md`, `exploded-views.md` e `verification.md`. Preserve a câmera entre estados que ocupam o mesmo espaço. Um elemento de decisão merece uma peça com nome reconhecível no painel.

## Contrato de drawing.json

A [captura original do visor](assets/visor-referencia.png) fixa a composição escura com a barra flutuante. A [prancha de anatomia](assets/referencia.png) documenta a geometria do exemplo. Compare o acabamento com ambas e use a estrutura de tela exigida pela reunião.

No [estudo de reserva de salas](assets/estudo-reservas/drawing.json), quatro frases de uma reunião dão origem a uma planta das salas, uma grade de horários e dois resultados possíveis. Veja como o [modelo das reservas](assets/estudo-reservas/model.js) usa tipografia no plano, indicação de conflito e áreas reconhecíveis em sete estados diferentes.

| Campo | Conteúdo |
| --- | --- |
| `title`, `summary` | Nome e objetivo do projeto. |
| `evidence[]` | Uma entrada por trecho relevante. `id` é a referência pública curta, como “Ata · linha 4”. `file` aponta para o texto local relativo a drawing.json, e `excerpt` contém um trecho desse arquivo, verificado no build. Para uma observação visual, registre uma nota datada com página ou tempo, identificada como interpretação do agente. |
| `scopeNotes[]`, `questions[]` | Cada diretriz geral tem `statement` e `sources`. Decisões pendentes entram como perguntas. |
| `drawings[]` | Ordem de revisão com ← e →. Cada item tem `id`, `flow`, `title`, `description`, `parts` e `requirement`. Use `entry: true` na tela que abre na primeira visita. |
| `requirement` | Uma frase objetiva de até 90 caracteres visíveis, incluindo espaços e pontuação, explicando a função específica desta tela. Por exemplo, “Devolver o pedido ao solicitante com o motivo da correção.” |
| `rules[]` | Cada regra tem `id`, `statement`, `rationale`, `parts` e `sources`. Diga a condição e a consequência. Ligue a justificativa a peças reais da própria prancha e às referências públicas de `evidence`. |
| `actions[]` | Escolhas de negócio. Cada ação tem um verbo em `label` e um ID de destino em `to`. A mesma tela pode ser compartilhada quando requisito, contexto e consequências coincidirem. Quando mudarem, crie outra prancha. |

Registre em `self.DrawingModels` o modelo de cada estado e passe suas peças a `TechnicalProjection.render`. Use a mesma geometria nas vistas montada e explodida. Agrupe por propósito, nomeie os controles e indique pela posição a relação entre campo, ação e consequência. Reaproveite navegação, cabeçalho e áreas estáveis. Refaça as partes que mudam. A confirmação do exemplo corresponde ao modelo original da referência.

A projeção das pranchas usa a câmera da referência (azimute −76°, elevação 25°, rotação 0°). Desenhe controles reconhecíveis pela silhueta, por exemplo uma agenda com intervalos, uma linha com anexo, um campo para explicar a devolução ou duas ações em um diálogo. Para um nome curto gravado na face, use `TechnicalGeometry.surfaceLabel(peca, 'Anexar', [x, y, topo + 0.1], {height: 3.5, role: 'edge'})`. A posição e a tinta acompanham a peça quando ela sobe ou é isolada. Deixe a explicação longa no painel Percurso. Compare o desenho montado com a captura de referência antes da entrega.

## Construir e conferir

Rode na pasta do projeto:

```sh
npm ci
node tools/technical-drawing/scripts/spec.cjs drawing.json .
node tools/technical-drawing/scripts/build-viewer.cjs drawing.json dist/index.html
node tools/technical-drawing/scripts/check-viewer.cjs dist/index.html check/ --dark
node tools/technical-drawing/scripts/proof.cjs drawing.json proof/
```

Os dois primeiros geradores de documentos e visor consultam os mesmos dados. Referências sem trecho correspondente, regras sem justificativa ou peça, destinos inexistentes e requisito acima do limite interrompem a geração. A validação prova o vínculo estrutural. Compare a interpretação de cada trecho com o briefing, em especial negações, limites e exceções.

Abra `dist/index.html` e teste as setas do teclado e os botões, o primeiro e o último estado, o histórico e cada destino em Percurso. Confira a ordem de foco, Escape e seletores nativos. Abra o requisito e siga a peça citada na regra. Inspecione as vistas montada e explodida, anotação, exportação e a leitura em tela estreita. Confira os rótulos em alto contraste e redução de movimento. Separe o HTML independente, briefing e SPEC para revisão. O arquivo evidence.md contém trechos do material de trabalho.
