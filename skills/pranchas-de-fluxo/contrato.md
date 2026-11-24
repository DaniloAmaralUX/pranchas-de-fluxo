# Contrato do desenho

O agente que recebe o briefing abre a sessão visual, passa os insumos ao conselho e espera os pareceres. A orquestradora lê cada parecer completo, a skill technical-drawing original e seus arquivos de apoio. O briefing do cliente decide o comportamento do produto. Cada especialista contribui dentro da sua disciplina.

Grave em `prototipo/decisoes.json` um objeto com as seguintes coleções. Exemplo ilustrativo com uma tela e uma recomendação. Use os identificadores reais de seu projeto.

```json
{
  "telas": [
    {
      "id": "confirmacao",
      "fundamentacao": "O cliente pediu que a pessoa conheça a consequência antes de confirmar.",
      "pareceres": ["better-accessibility"]
    }
  ],
  "recomendacoes": [
    {
      "skill": "better-accessibility",
      "id": "foco-inicial",
      "situacao": "aplicada",
      "justificativa": "A ação que preserva o projeto recebe o foco ao abrir.",
      "telas": [{"id": "confirmacao", "pecas": ["cancelar"]}]
    }
  ]
}
```

Inclua cada tela de drawing.json uma única vez. Toda tela referencia ao menos um especialista que devolveu status aplicavel. Represente **cada recomendação de cada parecer** exatamente uma vez, preservando seus identificadores. As situações aceitas são aplicada, adiada e recusada. Justifique todas. Para uma recomendação aplicada, indique pelo menos uma tela e uma peça real por tela, e liste o especialista em pareceres dessas telas. Para decisões adiadas ou recusadas, a lista de telas pode ser vazia. Um parecer nao_aplicavel já registra a razão em seu próprio arquivo.

Após a geração e a prova visual no Chrome, o instalador verifica os insumos, os pareceres, os vínculos e a reprodução byte a byte do HTML e da documentação. Guarda a assinatura SHA-256 em contrato.lock.json. Esses arquivos pertencem à pasta local do pedido. Mantenha o pedido inteiro junto para reproduzir.

```sh
node .pranchas-beta/cli.cjs --reproduzir "caminho/do/pedido/prototipo"
```

A reprodução usa o modelo salvo e a mesma versão da ferramenta. Um novo desenho criado por IA a partir do mesmo relato pode ter outra composição. O contrato torna verificável a entrega aprovada e acusa alterações nos arquivos que a sustentam.
