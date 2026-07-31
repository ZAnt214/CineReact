---
name: identidade
description: Defines CineClips visual identity — orb action rail with creator avatar, CineReact cyan CTAs, typography, and anti-patterns. Use when redesigning CineClips buttons, overlays, feed UI, or when the user mentions identidade, botões, or CineClips visual style.
disable-model-invocation: true
---

# IDENTIDADE — CineClips Visual System

## Princípio

**Nativo como TikTok, premium como CineReact.** Ícones flutuam com halo radial suave (não caixas glass). CTAs (Enviar/Baixar) usam orbs cyan sólidos. Avatar do criador no topo do rail com botão + vermelho.

## Tokens

| Token | Valor |
|-------|-------|
| Accent | `#00E5FF` (`--clips-accent`) |
| Like ativo | `#ff2d55` |
| Follow + | `#ff2d55` |
| Texto rail | `#fff` + `text-shadow` forte |
| Ícone social | `1.55rem`, branco, drop-shadow |
| Orb tap | `3rem` (48px) |
| Avatar rail | `3rem` com borda gradient cyan→indigo |

## Rail lateral

### Topo: avatar do criador

```html
<div class="cineclips-rail-creator">
  <button class="cineclips-rail-avatar"><span>A</span></button>
  <button class="cineclips-rail-follow"><!-- Plus --></button>
</div>
```

- Gradiente cyan→indigo na borda do avatar
- Botão `+` vermelho sobreposto na base (some quando já segue)

### Botões de ação

```html
<button class="cineclips-action cineclips-action--like is-active">
  <span class="cineclips-action-orb"><!-- ícone --></span>
  <span class="cineclips-action-label">1.2K</span>
</button>
```

### Variantes

| Variante | Ícone | Label | Visual |
|----------|-------|-------|--------|
| `like` | Heart | contagem | Halo escuro → **vermelho `#ff2d55`** quando ativo |
| `comment` | MessageCircle | contagem | Branco → **cyan** no toque |
| `favorite` | Bookmark | contagem | Branco → **cyan preenchido** quando ativo |
| `share` | Share2 | "Enviar" | **Orb cyan sólido**, ícone escuro |
| `download` | Download | "Baixar" | **Orb com borda cyan**, label cyan |
| `report` | Flag | (vazio) | Menor, `opacity: 0.5` |

### Regras

- Usar `.cineclips-action-orb` com `::before` para halo radial — **não** squircles glass, **não** `backdrop-filter` nos sociais
- Apenas `share` e `download` têm orb sólido/borda visível
- `whileTap={{ scale: 0.9 }}` (motion)
- Labels em **português**: Enviar, Baixar
- Contagens com `font-variant-numeric: tabular-nums`
- `-webkit-tap-highlight-color: transparent`

### Evitar

- Squircles escuros com gradiente em todos os botões
- Caixas glass/blur pesadas no rail
- Anéis externos decorativos, glows exagerados
- Painéis blur atrás das informações do clip (usar `text-shadow`)
- Ícones sem hierarquia — share/download devem se destacar dos sociais

## Informações do clip (meta)

- Texto **direto** sobre o vídeo, sem caixa glass
- `text-shadow` para legibilidade
- Classe: `cineclips-meta-copy`

## Marca d'água (download)

Ver skill `cineclips-ui` — watermark central discreta, sem retângulo escuro.

## Checklist

- [ ] Rail tem `RailCreatorAvatar` no topo
- [ ] HTML usa `cineclips-action-orb` (não chip/icon/glow antigos)
- [ ] Variantes `cineclips-action--{variant}` com estilos distintos
- [ ] Sociais com halo; share/download com orb cyan CTA
- [ ] Meta do clip sem painel blur
- [ ] Mobile: tap ≥ 44px, scroll lock mantido
