# Prompts Leonardo.ai — Bestiário Zona-Z

Prompts prontos para gerar a arte de todas as 44 ameaças do jogo (zumbis, humanos e animais), com uma direção de arte unificada: **HQ sombria estilo Sandman** (Neil Gaiman) — tinta cruzada (cross-hatching), paleta dessaturada com poucos acentos de cor, luz dramática (claro-escuro), textura pintada/entintada, nada de traço limpo de anime ou 3D.

Os prompts estão em **inglês** (Leonardo.ai responde muito melhor em inglês — mais fidelidade de estilo e menos erros de interpretação). As instruções e observações estão em português.

> Como usar: copie o "Prompt Positivo" inteiro de cada criatura para o campo de prompt, e o "Prompt Negativo Padrão" (seção abaixo) para o campo de negative prompt — ele serve para **todas** as criaturas, não precisa trocar a cada geração.

---

## 1. Estilo Visual — a fórmula usada em todo prompt

Todo prompt de criatura segue esta estrutura:

`[criatura + 2-4 detalhes visuais únicos dela] + [sufixo de estilo fixo]`

O **sufixo de estilo fixo** (sempre igual, para manter consistência visual entre as 44 imagens):

```
dark gothic comic book illustration, in the style of Neil Gaiman's The Sandman graphic novel, moody cross-hatched ink linework, painterly desaturated color palette with deep blacks and muted selective color accents, dramatic chiaroscuro lighting, gritty post-apocalyptic ruins atmosphere, unsettling horror mood, detailed textured linework, high contrast, cinematic framing, 2D comic book illustration, single creature, full body
```

Mantenha esse trecho **idêntico** em todos os prompts — é o que garante que as 44 criaturas pareçam parte do mesmo livro/bestiário, em vez de estilos diferentes a cada geração.

---

## 2. Configurações Recomendadas no Leonardo.ai

