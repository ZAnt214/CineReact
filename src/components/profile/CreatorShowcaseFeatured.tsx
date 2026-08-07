import React from 'react';

const SKELETON_COUNT = 3;

function FeaturedSkeletonCard() {
  return (
    <article
      className="creator-premium-featured-card shrink-0 w-[200px] sm:w-[220px]"
      aria-hidden
    >
      <div className="relative aspect-video creator-premium-skeleton-thumb animate-pulse">
        <span className="creator-premium-featured-tag">Destacado</span>
        <span className="absolute bottom-2 right-2 w-10 h-4 rounded bg-black/40" />
      </div>
      <div className="p-3 space-y-2 animate-pulse">
        <div className="h-3 rounded w-[92%] bg-[var(--premium-border)]" />
        <div className="h-3 rounded w-[68%] bg-[var(--premium-border)]" />
        <div className="h-2.5 rounded w-[40%] mt-2 bg-[var(--premium-border)] opacity-70" />
      </div>
    </article>
  );
}

export default function CreatorShowcaseFeatured() {
  return (
    <section className="creator-premium-section" aria-labelledby="creator-featured-title">
      <p className="creator-premium-label">Catálogo</p>
      <h2 id="creator-featured-title" className="creator-premium-title">
        Reacts em destaque
      </h2>
      <p className="creator-premium-desc">Fixados pelo criador após verificação</p>

      <div
        className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 mt-4"
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
