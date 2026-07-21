# Atualização: Título de Sobrevivência (bônus de criação + evolução por Marcos Narrativos)

Baseado em `Database/Título de Sobrevivência.docx`. Implementa duas mecânicas que antes não existiam no site.

## 1. Bônus dos Títulos avançados (Criar Personagem → Passo "Bônus do Título")

Antes: escolher qualquer título além de "Sobrevivente Básico" mostrava "Bônus complementares em breve" e a ficha sempre saía com valores de Sobrevivente Básico.

Agora o passo 2 ("Nível da Campanha") só escolhe o título; um novo passo dedicado **"Bônus do Título"** foi inserido entre "Antecedente" e "Atributos" — só nesse passo aparecem os pickers de arma/equipamento/aprimoramento/itens do título escolhido.

**Desenvolvimento por partes**: o passo "Bônus do Título" é habilitado um título de cada vez, controlado por `TITULOS_HABILITADOS` no topo de `CriarPersonagem.jsx` (atualmente só `'Veterano da Zona'`). Um título fora dessa lista continua selecionável no passo 2, mas o passo "Bônus do Título" mostra aviso "em desenvolvimento" e a ficha sai com os valores de Sobrevivente Básico — status detalhado em `Instruções do Site.md`, seção "Ferramenta Interativa — Criação de Personagem".

O backend já tem os 4 títulos avançados totalmente implementados e prontos (dados abaixo); o que falta é habilitar cada um no frontend após validação:

| Título | PV | Marcos Narrativos | Arma(s) | Equip.(s) | Aprimor. | Itens comuns | Item combate | Bônus extra |
|---|---|---|---|---|---|---|---|---|
| Veterano da Zona | +6 | 20 | 1 | 1 | — | até 3 | 1 | — |
| Caçador de Ruínas | +10 | 30 | 1 | 1 | 1 | até 3 | 2 | — |
| Predador do Apocalipse | +14 | 40 | 1 | 1 | 2 | até 3 | 2 | 1 arma OU equipamento extra |
| Lenda da Zona | +18 | 50 | 1 | 2 | — | até 3 | 2 | 2 aprimoramentos extra + Item Especial (2 raros ou 1 super raro) + munição extra (6 un.) |

Armas e equipamentos são filtrados pelo **tier do título ou menor** (ex.: com Caçador de Ruínas só aparecem armas de tier Sobrevivente Básico → Caçador de Ruínas). O tier vem do campo `titulo_sobrevivencia` que já existe no catálogo de `Equipamentos.docx`.

A ficha final ganha os campos: `armas_extra_lista`, `aprimoramentos_lista`, `marcos_narrativos_atual`.

## 2. Evolução por Marcos Narrativos (Ficha de Personagem → novo painel "Evolução")

Sistema de progressão pós-criação, gastando os Marcos Narrativos acumulados em jogo:

- **+PV** (10 MN): fixo +6 ou 1d10 (mín. 4)
- **+1 Determinação Máxima** (30 MN, uma única vez)
- **+1 Sanidade Máxima** (15 MN, até 12)
- **+1 Atributo** (10 MN) — não pode ultrapassar o valor atual de Determinação
- **Perícias**: progressão em 5 estágios (3 / 5 / 10 / 15 / 20 MN) até +5
- **Especialização** (20 MN) — exige perícia no 3º estágio (+3) ou mais
- **Talento** (20 MN) — limite de 7 talentos (3 iniciais + até 4 comprados)
- **Recursos Narrativos**: Abrigo, NPC Auxiliar, Item de Combate Extra, Item Comum/Raro, Veículos, Munição (custo fixo) + Armas (Simples 10 / Disparo 15 / Fogo 25 MN, filtradas pelo tier do título do personagem) + Equipamento (15 MN)

Toda compra desconta os Marcos Narrativos disponíveis e fica registrada num histórico de compras na ficha (`historico_evolucao`), para o Mestre auditar depois.

## Arquivos alterados

- `backend/app/api/character_builder.py` — normalização de tier, tabela `TITULO_BONUS`, catálogo filtrável `_catalogo_titulo_bonus()`, exposto em `GET /api/builder/data` como `titulo_bonus`.
- `frontend/src/pages/CriarPersonagem.jsx` / `.css` — pickers do Passo 1, aplicação no `buildFicha()`.
- `frontend/src/pages/FichaPersonagem.jsx` / `.css` — novos campos/cards (armas e equipamentos do título, aprimoramentos, recursos narrativos, Marcos Narrativos) + painel de Evolução.

Não mexe em nenhum `.docx` nem precisa rodar `import_to_db.py` — só consome dados que já existiam no catálogo.