> **Nota sobre a interface:** o Leonardo.ai mudou os controles nos modelos mais novos (Phoenix). Os nomes antigos "Alchemy", "Prompt Magic" e "Guidance Scale" não aparecem mais como opções separadas no Phoenix — a tabela abaixo já usa os nomes atuais da interface (validado contra a documentação oficial em [docs.leonardo.ai/docs/phoenix](https://docs.leonardo.ai/docs/phoenix)).

| Configuração | Valor recomendado | Por quê |
|---|---|---|
| **Modelo** | Phoenix 1.0 | Melhor fidelidade a prompts longos e detalhados. Evite modelos "Anime" ou focados em PhotoReal. |
| **Style** | `Illustration` (ou `Dark Fantasy`, se existir na lista do modelo escolhido) | Empurra a geração para o lado pintado/sombrio, evitando o look "capa de jogo mobile". |
| **Prompt Enhance** | **Desligado (Off)** | No Phoenix, essa opção reescreve seu prompt via IA antes de gerar. Como os prompts abaixo já são detalhados e específicos por criatura, deixe desligado para não perder controle fino. |
| **Contrast** | **High** | Substitui o antigo slider de Alchemy/Guidance — reforça o claro-escuro pesado característico do Sandman. |
| **Generation Mode** | **Quality** | No Phoenix, o modo Quality já ativa o equivalente ao antigo "Alchemy" (pipeline de renderização premium) — não existe mais um toggle de Alchemy separado. |
| **Image Dimensions** | Retrato (2:3) — ex: 1248×1872 (Medium) | Enquadramento vertical, melhor para personagem/criatura de corpo inteiro em ficha de bestiário. |
| **Number of generations** | 4 | Gere 4 e escolha a melhor — variação natural do modelo, sem gastar créditos extras em regeneração. |

### Consistência entre as 44 imagens

Duas formas de manter todas as criaturas com a "mesma mão" de ilustrador:

1. **Seed fixa**: gere a primeira criatura, guarde o *seed* usado, e reutilize esse mesmo seed (ou um seed próximo, ±1) nas gerações seguintes. Isso trava composição/estilo, deixando só o prompt mudar o conteúdo.
2. **Style Reference / Image Guidance**: depois de gerar 1-2 imagens que ficaram com a cara certa, suba uma delas como **imagem de referência de estilo** (campo "Style Reference" no Leonardo) nas gerações seguintes, com peso (influence) de ~40-60%. Isso ajuda muito mais que só repetir palavras de estilo no texto.

---

## 3. Prompt Negativo Padrão (usar em todas as gerações)

> **Limite do Leonardo.ai:** o campo de prompt negativo aceita cerca de **1000 caracteres**. Se você colar o padrão abaixo + o extra de uma criatura + termos seus (tipo "armor"), pode passar do limite e a geração falha silenciosamente ("prompt muito grande", sem imagem). Por isso o padrão abaixo foi enxugado para deixar folga. Regras:
> - Use o padrão + **no máximo um** bloco extra por vez (o da criatura que você está gerando). Não empilhe o extra de zumbi com o de Alice, por exemplo.
> - Se ainda cortar, é sinal de que você somou texto demais — corte por aí primeiro (esses extras já são o essencial).

```
bright colors, cartoon, anime, chibi, 3d render, photorealistic, plastic skin, cute, clean, pristine, blurry, watermark, text, logo, signature, extra limbs, deformed hands, bad anatomy, low quality, oversaturated, glossy, video game render, pixar style, smiling, comedic, overexposed, multiple creatures, crowd, national flag, military insignia, real country symbols
```
*(≈365 caracteres — combinado com qualquer extra de criatura fica entre 430-470 caracteres, deixando mais de 500 caracteres de folga para termos seus, ex: os de "armor" que você usou.)*

---

## 4. Zumbis

> **Regra importante:** zumbis atacam com as próprias mãos, garras e mordidas — **nenhum zumbi usa arma**, com uma única exceção de lore: o **Lunático** (seção 4.7), que é descrito no livro como capaz de usar armas de fogo com frieza estratégica. Por isso, todos os prompts abaixo (exceto o do Lunático) já incluem `unarmed, bare hands and teeth, no weapons` — e, para reforçar ainda mais, adicione este trecho extra (curto, ≈50 caracteres) ao Prompt Negativo Padrão ao gerar qualquer zumbi (remova-o só na hora de gerar o Lunático):
>
> ```
> holding a weapon, gun, rifle, pistol, sword, knife in hand
> ```

### 4.1 Caminhantes

#### 🧍‍♂️ Caminhante Comum
**Prompt Positivo:**
```
a slow shambling common zombie, ashen gray decomposing skin, hollow vacant eyes, torn bloodstained civilian clothes, dragging feet, uncoordinated posture, mouth open in a low groan, unarmed, bare hands and teeth, no weapons, dark gothic comic book illustration, in the style of Neil Gaiman's The Sandman graphic novel, moody cross-hatched ink linework, painterly desaturated color palette with deep blacks and muted selective color accents, dramatic chiaroscuro lighting, gritty post-apocalyptic ruins atmosphere, unsettling horror mood, detailed textured linework, high contrast, cinematic framing, 2D comic book illustration, single creature, full body
```

#### 🪖 Caminhante Militar
**Prompt Positivo:**
```
an infected zombie soldier, torn shredded military fatigues, cracked ballistic helmet, damaged tactical vest, heavy mud-and-blood-caked boots, rigid unnatural posture, dead eyes with disturbing tactical discipline, empty hands, unarmed, no weapons, no rifle, no pistol, attacking with bare hands and teeth, plain fatigues with no flags or unit patches, dark gothic comic book illustration, in the style of Neil Gaiman's The Sandman graphic novel, moody cross-hatched ink linework, painterly desaturated color palette with deep blacks and muted selective color accents, dramatic chiaroscuro lighting, gritty post-apocalyptic ruins atmosphere, unsettling horror mood, detailed textured linework, high contrast, cinematic framing, 2D comic book illustration, single creature, full body
```

#### 🥼 Caminhante Incomum
**Prompt Positivo:**
```
a zombie mutated by lab experiments, surgical scars, ruptured tubes still embedded in decaying flesh, bluish chemical burn patches on skin, fluids leaking from open wounds, glowing yellowish-red turbid eyes, erratic jittering posture, unarmed, bare hands and teeth, no weapons, dark gothic comic book illustration, in the style of Neil Gaiman's The Sandman graphic novel, moody cross-hatched ink linework, painterly desaturated color palette with deep blacks and muted selective color accents, dramatic chiaroscuro lighting, gritty post-apocalyptic ruins atmosphere, unsettling horror mood, detailed textured linework, high contrast, cinematic framing, 2D comic book illustration, single creature, full body
```

### 4.2 Corredores

#### 🌀 Corredor Desorientado
**Prompt Positivo:**
```
a blind feral zombie runner, empty crusted eye sockets, deep self-inflicted scratch marks on the face, gaunt tense trembling body, violently lurching mid-sprint toward a sound, convulsive posture, unarmed, bare hands and teeth, no weapons, dark gothic comic book illustration, in the style of Neil Gaiman's The Sandman graphic novel, moody cross-hatched ink linework, painterly desaturated color palette with deep blacks and muted selective color accents, dramatic chiaroscuro lighting, gritty post-apocalyptic ruins atmosphere, unsettling horror mood, detailed textured linework, high contrast, cinematic framing, 2D comic book illustration, single creature, full body
```

#### 🔥 Corredor Agressivo
**Prompt Positivo:**
```
a furious sprinting zombie, bulging veins, bloodshot enraged eyes, torn skin exposing tensed muscle, shattered teeth bared in a snarl, mid-lunge violent charging pose, fresh blood splatter trail, unarmed, bare hands and teeth, no weapons, dark gothic comic book illustration, in the style of Neil Gaiman's The Sandman graphic novel, moody cross-hatched ink linework, painterly desaturated color palette with deep blacks and muted selective color accents, dramatic chiaroscuro lighting, gritty post-apocalyptic ruins atmosphere, unsettling horror mood, detailed textured linework, high contrast, cinematic framing, 2D comic book illustration, single creature, full body
```

#### 🗣️ Corredor Uivante
**Prompt Positivo:**
```
a zombie with a grotesquely deformed throat mid-howl, torn swollen neck with bulging dark veins, mouth stretched unnaturally wide releasing a piercing scream, gaunt frantic running stance, unarmed, bare hands and teeth, no weapons, dark gothic comic book illustration, in the style of Neil Gaiman's The Sandman graphic novel, moody cross-hatched ink linework, painterly desaturated color palette with deep blacks and muted selective color accents, dramatic chiaroscuro lighting, gritty post-apocalyptic ruins atmosphere, unsettling horror mood, detailed textured linework, high contrast, cinematic framing, 2D comic book illustration, single creature, full body
```

### 4.3 Encorraçados

#### 🩸 Encorraçado Pele Grossa
**Prompt Positivo:**
```
a hulking armored zombie with leathery cracked hide, dried coagulated blood stains, swollen rigid musculature under stone-like skin, sunken opaque eyes radiating brute fury, heavy immovable stance, unarmed, bare hands, no weapons, dark gothic comic book illustration, in the style of Neil Gaiman's The Sandman graphic novel, moody cross-hatched ink linework, painterly desaturated color palette with deep blacks and muted selective color accents, dramatic chiaroscuro lighting, gritty post-apocalyptic ruins atmosphere, unsettling horror mood, detailed textured linework, high contrast, cinematic framing, 2D comic book illustration, single creature, full body
```

#### ❄️ Encorraçado Congelado
**Prompt Positivo:**
```
a cryogenically frozen zombie, ice fragments encasing limbs and torso, blue rigid frostbitten skin fused with crystalline plates, blackened frozen blood seeping from cracked frozen wounds, unnatural cold mist swirling around it, unarmed, bare hands, no weapons, dark gothic comic book illustration, in the style of Neil Gaiman's The Sandman graphic novel, moody cross-hatched ink linework, painterly desaturated color palette with deep blacks and muted selective color accents, dramatic chiaroscuro lighting, gritty post-apocalyptic ruins atmosphere, unsettling horror mood, detailed textured linework, high contrast, cinematic framing, 2D comic book illustration, single creature, full body
```

#### 🔥 Encorraçado Antichamas
**Prompt Positivo:**
```
a fire-resistant armored zombie, charred melted fireproof suit fused into scarred flesh, hardened blisters and burned blackened skin, walking slow and unstoppable through flames and embers, glowing embers on the ground, unarmed, bare hands, no weapons, dark gothic comic book illustration, in the style of Neil Gaiman's The Sandman graphic novel, moody cross-hatched ink linework, painterly desaturated color palette with deep blacks and muted selective color accents, dramatic chiaroscuro lighting, gritty post-apocalyptic ruins atmosphere, unsettling horror mood, detailed textured linework, high contrast, cinematic framing, 2D comic book illustration, single creature, full body
```

#### 🦍 Encorraçado Bruto
**Prompt Positivo:**
```
a colossal hulking brute zombie, massive torn muscle mass, thick scarred hide, bulging veins, crushing everything in its path, unstoppable heavy-footed advance cracking the ground, unarmed, bare hands, no weapons, dark gothic comic book illustration, in the style of Neil Gaiman's The Sandman graphic novel, moody cross-hatched ink linework, painterly desaturated color palette with deep blacks and muted selective color accents, dramatic chiaroscuro lighting, gritty post-apocalyptic ruins atmosphere, unsettling horror mood, detailed textured linework, high contrast, cinematic framing, 2D comic book illustration, single creature, full body
```

### 4.4 Rastejantes

> **Regra importante:** os Rastejantes não têm pernas funcionais — ou não têm pernas nenhuma (só a metade de cima do corpo), ou as pernas estão destruídas/mutiladas em tocos, por isso se arrastam usando só os braços. Nas gerações que vi, o modelo sempre desenhou pernas inteiras e intactas — reforce isso no negativo (curto, ≈35 caracteres) ao gerar estas duas criaturas:
>
> ```
> intact legs, walking, standing on feet
> ```

#### 🪦 Rastejante Flagelado
**Prompt Positivo:**
```
a mutilated crawling zombie, upper body torso only dragging itself across the ground with bare arms, legs completely missing or reduced to torn destroyed stumps, exposed bones and torn shredded flesh scraping the floor, emerging from a dark narrow gap or duct, ambush predator pose, unarmed, bare hands and teeth, no weapons, dark gothic comic book illustration, in the style of Neil Gaiman's The Sandman graphic novel, moody cross-hatched ink linework, painterly desaturated color palette with deep blacks and muted selective color accents, dramatic chiaroscuro lighting, gritty post-apocalyptic ruins atmosphere, unsettling horror mood, detailed textured linework, high contrast, cinematic framing, 2D comic book illustration, single creature, no legs
```

#### 🦿 Rastejante Saltador
**Prompt Positivo:**
```
a deformed zombie with disproportionately overdeveloped muscular arms adapted for brutal leaping, legs completely missing or reduced to torn destroyed stumps, propelling itself using only its powerful arms, half-crawling half-predatory grotesque posture, crouched in shadows ready to pounce, unarmed, bare hands and teeth, no weapons, dark gothic comic book illustration, in the style of Neil Gaiman's The Sandman graphic novel, moody cross-hatched ink linework, painterly desaturated color palette with deep blacks and muted selective color accents, dramatic chiaroscuro lighting, gritty post-apocalyptic ruins atmosphere, unsettling horror mood, detailed textured linework, high contrast, cinematic framing, 2D comic book illustration, single creature, no legs
```

### 4.5 Bombs

#### 🧫 Bomb Poroso
**Prompt Positivo:**
```
a bloated infected zombie covered in translucent pulsating pustules, skin rupturing in small tears releasing foul vapor and infectious particles, unstable swollen body about to burst, clumsy staggering walk, unarmed, bare hands, no weapons, dark gothic comic book illustration, in the style of Neil Gaiman's The Sandman graphic novel, moody cross-hatched ink linework, painterly desaturated color palette with deep blacks and muted selective color accents, dramatic chiaroscuro lighting, gritty post-apocalyptic ruins atmosphere, unsettling horror mood, detailed textured linework, high contrast, cinematic framing, 2D comic book illustration, single creature, full body
```

#### 🚑 Bomb Paramédico
**Prompt Positivo:**
```
a zombie grotesquely fused with paramedic equipment, defibrillator cables tangled into rotting flesh, rusted tanks strapped to its back, electrical burn marks pulsing with occasional sparks, unstable staggering advance, unarmed, bare hands, no weapons, dark gothic comic book illustration, in the style of Neil Gaiman's The Sandman graphic novel, moody cross-hatched ink linework, painterly desaturated color palette with deep blacks and muted selective color accents, dramatic chiaroscuro lighting, gritty post-apocalyptic ruins atmosphere, unsettling horror mood, detailed textured linework, high contrast, cinematic framing, 2D comic book illustration, single creature, full body
```

#### 🧪 Bomb Cheiroso
**Prompt Positivo:**
```
a chemically decomposing zombie leaking thick greenish toxic smoke, skin melting off in plates, releasing corrosive fumes with every rupture, slow uncoordinated staggering movement, unarmed, bare hands, no weapons, dark gothic comic book illustration, in the style of Neil Gaiman's The Sandman graphic novel, moody cross-hatched ink linework, painterly desaturated color palette with deep blacks and muted selective color accents, dramatic chiaroscuro lighting, gritty post-apocalyptic ruins atmosphere, unsettling horror mood, detailed textured linework, high contrast, cinematic framing, 2D comic book illustration, single creature, full body
```

### 4.6 Mutantes

#### 🧟‍♂️ Mutante Caminhante (Duocefálico)
**Prompt Positivo:**
```
a disturbing two-headed zombie mutation, both heads facing opposite directions moaning out of sync, heightened unnatural awareness, grotesque asymmetrical anatomy, unarmed, bare hands and teeth, no weapons, dark gothic comic book illustration, in the style of Neil Gaiman's The Sandman graphic novel, moody cross-hatched ink linework, painterly desaturated color palette with deep blacks and muted selective color accents, dramatic chiaroscuro lighting, gritty post-apocalyptic ruins atmosphere, unsettling horror mood, detailed textured linework, high contrast, cinematic framing, 2D comic book illustration, single creature, full body
```

#### 🏃‍♂️ Mutante Corredor (Felídeo)
**Prompt Positivo:**
```
a feline mutant zombie runner, elongated hind legs, taut predatory muscles, fluid animalistic crouched sprinting posture, arched spine, wild feral eyes locked on prey, unarmed, bare claws and teeth, no weapons, dark gothic comic book illustration, in the style of Neil Gaiman's The Sandman graphic novel, moody cross-hatched ink linework, painterly desaturated color palette with deep blacks and muted selective color accents, dramatic chiaroscuro lighting, gritty post-apocalyptic ruins atmosphere, unsettling horror mood, detailed textured linework, high contrast, cinematic framing, 2D comic book illustration, single creature, full body
```

#### 🪨 Mutante Encorraçado (Colosso)
**Prompt Positivo:**
```
a towering three-meter-tall armored mutant colossus zombie, thick prehistoric-hide-like scarred skin, hypertrophied crushing muscles, smashing through debris, ground-shaking heavy stomping stride, terrifying massive silhouette, unarmed, bare hands, no weapons, dark gothic comic book illustration, in the style of Neil Gaiman's The Sandman graphic novel, moody cross-hatched ink linework, painterly desaturated color palette with deep blacks and muted selective color accents, dramatic chiaroscuro lighting, gritty post-apocalyptic ruins atmosphere, unsettling horror mood, detailed textured linework, high contrast, cinematic framing, 2D comic book illustration, single creature, full body
```

#### 🧠 Mutante Rastejante (Aberração Tentacular)
**Prompt Positivo:**
```
a grotesque tentacular mutant abomination crawling low to the ground, multiple elongated clawed arms sprouting asymmetrically, disfigured mass of limbs dragging across the floor, patient predatory stillness, unarmed, no weapons, attacking with bone claws only, dark gothic comic book illustration, in the style of Neil Gaiman's The Sandman graphic novel, moody cross-hatched ink linework, painterly desaturated color palette with deep blacks and muted selective color accents, dramatic chiaroscuro lighting, gritty post-apocalyptic ruins atmosphere, unsettling horror mood, detailed textured linework, high contrast, cinematic framing, 2D comic book illustration, single creature, full body
```

#### 💥 Mutante HyperBomb
**Prompt Positivo:**
```
a horrifying unstable mutant zombie with a misshapen body covered in pulsating inflamed bulges, three glowing reddish organic explosive cores embedded in its right eye socket and shoulders, throbbing like exposed hearts, heat haze and acrid smoke around it, unarmed, bare hands, no weapons, dark gothic comic book illustration, in the style of Neil Gaiman's The Sandman graphic novel, moody cross-hatched ink linework, painterly desaturated color palette with deep blacks and muted selective color accents, dramatic chiaroscuro lighting, gritty post-apocalyptic ruins atmosphere, unsettling horror mood, detailed textured linework, high contrast, cinematic framing, 2D comic book illustration, single creature, full body
```

### 4.7 Conscientes

> **Regra importante:** os Conscientes mantêm a inteligência e por isso passam quase por humanos — **nada** de visual de zumbi/monstro (sem pele apodrecida, sem postura agachada/rosnando, sem olhos brilhantes ou vermelhos, sem presas). Eles devem ficar **parados, em pé, com postura humana normal**, num canto escuro — só a palidez leve e o olhar meio parado entregam que tem algo errado. A primeira geração do Imitador saiu com pose de monstro agachado e olhos vermelhos brilhantes (veja print) mesmo com o prompt pedindo aparência humana — por isso o negativo abaixo ficou mais forte, use sempre:
>
> ```
> glowing eyes, red eyes, fangs, claws, crouching, hunched, prowling, feral stance, vampire, monster face, rotting flesh, exposed bone, gore, decayed skin, shambling zombie
> ```

#### 🎭 Imitador
**Prompt Positivo:**
```
an ordinary-looking man standing completely still and upright in a dark shadowed corner, normal human body, normal human eyes with natural color and no glow, only a faint sickly pallor to the skin hints something is wrong, calm and quiet, occasionally mimicking a human voice crying for help, unsettling stillness, not crouching, not hunched, not baring teeth, unarmed, no weapons, dark gothic comic book illustration, in the style of Neil Gaiman's The Sandman graphic novel, moody cross-hatched ink linework, painterly desaturated color palette with deep blacks and muted selective color accents, dramatic chiaroscuro lighting, gritty post-apocalyptic ruins atmosphere, unsettling horror mood, detailed textured linework, high contrast, cinematic framing, 2D comic book illustration, single creature, full body, ordinary human appearance, standing still
```

#### 🔪 Lunático
**Prompt Positivo:**
```
an ordinary-looking man standing calmly like a normal survivor, worn practical clothing, normal human eyes with natural color and no glow, only a faint pale undertone to the skin, unsettlingly calm and composed expression, disturbing satisfied smile, holding a firearm with cold strategic precision, not crouching, not hunched, dark gothic comic book illustration, in the style of Neil Gaiman's The Sandman graphic novel, moody cross-hatched ink linework, painterly desaturated color palette with deep blacks and muted selective color accents, dramatic chiaroscuro lighting, gritty post-apocalyptic ruins atmosphere, unsettling horror mood, detailed textured linework, high contrast, cinematic framing, 2D comic book illustration, single creature, full body, ordinary human appearance, standing still
```
> **Exceção à regra "sem armas":** o Lunático é o único zumbi do jogo descrito capaz de usar armas de fogo com frieza estratégica — por isso, e só nesse caso, **não** adicione o negativo extra de armas da seção 4 ao gerar esta criatura.

#### 🧢 Líderes
**Prompt Positivo:**
```
a gaunt pale-skinned figure standing completely still, unnervingly upright and rigidly controlled posture, normal human eyes with natural color and no glow, silently watching a battlefield, one arm raised gesturing a silent unheard command to a horde, not crouching, not hunched, not baring teeth, unarmed, bare hands, no weapons, dark gothic comic book illustration, in the style of Neil Gaiman's The Sandman graphic novel, moody cross-hatched ink linework, painterly desaturated color palette with deep blacks and muted selective color accents, dramatic chiaroscuro lighting, gritty post-apocalyptic ruins atmosphere, unsettling horror mood, detailed textured linework, high contrast, cinematic framing, 2D comic book illustration, single creature, full body, standing still
```

#### 🐇 Alice
**Prompt Positivo:**
```
an unsettling uncanny entity resembling an ordinary young girl, standing completely still in a tattered old dress, near-human features, normal human eyes with natural color and no glow, only an unnervingly fixed, unblinking stare, an unnatural fractured smile, standing in an eerie dark abandoned warehouse, faint ghostly glow in the air around her (not in her eyes) as toxic neuroactive pheromones distort the air, her cast shadow on the wall behind her is twisted and monstrous, a huge clawed inhuman silhouette that does not match her small girl-like body, revealing her true monstrous nature only through the shadow, disturbing horror monster NOT a real child, uncanny valley, unarmed, no weapons, dark gothic comic book illustration, in the style of Neil Gaiman's The Sandman graphic novel, moody cross-hatched ink linework, painterly desaturated color palette with deep blacks and muted selective color accents, dramatic chiaroscuro lighting, unsettling horror mood, detailed textured linework, high contrast, cinematic framing, 2D comic book illustration, single creature, full body, fully clothed, modest tattered vintage dress, standing still
```
**Observação de segurança:** Alice é descrita no livro como uma entidade sobrenatural com aparência de criança, usada como armadilha psicológica — um monstro, não uma criança de verdade. O prompt acima foi escrito propositalmente para reforçar isso ("horror monster NOT a real child", "uncanny valley", "fully clothed, modest") e evitar qualquer resultado sexualizado ou inadequado. Use o negativo extra abaixo (não empilhe com o extra de zumbi/rastejante) e revise manualmente as imagens geradas antes de usar.

**Prompt Negativo adicional para Alice (≈115 caracteres — use no lugar do extra de zumbi, não junto):**
```
sexualized, suggestive, revealing clothing, provocative pose, realistic child, beautiful, seductive
```

---

## 5. Confrontos com Humanos

> **Regra importante:** estes são humanos comuns e cansados, não super-heróis nem vilões de HQ de ação — corpo mediano (nada de fisiculturista), sem pintura facial tipo caveira, sem pose "badass" de capa de jogo. Eles também devem carregar **só a arma/item citado no prompt**, nada de arsenal — sem coldres/bandoleiras/múltiplas armas penduradas ao mesmo tempo. Use este extra no negativo para todos os prompts desta seção:
>
> ```
> bodybuilder physique, bulging muscles, skull face paint, skull mask, superhero pose, supervillain, action figure, glowing effects, unrealistic proportions, cool badass pose, excessive gear, multiple weapons, weapon arsenal, bandolier, heavily strapped tactical harness, overloaded with equipment
> ```

### 5.1 Inimigos Básicos

#### Bandidos Errantes
**Prompt Positivo:**
```
a grizzled wasteland raider, average ordinary body build, gaunt tired face, dirty patched-up clothing, only a single compact pistol and no other weapons or extra gear, cold precise predatory stance near a roadside ambush, dark gothic comic book illustration, in the style of Neil Gaiman's The Sandman graphic novel, moody cross-hatched ink linework, painterly desaturated color palette with deep blacks and muted selective color accents, dramatic chiaroscuro lighting, gritty post-apocalyptic ruins atmosphere, unsettling horror mood, detailed textured linework, high contrast, cinematic framing, 2D comic book illustration, single character, full body
```

#### Civil
**Prompt Positivo:**
```
a desperate untrained civilian survivor, average ordinary body build, ragged improvised clothing, only a single makeshift short sickle and nothing else, fearful yet reckless posture caught between fleeing and attacking, dark gothic comic book illustration, in the style of Neil Gaiman's The Sandman graphic novel, moody cross-hatched ink linework, painterly desaturated color palette with deep blacks and muted selective color accents, dramatic chiaroscuro lighting, gritty post-apocalyptic ruins atmosphere, unsettling horror mood, detailed textured linework, high contrast, cinematic framing, 2D comic book illustration, single character, full body
```

#### Civil com Cão de Caça
**Prompt Positivo:**
```
a wary civilian survivor, average ordinary body build, gripping only a single light rifle and no other gear, standing beside an aggressive lean hunting dog straining at the ready, both alert and tense, improvised leather jacket, dark gothic comic book illustration, in the style of Neil Gaiman's The Sandman graphic novel, moody cross-hatched ink linework, painterly desaturated color palette with deep blacks and muted selective color accents, dramatic chiaroscuro lighting, gritty post-apocalyptic ruins atmosphere, unsettling horror mood, detailed textured linework, high contrast, cinematic framing, 2D comic book illustration, two characters, full body
```

### 5.2 Capuz Branco

#### Guarda de Contenção
**Prompt Positivo:**
```
a disciplined containment city guard soldier, average ordinary body build, steel helmet, standard tactical camouflage jacket, only a single submachine gun and no extra weapons or pouches, held in a rigid formation stance, authoritative but rattled expression, dark gothic comic book illustration, in the style of Neil Gaiman's The Sandman graphic novel, moody cross-hatched ink linework, painterly desaturated color palette with deep blacks and muted selective color accents, dramatic chiaroscuro lighting, gritty post-apocalyptic ruins atmosphere, unsettling horror mood, detailed textured linework, high contrast, cinematic framing, 2D comic book illustration, single character, full body
```

#### Soldado de Elite
**Prompt Positivo:**
```
an elite tactical soldier, average ordinary body build under the coat (not bulky or muscular), wearing an imposing black and white camouflage coat with a distinctive white hood, calculated silent stance, only a single assault rifle held with disciplined precision, no extra strapped weapons or gear, intimidating faceless presence, dark gothic comic book illustration, in the style of Neil Gaiman's The Sandman graphic novel, moody cross-hatched ink linework, painterly desaturated color palette with deep blacks and muted selective color accents, dramatic chiaroscuro lighting, gritty post-apocalyptic ruins atmosphere, unsettling horror mood, detailed textured linework, high contrast, cinematic framing, 2D comic book illustration, single character, full body
```

### 5.3 Piratas do Apocalipse

#### Saqueador Urbano
**Prompt Positivo:**
```
an opportunistic urban scavenger raider, average ordinary body build, patched trench coat, only a single shotgun held loosely and no other visible gear, hungry desperate gaze scanning for an easy target, dark gothic comic book illustration, in the style of Neil Gaiman's The Sandman graphic novel, moody cross-hatched ink linework, painterly desaturated color palette with deep blacks and muted selective color accents, dramatic chiaroscuro lighting, gritty post-apocalyptic ruins atmosphere, unsettling horror mood, detailed textured linework, high contrast, cinematic framing, 2D comic book illustration, single character, full body
```

#### Saqueador Atirador de Elite
**Prompt Positivo:**
```
a cold patient wasteland sniper, average ordinary body build, worn camouflage jacket, combat boots, lying prone atop rubble aiming only a single long precision rifle and no other weapons, empty calculating eyes, dark gothic comic book illustration, in the style of Neil Gaiman's The Sandman graphic novel, moody cross-hatched ink linework, painterly desaturated color palette with deep blacks and muted selective color accents, dramatic chiaroscuro lighting, gritty post-apocalyptic ruins atmosphere, unsettling horror mood, detailed textured linework, high contrast, cinematic framing, 2D comic book illustration, single character, full body
```

### 5.4 Seguidores da Seita Carmesim

#### Cultista da Seita do Sangue
**Prompt Positivo:**
```
a fanatical blood cultist, average ordinary body build, blood-stained ragged tunic, ritualistic symbols painted on the fabric, only a single poisoned curved sickle in hand and nothing else, unsettling calm devotion in the eyes, dark gothic comic book illustration, in the style of Neil Gaiman's The Sandman graphic novel, moody cross-hatched ink linework, painterly desaturated color palette with deep blacks and muted selective color accents, dramatic chiaroscuro lighting, gritty post-apocalyptic ruins atmosphere, unsettling horror mood, detailed textured linework, high contrast, cinematic framing, 2D comic book illustration, single character, full body
```

#### Ocultista Suicida
**Prompt Positivo:**
```
a deranged occultist, average ordinary body build, torn dark ritual robes marked with occult symbols and blood smears, painted marked face, wild maniacal eyes, carrying only a couple of small ritual vials and one improvised weapon, no heavy gear, distorted graceful lunging movement, dark gothic comic book illustration, in the style of Neil Gaiman's The Sandman graphic novel, moody cross-hatched ink linework, painterly desaturated color palette with deep blacks and muted selective color accents, dramatic chiaroscuro lighting, gritty post-apocalyptic ruins atmosphere, unsettling horror mood, detailed textured linework, high contrast, cinematic framing, 2D comic book illustration, single character, full body
```

#### Líder da Seita Carmesim
**Prompt Positivo:**
```
the fanatical leader of a blood cult, average ordinary body build with only subtly elongated limbs, blood-soaked crimson robes over a partially transformed body, black veins pulsing under the skin, feverish glowing eyes, wielding only a single ritual crimson blade and nothing else, commanding terrifying aura, dark gothic comic book illustration, in the style of Neil Gaiman's The Sandman graphic novel, moody cross-hatched ink linework, painterly desaturated color palette with deep blacks and muted selective color accents, dramatic chiaroscuro lighting, gritty post-apocalyptic ruins atmosphere, unsettling horror mood, detailed textured linework, high contrast, cinematic framing, 2D comic book illustration, single character, full body
```

### 5.5 Integrantes da URA

#### Soldado da URA
**Prompt Positivo:**
```
a URA military soldier, average ordinary body build under standard combat armor (not bulky or oversized), standardized tactical uniform, protective mask, only a single assault rifle and no extra strapped weapons or pouches, held with rigid disciplined authority, cold enforcement presence, dark gothic comic book illustration, in the style of Neil Gaiman's The Sandman graphic novel, moody cross-hatched ink linework, painterly desaturated color palette with deep blacks and muted selective color accents, dramatic chiaroscuro lighting, gritty post-apocalyptic ruins atmosphere, unsettling horror mood, detailed textured linework, high contrast, cinematic framing, 2D comic book illustration, single character, full body
```

#### Agente Secreto da URA
**Prompt Positivo:**
```
an infiltrator secret agent, average ordinary body build, discreet dark plain clothing concealing a combat exoskeleton, only a single suppressed heavy revolver in hand and nothing else visible, sharp watchful eyes observing from shadows, unreadable calculating expression, dark gothic comic book illustration, in the style of Neil Gaiman's The Sandman graphic novel, moody cross-hatched ink linework, painterly desaturated color palette with deep blacks and muted selective color accents, dramatic chiaroscuro lighting, gritty post-apocalyptic ruins atmosphere, unsettling horror mood, detailed textured linework, high contrast, cinematic framing, 2D comic book illustration, single character, full body
```

---

## 6. Ameaças do Reino Animal

#### 🐶 Cão Selvagem
**Prompt Positivo:**
```
a feral territorial wild dog, matted filthy fur, ribs showing, bared teeth dripping saliva, snarling mid-charge, wild desperate hunting eyes, dark gothic comic book illustration, in the style of Neil Gaiman's The Sandman graphic novel, moody cross-hatched ink linework, painterly desaturated color palette with deep blacks and muted selective color accents, dramatic chiaroscuro lighting, gritty post-apocalyptic ruins atmosphere, unsettling horror mood, detailed textured linework, high contrast, cinematic framing, 2D comic book illustration, single creature, full body
```

#### 🐍 Cobra Selvagem
**Prompt Positivo:**
```
a venomous ambush snake coiled among rubble and debris, scales textured and dull, mouth open baring fangs, ready to strike, dark gothic comic book illustration, in the style of Neil Gaiman's The Sandman graphic novel, moody cross-hatched ink linework, painterly desaturated color palette with deep blacks and muted selective color accents, dramatic chiaroscuro lighting, gritty post-apocalyptic ruins atmosphere, unsettling horror mood, detailed textured linework, high contrast, cinematic framing, 2D comic book illustration, single creature, full body
```

#### 🪶 Corvos (Enxame)
**Prompt Positivo:**
```
a swarm of black crows converging violently around a corpse, sharp beaks and dark glossy feathers, chaotic mass of wings and shadows, ominous circling flight, dark gothic comic book illustration, in the style of Neil Gaiman's The Sandman graphic novel, moody cross-hatched ink linework, painterly desaturated color palette with deep blacks and muted selective color accents, dramatic chiaroscuro lighting, gritty post-apocalyptic ruins atmosphere, unsettling horror mood, detailed textured linework, high contrast, cinematic framing, 2D comic book illustration, swarm of creatures
```

#### 🦅 Harpia (Ave de Rapina)
**Prompt Positivo:**
```
a large predatory bird of prey diving in a vertical strike, sharp cutting talons extended, fierce piercing eyes, wings spread wide against a gray sky, dark gothic comic book illustration, in the style of Neil Gaiman's The Sandman graphic novel, moody cross-hatched ink linework, painterly desaturated color palette with deep blacks and muted selective color accents, dramatic chiaroscuro lighting, gritty post-apocalyptic ruins atmosphere, unsettling horror mood, detailed textured linework, high contrast, cinematic framing, 2D comic book illustration, single creature, full body
```

#### 🐗 Javali Selvagem ou Infectado
**Prompt Positivo:**
```
an aggressive territorial wild boar, thick bristled hide, sharp tusks, some infected patches of decayed skin, mid-charge with dust kicking up, furious small eyes, dark gothic comic book illustration, in the style of Neil Gaiman's The Sandman graphic novel, moody cross-hatched ink linework, painterly desaturated color palette with deep blacks and muted selective color accents, dramatic chiaroscuro lighting, gritty post-apocalyptic ruins atmosphere, unsettling horror mood, detailed textured linework, high contrast, cinematic framing, 2D comic book illustration, single creature, full body
```

#### 🐆 Onça ou Felino Caçador
**Prompt Positivo:**
```
an agile lethal big cat predator, sleek muscular body low to the ground, spotted or dark rosette-patterned fur, mid-pounce from the shadows, piercing predatory gaze locked on prey, dark gothic comic book illustration, in the style of Neil Gaiman's The Sandman graphic novel, moody cross-hatched ink linework, painterly desaturated color palette with deep blacks and muted selective color accents, dramatic chiaroscuro lighting, gritty post-apocalyptic ruins atmosphere, unsettling horror mood, detailed textured linework, high contrast, cinematic framing, 2D comic book illustration, single creature, full body
```

#### 🐙 Polvo Mutante (Água ou Zona Costeira)
**Prompt Positivo:**
```
a mutated intelligent octopus creature emerging from murky flooded ruins, thick writhing tentacles reaching out, dark mottled skin releasing black ink clouds, unnervingly intelligent eyes, dark gothic comic book illustration, in the style of Neil Gaiman's The Sandman graphic novel, moody cross-hatched ink linework, painterly desaturated color palette with deep blacks and muted selective color accents, dramatic chiaroscuro lighting, gritty post-apocalyptic flooded ruins atmosphere, unsettling horror mood, detailed textured linework, high contrast, cinematic framing, 2D comic book illustration, single creature, full body
```

#### 🦈 Tubarão (Zonas Costeiras ou Inundadas)
**Prompt Positivo:**
```
a massive predatory shark circling beneath murky flooded ruined streets, rows of jagged teeth bared, cold dead eyes, fin cutting through dark water, dark gothic comic book illustration, in the style of Neil Gaiman's The Sandman graphic novel, moody cross-hatched ink linework, painterly desaturated color palette with deep blacks and muted selective color accents, dramatic chiaroscuro lighting, gritty post-apocalyptic flooded ruins atmosphere, unsettling horror mood, detailed textured linework, high contrast, cinematic framing, 2D comic book illustration, single creature, partially submerged
```

---

## 7. Dicas finais

- **Gere em lote por categoria** (todos os Caminhantes juntos, depois Corredores, etc.) — mantendo o mesmo seed/style reference dentro de cada lote, a consistência fica mais fácil de controlar.
- **Ajuste fino**: se uma imagem sair "bonita demais" ou "limpa demais", aumente o peso do Contrast e reforce no prompt palavras como `grimy`, `decayed`, `rotting`, `weathered`.
- **Evite prompts genéricos demais**: sempre que possível, mencione a arma/poder específico da criatura (já incluído nos prompts acima) — isso ajuda a diferenciar visualmente criaturas da mesma "família" (ex: os 3 Encorraçados).
- **Revisão manual obrigatória**: como em qualquer geração de IA, revise as imagens antes de publicar — principalmente para a criatura Alice (ver observação de segurança na seção 4.7).
- Depois de aprovar as artes, salve os arquivos em `Database/img/Pagina06/` seguindo o padrão de nomenclatura já usado nas outras páginas, para que o backend possa servi-las.
