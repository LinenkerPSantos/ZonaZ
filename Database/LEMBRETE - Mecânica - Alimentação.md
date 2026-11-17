# LEMBRETE — Mecânica: acrescentar a regra de Alimentação e ajustar a ficha

Anotado em 30/09/2026. Este arquivo é só um lembrete (não é lido pelo site; o site lê apenas os `.docx`).

## 1. Acrescentar em `Mecânica.docx` (capítulo 4.1 Alimentação)
O texto atual diz que o personagem consome 1 Unidade de Ração por dia e que quem não come perde Determinação e depois Sanidade, mas **não define prazo nem valores**. Falta escrever:

- [ ] **Quando o dia fecha:** em que momento se cobra a refeição (proposta: no fim do dia, antes do descanso longo).
- [ ] **Escolha do jogador:** ao fim do dia, comer ou não comer.
- [ ] **Prazo:** quantos dias sem comer até o primeiro efeito (proposta: 1 dia).
- [ ] **Quanto se perde por dia:** valores de Determinação e de Sanidade (proposta: −1 Determinação por dia; com Determinação em 0, −1 Sanidade; com as duas zeradas, enlouquece).
- [ ] **Sem comida possível:** vale como "não comeu".
- [ ] **Duração da ração:** decidir se continua 1 Ração = 1 dia (como está) ou se passa a durar mais dias (hoje o jogo de PC de teste usa 3 dias). Ajustar `Equipamentos.docx` (Ração MRE e Cartão de Ração) se mudar.
- [ ] **Fome Constante** (sintoma de Infecção): definir o valor "normal" de perda para que o "dobro" faça sentido.
- [ ] Depois de editar o `.docx`, reimportar no site (`python import_to_db.py 2`) para o texto aparecer.

## 2. Ajustar a ficha para esse processo
- [ ] **Ficha do site** (`frontend/src/pages/FichaEmJogo.jsx` e o serviço de fichas no backend): campo para Rações carregadas, dias sem comer, e botão "Comer no fim do dia".
- [ ] **Ficha editável** (`Ficha Editavel Zona Z - v0.15 - Versão Revisada.xlsx` e a pasta `Modelo de Ficha`): linha de controle de alimentação por dia.
- [ ] Mostrar na ficha o efeito de quem não comeu (Determinação/Sanidade e condição Fome).

## 2.1 Regra de teste do jogo de PC (30/09/2026) — "Fadiga Alimentar"
Decidida só para o jogo atual; não substitui a regra do livro até você decidir:
- **Cada Cartão de Ração vale 1 dia de comida.** Come-se uma vez por dia, **sempre no início do dia**; a rotina é ir à fila, trocar o cartão por ração e comer.
- Sem comer: dia 1 **Fraqueza**; dia 2 **Fadiga**; dia 3 Fadiga, −1d6 PV (mínimo 1) e −1 Sanidade; dia 4 em diante Fadiga, **Vulnerável**, −1d6 PV e −1 Sanidade por dia; vida zerada = **Morrendo**.
- Quando o jogo for testado, decidir se esta regra entra no livro (e então ajustar `Mecânica.docx`, `Equipamentos.docx` e a ficha) ou se volta à regra do livro. O livro já diz "1 Unidade de Ração por dia" e que a Ração MRE gera 1 unidade, então "1 cartão = 1 dia" é compatível: só muda o cartão ser a moeda.

## 3. Onde a regra já está
- Jogo de PC de teste (`Jogo Teste`): implementada, com penalidades diferentes das do livro (Fome, PV, Sanidade). Alinhar com o livro quando as decisões acima forem tomadas. Detalhes em `Roteiro/_Arquivos de Controle/mecanicas.md`.

---

# CHECKLIST — O que não está definido na Alimentação
Preencha a linha **Decisão** de cada item. Quando tudo estiver marcado, o texto vai para `Mecânica.docx`, a ficha e o jogo de PC.

