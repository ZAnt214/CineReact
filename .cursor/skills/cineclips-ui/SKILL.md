---
name: cineclips-ui
description: Designs polished CineClips action buttons (like, comment, share, favorite, download) and discreet centered video watermarks for CineReact exports. Use when improving CineClips interactions, action rails, download branding, or bit.ly/CineReact watermarks.
disable-model-invocation: true
---

# CineClips UI — Ações e Marca d'água

## Botões de ação (rail lateral)

**Seguir skill `identidade`** — orb rail com avatar do criador, halo radial nos sociais, CTAs cyan.

Resumo: avatar + follow no topo; like vermelho ativo; favorite cyan ativo; share orb cyan sólido; download orb outline cyan; report discreto.

Estrutura:

```html
<button class="cineclips-action cineclips-action--like is-active">
  <span class="cineclips-action-orb"><!-- ícone --></span>
  <span class="cineclips-action-label">1.2K</span>
</button>
```

## Marca d'água (download de vídeo)

Logo **discreta no centro** do vídeo convidando ao CineReact.

### Layout (vertical, centralizado, sem fundo escuro)

```
      [▶ ícone cyan]
        CineReact
  assista mais reacts aqui
    [bit.ly/CineReact]
```

### Especificações

- SVG: `360×260`, **sem retângulo de fundo** — apenas logo, textos e pill
- Textos com `feDropShadow` para legibilidade em qualquer vídeo
- Ícone play em squircle cyan `#00E5FF` com glow suave
- Pill cyan sólido com `bit.ly/CineReact` em preto
- FFmpeg: `scale='min(360,iw*0.38)'`, overlay `(W-w)/2:(H-h)/2`
- Rasterizar SVG em 800px (`rsvg-convert -w 800`)

### O que evitar

- Marca d'água excessiva (> ~45% da largura do vídeo)
- Retângulo/fundo escuro semi-transparente atrás da logo

## Checklist

- [ ] Seguir skill `identidade` para botões e meta do clip
- [ ] Cada ação tem variante CSS (`cineclips-action--{variant}`)
- [ ] Watermark centralizada e discreta (~28% largura)
- [ ] `WATERMARK_VERSION` atualizado + PNG regenerado
- [ ] Mobile: scroll lock mantido, botões ≥ 44px
