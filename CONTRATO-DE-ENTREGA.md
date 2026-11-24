# Contrato de entrega do Pranchas

O modo autônomo vale quando o responsável pede para tocar uma entrega do projeto até o aceite. O agente lê o briefing e a memória de produto, consulta as skills de Matt Pocock no clone do repositório e usa AFK de Jakub Krehel para decidir, verificar e deixar a trilha da execução. Este contrato foi definido para a apresentação a stakeholders.

## Operação

- Aplicar `research` e `domain-modeling` para identificar as fontes, os nomes do usuário e as decisões que mudam o percurso. Usar `to-spec` para declarar o resultado observável e os critérios antes de implementar. Quando o responsável delegar as decisões, resolver as hipóteses reversíveis com a evidência disponível e registrá-las localmente.
- Aplicar `tdd` no ponto de entrada pelo qual a pessoa usa o produto. Para defeitos, reproduzir com `diagnosing-bugs` e confirmar a correção pelo mesmo caminho. Para avaliar a entrega, cruzar as duas perguntas de `code-review`. A implementação segue as convenções do projeto? Ela resolve o que a pessoa pediu?
- Trabalhar em branch local reversível e preservar trabalho em andamento em outra árvore. Registrar evidências, escolhas e ideias em `.afk/`. Refazer as verificações impactadas após correções. Antes do encerramento, conferir o conjunto e deixar o caminho da apresentação aberto.
- Processos de geração de tela seguem também o [contrato do desenho](skills/pranchas-de-fluxo/contrato.md). O material privado de reuniões e o Supernova importado permanecem na máquina. Publicações e compartilhamentos seguem a autorização da entrega específica.

## Aceite para a apresentação

| Quem usa | Resultado verificável |
| --- | --- |
| Stakeholder | Abre a home em uma URL local, vê telas reais do Supernova no carrossel e percorre os destaques por seta, teclado ou toque. |
| Designer | Usa **Explorar**, encontra a coleção importada completa, filtra por categoria, busca sem acento, abre a prévia e alterna as versões clara e escura. Uma tela tem link direto. |
| Stakeholder | Abre a demonstração interativa de uma tela do catálogo e consegue voltar à home ou à coleção. As 158 páginas e as 316 imagens são as do export de origem. |
| PO e QA | Abrem o caso fictício de aprovação no **Visor técnico**. Percorrem as ações de aprovar, devolver e corrigir, encontram a regra e a fonte e inspecionam a peça. |
| Pessoa que recebe o briefing | Encontra **Criar pranchas** na home, abre o formulário local e pode colar texto ou anexar material. A interface mostra as etapas reais e só apresenta o HTML após validação. O caso de apresentação já está pronto para abrir mesmo sem acesso ao provedor. |
| Pessoa que apresenta | Tem roteiro curto e comando de reabertura. Os testes locais confirmam instalação, catálogo, renderização, navegação e reprodução do contrato. |

Uma execução só é considerada concluída após verificar os caminhos acima e registrar o resultado. Se um recurso externo impedir a prova de uma etapa, manter o restante funcional e registrar exatamente o que foi testado e o que depende desse recurso.

[Skills de Matt Pocock, revisão abeeaf9](https://github.com/mattpocock/skills/tree/abeeaf95660ba9e8b7c753eb38f441ca707a8823) · [AFK de Jakub Krehel](https://github.com/jakubkrehel/skills/tree/672ae44ace6aaed65b86cbb1e2fd6fbea0e79578)
