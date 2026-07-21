# Instruções do Site - Zona-Z RPG

## Visão Geral do Projeto

O site do **Zona-Z RPG** será dividido em duas camadas:

- **Frontend** — Responsável pela apresentação visual (layout, navegação, animações e responsividade).
- **Backend** — Responsável por fornecer todos os dados que o frontend consome (textos, imagens, ícones, tabelas, etc.).

O conteúdo base do site vem do documento **"Zona-Z 1.0v Versão Final.docx"**, que será quebrado em partes. Cada parte será salva em um arquivo com o mesmo nome da página correspondente para facilitar o desenvolvimento do layout.

---

## Estrutura de Páginas

O site é composto por **7 páginas principais**, cada uma com suas seções e subseções:

---

### Página 1 — Apresentação do Jogo e do Mundo

> Primeira impressão do visitante. Apresenta o jogo, o universo e a história.

**Arquivo:** `pagina-1-apresentacao.md`

#### Bem-Vindos à Zona-Z
- Orientações — Avisos importantes e o que é RPG
- Introdução — Introdução do jogo e do que se trata
- Conteúdo — Resumo do Site

#### Como Tudo Começou
> História do jogo no passado — a origem dele

- A Queda
- A História Oculta do PR-Z13
- O Estado do Mundo
- A Ordem no Caos
- O Retorno à Origem
- O Último Refúgio

#### Atualmente
> Como está o mundo atualmente — ponto de partida dos jogadores

- A Cidade de Contenção
- As Zonas da Cidade
- Além das Muralhas
- Mundo dos Zumbis
- Facções do Mundo

---

### Página 2 — Mecânicas do Jogo (Guia ao Jogador)

> Todas as regras e mecânicas que o jogador precisa conhecer.

**Arquivo:** `pagina-2-mecanicas.md`

#### Mecânica do Jogo
- Testes de Ação
- Atributos
- Perícias
- Determinação
- Sanidade
- Infecção

#### Combate e Consequências
- Figura Favorecida
- Iniciativa e Ações do Turno
- Ataques e Defesa
- Dano Crítico e Falha Crítica
- Penalidade
- Vantagens e Desvantagens
- Morte
- Coberturas
- Perseguições

#### Exploração e Sobrevivência
- Alimentação
- Descansos
- Condições e Efeitos Adversos
- Distâncias, Alcance e Uso de Armas
- Regras Gerais dos Sons
- Evolução do Personagem
- Título de Sobrevivência
- Cargas

---

### Página 3 — Antecedentes e Talentos (Guia ao Jogador)

> Monte a sua história — escolha quem seu personagem era antes do apocalipse e seus talentos.

**Arquivo:** `pagina-3-antecedentes.md`

#### Antecedentes
- Acadêmico
- Advogado
- Agente de Saúde
- Artista
- Chef de Cozinha / Cozinheiro
- Criminoso
- Empresário
- Esportista Profissional
- Farmacêutico
- Jornalista
- Mensageiro / Entregador Urbano
- Militar
- Operário
- Policial
- Religioso
- Segurança Privado
- Sem Experiência
- Servidor Público
- Técnico de TI
- Trabalhador Rural

#### Talentos
- Ataque
- Defesa
- Interação
- Movimento
- Utilidade

---

### Página 4 — Equipamentos e Recursos (Guia ao Jogador)

> Tudo que o jogador pode encontrar, usar e criar no mundo.

**Arquivo:** `pagina-4-equipamentos.md`

#### Equipamentos
- Lista de Armamentos
- Equipamentos
- Munições

#### Itens
- Itens Comuns
- Itens de Combate
- Itens para Componentes
- Kit's Essenciais
- Itens Especiais

#### Criações e Aprimoramentos
- Criações
- Aprimoramento Geral

---

### Página 5 — Guia do Mestre (Parte 1)

> Ferramentas e orientações para o Mestre narrar campanhas.

**Arquivo:** `pagina-5-guia-mestre.md`

#### O Mundo em Detalhes
- Narrando Zona-Z: Guia do Mestre
- Como Criar uma Atmosfera de Sobrevivência
- Dicas e Ideias para Missões
- Distribuição de Marcos Narrativos nas Campanhas
- Dicas de Balanceamento
- Dicas sobre Assuntos Delicados

