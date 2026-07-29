export type BrandLogoCategory = 'essencial' | 'estilo';

export interface BrandLogoAsset {
  id: string;
  name: string;
  description: string;
  file: string;
  format: 'svg';
  previewBg: string;
  recommendedUse: string;
  category: BrandLogoCategory;
}

export const BRAND_LOGO_CATEGORIES: { id: BrandLogoCategory; label: string; description: string }[] = [
  {
    id: 'essencial',
    label: 'Versões essenciais',
    description: 'Formatos principais para uso diário em vídeos, redes e materiais.',
  },
  {
    id: 'estilo',
    label: 'Estilos alternativos',
    description: 'Variações com tipografias e visual diferentes para destacar sua marca.',
  },
];

export const BRAND_LOGO_ASSETS: BrandLogoAsset[] = [
  {
    id: 'horizontal-dark',
    name: 'Horizontal — Fundo Escuro',
    description: 'Versão principal com letreiro centralizado e tagline alinhada.',
    file: '/logos/cinereact-horizontal-dark.svg',
    format: 'svg',
    previewBg: 'bg-neutral-950 border border-neutral-800',
    recommendedUse: 'Thumbnails, banners, posts e destaques no YouTube.',
    category: 'essencial',
  },
  {
    id: 'horizontal-transparent',
    name: 'Horizontal — Fundo Transparente',
    description: 'Letreiro unificado sem fundo, ideal para sobrepor conteúdo.',
    file: '/logos/cinereact-horizontal-transparent.svg',
    format: 'svg',
    previewBg: 'bg-gradient-to-br from-neutral-900 via-neutral-800 to-cine-accent/20 border border-neutral-700',
    recommendedUse: 'Overlays em vídeos, streams e artes com fundo customizado.',
    category: 'essencial',
  },
  {
    id: 'horizontal-light',
    name: 'Horizontal — Fundo Claro',
    description: 'Versão para fundos claros e impressos em papel branco.',
    file: '/logos/cinereact-horizontal-light.svg',
    format: 'svg',
    previewBg: 'bg-zinc-100 border border-zinc-200',
    recommendedUse: 'Documentos, formulários e materiais impressos claros.',
    category: 'essencial',
  },
  {
    id: 'banner-youtube',
    name: 'Banner YouTube (1600×400)',
    description: 'Formato largo para capa de canal e arte promocional.',
    file: '/logos/cinereact-banner-youtube.svg',
    format: 'svg',
    previewBg: 'bg-neutral-950 border border-neutral-800',
    recommendedUse: 'Banner do canal no YouTube e headers widescreen.',
    category: 'essencial',
  },
  {
    id: 'icon-badge',
    name: 'Ícone Quadrado',
    description: 'Marca compacta com claquete e nome centralizado.',
    file: '/logos/cinereact-icon-badge.svg',
    format: 'svg',
    previewBg: 'bg-neutral-950 border border-cine-accent/25',
    recommendedUse: 'Foto de perfil, watermark, stickers e ícones de app.',
    category: 'essencial',
  },
  {
    id: 'monochrome-white',
    name: 'Monocromática Branca',
    description: 'Versão totalmente branca com fundo transparente.',
    file: '/logos/cinereact-monochrome-white.svg',
    format: 'svg',
    previewBg: 'bg-gradient-to-br from-zinc-900 to-black border border-neutral-800',
    recommendedUse: 'Cantos de vídeo, lower thirds e sobreposições em cenas escuras.',
    category: 'essencial',
  },
  {
    id: 'style-sora',
    name: 'Estilo Sora — Display',
    description: 'Tipografia Sora bold, visual moderno e impactante.',
    file: '/logos/cinereact-style-sora.svg',
    format: 'svg',
    previewBg: 'bg-neutral-950 border border-neutral-800',
    recommendedUse: 'Capas de vídeo, posts e materiais com pegada premium.',
    category: 'estilo',
  },
  {
    id: 'style-mono',
    name: 'Estilo Mono — Tech',
    description: 'Fonte monoespaçada JetBrains Mono, clima gamer/dev.',
    file: '/logos/cinereact-style-mono.svg',
    format: 'svg',
    previewBg: 'bg-black border border-cine-accent/30',
    recommendedUse: 'Streams de jogos, conteúdo técnico e overlays retro.',
    category: 'estilo',
  },
  {
    id: 'style-cinematic',
    name: 'Estilo Cinemático',
    description: 'Letras espaçadas e barra luminosa, clima de cinema.',
    file: '/logos/cinereact-style-cinematic.svg',
    format: 'svg',
    previewBg: 'bg-zinc-950 border border-neutral-800',
    recommendedUse: 'Intros, trailers de react e artes widescreen.',
    category: 'estilo',
  },
  {
    id: 'style-neon',
    name: 'Estilo Neon',
    description: 'Brilho ciano suave com fundo escuro profundo.',
    file: '/logos/cinereact-style-neon.svg',
    format: 'svg',
    previewBg: 'bg-black border border-cine-accent/40',
    recommendedUse: 'Thumbnails chamativas, shorts e highlights noturnos.',
    category: 'estilo',
  },
  {
    id: 'style-stacked',
    name: 'Estilo Empilhado',
    description: 'CINE acima de REACT, layout vertical compacto.',
    file: '/logos/cinereact-style-stacked.svg',
    format: 'svg',
    previewBg: 'bg-neutral-950 border border-neutral-800',
    recommendedUse: 'Stories, posts verticais e avatares quadrados.',
    category: 'estilo',
  },
];
