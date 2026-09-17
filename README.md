# CRIA — interface da plataforma

Redesign da camada visual, alinhado à landing page CRIA. HTML, CSS e JavaScript nativos, sem framework, dependências de aplicação ou etapa de build.

## Arquivos de entrega

- `index.html`: nova tela de acesso; formulário, IDs, evento de envio e script originais preservados.
- `prompts.html`: novo workspace; 300 prompts, 31 categorias, seis comandos do guia e os três scripts originais preservados.
- `platform.css`: design system, layout, componentes, estados, acessibilidade e responsividade.
- `platform-ui.js`: adaptador visual do modal, autorizado separadamente. Usa o estado de expansão e o botão de cópia originais, sem substituir as funções existentes.
- `assets/`: logo oficial, SVGs locais do Lucide e licença dos ícones.
- `api/verify.js` e `api/webhook.js`: cópias idênticas às originais.

## Substituição

Copie o conteúdo desta pasta para a raiz do projeto existente. Inclua os dois HTMLs, o CSS, o adaptador visual e `assets/`. Não é necessário alterar configurações da Vercel, Supabase ou Kiwify.

As rotas continuam sendo `/`, `/prompts.html`, `/api/verify` e `/api/webhook`. Variáveis de ambiente, consultas, tabelas, geração e armazenamento do token, chaves de acesso e liberação de compradores não foram alterados. As variáveis e segredos continuam configurados no ambiente de hospedagem existente.

## Componentes visuais

Tokens de cor, tipografia, raio e superfície ficam no início de `platform.css`. Manrope aproxima a interface da landing page; JetBrains Mono é usado no texto dos prompts. Ícones Lucide são SVGs locais, sem pacote JavaScript.

Componentes: cabeçalho com busca, sidebar, grupos nativos recolhíveis, avatar neutro de membro, indicador do produto, estatísticas, tutorial, filtros por categoria, cards de prompt, guia de adaptação, modal e formulário de acesso. Nenhum nome de usuário ou plano adicional foi inventado.

Favoritos, recentes, filtros por tipo e badges de popularidade não tinham suporte na lógica existente. Não foram criados controles fictícios, armazenamento novo ou alterações no banco. Os filtros existentes por categoria foram apresentados como chips.

O tutorial inicia recolhido para dar prioridade à biblioteca. O botão mantém a função original de expansão.

## Preservação dos contratos

- Scripts originais mantidos literalmente, incluindo os controles de acesso e todas as funções.
- IDs, atributos `data-cat` e eventos inline originais mantidos.
- `.pb` e `.ph` continuam filhos diretos de `.pc`; cada card continua associado à mesma categoria.
- Conteúdo, títulos, números, campos de personalização e comandos do guia não foram reescritos.
- Corrigidos fechamentos estruturais do HTML: as categorias estavam aninhadas umas dentro das outras. Agora são seções irmãs, permitindo que as mesmas funções operem sobre as 31 categorias corretas.
- O adaptador do modal não faz requisições, não lê tokens, não usa armazenamento e não altera o conteúdo dos prompts. O modal usa `dialog` nativo, contém o foco e pode ser fechado com Escape. Sem suporte ao modal, a expansão original continua funcionando.

## Manutenção

Preserve os seletores usados nos scripts originais, especialmente `.pc`, `.ph`, `.pb`, `.pn`, `.pt`, `.cat-section`, `.cat-chip`, `.snav-item`, `.gc-cmd`, `#q` e `#cnt`. Não coloque a classe `.pc` em cópias visuais do modal: ela participa das contagens e da busca.

Ao alterar CSS ou o adaptador visual, atualize as versões nas referências dos HTMLs. Os ícones e a marca são locais; apenas as fontes usam Google Fonts, com fontes de sistema como fallback.

## Verificação

Foram comparados os scripts originais, os arquivos de API, IDs, eventos e o conteúdo dos 300 prompts e dos seis comandos. A revisão de navegador cobriu login com dados locais de teste, busca, estado vazio, filtros por categoria, sidebar, cópia, modal e guia. Desktop, tablet e celular foram revisados.

Os testes visuais usam um servidor separado com uma resposta de acesso simulada apenas em localhost. Esse servidor e seus dados de teste NÃO fazem parte desta entrega. A aplicação entregue mantém o fluxo real de autenticação. Nenhuma compra ou escrita no Supabase foi feita para validar o redesign.

Esta entrega é local. Publicação no GitHub/Vercel não foi realizada nesta etapa.
