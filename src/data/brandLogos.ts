export interface BrandLogoAsset {
  id: string;
  name: string;
  description: string;
  file: string;
  format: 'svg';
  previewBg: string;
  recommendedUse: string;
}

export const BRAND_LOGO_ASSETS: BrandLogoAsset[] = [
  {
    id: 'horizontal-dark',
    name: 'Horizontal — Fundo Escuro',
    description: 'Versão principal com fundo escuro e tagline. Ideal para materiais digitais e capas.',
    file: '/logos/cinereact-horizontal-dark.svg',
    format: 'svg',
    previewBg: 'bg-neutral-950 border border-neutral-800',
    recommendedUse: 'Thumbnails, banners, posts e destaques no YouTube.',
  },
  {
    id: 'horizontal-transparent',
    name: 'Horizontal — Fundo Transparente',
    description: 'Letreiro completo sem fundo. Perfeita para sobrepor vídeos e imagens.',
    file: '/logos/cinereact-horizontal-transparent.svg',
    format: 'svg',
    previewBg: 'bg-gradient-to-br from-neutral-900 via-neutral-800 to-cine-accent/20 border border-neutral-700',
    recommendedUse: 'Overlays em vídeos, streams e artes com fundo customizado.',
  },
  {
    id: 'horizontal-light',
    name: 'Horizontal — Fundo Claro',
    description: 'Versão para fundos claros e impressos em papel branco.',
    file: '/logos/cinereact-horizontal-light.svg',
    format: 'svg',
    previewBg: 'bg-zinc-100 border border-zinc-200',
    recommendedUse: 'Documentos, formulários e materiais impressos claros.',
  },
  {
    id: 'icon-badge',
    name: 'Ícone Quadrado',
    description: 'Marca compacta com claquete e nome. Ótima para avatar, watermark e apps.',
    file: '/logos/cinereact-icon-badge.svg',
    format: 'svg',
    previewBg: 'bg-neutral-950 border border-cine-accent/25',
    recommendedUse: 'Foto de perfil, watermark, stickers e ícones de app.',
  },
  {
    id: 'monochrome-white',
    name: 'Monocromática Branca',
    description: 'Versão totalmente branca com fundo transparente para vídeos escuros.',
    file: '/logos/cinereact-monochrome-white.svg',
    format: 'svg',
    previewBg: 'bg-gradient-to-br from-zinc-900 to-black border border-neutral-800',
    recommendedUse: 'Cantos de vídeo, lower thirds e sobreposições em cenas escuras.',
  },
];
