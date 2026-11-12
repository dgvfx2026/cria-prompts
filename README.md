# CRIA — Biblioteca de vídeo

Área de membros com 500 prompts de vídeo, 18 categorias e uma prévia exclusiva de um único frame para cada cena. Todos os vídeos têm duração final de até 15 segundos. HTML, CSS e JavaScript nativos; sem framework ou etapa de build.

## Estrutura

- `index.html`: acesso pelo e-mail de compra, com o script de login original.
- `prompts.html`: biblioteca visual e controles de navegação.
- `platform.css`: interface responsiva, animações e pop-up liquid glass.
- `premium.css`: superfícies de vidro, entrada em sequência, elevação, inclinação e flutuação dos cards.
- `platform-ui.js`: categorias, busca sem distinção de acentos, ordenação, favoritos, recentes, modal e cópia.
- `personalizer.js`: composição local e determinística das versões personalizadas.
- `customizer.css`: resumos, campos de personalização e miniaturas responsivas.
- `data/catalog.json`: fonte editorial completa dos 500 prompts, incluindo campos de personalização.
- `data/library.json`: índice leve usado para abrir a biblioteca.
- `data/prompts/`: direção completa de cada cena, carregada ao abrir ou focar seu card.
- `data/search.json`: índice de texto completo, carregado somente quando há uma busca.
- `assets/thumbs/`: miniaturas AVIF/WebP em 384 e 640 px, sem recorte da imagem original.
- `vercel.json`: cache duradouro das miniaturas com nomes versionados e revalidação dos dados.
- `assets/previews/cria-001.webp` a `cria-500.webp`: prévias individuais, otimizadas para a web.
- `api/verify.js` e `api/webhook.js`: arquivos originais preservados byte a byte.

## Acesso e integração

As rotas continuam sendo `/`, `/prompts.html`, `/api/verify` e `/api/webhook`. O webhook Kiwify → Supabase, as variáveis de ambiente da Vercel e o contrato do token `cria_access` foram preservados. Não é necessário trocar banco, credenciais ou automação de compra para adotar esta interface.

Favoritos e recentes ficam neste navegador, nas chaves `cria_favorites_v2` e `cria_recent_v2`. Eles não alteram a base de compradores. O pop-up usa `dialog` nativo, fecha pelo botão discreto, por Escape ou por clique fora; ao fechar, devolve o foco ao card. A cópia tem um método alternativo e seleção manual se o navegador bloquear o clipboard.

## Conteúdo

Os 150 prompts originais de vídeo receberam revisão individual. A primeira reformulação acrescentou 150 vídeos e retirou os 150 prompts antigos de imagem. Esta edição acrescenta mais 200 vídeos: o total final é 150 originais revisados + 350 novos. Os IDs e as ideias da edição anterior foram mantidos; 63 cenas mais longas receberam sequências individuais reduzidas para 15 segundos.

FOOH e UGC têm 40 prompts cada. Comerciais de produto e Packshots & loops têm 35 cada. As outras 14 categorias têm 25 prompts cada. Os novos conceitos incluem lançamentos, demonstrações, kits, coleções, acabamentos, uso cotidiano e bastidores que as marcas podem adaptar ao seu produto real.

Cada prompt tem entrega, referências, direção de câmera e luz, sequência temporal, VFX/continuidade, áudio e restrições. Quando há falas previstas, elas são em português brasileiro. Os 40 FOOH proíbem diálogo, narração, locução, vozes ao fundo, vozes de multidão, canto e reações vocais; usam apenas ambiente e efeitos não vocais. Os prompts mantêm o inglês como convenção do pack original. Referências a Alexa e Houdini descrevem a linguagem visual desejada.

Apenas Cinematic pessoa, Animação & fantasia, Atmosférico & sci-fi, Drone & aerial, Microcinema & curta e Esporte & ação usam vídeo horizontal 16:9 (150 prompts). Todas as outras categorias usam vídeo vertical 9:16 (350 prompts). A proporção aparece no texto copiado, no card e no pop-up. As capas permanecem em 16:9, conforme solicitado, independentemente da proporção do vídeo.

Os tempos são do vídeo final, sempre até 15 segundos; loops e cenas que já eram mais curtos mantêm a duração menor. Em geradores com limite de duração, produza as tomadas separadamente e monte a sequência dentro do total indicado. Os campos entre colchetes devem ser preenchidos antes de gerar. As prévias mostram uma possibilidade da cena; não são storyboards ou resultados garantidos de um gerador específico.

## Publicação na Vercel

Use estes arquivos na raiz do projeto existente, incluindo `data/` e `assets/previews/`. Mantenha a configuração e as variáveis de ambiente já existentes. A entrega local não publica automaticamente na Vercel.

Para servir os arquivos estáticos localmente, use um servidor HTTP na raiz desta pasta, por exemplo `python -m http.server 8080`. As rotas de API reais dependem do ambiente da Vercel; o servidor estático simples não simula a autenticação. Os testes desta entrega usam um servidor separado, restrito a localhost, que não faz parte do projeto publicado.

## Acabamento

