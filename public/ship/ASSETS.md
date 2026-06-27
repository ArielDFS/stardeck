# NEXUS HUB — Manifesto de Assets da Nave (2D / FTL)

> ## ⚠️ ATUALIZAÇÃO (ADR-0008) — virada para RENDER ÚNICO
> A abordagem **modular** descrita abaixo (casco + `room-floor` + `room-frame` + `equip-*` montados por código) foi **SUPERADA**. Decisão atual:
> - **A nave/cômodos = UM render coeso único** (gerado num prompt só, estilo da referência "img 3"), com os cômodos e equipamentos **já pintados na imagem**. Layout **congelado** em troca de coerência visual máxima. Ver `prompt da nave` no fim deste arquivo.
> - **Os robôs continuam camada de código por cima** — `bot-idle.png`, `bot-working.png` e o sprite sheet `bot-walk.png` (→ `bot-walk-cut.png` com alpha) seguem **válidos**. O recolor por agente continua via `hue-rotate`.
> - O **console docado**, glows de foco e partículas continuam em **CSS/HTML**, não no render.
> - O HUD tycoon (Revenue/Orders/Day) está **descartado** por enquanto.
>
> As seções "modulares" abaixo ficam como **referência histórica** (ainda úteis pros prompts do robô). O prompt do render único está em **`## Prompt da nave (render único)`** no fim.

Guia para **gerar por IA** (Leonardo.ai) os assets 2D da nave. A grade de salas e a coloração dos personagens são feitas por **código** — IA gera peças atômicas (consistentes), o código tila, alinha e tinge. Drop dos PNGs finais em `public/ship/`.

## Decisões travadas (grelha)

- **Arquitetura:** híbrida em camadas (casco + tiles + equipamento + personagem).
- **Estilo:** 2D ilustrado chapado, estilo FTL (NÃO pixel-art).
- **Layout:** nave top-down; **8 módulos** (5 agentes + 3 vagos) em grade 4×2 + **Ponte/Reator**.
- **Personagens:** **robô uniforme** (mesmo chassi) representa cada agente; fica no seu módulo com **micro-animações CSS** (idle flutua; trabalhando se inclina ao console). Cor por agente via **CSS `hue-rotate`** — gera-se 1 só robô (accent ciano) e o código tinge os outros.
- **Cômodos:** personagem **+ equipamento temático** por agente.
- **Estados** (idle/focused/working): **glows CSS**, não assets.

## Direção de arte (style bible — colar em TODO prompt)

> `top-down 3/4 view, flat 2D game art, clean dark outlines, soft cel shading, no perspective, sci-fi, FTL-inspired (original, not copyrighted), transparent background, centered, game asset sprite`
>
> **Paleta:** fundo `#050A14`, cascos/painéis `#0D1B2A`/`#112233`, linhas `#1E3A5F`, **accent ciano `#00F5FF`**, detalhe rust `#C2603A`.
>
> **Regras fixas:** luz de cima, fundo 100% transparente (PNG), peça centralizada/aparada (trim), sem texto. Mesma seed entre peças irmãs.

## Sistema de personagem (o truque de crédito)

Gere **2 sprites** do MESMO robô (corpo metal neutro/cinza + **um** accent emissivo **ciano** — visor/núcleo). O código tinge por agente via `hue-rotate`/`saturate` (corpo cinza quase não muda; só o accent gira de cor):

| Agente | Cor alvo | Filtro CSS aprox. (a afinar) |
|---|---|---|
| NEXUS | ciano `#00F5FF` | nenhum (base) |
| ARIA | violeta `#7B2FBE` | `hue-rotate(70deg) saturate(1.1)` |
| ECHO | gold `#FFD700` | `hue-rotate(150deg) saturate(1.3)` |
| FORGE | vermelho `#FF4C4C` | `hue-rotate(200deg)` |
| PHANTOM | aço `#5A7A94` | `saturate(0.2) brightness(1.05)` |

> Fallback: se o tingimento por CSS ficar ruim, gerar 1 recolor por agente (mais crédito).

## Tamanhos

- Sala (tile): **512×512** (lógico 256 @2x). Equipamento ocupa ~70% central.
- Personagem: **512×512**, corpo ocupa ~60% central.
- Casco externo: **2048×1280**, transparente, centro vazio para a grade.

## Manifesto — gerar nesta ordem (lotes p/ limite diário)

