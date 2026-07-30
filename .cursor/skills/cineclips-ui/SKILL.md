---
name: cineclips-ui
description: Designs polished CineClips action buttons (like, comment, share, favorite, download) and discreet centered video watermarks for CineReact exports. Use when improving CineClips interactions, action rails, download branding, or bit.ly/CineReact watermarks.
disable-model-invocation: true
---

# CineClips UI — Ações e Marca d'água

## Botões de ação (rail lateral)

Cada botão deve ter **identidade visual própria**, não ícones genéricos iguais.

| Variante | Ícone | Label | Estado ativo |
|----------|-------|-------|--------------|
| `like` | Heart | contagem | Vermelho + glow `#ef4444` |
| `comment` | MessageCircle | contagem | Cyan no toque |
| `favorite` | Bookmark | contagem | Cyan + glow |
| `share` | Share2 | "Enviar" | Fundo cyan suave |
| `download` | Download | "Baixar" | Borda cyan, label cyan |
| `report` | Flag | (vazio) | Menor, discreto |

### Estrutura HTML/CSS

```html
<button class="cineclips-action cineclips-action--like is-active">
  <span class="cineclips-action-glow" aria-hidden />
  <span class="cineclips-action-icon"><!-- ícone --></span>
  <span class="cineclips-action-label">1.2K</span>
</button>
```

### Regras visuais

- Ícone: **3.1rem** círculo, gradiente escuro, borda 1.5px, `backdrop-blur`, sombra interna
- Glow: `radial-gradient` atrás do ícone, visível só no estado ativo
- Tap: `whileTap={{ scale: 0.9 }}` (motion)
- Labels em **português**: Enviar, Baixar (não Share)
- `-webkit-tap-highlight-color: transparent` no mobile

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

- [ ] Cada ação tem variante CSS (`cineclips-action--{variant}`)
- [ ] Estados ativos com cor + glow distintos
- [ ] Watermark centralizada e discreta (~28% largura)
- [ ] `WATERMARK_VERSION` atualizado + PNG regenerado
- [ ] Mobile: scroll lock mantido, botões ≥ 44px
