# Skills de Jakub Krehel

O diretório `jakub/skills/` contém as 16 skills do commit atual registrado em `jakub/manifest.json` e a versão histórica de technical-drawing que dirige o desenho. Cada entrada do manifesto identifica o commit, o objeto de árvore Git e, para cada arquivo, o blob Git e o SHA-256. A licença MIT acompanha o material. [Repositório original](https://github.com/jakubkrehel/skills)

Para conferir o inventário e os bytes locais, execute na raiz do projeto com Python 3.9 ou superior.

```sh
python tools/vendor-jakub.py
```

Para comparar a cópia diretamente com os objetos Git das duas revisões, obtenha o repositório em uma pasta à parte.

```sh
git clone https://github.com/jakubkrehel/skills jakub-upstream
python tools/vendor-jakub.py --source jakub-upstream
```

Para preparar uma atualização, informe a revisão completa em `--current` e um diretório novo em `--stage`. O script verifica o material antes de terminar. Confira a diferença entre os dois manifestos antes de substituir o snapshot.