### 🟢 Lote P0 — núcleo jogável (5 peças) — gere primeiro
| Arquivo | Tam. | Prompt (após style bible) |
|---|---|---|
| `hull-exterior.png` | 2048×1280 | `spaceship hull exterior frame only, twin top and bottom engine nacelles with rust-orange stripes, rear thrusters glowing cyan, pointed cockpit nose with cyan window, hollow empty center` |
| `room-floor.png` | 512×512 | `metal deck floor tile, subtle panel lines, dark teal, faintly seamless` |
| `room-frame.png` | 512×512 | `square room walls frame with 4 door slots, rust-orange door connectors, hollow center` |
| `bot-idle.png` | 512×512 | `small sci-fi utility robot, uniform chassis, neutral brushed-metal body, single glowing cyan visor and core, standing idle pose` |
| `bot-working.png` | 512×512 | `same robot leaning forward operating a console, arms active, glowing cyan core, working pose` |

### 🟡 Lote P1 — riqueza temática (7 peças)
| Arquivo | Tam. | Prompt |
|---|---|---|
| `equip-nexus.png` | 512×512 | `server racks and glowing database cores, cyan` |
| `equip-aria.png` | 512×512 | `rotating radar dish and scanner array, violet` |
| `equip-echo.png` | 512×512 | `holographic writing desk and document printer, gold` |
| `equip-forge.png` | 512×512 | `robotic fabricator arm and 3d-printer forge, red` |
| `equip-phantom.png` | 512×512 | `data compactor and archive console, steel grey` |
| `bridge-core.png` | 512×512 | `central reactor core, glowing pulsing cyan energy` |
| `room-empty.png` | 512×512 | `sealed empty room hatch, under-construction warning stripes, dim` |

### ⚪ Lote P2 — opcional / futuro (backlog)
- Poses extras do robô (`bot-alert`, `bot-celebrate`).
- `equip-vega.png`, `equip-oracle.png` (futuros agentes; robô reusa o mesmo chassi tingido).
- Avatares distintos por agente (se um dia trocar robô-uniforme por entidades).

**Total essencial: 12 PNGs** (P0: 5 + P1: 7). Personagens custam só **2 gerações** graças ao tingimento por código.

## Dicas (fugir das 3 armadilhas)

1. **Consistência:** gere peças irmãs (os 5 equipamentos; os 2 bots) na MESMA sessão, style bible idêntico, seed fixa.
2. **Transparência:** peça `transparent background`; se vier fundo, remova e apare (trim).
3. **Tileabilidade:** só `room-floor` precisa ser quase-seamless; o resto é peça avulsa centralizada.

## Integração (código)

`ShipView` empilha: `hull-exterior` (fundo) → grade 4×2 de `room-floor`+`room-frame` (8 células) → nas 5 ocupadas: `equip-*` + robô (`bot-idle`/`bot-working`, tingido por agente) / nas 3 vagas: `room-empty` → `bridge-core` → glows CSS por estado → hotspots clicáveis por célula. A nave SVG atual é placeholder até os PNGs chegarem.

---

# Guia de configuração — Leonardo.ai

Objetivo: máxima **consistência** entre as 12 peças + economia de **crédito diário**.

## Modelo & presets
- **Modelo:** um finetune de ilustração/flat. Tente **"Leonardo Phoenix"** ou **"Leonardo Diffusion XL"** / **"AlbedoBase XL"**. Na galeria de modelos, busque por *"flat illustration"* / *"2D game asset"* se houver community model.
- **Preset Style:** `Illustration` ou `Concept Art` (NÃO `Photography`/`Cinematic`).
- **Alchemy / PhotoReal:** **DESLIGADO** ao iterar (consome muito mais crédito). Ligue só na geração final se quiser nitidez extra.
- **Prompt Magic:** opcional; se ligar, mantenha leve.

## Settings por geração
- **Transparency / PNG (alpha):** **LIGADO** para personagem, equipamento, ponte, sala-vaga (objeto único centralizado). Para `hull-exterior` também (centro vazio). Se o modelo não suportar alpha, gere em fundo chapado e use **Remove Background** (Canvas) depois.
- **Tiling:** **LIGADO** só para `room-floor` (chão seamless). Desligado no resto.
- **Dimensões:** quadrado **512×512** para sprites/equipamento/robô; **wide ~1360×768** para `hull-exterior` (depois upscale).
- **Guidance (CFG):** ~7.
- **Imagens por geração:** **1–2** enquanto afina o prompt; só suba pra 4 quando o prompt estiver redondo (cada imagem = crédito).
- **Seed fixa:** ligue **Fixed Seed** e reuse a MESMA seed nas peças irmãs (os 5 equipamentos; as 2 poses do robô).

## A chave da consistência — Image Guidance
1. Gere primeiro **1 peça-âncora** que você ame (sugestão: `bot-idle`). Anote a **seed**.
2. Em todas as peças seguintes, use **Image Guidance → Style Reference**: suba a peça-âncora como referência de estilo (peso médio ~0.4–0.6). Isso "cola" o render de todas as peças no mesmo estilo.
3. Para `bot-working` (mesmo robô, outra pose): use a `bot-idle` como **Character Reference** (se disponível) ou **Image-to-Image** com força baixa (~0.3) + Style Reference. Mantém o MESMO chassi.
4. Equipamentos: mesma Style Reference da âncora → todos combinam entre si e com o robô.