#### Regras Opcionais — Modulando a Sobrevivência
- Sistema de Infecção
- Sistema Alternativo de Idade
- Sistema de Dano Massivo

---

### Página 6 — Guia do Mestre (Parte 2)

> Bestiário e ameaças do mundo.

**Arquivo:** `pagina-6-criaturas.md`

#### Criaturas e Inimigos
- Tipo de Zumbis
- Confrontos com Humanos
- Ameaças do Reino Animal

---

### Página 7 — Complementos

> Material adicional e de apoio.

**Arquivo:** `pagina-7-complementos.md`

#### Conteúdo Adicional
- Criação de Personagem
- Explicando a Ficha do Personagem
- Campanha Introdutória

---

## Ferramenta Interativa — Criação de Personagem (`/criar-personagem`)

> Passo a passo fora das 7 páginas do livro de regras. Consome `Database/Título de Sobrevivência.docx` (bônus por título) e `Database/Equipamentos.docx` (catálogo filtrável por tier).

**Arquivos:** `frontend/src/pages/CriarPersonagem.jsx` (wizard) · `backend/app/api/character_builder.py` (`GET /api/builder/data`)

### Passos do wizard

1. Conceito
2. Nível da Campanha — escolha do Título de Sobrevivência
3. Antecedente
4. **Bônus do Título** — abas de armas/equipamentos/aprimoramentos/itens concedidos pelo título (filtrados por tier), mais duas abas sempre presentes quando o título é suportado: **Bazar** (gastar Marcos Narrativos em atributos/perícias/talentos/itens — inclui campo de "Bônus do Mestre" pra Marcos extras liberados à mão) e **Prévia da Ficha**. Sobrevivente Básico não tem bônus fixos, mas ainda mostra Bazar/Prévia (o livro permite ao Mestre liberar Marcos Narrativos mesmo nesse título).
5. Atributos
6. Talentos
7. Perícias
8. Finalizar

### Desenvolvimento por partes — status de cada Título de Sobrevivência

Todos os 5 títulos estão habilitados (`TITULOS_HABILITADOS` em `CriarPersonagem.jsx` lista os 4 avançados; Sobrevivente Básico é sempre suportado à parte, por não ter bônus fixo). O passo "Bônus do Título" foi validado um título por vez, começando pelo Veterano da Zona (única validação com navegador de verdade, já que este ambiente não tem ferramenta de automação — os demais foram habilitados após revisão de código linha a linha dos caminhos que cada um exercita, comparando com os dados reais do backend).

| Título | Status |
|---|---|
| Sobrevivente Básico | ✅ Pronto (sem bônus fixo; Bazar/Prévia sempre disponíveis) |
| Veterano da Zona | ✅ Habilitado e testado no navegador |
| Caçador de Ruínas | ✅ Habilitado (revisão de código — aba Aprimoramento(s) `max=1`) |
| Predador do Apocalipse | ✅ Habilitado (revisão de código — Aprimoramento(s) `max=2`, aba Bônus Extra arma-ou-equipamento) |
| Lenda da Zona | ✅ Habilitado (revisão de código — Item Especial raro/super-raro, Bônus Extra de 2 aprimoramentos, Munição Extra automática) |

**Bugs encontrados e corrigidos durante essa revisão, antes de habilitar:**
- Trocar entre "2 Raros" e "1 Super Raro" na aba Item Especial (Lenda) não limpava as escolhas antigas — se o jogador já tivesse selecionado itens no primeiro modo, o limite (`max`) do segundo modo ficava bloqueado por seleções que nem apareciam mais na lista. Corrigido: trocar o tipo agora limpa `itensEspeciais`.
- Aba "Bônus Extra" (Predador/Lenda) usava botões simples sem tooltip, diferente de todo o resto do passo — trocado pra reaproveitar o mesmo componente `ItemPicker` (com tooltip via portal) usado nas outras abas.

**Vale testar no navegador quando possível** (não foi possível nesta sessão): gerar uma ficha completa pra cada um dos 3 títulos novos e conferir visualmente os campos finais (PV, Marcos Narrativos, aprimoramentos, item do Bônus Extra, item especial, munição extra) — a lógica foi conferida por leitura de código e por scripts diretos contra o catálogo do backend, não por clique real.