## Limitação de conteúdo conhecida (não é bug de código)

Em `Database/Equipamentos.docx`, os itens **"Armadura de Combate Militar Completa"** e **"Exoesqueleto de Suporte de Combate"** (Equipamento de Proteção) não estão dentro do parêntese `(Titulo de Sobrevivência)` no Word — por isso ficam sem tier (aparecem disponíveis em qualquer título, em vez de travados em Lenda da Zona). Para corrigir: no Word, envolver esses dois itens com a tag `(Titulo de Sobrevivência) Lenda da Zona ... (Titulo de Sobrevivência - Fechamento)` como os outros itens dessa seção, e rodar `python import_to_db.py` de novo.

## Verificação feita

- `GET /api/builder/data` testado direto (backend rodando) — tiers conferidos (ex.: Pistola Compacta=tier 0, Revolver Pesado=tier 4, Mochila Militar=tier 3).
- `npm run build` passou sem erros.
- Revisão manual linha a linha do código novo (achei e corrigi 1 bug: valor de perícia fora da progressão padrão podia corromper o estado no painel de Evolução).
- **Não testado visualmente no navegador** — não havia ferramenta de automação de browser disponível neste ambiente. Vale um teste manual clicando no passo a passo antes de considerar 100% validado.

---

## Log de mudanças futuras

<!-- Adicione aqui as próximas alterações relacionadas a esta atualização. -->

### Passo "Bônus do Título" reestruturado em abas + aba de Prévia

- Novo passo dedicado **"Bônus do Título"** inserido entre "Antecedente" e "Atributos" no wizard. O passo "Nível da Campanha" ficou só com a escolha do título.
- Dentro do passo, cada categoria (Arma(s), Equipamento(s), Aprimoramento(s), Itens Comuns, Item de Combate, Bônus Extra, Item Especial) virou uma **aba separada**, em vez de ficarem empilhadas — corrige a sobreposição visual que aparecia com várias listas roláveis uma embaixo da outra. As abas têm largura igual (`flex:1 1 0`) e se ajustam sozinhas conforme as regras de cada título (ex.: título sem Aprimoramento não mostra essa aba).
- Nova aba **"Prévia da Ficha"** (sempre a última) mostra tudo que já foi escolhido nas outras abas — nome, dados e efeito de cada item, mais o resumo de PV/Marcos Narrativos do título — antes de seguir para Atributos.
- Cada item dos pickers (armas, equipamentos, itens, aprimoramentos) agora tem **tooltip ao passar o mouse** mostrando dados/descrição/efeito completos. Primeira versão reaproveitava o CSS dos Talentos (`position:absolute`), mas ficava cortada pelo scroll da lista de itens (`.criar-titulo-picker-list` tem `overflow-y:auto`) — corrigido renderizando o tooltip via **portal** (`createPortal` direto em `document.body`, componente `ItemPicker`), com `position:fixed` calculado a partir da posição do botão. Largura fixa (320px, igual em todos) e altura automática (cresce pro texto sempre caber inteiro, sem cortar).
- **Desenvolvimento por partes**: continua controlado por `TITULOS_HABILITADOS` em `CriarPersonagem.jsx` (só Veterano da Zona por enquanto).

### Novo passo "Bazar" — gastar os Marcos Narrativos iniciais já na criação

Antes, os Marcos Narrativos concedidos pelo título só podiam ser gastos depois, no painel "Evolução" da Ficha de Personagem já pronta. Agora existe uma aba **"Bazar"** dentro do próprio passo "Bônus do Título" (por pedido — o Bazar usa os Marcos Narrativos que esse mesmo título concede, então faz parte do mesmo passo, não é um passo separado), com o mesmo sistema de "Evolução do Personagem" do `Título de Sobrevivência.docx`.

⚠️ Como esse passo vem *antes* de Atributos/Talentos/Perícias no wizard, uma perícia ou talento comprado no Bazar pode acabar sendo "desperdiçado" se você também escolher a mesma coisa de graça mais adiante (o sistema não deixa o bônus dobrar — fica só o maior dos dois). Coloquei um aviso na própria aba lembrando disso.

