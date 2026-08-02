import React from 'react';
import { BadgeCheck } from 'lucide-react';

const SKELETON_COUNT = 3;

function FeaturedSkeletonCard({ index }: { index: number }) {
  return (
    <article
      className="creator-showcase-featured-card cine-recomenda-card"
      aria-hidden
      data-skeleton-index={index}
    >
      <div className="creator-showcase-featured-thumb cine-recomenda-thumb">
        <div className="creator-showcase-skeleton-shine" />
        <span className="cine-recomenda-tag">
          <span className="cine-recomenda-tag-label">Destacado</span>
        </span>
        <span className="creator-showcase-skeleton-duration" />
      </div>
      <div className="p-3.5 sm:p-4 cine-recomenda-body">
        <div className="creator-showcase-skeleton-lines">
          <span className="creator-showcase-skeleton-line creator-showcase-skeleton-line--lg" />
          <span className="creator-showcase-skeleton-line creator-showcase-skeleton-line--sm" />
        </div>
        <div className="creator-showcase-skeleton-footer cine-recomenda-footer">
          <span className="creator-showcase-skeleton-line creator-showcase-skeleton-line--channel" />
        </div>
      </div>
    </article>
  );
}

export default function CreatorShowcaseFeatured() {
  return (
    <section
      className="creator-showcase-section"
      aria-labelledby="creator-showcase-featured-heading"
    >
      <div className="creator-showcase-section-head">
        <h2 id="creator-showcase-featured-heading" className="creator-showcase-section-title">
          Vídeos em destaque
        </h2>
        <p className="creator-showcase-section-sub">
          Exemplo de como os reacts do criador aparecem em evidência após a verificação
        </p>
      </div>

      <div
        className="creator-showcase-featured-grid"
        role="img"
        aria-label="Prévia ilustrativa: três cards de vídeo em destaque com esqueleto de carregamento"
      >
        {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
          <FeaturedSkeletonCard key={index} index={index} />
        ))}
      </div>

      <p className="creator-showcase-featured-note">
        <BadgeCheck className="w-3.5 h-3.5 text-cine-accent-light shrink-0" strokeWidth={2.5} />
        Criadores verificados podem fixar reacts no catálogo e na home da plataforma.
      </p>
    </section>
  );
}
