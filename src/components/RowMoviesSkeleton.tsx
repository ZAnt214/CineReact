import React from 'react';

export default function RowMoviesSkeleton() {
  // We'll render 3 rows of skeletons, mirroring the top lists of the homepage
  const rows = [
    { titleWidth: 'w-48' },
    { titleWidth: 'w-36' },
    { titleWidth: 'w-40' }
  ];

  // Each row will show 4-5 card skeletons (hidden on smaller screens dynamically, just like a responsive row)
  const skeletonCards = Array.from({ length: 6 });

  return (
    <div className="space-y-12 pb-24 pt-24 animate-pulse max-w-7xl mx-auto w-full">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="space-y-4">
          
          {/* Row Title Skeleton */}
          <div className="px-4 md:px-8">
            <div className={`${row.titleWidth} h-6 bg-zinc-800 rounded-md`} />
          </div>

          {/* Horizontal Row Skeletons Container */}
          <div className="flex items-center gap-3.5 sm:gap-4 md:gap-5 overflow-x-hidden py-2.5 px-4 md:px-8">
            {skeletonCards.map((_, cardIndex) => (
              <div
                key={cardIndex}
                className="shrink-0 w-[220px] sm:w-[280px] md:w-[320px] lg:w-[350px] bg-zinc-900/30 backdrop-blur-sm rounded-2xl overflow-hidden border border-zinc-850/60 shadow-lg shadow-black/50"
              >
                {/* Thumbnail Skeleton */}
                <div className="relative h-36 md:h-44 w-full bg-zinc-900/50 flex items-center justify-center">
                  {/* Subtle inner accent to mimic empty image area */}
                  <div className="w-10 h-10 rounded-full bg-zinc-800/40" />
                  
                  {/* Fake duration badge skeleton */}
                  <div className="absolute bottom-2 right-2 w-14 h-4 bg-zinc-800 rounded border border-zinc-700/30" />
                </div>

                {/* Card Body Skeleton */}
                <div className="p-3.5 space-y-3">
                  
                  {/* Fake double-line title */}
                  <div className="space-y-2">
                    <div className="h-3.5 bg-zinc-800 rounded w-11/12" />
                    <div className="h-3.5 bg-zinc-800 rounded w-2/3" />
                  </div>

                  {/* Metadata: Channel & Views */}
                  <div className="flex items-center justify-between pt-1">
                    {/* Channel name skeleton */}
                    <div className="h-3 bg-zinc-800 rounded w-1/3" />
                    {/* View count skeleton */}
                    <div className="h-2.5 bg-zinc-800 rounded w-1/4" />
                  </div>

                  {/* CineReact Branding Footer Divider */}
                  <div className="pt-2 border-t border-zinc-800/50 flex items-center">
                    <div className="h-2 bg-zinc-800/20 rounded w-12" />
                  </div>

                </div>
              </div>
            ))}
          </div>

        </div>
      ))}
    </div>
  );
}
