import React, { useState } from 'react';
import { ArrowLeft, Download, Image as ImageIcon, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { BRAND_LOGO_ASSETS, BRAND_LOGO_CATEGORIES } from '../data/brandLogos.ts';
import { downloadBrandLogoAsPng, downloadBrandLogoFile } from '../utils/downloadBrandLogo.ts';

interface LogoDownloadPageProps {
  onBack: () => void;
}

export default function LogoDownloadPage({ onBack }: LogoDownloadPageProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (assetId: string, file: string, format: 'svg' | 'png') => {
    const asset = BRAND_LOGO_ASSETS.find((item) => item.id === assetId);
    if (!asset) return;

    const key = `${assetId}-${format}`;
    setDownloadingId(key);

    try {
      const filename = `cinereact-${asset.id}.${format}`;
      if (format === 'svg') {
        await downloadBrandLogoFile(file, filename);
      } else {
        await downloadBrandLogoAsPng(file, filename);
      }
    } catch (error) {
      console.error(error);
      window.alert('Não foi possível baixar este logo. Tente novamente.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full flex-1 min-h-screen"
    >
      <div className="cine-container pt-24 pb-20">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-white transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        <motion.div className="max-w-5xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cine-accent/10 border border-cine-accent/25 text-cine-accent-light text-[10px] font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Kit de Marca CineReact
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            Baixar logo do CineReact
          </h1>
          <p className="text-sm md:text-base text-zinc-400 mt-3 leading-relaxed max-w-3xl">
            Criadores parceiros podem usar estas versões oficiais do logo em thumbnails, overlays,
            descrições de vídeo e redes sociais. O letreiro CINEREACT é unificado e centralizado em todas as versões.
          </p>

          <div className="mt-8 space-y-10">
            {BRAND_LOGO_CATEGORIES.map((category) => {
              const items = BRAND_LOGO_ASSETS.filter((asset) => asset.category === category.id);
              if (!items.length) return null;

              return (
                <section key={category.id} className="space-y-4">
                  <div>
                    <h2 className="text-lg font-bold text-white">{category.label}</h2>
                    <p className="text-sm text-zinc-500 mt-1">{category.description}</p>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    {items.map((asset) => {
                      const svgBusy = downloadingId === `${asset.id}-svg`;
                      const pngBusy = downloadingId === `${asset.id}-png`;

                      return (
                        <article
                          key={asset.id}
                          className="rounded-2xl border border-neutral-800 bg-neutral-900/40 overflow-hidden"
                        >
                          <div className={`p-6 min-h-[180px] flex items-center justify-center ${asset.previewBg}`}>
                            <img
                              src={asset.file}
                              alt={asset.name}
                              className="max-h-28 w-full object-contain"
                              loading="lazy"
                            />
                          </div>

                          <div className="p-5 space-y-3 border-t border-neutral-800/80">
                            <div>
                              <h3 className="text-base font-bold text-white">{asset.name}</h3>
                              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{asset.description}</p>
                              <p className="text-[11px] text-zinc-500 mt-2">
                                <span className="text-cine-accent-light font-semibold">Uso recomendado:</span>{' '}
                                {asset.recommendedUse}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={!!downloadingId}
                                onClick={() => handleDownload(asset.id, asset.file, 'svg')}
                                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cine-accent hover:bg-cine-accent-light text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                {svgBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                Baixar SVG
                              </button>
                              <button
                                type="button"
                                disabled={!!downloadingId}
                                onClick={() => handleDownload(asset.id, asset.file, 'png')}
                                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-zinc-200 text-xs font-bold border border-neutral-700 transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                {pngBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                                Baixar PNG
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>

          <p className="text-[11px] text-zinc-600 mt-8 leading-relaxed max-w-3xl">
            Ao usar o logo, mantenha espaço livre ao redor da marca e não altere cores, proporções ou tipografia.
            O CineReact é uma plataforma de descoberta de reacts — o logo não substitui a identidade do seu canal no YouTube.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
