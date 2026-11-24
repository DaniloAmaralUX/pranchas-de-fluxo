# Consulta dos especialistas

Quando a pessoa solicita a geração, o executor reserva uma sessão independente do Codex CLI para cada skill atual declarada no manifesto de Jakub Krehel. A revisão incluída tem 16 especialistas. Um pedido novo consome essas consultas e a sessão de síntese na conta configurada, com consultas adicionais em caso de nova tentativa. Há até quatro especialistas ativos de cada vez. A saída do terminal informa quantos pareceres já passaram pela validação. [Execução não interativa do Codex](https://developers.openai.com/codex/noninteractive/)

Cada agente recebe o texto oficial com sua revisão fixa, o diretório que contém as referências relativas e o pedido da reunião. Lê as fontes de trabalho e responde como consultor em modo de leitura. Na participação de AFK, os critérios de investigação e triagem de ideias são aplicados ao briefing. O trabalho proposto por cada especialista segue para a decisão da orquestradora.

O arquivo `conselho/indice.json` aponta para os pareceres na ordem do manifesto e registra os hashes SHA-256. Cada parecer contém:

- A competência que respondeu e a justificativa para sua aplicabilidade.
- Trechos e localizações de origem. Cada citação textual precisa ocorrer no briefing normalizado. Em fontes visuais, o agente identifica o quadro ou página e sinaliza suas interpretações.
- Recomendações com ID único por especialista, proposta e índices numéricos das fontes que a sustentam.
- Conflitos e decisões que dependem de esclarecimento.

Um especialista fora do escopo também precisa devolver um parecer próprio com o status `nao_aplicavel`, explicar o motivo e citar as fontes que examinou. A execução repete uma consulta que falhou. Se faltar um único parecer válido após a segunda tentativa, ela interrompe o pedido antes de desenhar.

O índice e os pareceres completos ficam disponíveis juntos. Uma repetição do mesmo pedido pode reaproveitar o lote se os arquivos de entrada, a revisão dos especialistas e os hashes de todos os pareceres ainda coincidirem. Um novo pedido tem seu próprio diretório. Esses relatórios ficam no espaço de trabalho da reunião e podem conter citações privadas.

A síntese precisa confrontar as contribuições com o briefing e registrar a decisão para cada recomendação. [Contrato da orquestradora](contrato.md)
