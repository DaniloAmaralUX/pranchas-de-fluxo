# Criar sua versão no Pranchas

## Resultado esperado

Uma pessoa abre o Pranchas com um comando, reconhece as telas reais do Supernova na home e usa o catálogo para montar uma base de design. Depois de enviar o material da reunião, ela recebe um protótipo navegável e consegue explicar de onde veio cada regra de negócio e como ela se materializa na interface.

## Jornada

1. **Abrir.** O comando inicia o servidor, aguarda até a home e seu catálogo responderem e abre a mesma URL no navegador externo e no navegador integrado de uma IDE com integração verificada. Em um terminal comum, abre o navegador padrão e imprime a URL.
2. **Reconhecer.** A home exibe o carrossel Skiper 49 e oferece duas ações. **Criar sua versão** é a principal. **Explorar catálogo** continua levando à coleção completa, onde a pessoa pode comparar as telas originais.
3. **Combinar.** Abaixo do carrossel, os quadros de **Base de design** sugerem telas reais e explicam o que se pode aproveitar em cada uma. A seleção fica visível e editável. A pessoa pode começar com uma tela, combinar várias ou seguir sem selecionar.
4. **Enviar.** A sessão mostra a base selecionada ao lado da entrada do briefing. A pessoa cola a transcrição ou anexa arquivos e inicia a geração quando estiver pronta. O Mobius Loop acompanha estados reais do trabalho.
5. **Revisar.** O resultado abre no visor técnico com setas, fluxos e peças. Cada tela apresenta um requisito de até 90 caracteres, a regra de negócio, o trecho de origem e a decisão de interface que a atende. A especificação também registra as referências de design efetivamente aplicadas.

## Como a combinação funciona

Uma referência do Supernova é uma tela que oferece um recurso de composição, como a estrutura de um painel, a densidade de uma tabela ou a disposição de uma confirmação. A base de design é a combinação escolhida para um pedido. O briefing reúne o problema, os papéis e as evidências das regras de negócio. O protótipo usa todos esses insumos para representar o comportamento solicitado.

Exemplo. A pessoa escolhe uma tela de lista e um diálogo. O relato diz que a gerente pode devolver a solicitação com justificativa. A lista orienta a apresentação dos pedidos. O diálogo orienta a posição do campo de motivo junto à ação. A obrigatoriedade do motivo é fundamentada no trecho da reunião. A especificação aponta a regra, a tela, a peça e as referências usadas.

O pedido guarda a seleção como dados próprios. A orquestradora recebe identificadores, nomes, categorias, imagens e a intenção de cada referência. A entrega registra quais recursos foram incorporados e em quais telas ou peças. Se duas referências competirem pelo mesmo espaço, o requisito e a tarefa da pessoa determinam a escolha. Referências incompatíveis podem ser deixadas de lado com justificativa.

## Componentes e adaptação

A home reaproveita a composição já incorporada do Skiper 49. Os quadros podem adaptar o contorno do Glow Card Grid para indicar foco e seleção. A inspeção usa o Lightbox já adotado no visor. A espera reaproveita o Mobius Loop do formulário local. Os quadros usam miniaturas locais do Supernova sob demanda, com foco visível, seleção anunciada e movimento reduzido conforme a preferência do sistema. [Skiper 49](https://skiper-ui.com/v1/skiper49) · [Glow Card Grid](https://chanhdai.com/components/glow-card-grid) · [Lightbox](https://chanhdai.com/components/lightbox) · [Mobius Loop Icon](https://chanhdai.com/components/mobius-loop-icon)

## Aceite

| Percurso | Evidência esperada |
| --- | --- |
| Primeira execução | O comando funciona em um projeto limpo e a home abre carregada. A abertura nos dois navegadores é verificada separadamente em cada IDE com integração. |
| Escolha das telas | A pessoa explora a coleção, escolhe referências por teclado ou toque e vê a mesma combinação antes de enviar. Trocar uma referência atualiza o pedido correspondente. |
| Geração real | Uma transcrição fictícia percorre formulário, conselho, verificação e visor. O protótipo e a especificação registram ao menos uma aplicação concreta da seleção. |
| Rastreabilidade | O teste encontra no visor um requisito de até 90 caracteres, a peça correspondente e a citação literal da reunião para uma ação e uma exceção. |
| Recuperação | Sem seleção, o fluxo funciona com base no briefing. Uma falha de geração preserva a seleção e permite tentar novamente. |
| Apresentação | A jornada é exercitada no Eregion, no navegador externo e em largura móvel, com a demonstração pronta disponível para abrir. |

A implementação aproveita a sessão de geração e o contrato de validação já existentes. O teste principal parte da home e termina no visor e na documentação do mesmo pedido.

## Revisão do planejamento

- **Abertura do produto.** Hoje o comando serve a home e imprime a URL. Ver o Eregion aberto via controle da interface comprova a exibição. A abertura pelo próprio comando depende de uma integração do editor. No VS Code, a API documenta a abertura externa e o painel Webview como operações distintas. Para o Eregion, a pesquisa ainda precisa identificar e exercitar um mecanismo equivalente. O teste da primeira execução usa uma pasta limpa com o export autorizado do Supernova disponível. [API do VS Code](https://code.visualstudio.com/api/advanced-topics/remote-extensions)
- **Escolha de referências.** O carrossel é a apresentação visual. Os quadros de seleção usam controles nativos com estado anunciado, foco visível e uma indicação além da cor. A pessoa deve poder usar as duas partes com teclado, testar em 320 px e inspecionar o resultado com movimento reduzido. O Swiper já oferece módulos de acessibilidade e teclado, que permitem testar o carrossel independentemente da seleção. [Swiper 12.2.0](https://github.com/nolimits4web/swiper/tree/v12.2.0)
- **Prova da combinação.** No primeiro ensaio, a pessoa seleciona duas referências com funções distintas. O resultado registra o destino de cada uma. Para uma referência aplicada, a documentação aponta o ID da tela, a peça do modelo e a escolha visível. Para uma referência descartada, guarda o motivo. O teste confere a escolha visível e o vínculo estruturado. Um segundo pedido com a mesma transcrição e uma base diferente permite revisar a composição ao lado da primeira e confirmar as mesmas regras e citações. A geração pode variar, por isso o aceite depende da inspeção das pranchas e da trilha de decisões.