## Negative prompt (colar sempre)
> `photo, realistic, 3d render, perspective, cast shadow on floor, background scenery, text, watermark, multiple objects, blurry, jpeg artifacts`

## Fluxo recomendado p/ o limite diário
- **Dia 1 (Lote P0):** trava o estilo. Gere `bot-idle` (âncora) → `bot-working` → `room-floor` (tiling) → `room-frame` → `hull-exterior`. Com isso a nave já fecha.
- **Dia 2+ (Lote P1):** os 5 `equip-*` + `bridge-core` + `room-empty`, todos com a Style Reference do dia 1.
- Iterar barato: use um modelo **Lightning/Turbo** pra achar a composição, depois refaça a final no modelo bom.

## Pós-processo
- Confirme **fundo transparente** real (sem halo). Se houver, Remove Background.
- **Trim** (aparar) e centralizar cada sprite.
- Exporte PNG. Nomeie EXATAMENTE como na tabela do manifesto e jogue em `public/ship/`.

---

# Prompt da nave (render único) — ADR-0008 ✅ ATUAL

Objetivo: **1 PNG transparente** com **casco + 8 salas + ponte** já pintados, top-down, estilo da img 3. **Robôs, console e HUD NÃO entram** (são camada de código por cima). Nome do arquivo final: `ship-render.png`.

## Style bible (colar no prompt)
> `top-down 3/4 view, hand-painted 2D game art, detailed sci-fi spaceship cutaway interior seen from above, soft cel shading, clean dark outlines, dramatic neon rim lighting, FTL-inspired (original, not copyrighted), transparent background, no text, no UI`

**Paleta base:** casco/painéis `#0D1B2A`/`#112233`, linhas `#1E3A5F`, detalhe rust `#C2603A`. Cada sala puxa a cor do seu agente (abaixo). Luz vinda de cima.

## Composição (HÍBRIDO — casco orgânico + miolo em grade)
- **Casco externo orgânico:** cockpit/ponte pontudo à **direita** (proa), **duas naceles de motor** à esquerda (popa) com thrusters brilhando ciano, listras rust-orange no casco, luzes de navegação.
- **Miolo:** **grade regular 4×2 de 8 salas quadradas**, separadas por **paredes/bulkheads metálicos** com conectores de porta entre elas. **Ponte/reator central** decorativa (núcleo pulsando ciano).
- **Cada sala (regra de ouro):** equipamento temático **encostado nas bordas/paredes**, com o **chão central VAZIO e plano** — é ali que o robô fica (no código). Tudo visto **de cima**.
- **Fundo:** 100% **transparente** (alpha) ao redor do casco — sem espaço/nebulosa pintada (vem do CSS).

## As 8 salas (cor do agente + equipamento)
| # | Sala | Cor | Equipamento (nas bordas) |
|---|---|---|---|
| 1 | NEXUS | ciano `#00F5FF` | racks de servidor, núcleos de banco de dados brilhando |
| 2 | ARIA | violeta `#7B2FBE` | antena de radar / array de scanner |
| 3 | ECHO | dourado `#FFD700` | mesa holográfica de escrita, impressora de documentos |
| 4 | FORGE | vermelho `#FF4C4C` | braço fabricador, forja / impressora 3D |
| 5 | PHANTOM | aço `#5A7A94` | compactador de dados, console de arquivo |
| 6–8 | (vagas) | cinza dim | escotilha selada, listras de "em construção", apagada |
| — | Ponte/Reator | ciano | núcleo de reator central pulsando |

## Settings (Leonardo.ai)
- **Dimensão:** wide **~2048×1280**, depois upscale. Alpha PNG ligado.
- **Style Reference:** suba a **img 3** (peso ~0.5) p/ colar o render no estilo que você aprovou.
- Alchemy/PhotoReal **OFF** ao iterar; CFG ~7; 1–2 imagens por geração.
- **Negative:** `photo, realistic, 3d render, robot, character, people, crew, text, watermark, UI, HUD, docked console, opaque background, painted starfield, cast shadow outside hull, blurry`

## Plano B (se 1 prompt não fechar as 8 salas com nitidez)
Gere o **casco + grade de salas vazias + ponte** primeiro (sem equipamento); depois **inpaint/regional prompt** o equipamento de cada sala uma a uma (com a mesma Style Reference). O alvo continua sendo **1 render final** consolidado.

## Integração (código) — depois de gerar
1. Drop em `public/ship/ship-render.png`.
2. Eu meço a caixa `{x,y,w,h}` (em % da imagem) de **cada uma das 8 salas + ponte** e defino um config `ROOMS` no `ShipView`.
3. O código ancora, por sala, o **robô** (idle/walk/working, tingido por `hue-rotate`) + o **hotspot clicável** + glows de foco/partículas, **por cima** do PNG.
4. Como o miolo é grade regular, o mapeamento é quase uniforme — afino as caixas na mão a partir da imagem real.