| Compra | Custo | Regra aplicada |
|---|---|---|
| +6 PV (fixo) ou 1d10 (mín. 4) | 10 MN | — |
| +1 Determinação Máxima | 30 MN | Uma única vez por personagem |
| +1 Sanidade Máxima | 15 MN | Até o teto de 12 |
| +1 Atributo | 10 MN | Não pode ultrapassar a Determinação atual |
| Perícia: aprender/evoluir | 3 / 5 / 10 / 15 / 20 MN por estágio | Até +5, estágio calculado sobre o bônus já existente (antecedente + perícias livres) |
| Especialização | 20 MN | Exige perícia no 3º estágio (+3)+; uma por perícia; total limitado pela Determinação atual |
| Talento | 20 MN | Limite de 7 talentos no total |
| Abrigo Seguro Temporário | 12 MN | — |
| NPC Auxiliar (Contato) | 15 MN | — |
| Arma Simples / de Disparo / de Fogo | 10 / 15 / 25 MN | Disparo e Fogo limitados ao tier do título atual |
| Equipamento (Proteção/Transporte) | 15 MN | Limitado ao tier do título atual |
| Item de Combate Extra | 10 MN | — |
| Item Comum / Item Raro | 5 / 15 MN | — |
| Veículo Pequeno (Moto) / Grande (Carro) | 20 / 40 MN | — |
| Munição (7 pacotes: Arma de Fogo Pequeno/Médio/Longo/Cartucho/Pesado, Arma de Disparo Leve/Pesado) | 5 / 10 / 20 / 15 / 25 / 5 / 5 MN | — |

Toda compra desconta o saldo, aplica o efeito de verdade no personagem em construção (atributo sobe, perícia evolui, arma/equipamento/item entra no inventário, talento é adicionado) e fica registrada num histórico (`char.bazar.historico`) que segue para a ficha final (`historico_evolucao`) — o painel "Evolução" da Ficha de Personagem continua o mesmo histórico depois.

**Bugs encontrados e corrigidos durante a revisão contra o docx** (pedido explícito de conferência da seção "Evolução do Personagem"):
- Tabela de preços de Munição estava incompleta/errada em **ambos** os arquivos (`CriarPersonagem.jsx` e `FichaPersonagem.jsx`): faltava a faixa "Pesado" (25 MN) e as duas faixas de Arma de Disparo (Leve/Pesado, 5 MN cada), e "Longo" (20 MN) tinha sido incorretamente fundido com "Cartucho" (15 MN) num único preço errado. Corrigido para as 7 faixas exatas do docx.
- Especialização podia ser comprada em dobro na mesma perícia (recarregando Marcos Narrativos à toa) e não respeitava o limite "total de Especializações ≤ Determinação atual" do livro — nenhuma das duas regras estava implementada em lugar nenhum. Corrigido nos dois arquivos.

**Limitação de conteúdo conhecida (docx)**: o cabeçalho da seção "🤝 Contatos" diz "20 Marcos Narrativos", mas o texto do corpo descreve a ação real como "Ao gastar 15 Marcos Narrativos, o jogador pode introduzir... um NPC Auxiliar" — usei o valor de 15 MN (o que está de fato ligado à ação), mas vale confirmar com você qual dos dois números é o pretendido e ajustar o `.docx` se for o caso. Também não incluí "Kit's Essenciais" no picker de Equipamento do Bazar — o docx precifica "Equipamentos de Proteção e Kit's Essenciais" como uma coisa só (15 MN), mas o catálogo de kits ainda não está exposto no `titulo_bonus.catalogo` do backend; hoje só dá pra comprar Proteção/Transporte por lá.

### Bazar: virou aba dentro de "Bônus do Título" (primeira aba), com desfazer, popup próprio e slots dinâmicos

Ajustes pedidos depois de testar o passo:

- **Bazar é a primeira aba** agora (antes de Arma(s)/Equipamento(s)/etc.), já que faz sentido decidir o que comprar com Marcos Narrativos antes de ver os outros picks.
- **Desfazer compra**: cada linha do "Histórico de Compras" ganhou um botão ✕ que devolve os Marcos Narrativos e reverte exatamente o efeito daquela compra (tira o PV, reduz o atributo, remove a arma/talento/equipamento específico, etc.) — não é mais um histórico só de leitura. Implementado gravando `tipo` + `meta` em cada entrada do histórico (`comprarBazar`) e uma função `reverterCompraBazar` que sabe desfazer cada um dos 12 tipos de compra.
- **Popup próprio**: erros de limite (Marcos insuficientes, atributo passando da Determinação, talento no limite de 7, etc.) não usam mais `window.alert()` nativo do navegador — agora é um modal no estilo do site (`ModalAvisoBazar`), com botão OK.
- **"Item Comum" e "Item de Combate Extra" agora aumentam os slots das próprias abas** — comprar isso no Bazar não gera mais um item genérico solto no inventário; em vez disso aumenta em +1 quantas escolhas você tem nas abas "Itens Comuns"/"Item de Combate" (que já têm o catálogo real de Medicamentos/Utilidades/Alimentícios e Granadas/Armadilhas), pra você escolher o item de verdade. Isso é inclusive mais fiel ao texto do docx ("trazer para a história algo que não estava listado inicialmente") do que a versão anterior.
- **Resumo ao vivo dos ganhos do Bazar**: um bloco na própria aba mostra tudo que já foi comprado (PV, Determinação, Sanidade, atributos, perícias, especializações, talentos, armas, equipamentos, slots extras) assim que a compra é feita, sem precisar abrir outra aba.

