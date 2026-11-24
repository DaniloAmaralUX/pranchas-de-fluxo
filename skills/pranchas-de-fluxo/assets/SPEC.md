# Arquivo de projetos

Simulação com dados fictícios. A pessoa arquiva um projeto, pode cancelar antes da confirmação e pode restaurá-lo depois.

## Arquivar projeto · Projetos ativos

**Escolher o projeto que será arquivado e abrir a confirmação.**

O Portal do cliente está na lista de ativos. Acione Arquivar para revisar a consequência antes de mudar o estado.

### ARQ-01 · O projeto permanece ativo até a confirmação.

A ação Arquivar fica na linha do projeto. A lista só muda depois da decisão.

Peças do desenho — Lista de projetos, Ação Arquivar

Origem — Resumo da reunião · linha 2, Resumo da reunião · linha 5

**Caminhos a testar**

- Arquivar Portal do cliente → Confirmar arquivamento

## Arquivar projeto · Confirmar arquivamento

**Identificar o projeto e explicar a recuperação antes de confirmar o arquivamento.**

A lista fica visível e inerte. A confirmação explica que o projeto pode ser restaurado. Na abertura o foco começa em Cancelar. O anel desenhado em Arquivar mostra a posição após Tab.

### ARQ-02 · A confirmação mantém a lista visível e impede ações no fundo.

A camada entre o diálogo e a lista preserva o contexto e concentra a decisão no diálogo.

Peças do desenho — Lista de projetos, Scrim, Diálogo

Origem — Resumo da reunião · linha 2

### ARQ-03 · A pessoa precisa saber o que arquiva e que poderá restaurá-lo.

O nome Portal do cliente e a possibilidade de recuperação pertencem ao corpo do diálogo, antes dos botões.

Peças do desenho — Diálogo

Origem — Resumo da reunião · linha 3

### ARQ-04 · Ao abrir, a primeira ação em foco é Cancelar.

O foco inicial permite sair com segurança. O anel da prancha mostra onde chega o foco após Tab.

Peças do desenho — Diálogo, Anel de foco

Origem — Resumo da reunião · linha 4

**Caminhos a testar**

- Cancelar → Cancelamento
- Confirmar arquivamento → Projeto arquivado

## Arquivar projeto · Cancelamento

**Manter o projeto ativo e devolver o foco a Arquivar quando a pessoa cancelar.**

O projeto continua na lista de ativos. Ao cancelar ou pressionar Esc no sistema, o foco volta ao botão Arquivar da mesma linha.

### ARQ-05 · Cancelar ou pressionar Esc fecha a confirmação.

A lista conserva a linha original. O contorno de foco volta para Arquivar, onde a pessoa pode retomar a tarefa.

Peças do desenho — Lista de projetos, Ação Arquivar, Foco no acionador

Origem — Resumo da reunião · linha 4, Resumo da reunião · linha 5

**Caminhos a testar**

- Tentar novamente → Confirmar arquivamento
- Voltar à lista → Projetos ativos

## Arquivar projeto · Projeto arquivado

**Retirar o projeto dos ativos, anunciar o resultado e permitir a restauração.**

O Portal do cliente sai da lista de ativos, o título recebe o foco e uma mensagem informa que a ação foi concluída. Neste teste, Restaurar repõe o projeto.

### ARQ-06 · Confirmar retira o projeto da lista e leva o foco ao título do resultado.

A linha desaparece. A mensagem confirma a mudança e o contorno no título mostra onde a leitura recomeça.

Peças do desenho — Lista de projetos, Mensagem de sucesso, Foco no título

Origem — Resumo da reunião · linha 5

### ARQ-07 · Restaurar repõe o projeto e permite repetir a simulação.

A escolha Restaurar no percurso leva à lista com o mesmo projeto disponível para arquivamento.

Peças do desenho — Lista de projetos, Mensagem de sucesso

Origem — Resumo da reunião · linha 6

**Caminhos a testar**

- Restaurar projeto → Projetos ativos

## Diretrizes do projeto

- A confirmação conserva a geometria da prancha de referência. (Resumo da reunião · linha 1)
- A primeira visita abre na confirmação. As setas percorrem as quatro pranchas na ordem da revisão. (Resumo da reunião · linha 7)
