# Memória de produto e engenharia

## Do relato à tela

Uma pessoa que participou da reunião deve reconhecer o que disse e conseguir testar a consequência. “A gerente pode devolver o pedido com um motivo” implica pelo menos um ator, um estado, uma ação, uma condição e um destino. Uma tela que apenas exibe a frase deixa de explicar onde o motivo é obrigatório ou o que o solicitante verá. Preserve a frase e sua origem, desenhe a decisão na peça e ligue o percurso ao estado seguinte. Perguntas sem resposta permanecem no briefing.

Nas quatro etapas do Double Diamond, **Descobrir** reúne os relatos e divergências. **Definir** explicita papéis, fronteiras e critérios. **Desenvolver** compõe as pranchas e liga alternativas. **Entregar** testa cada decisão e confronta a tela com as fontes. O nome do fluxo pertence à atividade do usuário, por exemplo “Devolver solicitação”. A etapa de design descreve o trabalho da equipe. [Design Council](https://www.designcouncil.org.uk/our-resources/the-double-diamond/)

## O que incorporamos de Matt Pocock

A pesquisa das skills research, domain-modeling e grill-with-docs orienta o agente a ler as evidências, usar os nomes do domínio, procurar casos limítrofes e registrar perguntas que afetam uma decisão. Na prática, a afirmação de um especialista precisa apontar para o trecho da reunião. Um exemplo do repositório inspira a técnica e nunca vira regra de negócio do cliente. [Fontes na revisão consultada](https://github.com/mattpocock/skills/tree/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills) · [Catálogo](https://skills.sh/mattpocock/skills)

O encadeamento to-spec, prototype, implement-spec e tdd levou à separação de quatro evidências de entrega. O briefing nomeia o problema. A SPEC descreve a decisão observável. O desenho localiza a peça. O teste exercita a transição e seu retorno. O trabalho de code-review e diagnosing-bugs orienta testar pelo ponto de entrada do usuário e registrar a primeira diferença reproduzível. A reprodução do HTML verifica o arquivo gerado. A revisão por pessoas verifica clareza, hierarquia e adequação ao negócio. [Repositório e instruções](https://github.com/mattpocock/skills/tree/abeeaf95660ba9e8b7c753eb38f441ca707a8823)

## O que incorporamos de Jakub Krehel

O manifesto conserva a revisão oficial de cada skill e os hashes dos arquivos de apoio. Os especialistas atuais leem a mesma reunião independentemente. As recomendações podem conflitar. A orquestradora registra qual decisão tomou, o motivo e a peça afetada. AFK orienta a tomar decisões reversíveis a partir do material disponível e a deixar uma trilha de revisão. [Conjunto dos especialistas](https://github.com/jakubkrehel/skills/tree/672ae44ace6aaed65b86cbb1e2fd6fbea0e79578)

A versão histórica de technical-drawing dá a referência de câmera, geometria, projeção, vistas e funcionamento do visor. O uso para interfaces acrescenta tela, fluxo, requisito, ação e fonte. A silhueta da tela, o empilhamento de planos e os controles precisam comunicar a decisão mesmo antes de abrir suas regras. A prancha inicial de confirmação serve de referência de regressão visual. [Revisão da orquestradora](https://github.com/jakubkrehel/skills/tree/16a6eb87b96479964d6686efc78ac6d29fba22aa)

## Navegação e espera

A primeira exibição é a prancha técnica. O botão **Fluxos** abre a busca nas três perspectivas da coleção. **Fluxos** mostra miniaturas em ordem, **Telas** busca títulos e requisitos e **Elementos** mostra ocorrências das peças no contexto das telas. A visualização ampliada percorre a sequência com setas, toque ou a tira de etapas. Esc devolve o foco ao resultado. A inspeção seleciona a tela e, quando aplicável, a peça no visor técnico. [Line Nav](https://chanhdai.com/components/line-nav) · [Lightbox](https://chanhdai.com/components/lightbox) · [Mobbin](https://mobbin.com)

O ícone de espera usa os três contornos e o ciclo de três segundos de Mobius Loop Icon, com interpolação SVG local. A etapa textual acompanha eventos reais. Com redução de movimento, o símbolo fica estático. [Mobius Loop Icon, de Chanh Dai](https://chanhdai.com/components/mobius-loop-icon)