Arquivos: só `frontend/src/pages/CriarPersonagem.jsx` e `.css` (a estrutura de dados `char.bazar` ganhou `itensComunsExtra`/`itensCombateExtra`; nada no backend mudou).

### Bônus do Mestre + Sobrevivente Básico ganha Bazar/Prévia + plano dos próximos títulos

- **Campo "Bônus do Mestre"**: novo bloco no topo da aba Bazar — input numérico + botão OK (só aplica quando confirmado, não a cada tecla) pra registrar Marcos Narrativos que o Mestre libere por fora do que o título concede. Existe porque o próprio `Título de Sobrevivência.docx` diz, na descrição do Sobrevivente Básico: *"fica a critério do Mestre oferecer... até pontos extras de Marcos Narrativos, levando em consideração o background e a história do personagem"*. Guardado em `char.marcosExtraMestre`, soma direto no saldo (`marcosDisponiveisCriacao`), e a linha "Disponíveis" agora mostra o detalhamento (`X do título + Y do Mestre`).
- **Sobrevivente Básico agora mostra as abas Bazar e Prévia da Ficha** (antes o passo "Bônus do Título" ficava totalmente vazio pra esse título, só com um aviso). As abas de item (Arma(s), Equipamento(s), Itens Comuns, Item de Combate) continuam ocultas pra ele — Básico não tem bônus fixo — mas passam a aparecer sozinhas se o jogador comprar um "slot" correspondente no Bazar (ver seção acima), já que aí o limite da categoria deixa de ser zero.
- **Plano para os próximos títulos**: em vez de implementar Caçador/Predador/Lenda agora, escrevi um checklist detalhado em `Instruções do Site.md` (seção "Ferramenta Interativa — Criação de Personagem" → "Checklist para habilitar cada título pendente") — o backend já tem os dados prontos pros 4 títulos, falta só testar cada um no frontend porque cada um exercita um caminho de código que o Veterano da Zona não cobriu sozinho (Aprimoramentos no Caçador, Bônus Extra arma-ou-equipamento no Predador, Item Especial + Munição Extra automática + Bônus Extra de aprimoramentos na Lenda). Um título de cada vez, na ordem da tabela de status.

### Corrige furo de duplicação (Perícias/Talentos comprados no Bazar) + aba "Item Raro" + bug do Sobrevivente Básico

- **Perícia/Talento comprado no Bazar agora trava a escolha livre correspondente**: antes, comprar uma perícia (ou usar o talento exclusivo do Antecedente) no Bazar não impedia escolher a *mesma* perícia/talento de graça nos passos Perícias/Talentos — o jogador não perdia o bônus (o sistema usa o maior dos dois, não soma), mas "gastava" à toa um dos picks livres sem perceber, e um Talento comprado duas vezes chegava **duplicado** na ficha final (`talentos_lista` sem dedupe). Agora perícias/talentos já obtidos no Bazar aparecem travados nesses passos com badge dourado "BAZAR" (mesmo tratamento visual que perícias do Antecedente já tinham com "ANT").
- **Nova aba "Item Raro"** no passo "Bônus do Título", no mesmo esquema de "Itens Comuns"/"Item de Combate": comprar "Item Raro" no Bazar (15 MN) não gera mais um item genérico solto — abre/aumenta uma aba própria de escolha real no catálogo de Itens Especiais Raros (o mesmo catálogo que a Lenda da Zona usa no "Item Especial").
- **Bug corrigido**: quando o Sobrevivente Básico ganhou as abas Bazar/Prévia (mudança anterior), o `buildFicha()` continuava só aplicando as escolhas de Itens Comuns/Combate/Raros quando `tituloHabilitado` era verdadeiro — que nunca é o caso pro Básico. Ou seja, um jogador de Sobrevivente Básico podia comprar um slot e escolher um item no catálogo, e essa escolha sumia silenciosamente ao gerar a ficha. Corrigido (guard agora inclui `isBasico`).

### Aba "Prévia" vira gerenciador de equipamento (Antecedente + Título + Bazar juntos)