---

# Props de decoração das salas (atlas → fatiamento)

Equipamento e mobília que vestem as salas. Gerados por IA como **sprite sheets** e fatiados por código em props individuais com alpha.

## Pipeline de fatiamento (decidido)
1. Gerar o atlas (ChatGPT/DALL·E): grade **4×3 = 12 props**, props separados, mesmo estilo da nave.
2. ⚠️ Os sheets do ChatGPT vêm em **RGB com o xadrez "transparente" achatado na imagem** (não é alpha real). O script remove o xadrez por **flood-fill a partir das bordas** (o fundo é claro/dessaturado; para no contorno escuro do prop), fatia em **4×3** e **apara no alpha** (bbox + margem).
3. Saída: 1 PNG por prop em `public/ship/props/` (ex.: `server-rack.png`, `sofa.png`…). Script de referência: `scratchpad/slice.py` (lógica reaproveitável).

## ⚠️ Vista dos props: FRONTAL, não isométrica (decidido)
A 1ª leva saiu **isométrica/diagonal** e foi **rejeitada**: a sala é top-down, o robô é 3/4 frontal, e props 3/4 criam **três perspectivas brigando** + não encostam nas paredes. Decisão: **regerar em vista FRONTAL/elevação** (prop encara a câmera, base plana no chão, encosta na parede de fundo — estilo FTL). Mesmos 12 itens.

## Recolor
Props ficam **ciano + metal neutro**. A cor por agente NÃO vem de `hue-rotate` por prop — vem do **glow ambiente da sala** (layer CSS `room-tint` na `--accent`). Mantém os props neutros e a sala colorida.

## Prompt — props FRONTAIS (colar no ChatGPT, anexar `ship-render.png`)
> `Create a 2D game asset sheet: a grid of separate sci-fi room equipment props, drawn in FRONT VIEW (orthographic front elevation, each object facing the viewer head-on). NOT isometric, no 3/4 angle, no diagonal tilt — flat front-facing, as if mounted against a wall. 4x3 grid (12 props), generous gaps, centered, uniform scale, no overlap, fully TRANSPARENT background. Hand-painted 2D game art, soft cel shading, clean dark outlines, neon rim lighting, FTL-inspired (original). Brushed metal in dark navy and steel grey with glowing cyan emissive panels; each prop has a flat bottom to sit on a floor; lighting from above. Props: server rack; radar dish; holographic desk with screens; fabricator arm with 3D printer; data archive console; reactor core; control terminal; supply crates; charging pod; pipes/ventilation; antenna array; storage lockers. DO NOT include floor, walls, room, scenery, robots, people, text. Wide landscape image.`
>
> Para a mobília (living): mesmo cabeçalho "FRONT VIEW", lista = bunk bed, sofa, office desk, chair, bookshelf, plant, floor lamp, coffee dispenser, holo TV, coffee table, wardrobe, gym bench.

# Robô 3-direcional (down/up/side) — regeração (ADR-0008 rev.)

Substitui o sheet só-lateral. Movimento real em 2 eixos → robô precisa de **DOWN (frente) / UP (costas) / SIDE (perfil, espelhado p/ L↔R)**. Gerar em **2 sheets**, anexando o robô atual no ChatGPT ("mesmo robô exato") p/ consistência. Side nasce virado p/ **esquerda**; código espelha p/ direita.

- **Sheet caminhada** `bot-walk-3dir.png` — grade **3×6** (linhas = down/up/side; colunas = 6 frames do ciclo).
- **Sheet poses** `bot-pose-3dir.png` — grade **2×3** (linha 1 = idle, linha 2 = working; colunas = down/up/side).

Código escolhe a direção pelo **eixo dominante**: `|dx|>|dy|` → SIDE (flip se `dx>0`); senão UP (`dy<0`) / DOWN (`dy>0`). **Plano B:** se os 18 frames de caminhada saírem incoerentes, gerar 1 sheet por direção (1×6) e juntar. Prompts completos versionados no histórico do chat / commit.

## Mapa de props por sala (provisório — afinar no mockup)
No `_mockups/ship-render.html`, cada sala tem um array `props:[{f, x, y, w}]` (f=arquivo, x/y=centro em % da sala, w=largura em %). Sugestão inicial: NEXUS=server-rack+archive-console+office-desk; ARIA=radar-dish+antenna+bookshelf; ECHO=holo-desk+control-terminal+coffee-dispenser; FORGE=fabricator+pipes-vent+gym-bench; PHANTOM=archive-console+lockers+bunk-bed+plant. _(Removidos do mockup enquanto a leva frontal é regerada.)_