### Evolução por Marcos Narrativos (pós-criação)

Painel "Evolução" em `frontend/src/pages/FichaPersonagem.jsx`, para gastar Marcos Narrativos numa ficha já criada (subir PV/atributos/perícias, comprar talentos e recursos narrativos). Reaproveita o mesmo catálogo `titulo_bonus` do backend. Detalhes completos em `Atualizacao - Titulo de Sobrevivencia.md` (raiz do projeto).

---

## Arquitetura Frontend / Backend

### Frontend
| Responsabilidade | Detalhes |
|---|---|
| Layout | Estrutura visual de cada página conforme as seções acima |
| Navegação | Menu principal entre as 7 páginas + navegação interna por seções |
| Responsividade | Adaptação para desktop, tablet e mobile |
| Apresentação | Renderização de textos, imagens, tabelas e ícones recebidos do backend |

### Backend
| Responsabilidade | Detalhes |
|---|---|
| Dados de Conteúdo | Textos de cada seção e subseção extraídos do documento original |
| Imagens | Servir imagens, artes e ícones utilizados no layout |
| Tabelas | Dados estruturados (atributos, equipamentos, criaturas, etc.) |
| API | Endpoints para o frontend consumir o conteúdo de cada página |

---

## Regras de Conteúdo

- **Não exibir marcadores de capítulos**: Nenhuma numeração de capítulo ou seção (ex: 2.1., 3.2.1., 4.8.3.) deve aparecer no site. O backend remove automaticamente essas numerações dos títulos ao processar os arquivos `.docx`. Apenas o nome limpo da seção deve ser exibido (ex: "Testes de Ação" em vez de "2.1. Testes de Ação").
- **Não exibir referências de imagem**: Marcações como "Img – pg01" presentes nos documentos originais não devem ser renderizadas no frontend.
- **Títulos de Sobrevivência agrupados**: Itens com o mesmo `(Titulo de Sobrevivência)` devem ser agrupados sob um único header de grupo (🛡️), sem repetir o badge em cada item individual.
- **Tags de formatação reconhecidas**:
  - `(Marcador)` → badge visual com label e texto
  - `(card)` / `(card-fim)` → card com fundo e borda
  - `[(card)` / `]` → card de receita/crafting (com materiais)
  - `(introdução)` → texto com barra lateral vermelha
  - `(subtitulo)` → header dourado de seção
  - `[(subtitulo)` / `]` → grupo de itens sob esse subtítulo
  - `(Anotação)` → card amarelo estilo sticky-note
  - `(importante destacar - I)` / `(I - fim)` → texto em negrito vermelho
  - `(Titulo de Sobrevivência)` / `(Titulo de Sobrevivência - Fechamento)` → grupo de restrição por título
  - `IMAGEM PARA FUNDO – nome` → imagem de fundo da seção/capítulo

- **Sem cache no backend (dev)**: Os serviços do backend não utilizam cache, garantindo que alterações nos arquivos `.docx` reflitam imediatamente na API sem necessidade de reiniciar o servidor.
- **Scroll-to-anchor**: Ao clicar em uma seção na sidebar, a página rola diretamente para o título da seção correspondente (âncora), não para o topo da página.

---

## Fluxo de Trabalho

1. Quebrar o documento **"Zona-Z 1.0v Versão Final.docx"** em partes
2. Salvar cada parte em um arquivo `.md` com o nome da página correspondente
3. Desenvolver o layout do frontend página por página
4. Estruturar o backend para servir os dados de cada arquivo
5. Integrar frontend com backend

---

## Nomenclatura dos Arquivos de Conteúdo

| Página | Arquivo |
|---|---|
| Página 1 — Apresentação | `pagina-1-apresentacao.md` |
| Página 2 — Mecânicas | `pagina-2-mecanicas.md` |
| Página 3 — Antecedentes | `pagina-3-antecedentes.md` |
| Página 4 — Equipamentos | `pagina-4-equipamentos.md` |
| Página 5 — Guia do Mestre | `pagina-5-guia-mestre.md` |
| Página 6 — Criaturas | `pagina-6-criaturas.md` |
| Página 7 — Complementos | `pagina-7-complementos.md` |