As animações são automáticas: entrada em sequência quando os cards aparecem na tela, flutuação contínua apenas nos cards visíveis, elevação e inclinação ao passar o mouse. A flutuação pausa fora da tela e enquanto um pop-up está aberto. Com redução de movimento ativa, a entrada usa apenas um fade curto e a resposta ao mouse mantém uma elevação suave de 7 px; a flutuação contínua e a inclinação ficam desativadas. Não há botão de ativação. O vidro usa desfoque, transparência e reflexos de borda; navegadores sem `backdrop-filter` recebem uma superfície de leitura alternativa.

A marca oficial e os ícones locais foram mantidos. As fontes usam Google Fonts com alternativas locais de sistema. A licença dos ícones está em `assets/LUCIDE-LICENSE.txt`.


## Personalizador local

Os 500 prompts têm resumo visível no card e no pop-up, além de opções de marca/projeto, acabamento de cor e contraste. Os campos adicionais dependem da cena: nome de produto ou pessoa associado ao anexo real, dados verificáveis dos tutoriais e escolhas preparadas de ambiente ou cor de elementos específicos. As opções de seleção têm instruções em inglês; nomes e dados livres entram como o usuário escreveu. Não há tradução ou reescrita livre por IA.

A direção base continua intacta. As escolhas acrescentam um briefing com prioridades explícitas ou substituem trechos literais preparados para aquela cena. Tempos, proporção, referências e restrições de áudio são preservados. “Restaurar original” recupera o texto exato. A cópia usa a versão exibida, e seu botão permanece visível no rodapé do pop-up.

A opção de lembrar a marca é desmarcada por padrão. Quando ativada, salva somente marca, acabamento de cor e contraste em `cria_brand_profile_v1`, no navegador atual. Produto, pessoa, cor de adereços e ambiente não são reutilizados automaticamente entre cenas. Desmarcar remove o perfil salvo; os dados não são enviados ao servidor. Rascunhos de cada prompt permanecem apenas na memória da aba. Bloqueio de armazenamento não impede personalização ou cópia.

O personalizador não usa APIs pagas, créditos de IA, novos serviços ou banco de dados. A geração do vídeo acontece na ferramenta escolhida pelo comprador.

## Carregamento de imagens

As 500 capas originais em WebP e 1280 × 720 foram preservadas byte a byte. Os cards escolhem miniaturas AVIF ou WebP de 384/640 px conforme o navegador e a densidade da tela. Somente as referências que se aproximam da área visível são carregadas; o pop-up textual não baixa a imagem original escondida. A abertura da biblioteca usa um índice de cerca de 310 KB, em vez de baixar todos os prompts antes de mostrar os cards.

Os originais permanecem no projeto como matrizes, portanto o tamanho total do pacote não representa o download de quem visita a página. Cada visitante baixa apenas a variante escolhida para os cards que visualiza. As regras de cache da Vercel não alteram as rotas de login ou webhook.


## Edições futuras

Edite `data/catalog.json` como fonte de conteúdo. Depois execute `node scripts/build-library.mjs` na raiz do projeto para atualizar o índice leve, a busca e os 500 arquivos individuais. O script usa apenas recursos nativos do Node; a aplicação publicada continua estática e sem etapa de build obrigatória. Novas miniaturas devem receber nomes versionados ou derivados do conteúdo para manter a validade do cache.


## Movimento e transições

A edição fluid1 acrescenta `motion.js` e `motion.css`, usando apenas animações nativas do navegador. A entrada da página é coordenada por grupos; categorias e ordenação recebem uma transição curta, e a busca continua atualizando sem esperar a saída animada. Trocas rápidas cancelam a transição anterior e mantêm a última seleção. Os cards entram em sequência com suavização, e sua flutuação começa a partir de repouso.

O pop-up entra e sai com fade e escala discretos. Sua posição vertical fica estável durante o carregamento do texto e a expansão dos campos. O personalizador anima a altura nos dois sentidos, inclusive ao inverter uma abertura em andamento. Botões, favoritos, contagem de ajustes, cópia, imagens, guia, navegação móvel e mensagens do login recebem respostas visuais coerentes. Os scripts originais de autenticação não foram editados.

A preferência de movimento reduzido mantém fades e respostas breves; elimina a entrada ampla, a inclinação e a flutuação contínua. Não há interruptor de animações na interface. Os efeitos de cursor são limitados a um cálculo por quadro, as imagens continuam sob demanda e as animações ambientes pausam quando a aba fica oculta. Conteúdo, imagens e regras dos prompts permanecem intactos nesta revisão.


Na revisão pop1, o pop-up do prompt surge menor, cresce com uma ultrapassagem leve do tamanho final e se acomoda em escala 1. A abertura completa dura 560 ms; com movimento reduzido, usa escala de 0,92 a 1,012 em 380 ms, sem deslocamento ou desfoque. Fechar durante a entrada parte do tamanho atual para evitar saltos.


A revisão pop2 torna a abertura mais expressiva: escala inicial de 0,74 no modo completo e 0,82 no modo suave, com pico de até 1,045/1,028 e uma segunda acomodação antes de chegar a 1. Os tempos são 650/500 ms. O pico é limitado pelo espaço disponível da tela para manter o painel dentro da área visível.
