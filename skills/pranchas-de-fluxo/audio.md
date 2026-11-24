# Da conversa às evidências

A pessoa fornece um relato ou anexa as fontes no chat. Para texto já legível no chat, trabalhe diretamente nele. Para arquivos, o agente executa o auxiliar com Node 18 ou superior a partir da instalação da skill. O mesmo comando aceita várias fontes.

```text
node "<skill>/scripts/ingerir.cjs" --out "<projeto>/fontes-privadas" "<pauta.docx>" "<reuniao.mp4>" "<regras.pdf>"
```

O caminho impresso aponta para o índice privado em Markdown. A opção `--stdin` inclui texto recebido pela entrada padrão junto com os arquivos. Para nomes que começam com dois hifens, separe as opções e os arquivos com `--`. No PowerShell legado, ao enviar acentos por pipe, defina `$OutputEncoding = [System.Text.UTF8Encoding]::new($false)` na sessão. Ao lidar com conversas reais, mantenha as fontes fora do controle de versão.

| Entrada | Evidência para ler |
| --- | --- |
| TXT, Markdown, AsciiDoc, RST, CSV, TSV, JSON, JSONL, YAML, XML, TOML, logs | Texto com números de linha. Lê UTF-8, UTF-16 com BOM e Windows-1252. |
| SRT, VTT, ASS | Texto com linhas e tempos originais. |
| DOCX, ODT | Parágrafos, conteúdo textual de células e figuras raster incorporadas. A ordem visual de diagramas, células mescladas e objetos exige conferência no original. |
| PDF | Texto selecionável e uma imagem de cada página. Em digitalizações, leia a imagem da página no agente com visão. |
| HTML, RTF | Texto extraído. No HTML, scripts e folhas de estilo são ignorados. |
| PNG, JPEG, WEBP, GIF | Cópia da imagem original. |
| WAV, MP3, M4A, FLAC, OGG, AAC, OPUS e outros contêineres reconhecidos | Fala com tempos e idioma reconhecido. |
| MP4, MOV, MKV, WEBM, AVI e outros contêineres reconhecidos | Fala da primeira trilha de áudio e amostras com tempo da primeira trilha de vídeo. Vídeos mudos também funcionam. |

Abra cada imagem referenciada e descreva o que ela comprova. Diferencie fala, anotação visual e inferência na síntese. Em vídeo, o extrator considera mudanças de cena uma vez por segundo, guarda um quadro periódico a cada dez segundos e inclui o último quadro. Para analisar um gesto breve, repita com `--frames-every 0.25` ou abra o original no instante indicado. Em documentos longos, percorra todas as referências antes de concluir a cobertura. Vincule cada regra às fontes por identificador, página, parágrafo, tempo ou linha. Quando uma definição não estiver explícita, registre a hipótese como tal. Preserve palavras negativas, exceções e papéis. Compartilhe apenas a síntese autorizada das regras no HTML final.

### Reconhecimento local

Na primeira utilização de documentos ricos e mídia, o auxiliar encontra uv ou baixa o binário oficial da Astral e confere seu SHA-256. Ele prepara Python 3.12 e as bibliotecas sob demanda no cache do usuário. Áudio e vídeo usam PyAV e faster-whisper em CPU. O modelo multilíngue base é obtido na primeira transcrição. O processamento ocorre nesta máquina. O auxiliar só busca dependências e pesos, sem upload do material. A análise posterior pelo agente segue a configuração de privacidade da IDE escolhida.

Use `--language pt` para orientar o reconhecimento em gravações curtas, `--model small` para um modelo maior ou `--model "<pasta CTranslate2>"` para pesos locais. Depois de preparar as mesmas dependências e pesos, `--offline` exige somente o cache. Os tempos permitem conferir nomes próprios, números, termos ambíguos e trechos marcados para revisão. Exatidão depende de dicção, idioma e ruído. Arquivos protegidos por senha precisam de cópia legível. Falhas identificam a fonte e preservam a última extração concluída.

O bootstrap inclui binários para Windows, macOS e Linux glibc em x64 ou ARM64. Precisa de Node, tar e acesso de leitura e escrita ao cache do usuário. A disponibilidade das bibliotecas de mídia depende de haver wheels para a plataforma. Em outras plataformas, o agente pode usar um uv já instalado.

A ingestão de ponta a ponta foi exercitada em Windows x64. A resolução de pacotes binários com Python 3.12 também passou para Linux glibc x64 e ARM64, macOS Intel e macOS 14 ou superior em Apple Silicon. A pilha fixada de mídia carece de wheels nativos para Windows ARM64. Nessas máquinas, texto, legendas e imagens isoladas usam apenas Node.