### Tempo e momento
- [x] **1. Quando o dia fecha?** (decidido: a refeição é no **início** do dia) (fim do dia / descanso longo / meia-noite / ao trocar de cena)
  - Proposta: fim do dia, antes do descanso longo.
  - Decisão: ______________________
- [ ] **2. Quem decide comer ou não?** (o jogador escolhe / é automático se houver comida)
  - Proposta: o jogador escolhe ao fim do dia.
  - Decisão: ______________________
- [ ] **3. Refeição em marcha (deslocamento) conta para a meta do dia?** O livro diz que sim, sob autorização do Mestre. Como funciona no jogo de PC?
  - Decisão: ______________________

### Prazo e custo de não comer
- [ ] **4. Quantos dias sem comer até o primeiro efeito?**
  - Proposta: 1 dia.
  - Decisão: ______________________
- [ ] **5. Quanto se perde de Determinação por dia sem comer?**
  - Proposta: −1 por dia.
  - Decisão: ______________________
- [ ] **6. Quando começa a perder Sanidade?** (só com Determinação em 0, como no livro)
  - Proposta: com Determinação em 0, −1 Sanidade por dia.
  - Decisão: ______________________
- [ ] **7. O que acontece com Determinação e Sanidade ambas em 0?** O livro diz "enlouquece".
  - Proposta: fim de jogo por loucura (já existe no motor).
  - Decisão: ______________________
- [ ] **8. Fome como condição (−1d6 em testes) entra quando?** Logo no 1º dia ou só depois de X dias?
  - Decisão: ______________________
- [ ] **9. Perde PV por fome?** O livro não diz. (hoje o jogo de PC de teste tira PV a partir do 2º dia)
  - Decisão: ______________________
- [ ] **10. Como recuperar?** Comer tira a condição Fome e recupera Determinação/Sanidade perdidas, ou só para de perder?
  - Decisão: ______________________

### Comida e ração
- [x] **11. Duração de uma ração:** 1 Ração = 1 dia, e cada Cartão de Ração também vale 1 dia (decidido em 30/09/2026 para o jogo de PC).
  - Decisão: ______________________
- [ ] **12. Sem comida possível:** vale como "não comeu"? Há alternativa (alimentos estragados, ração animal, forrageamento) e com que teste?
  - Decisão: ______________________
- [ ] **13. Ração Nutritiva (2 unidades):** dura 2 dias ou serve 2 refeições no mesmo dia?
  - Decisão: ______________________
- [ ] **14. Preparo obrigatório:** no jogo de PC, o preparo (Kit de Culinária, fogo, água) é exigido ou simplificado?
  - Decisão: ______________________
- [ ] **15. Água e sede:** entra no mesmo controle diário ou fica fora por enquanto?
  - Decisão: ______________________

### Sintomas e talentos que mexem na regra
- [ ] **16. Fome Constante (Infecção, sintoma 9):** qual é a perda "normal" cujo dobro vale sem as 2 rações?
  - Decisão: ______________________
- [ ] **17. Falta de Apetite (Infecção, sintoma 20):** como conviver com o teste de Determinação CD12 para comer num sistema de escolha diária?
  - Decisão: ______________________
- [ ] **18. Talentos de refeição** ("Banquete de sobrevivência": recupera 1 atributo ou Determinação ao fazer uma refeição; "Golpe de Sorte Alimentar"): valem quando no fim do dia?
  - Decisão: ______________________

### Ficha e jogo
- [ ] **19. Campos da ficha:** Rações carregadas, dias sem comer, refeição de hoje (feita/não feita).
  - Decisão: ______________________
- [ ] **20. O jogador vê o contador de dias sem comer, ou fica oculto (só sente o efeito)?**
  - Decisão: ______________________
- [ ] **21. Onde o fim do dia aparece na campanha?** O Ato I (Prólogo a 1.6) não diz quantos dias passam. Quais cenas encerram um dia?
  - Decisão: ______________________
- [ ] **22. Quantas rações cada sobrevivente começa?** Hoje: 3 na ficha (+1 ao trocar o cartão na 1.1).
  - Decisão: ______________________
