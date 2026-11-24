# Catálogo Supernova no Pranchas

A home em `/` apresenta telas do Supernova no carrossel Skiper 49. **Explorar** abre a coleção com busca, categorias e prévias clara e escura. A demonstração interativa de cada tela vem do export original do Supernova. **Visor técnico** abre o exemplo de aprovação na mesma origem. **Criar pranchas** abre uma sessão local para seu briefing.

Com o export estático `out/` disponível na pasta do Supernova, execute na raiz do Pranchas.

```sh
npm run apresentar --prefix integrations/catalogo -- "<pasta-absoluta-do-supernova-catalogo>"
```

[Abrir a home local](http://127.0.0.1:57128/) · [Abrir a coleção](http://127.0.0.1:57128/explorar/)

Nas próximas apresentações, execute sem o caminho do Supernova para reaproveitar a importação. A sessão de criação usa o Codex CLI quando a pessoa envia um briefing. O exemplo fictício, o catálogo e as demonstrações interativas ficam disponíveis localmente durante a apresentação.

O importador leva as páginas, os recursos, as prévias e o registry da exportação estática para `public/catalogo`. A cópia local fica fora do Git. As prévias carregam à medida que entram na área visível. O servidor da home aplica alterações de CSS na aba aberta e recarrega o conteúdo ao salvar mudanças no JavaScript, no HTML ou no manifesto.

O carrossel usa o efeito Coverflow do Swiper com as telas locais. [Skiper 49, de Skiper UI](https://skiper-ui.com/v1/skiper49) · [Licença do Swiper](https://github.com/nolimits4web/swiper/blob/v12.2.0/LICENSE)