Antes, a aba "Prévia da Ficha" só mostrava o que tinha sido escolhido *no passo atual* (armas/equipamentos do Título/Bazar) — as armas e equipamentos que vêm do **Antecedente** (ex.: a arma inicial, "Jaqueta de Couro", "Calças Militar") não apareciam em lugar nenhum antes de gerar a ficha, e não tinha como saber se dois itens de origens diferentes eram na prática a mesma coisa (ex.: duas peças de perna concedidas por fontes diferentes).

Agora a aba "Prévia" mostra uma lista única de **todas** as armas e equipamentos (Antecedente + Título + Bazar), cada um com:
- **Badge de origem** (Antecedente/Título/Bazar) e um badge **"Duplicado"** quando o mesmo nome aparece mais de uma vez na lista.
- Botão **Guardar/Equipar**: manda o item pro inventário (deixa de contar como equipado — perde o bônus de Defesa/Carga e passa a consumir Carga como item solto, mesma regra do capítulo "Cargas" que já existia) ou traz de volta a ficar equipado.
- Botão **✕ Remover**: descarta o item por completo (com opção de "Restaurar" depois, caso tenha sido sem querer).

**Como foi implementado**: a resolução do pacote (Antecedente + Título + Bazar) que antes só rodava dentro do `buildFicha()` foi extraída pra uma função `resolverEquipamentoBase()`, chamada tanto na aba Prévia (pra montar a lista e detectar duplicatas) quanto dentro do `buildFicha()` final — evita duplicar a lógica. Cada nota de proteção/transporte ganhou um campo `_origem` (gravado por `aplicarOpcaoPacote(op, pac, origem)`, que agora aceita a origem como parâmetro opcional). As decisões de guardar/remover ficam em `char.gearGuardado`/`char.gearRemovido` (chaves `tipo:nome:índice`) e são aplicadas como um passo final antes de calcular Defesa (CA)/Carga.

**Limitação consciente de escopo**: a arma principal do Antecedente (a que vem em "Arma Primária") **não** entra nesse gerenciador — continua sempre equipada, como já era. Só as armas *extras* (Título/Bazar) e os itens de proteção/transporte (de qualquer origem) participam do guardar/remover, porque a ficha só tem um slot de "arma equipada principal" mesmo.

### Dados de "Combo" dos equipamentos (backend)

Vários itens de Proteção/Transporte têm um campo `combo` no catálogo (ex.: "Calças Moletom" combina com "Tenis de Corrida", "Botas de Combate" combina com "Calças Táticas ou Calças Balístico") que existia nos dados mas nunca era exposto pro frontend — `_equip_estruturado()` (backend, `character_builder.py`) simplesmente descartava o campo. Corrigido numa única função: agora aparece como uma linha "Combo" no `dados` do item, o que significa que já aparece automaticamente em **todo lugar** que já renderiza esses dados — tooltip dos pickers, cards da aba Prévia e as notas de Proteção/Transporte na Ficha de Personagem — sem precisar mexer no frontend.

### Todos os 4 Títulos de Sobrevivência avançados habilitados

`TITULOS_HABILITADOS` agora inclui Veterano da Zona, Caçador de Ruínas, Predador do Apocalipse e Lenda da Zona (só Sobrevivente Básico continua sendo um caso à parte, por natureza não ter bônus fixo). Antes de habilitar Caçador/Predador/Lenda, revisei o código dos caminhos que cada um exercita e que o Veterano nunca tinha testado (aba Aprimoramento(s), aba Bônus Extra, aba Item Especial, Munição Extra automática) — achei e corrigi 2 bugs nesse processo:
- **Item Especial (Lenda)**: trocar entre "2 Raros" e "1 Super Raro" não limpava as escolhas já feitas no modo anterior, o que podia travar o limite do novo modo com seleções "fantasma" que não apareciam mais na lista. Corrigido — trocar o tipo agora reseta as escolhas.
- **Aba Bônus Extra (Predador/Lenda)**: usava botões simples sem tooltip, diferente das outras abas. Trocado pra reaproveitar o `ItemPicker` (tooltip via portal) usado em todo o resto do passo.

Também conferi diretamente contra o catálogo do backend que os 3 pesos/rifles exclusivos da Lenda da Zona (Revolver Pesado, Fuzil de Precisão Automático, Metralhadora) têm o tipo de munição corretamente cadastrado (`Pesada`/`Longa`), então a Munição Extra automática do título vai resolver certo.

**Importante**: como não há ferramenta de automação de navegador neste ambiente, Caçador/Predador/Lenda foram habilitados com base em revisão de código + verificação direta contra os dados do backend, não em teste de clique real (diferente do Veterano, que foi testado no navegador). Vale gerar uma ficha de cada título e conferir visualmente antes de considerar 100% fechado.
