---
name: layout-vertical-premium
description: Designs premium 9:16 vertical short-video layouts — feed zones, safe areas, overlay hierarchy, scrims, and mobile-first interactions. Use when building or redesigning TikTok/Reels-style feeds, CineClips pages, vertical video players, or when the user mentions layout vertical, vídeos curtos, feed fullscreen, or premium short-video UI.
disable-model-invocation: true
---

# SKILL — Especialista em Layout Premium para Vídeos Curtos Verticais

## Princípio

**Vídeo em primeiro lugar.** Toda UI flutua sobre o conteúdo sem competir com ele. Legibilidade vem de scrim + `text-shadow`, não de caixas glass pesadas. Hierarquia clara: vídeo → ações → meta → chrome do app.

## Canvas 9:16

| Contexto | Comportamento |
|----------|---------------|
| Mobile | `100dvh`, full bleed, sem bordas |
| Desktop | Shell central `max-w-[420px]`, `h-[92vh]`, `rounded-3xl`, borda `white/15` |
| Ambiente desktop | Poster blur do clip ativo atrás do shell (`opacity-30 blur-3xl`) |

```html
<div class="cineclips-shell">
  <div class="cineclips-feed"><!-- slides --></div>
</div>
```

- Shell: `position: fixed; inset: 0; height: 100dvh; overflow: hidden`
- Feed: `scroll-snap-type: y mandatory`, cada slide `height: 100%`, `scroll-snap-stop: always`

## Mapa de zonas

```
┌─────────────────────────────┐
│  Z1 Header (gradient fade)  │  ← voltar, tabs, mute
├─────────────────────────────┤
│                             │
│  Z2 Vídeo (full bleed)      │  ← object-fit contain/cover
│                             │
│                    Z4 Rail  │  ← avatar + ações (direita)
│  Z3 Meta (esq. inferior)    │  ← criador, título, tags
├─────────────────────────────┤
│  Z5 Progress / swipe hint   │  ← safe-area-bottom
└─────────────────────────────┘
```

### Z1 — Header

- `absolute top-0`, gradiente `from-black/80 via-black/40 to-transparent`
- Altura ~`3.25rem` + `env(safe-area-inset-top)`
- `pointer-events: none` no container; filhos com `pointer-events: auto`
- Tabs pill centralizadas; CTA ativo com fill (cyan / rose para trending)

### Z2 — Vídeo

- Camada `absolute inset-0`, fundo `#000`
- Reprodução: `object-fit: contain` (ativo) / `cover` + opacidade reduzida (idle)
- Scrim obrigatório por cima do vídeo (ver abaixo)

### Z3 — Meta (coluna esquerda)

- `flex-1 min-w-0`, alinhada ao fundo
- **Sem painel blur** — texto direto com `cineclips-meta-copy` + `text-shadow`
- Ordem: badge trending → criador + seguir → título (`line-clamp-2`) → descrição (`line-clamp-2` + "mais") → hashtags (máx. 3) → faixa de áudio
- `max-width: calc(100% - 4.75rem)` para não colidir com o rail

### Z4 — Rail (coluna direita)

- Coluna vertical, `align-items: center`, gap ~`1.15rem`
- Topo: avatar do criador + botão seguir
- Ações: seguir skill **`identidade`** (`cineclips-action-orb`)
- Reservar ~`4.5–5rem` de largura na direita

### Z5 — Rodapé

- Indicador de progresso: dots ou barras, `bottom` + `safe-area-inset-bottom`
- Swipe hint: centro, `pointer-events: none`, animação sutil

## Scrim (legibilidade)

Gradiente vertical sobre o vídeo — **não** substituir por card opaco:

```css
background: linear-gradient(
  to bottom,
  rgba(8, 8, 10, 0.25) 0%,
  transparent 30%,
  transparent 58%,
  rgba(8, 8, 10, 0.55) 78%,
  rgba(8, 8, 10, 0.88) 100%
);
```

