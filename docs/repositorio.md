# Trabalhar no repositório do Pranchas

O repositório [DaniloAmaralUX/pranchas-de-fluxo](https://github.com/DaniloAmaralUX/pranchas-de-fluxo) guarda o código distribuível, os contratos, os exemplos fictícios e as verificações. O export original do Supernova e as sessões de briefing ficam no checkout local, em diretórios ignorados pelo Git. A integração do catálogo recebe um export disponível na máquina e o transforma em dados navegáveis.

## Mapa do projeto

| Área | Responsabilidade |
| --- | --- |
| [Catálogo](../integrations/catalogo/README.md) | Home, importação, galeria, demonstrações e entrada para criação de pranchas. |
| [Instalador](../tools/pranchas-cli/README.md) | Registro da skill na IDE, ingestão, sessão de geração e empacotamento para npx. |
| [Skill Pranchas](../skills/pranchas-de-fluxo/SKILL.md) | Processo da reunião até o desenho, conselho e contrato da entrega. |
| [Visor técnico](../integrations/ui-sdk/README.md) | Navegação por fluxo e peça, prévia local, regras e exportação. |
| [Contrato de entrega](../CONTRATO-DE-ENTREGA.md) | O que uma entrega apresentável precisa demonstrar. |
| [Criar sua versão](criar-sua-versao.md) | Especificação da seleção de referências e da sua ligação com o protótipo futuro. |

## Fontes de trabalho

Execute `node tools/fontes.mjs` com Git e GitHub CLI disponíveis. O comando prepara os clones locais e confirma origem e revisão. O [AGENTS.md](../AGENTS.md) indica como consultar os manuais em cada entrega. Os clones podem ser usados sem conexão depois de preparados.

| Fonte | Revisão | Aplicação |
| --- | --- | --- |
| [Matt Pocock](https://github.com/mattpocock/skills/tree/abeeaf95660ba9e8b7c753eb38f441ca707a8823) | `abeeaf95660ba9e8b7c753eb38f441ca707a8823` | Pesquisa, termos do domínio, especificação, testes por comportamento e revisão. |
| [Chánh Đại](https://github.com/ncdai/chanhdai.com/tree/7d44f44c7225c007831f9110e673c58290c3dca9) | `7d44f44c7225c007831f9110e673c58290c3dca9` | Referência de componentes, comportamento e acessibilidade. |
| [Jakub Krehel](https://github.com/jakubkrehel/skills) | [Manifesto de revisões e hashes](../vendor/jakub/manifest.json) | AFK, especialistas e a versão de technical-drawing usada para o visor. |
| [Skiper 49](https://skiper-ui.com/v1/skiper49) | [Adaptação no catálogo](../integrations/catalogo/README.md) | Carrossel com telas da coleção local. |

## Fluxo de integração

Use a branch `main` como origem da versão estável. Traga propostas para uma branch `experimental/*` com um pull request que ligue a mudança ao critério de aceite relevante. Para decisões de produto, use a [especificação](criar-sua-versao.md) e o [vocabulário](../GLOSSARY.md) para manter o mesmo sentido na UI, no código e nos testes.

O GitHub Actions verifica o conselho com entradas fictícias, o pacote instalável com perfis descartáveis, o visor em Chromium e a jornada do catálogo com uma coleção sintética. O aceite visual com todas as telas do Supernova usa a importação local. A prova de geração com o provedor de IA e a abertura no navegador integrado continuam verificações de ambiente real.
