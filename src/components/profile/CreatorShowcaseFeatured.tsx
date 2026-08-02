import React from 'react';

const SKELETON_COUNT = 3;

function FeaturedSkeletonCard() {
  return (
    <article
      className="shrink-0 w-[200px] sm:w-[220px] rounded-2xl overflow-hidden border border-neutral-800/60 bg-neutral-950/40"
      aria-hidden
    >
      <div className="relative aspect-video bg-neutral-900/80 animate-pulse">
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-cine-accent/15 border border-cine-accent/25 text-[9px] font-bold uppercase tracking-wider text-cine-accent-light">
          Destacado
        </span>
        <span className="absolute bottom-2 right-2 w-10 h-4 rounded bg-neutral-800/90" />
      </div>
      <div className="p-3 space-y-2 animate-pulse">
        <div className="h-3 bg-neutral-800 rounded w-[92%]" />
        <div className="h-3 bg-neutral-800 rounded w-[68%]" />
        <div className="h-2.5 bg-neutral-800/70 rounded w-[40%] mt-2" />
      </div>
    </article>
  );
}

export default function CreatorShowcaseFeatured() {
  return (
    <section className="pt-8 border-t border-neutral-800/60" aria-labelledby="creator-featured-title">
      <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500 font-semibold">Catálogo</p>
      <h2 id="creator-featured-title" className="font-display text-lg sm:text-xl font-bold text-white mt-1">
        Reacts em destaque
      </h2>
      <p className="text-sm text-zinc-500 mt-1 mb-4">Fixados pelo criador após verificação</p>

      <div
        className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin"
        role="img"
        aria-label="Prévia de cards em destaque"
      >
        {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
          <FeaturedSkeletonCard key={index} />
        ))}
      </div>
    </section>
  );
}
