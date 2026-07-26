import React from 'react';

export default function PlaybackSkeleton() {
  // Skeleton recommendations for the sidebar (right column)
  const sidebarItems = Array.from({ length: 6 });
  
  // Skeleton videos for the horizontal carousel (left column)
  const carouselItems = Array.from({ length: 4 });

  return (
    <div className="cine-container pt-24 pb-20 min-h-screen bg-[#0f0d14] w-full animate-pulse">
      {/* GRID LAYOUT: 12 Columns matching PlaybackPage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        
        {/* LEFT COLUMN: Player, Info, and Shelves */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          
          {/* Video Player Box Skeleton */}
          <div className="relative w-full bg-zinc-900/60 rounded-2xl aspect-video border border-zinc-800/40 shadow-2xl flex items-center justify-center">
            {/* Subtle inner center logo/ring accent */}
            <div className="w-16 h-16 rounded-full border-4 border-zinc-800/40 border-t-zinc-700/60 animate-spin" />
          </div>

          {/* Title & Badge */}
          <div className="space-y-3 pt-2">
            {/* Type Badge */}
            <div className="w-20 h-5 bg-zinc-800 rounded-full" />
            {/* Main Title (Two Lines) */}
            <div className="space-y-2">
              <div className="h-7 bg-zinc-800 rounded-lg w-10/12" />
              <div className="h-7 bg-zinc-800 rounded-lg w-6/12" />
            </div>
          </div>

          {/* Actions & Creator Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-zinc-900 pb-5">
            {/* Creator Circle + Info */}
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 bg-zinc-800 rounded-full flex-shrink-0" />
              <div className="space-y-1.5">
                <div className="h-3.5 bg-zinc-800 rounded w-28" />
                <div className="h-2.5 bg-zinc-800 rounded w-20" />
              </div>
            </div>

            {/* Actions (Buttons) */}
            <div className="flex items-center gap-2.5">
              <div className="w-24 h-9 bg-zinc-800 rounded-xl" />
              <div className="w-24 h-9 bg-zinc-800 rounded-xl" />
              <div className="w-10 h-9 bg-zinc-800 rounded-xl" />
            </div>
          </div>

          {/* Description Block */}
          <div className="bg-zinc-900/20 p-4 rounded-xl border border-zinc-850/60 space-y-2.5">
            <div className="h-3.5 bg-zinc-800 rounded w-1/4" />
            <div className="space-y-2 pt-1">
              <div className="h-3 bg-zinc-850 rounded w-full" />
              <div className="h-3 bg-zinc-850 rounded w-11/12" />
              <div className="h-3 bg-zinc-850 rounded w-4/5" />
            </div>
          </div>

          {/* Carousel Title & Horizontal row */}
          <div className="space-y-4 pt-6 border-t border-zinc-900">
            <div className="h-6 bg-zinc-800 rounded w-40" />
            
            <div className="flex gap-4 overflow-x-hidden pb-4 pt-1">
              {carouselItems.map((_, idx) => (
                <div key={idx} className="flex-shrink-0 w-[240px] md:w-[290px] bg-zinc-900/15 border border-zinc-850/60 rounded-xl overflow-hidden flex flex-col">
                  {/* Thumbnail */}
                  <div className="aspect-video w-full bg-zinc-900" />
                  {/* Title & Metadata */}
                  <div className="p-3.5 space-y-2.5 flex-1">
                    <div className="h-3 bg-zinc-800 rounded w-11/12" />
                    <div className="h-3 bg-zinc-800 rounded w-2/3" />
                    <div className="pt-2 flex justify-between">
                      <div className="h-2.5 bg-zinc-800 rounded w-1/3" />
                      <div className="h-2.5 bg-zinc-800/40 rounded w-1/4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: RECOMMENDED SIDEBAR */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-5">
          {/* Header */}
          <div className="border-b border-zinc-900 pb-3">
            <div className="h-5 bg-zinc-800 rounded w-32" />
            <div className="h-3 bg-zinc-850 rounded w-44 mt-2" />
          </div>

          {/* Recommended list */}
          <div className="flex flex-col gap-3.5">
            {sidebarItems.map((_, idx) => (
              <div key={idx} className="flex gap-3.5 p-2 rounded-xl">
                {/* Thumbnail Frame */}
                <div className="relative w-28 h-18 sm:w-36 sm:h-22 flex-shrink-0 bg-zinc-900 rounded-lg overflow-hidden border border-zinc-850/40" />
                
                {/* Meta details */}
                <div className="flex flex-col flex-1 justify-between py-1">
                  <div className="space-y-1.5">
                    <div className="h-3 bg-zinc-800 rounded w-11/12" />
                    <div className="h-3 bg-zinc-800 rounded w-2/3" />
                  </div>
                  <div className="space-y-1 pt-2">
                    <div className="h-2.5 bg-zinc-800 rounded w-1/3" />
                    <div className="h-2 bg-zinc-850 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
