# Cosméticos (ADR-0009)

Coloque aqui os PNGs **recortados** dos cosméticos (chapéus/itens de cabeça), com
fundo transparente (alpha real).

## Convenção de nome esperada pelo código

Os IDs vêm do catálogo em `src/lib/ship/cosmetics.ts`:
`headset`, `visor`, `antenna`, `halo`, `cap`, `crown`.

As 3 direções casam com `bot-pose-cut.png`: `down` (frente), `up` (costas), `side` (perfil).

**Se você cortou um PNG por direção** (recomendado):

```
headset-down.png   headset-up.png   headset-side.png
visor-down.png     visor-up.png     visor-side.png
antenna-down.png   antenna-up.png   antenna-side.png
halo-down.png      halo-up.png      halo-side.png
cap-down.png       cap-up.png       cap-side.png
crown-down.png     crown-up.png     crown-side.png
```

**Se cortou um PNG por cosmético** (vista única, frontal): `headset.png`, `visor.png`, etc.

> Me diga como você nomeou os arquivos que eu ajusto o código (`COSMETIC_SHEET`
> vira leitura por arquivo) e implemento o render com âncora na cabeça do robô.