- Topo leve para header legível
- Base forte para meta + rail
- Meio transparente para não escurecer o centro do vídeo

## Safe areas e toque

| Regra | Valor |
|-------|-------|
| Tap mínimo | 44px (`3rem` orbs) |
| Padding inferior UI | `calc(1rem + env(safe-area-inset-bottom))` |
| Scroll lock no feed | `useBodyScrollLock` quando shell aberto |
| `touch-action` | `pan-y` no feed; `none` no shell externo |
| Tap highlight | `-webkit-tap-highlight-color: transparent` |

## Hierarquia tipográfica

| Nível | Tamanho | Peso | Uso |
|-------|---------|------|-----|
| Título | `text-sm` | bold | Nome do clip |
| Criador | `text-sm` | bold | @handle |
| Descrição | `text-xs` | normal | Caption |
| Meta / tags | `text-[11px]` | semibold | Hashtags, áudio |
| Contagens rail | `0.7rem` | 700, tabular-nums | Likes, comentários |

Accent cyan (`--clips-accent`) só em: tab ativa, links, CTAs Enviar/Baixar, estados ativos de favorito.

## Interações premium

- **Scroll snap** entre clips; `IntersectionObserver` ou scroll index para play/pause
- **Double-tap** like com corações flutuantes (não bloquear scroll)
- **Sheets** (comentários, denúncia): `max-h-[75vh]`, handle drag, spring motion
- **whileTap** `scale(0.9)` em botões de ação
- Estados: loading (spinner cyan), empty (ícone + CTA), erro (retry)

## Desktop vs mobile

| Elemento | Mobile | Desktop |
|----------|--------|---------|
| Shell | Edge-to-edge | Card 9:16 centralizado |
| Fundo | Preto sólido | Poster blur do clip |
| Header tabs | Compactas | Label Beta visível |
| Rail | Mesma posição | Mesma — não encolher botões |

## Workflow

```
Task Progress:
- [ ] Definir shell (mobile full / desktop card)
- [ ] Camadas: vídeo → scrim → UI (pointer-events split)
- [ ] Posicionar meta (esq.) e rail (dir.) sem overlap
- [ ] Aplicar safe-area-inset em header e rodapé
- [ ] Scroll snap + scroll lock
- [ ] Testar: 1 clip, muitos clips, sem thumbnail, teclado (sheet)
```

1. Estruturar slide: `media` → `scrim` → `slide-ui` (meta + rail)
2. Garantir scrim antes de qualquer texto
3. Aplicar tokens de **`identidade`** no rail
4. Validar em 390×844 e desktop ~420px largura
5. Motion por último — só onde orienta (hint, sheets, toasts)

## Anti-patterns

- Caixas glass/blur atrás de título ou descrição
- Texto branco puro sem scrim nem `text-shadow`
- Rail e meta na mesma coluna
- Tap targets &lt; 40px
- Múltiplos accents competindo (cyan + amarelo + rosa sem hierarquia)
- `object-fit: cover` cortando rostos em vídeos 16:9 dentro do 9:16
- Scroll da página por trás do feed fullscreen
- Indicadores de progresso que bloqueiam toque

## Skills relacionadas

- **`identidade`** — botões orb, avatar rail, tokens visuais CineClips
- **`cineclips-ui`** — marca d'água de download, specs de export
- **`elite-web-design`** — tokens globais CineReact, sheets, botões primários

## Checklist final

- [ ] Vídeo ocupa 100% do slide; scrim aplicado
- [ ] Meta à esquerda, rail à direita, sem sobreposição
- [ ] `safe-area-inset-top/bottom` respeitados
- [ ] Feed com snap vertical e scroll lock
- [ ] Legibilidade sem painéis opacos na meta
- [ ] Desktop: shell 9:16 centralizado com ambiente blur
- [ ] Acessibilidade: `aria-label` em botões só-ícone
