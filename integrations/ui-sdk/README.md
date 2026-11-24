# UI SDK no visor técnico

O painel **Ver regras** usa o Accordion para abrir a decisão, seguir sua fonte e selecionar uma peça no desenho. A primeira regra de cada prancha começa aberta. Tab percorre os controles e Enter ou Espaço alterna a regra. É possível manter várias justificativas abertas para compará-las.

A barra flutuante usa o Segmented Control para escolher a vista montada ou explodida. Dentro dele, as setas alternam a vista e preservam a tela atual. Fora dele, as setas laterais continuam passando pelas telas do fluxo. O estado da vista acompanha cada prancha e a exportação usa a vista selecionada.

As duas entradas Web Components são empacotadas localmente com esbuild. O gerador incorpora ao HTML o runtime pré-compilado e a licença Apache 2.0. As dependências desta pasta servem à manutenção e aos testes. O leitor abre o HTML offline. [Accordion](https://ui-sdk.dev/docs/web-components/components/accordion) · [Segmented Control](https://ui-sdk.dev/docs/web-components/components/segmented-control)

## Índice e apresentação

**Fluxos** abre um índice recolhível. Os traços seguem a Line Nav de Chánh Đại. Pesquise por fluxo, tela ou requisito com ou sem acentos. Selecione um resultado para apresentar as pranchas do grupo. As setas, o gesto lateral e os botões de zoom usam o Lightbox de Ramka. Cada imagem é um SVG produzido pelo modelo técnico da própria tela, com o tema, o afastamento e as peças selecionadas no visor. **Inspecionar esta tela** abre a prancha no visor de peças. Esc devolve o foco à origem.

No índice, **Processo de design** relaciona a tela atual ao Double Diamond. Descobrir cita o briefing, Definir traz o requisito, Desenvolver enumera as peças desenhadas e Entregar indica o estado da renderização e os caminhos que podem ser testados. [Line Nav](https://chanhdai.com/components/line-nav) · [Lightbox](https://chanhdai.com/components/lightbox)

## Acompanhar o design ao vivo

```sh
npm run dev --prefix integrations/ui-sdk
```

Abra [o visor local](http://127.0.0.1:57126/) no navegador integrado da IDE. O servidor local acompanha as alterações salvas e mantém a última versão válida durante uma correção. Mudanças nos estilos da galeria aparecem na aba aberta. Mudanças no modelo ou no código recarregam o visor na tela selecionada, desde que ela ainda exista. Para acompanhar outro projeto, passe o caminho absoluto de seu `drawing.json` depois de `--`.

## Reproduzir o build e o teste

Execute da raiz do repositório com Node.js 22.20 ou superior.

```sh
npm ci --prefix integrations/ui-sdk
npm ci --prefix skills/pranchas-de-fluxo/assets
npm run build --prefix integrations/ui-sdk
npm test --prefix integrations/ui-sdk
```

O primeiro comando instala os componentes, esbuild e Playwright nas versões do lockfile. O segundo instala as dependências de exportação do modelo de teste. O build gera `assets/ui-sdk.js`, `assets/UI-SDK-LICENSE.txt` e `assets/FLOW-ATLAS-LICENSES.txt` em `skills/pranchas-de-fluxo/assets/technical-drawing/`. O teste usa Chrome ou Chromium local em modo headless. Para escolher outro executável, defina `CHROMIUM_PATH` com seu caminho absoluto. Também pode instalar o Chromium do Playwright com `npx playwright install chromium` dentro desta pasta.

## Verificação

O teste gera três HTMLs em uma pasta temporária. Exercita as vistas montada e explodida, foco e seleção pelo teclado, regras, fontes, peças, histórico e download de SVG. Verifica também a busca com acentos, dois grupos independentes, o SVG real de uma prancha ampliada, o gesto lateral em um celular de 390 px e o retorno à inspeção. O HTML de uma placa física verifica o caso de peça única. O teste falha ao encontrar uma requisição HTTP(S) ou erro JavaScript.

Na verificação local em Windows x64, dois builds do runtime produziram o mesmo SHA-256. Em Chrome com viewport de 930 × 990 px, comparei o *SVG* montado e os pixels de toda a área do desenho com a versão estável. Ambos coincidiram. A barra flutuante e o seletor de vistas mantiveram as mesmas dimensões e posição.
