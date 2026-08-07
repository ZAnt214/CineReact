import React from 'react';

export default function PlaybackSkeleton() {
  const sidebarItems = Array.from({ length: 5 });
  const carouselItems = Array.from({ length: 3 });

  return (
    <div className="cine-container pt-24 pb-20 min-h-screen bg-cine-bg w-full animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        <div className="lg:col-span-8 xl:col-span-9 space-y-5">
          <div className="w-full bg-neutral-900 rounded-xl aspect-video border border-neutral-800/60" />

          <div className="space-y-2">
            <div className="h-3 w-24 bg-neutral-800 rounded" />
            <div className="h-7 bg-neutral-800 rounded w-10/12" />
            <div className="h-4 bg-neutral-800 rounded w-1/3" />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-900/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-neutral-800 rounded-full" />
              <div className="space-y-1.5">
                <div className="h-3.5 bg-neutral-800 rounded w-28" />
                <div className="h-2.5 bg-neutral-800 rounded w-20" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="w-16 h-8 bg-neutral-800 rounded-lg" />
              <div className="w-16 h-8 bg-neutral-800 rounded-lg" />
              <div className="w-20 h-8 bg-neutral-800 rounded-lg" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 border-b border-neutral-900/80 pb-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-1">
                <div className="h-2.5 bg-neutral-800 rounded w-16" />
                <div className="h-3.5 bg-neutral-800 rounded w-12" />
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-neutral-900/80 space-y-3">
            <div className="h-4 w-48 bg-neutral-800 rounded" />
            <div className="flex gap-3">
              {carouselItems.map((_, idx) => (
                <div key={idx} className="flex-shrink-0 w-[200px] sm:w-[240px]">
                  <div className="aspect-video bg-neutral-900 rounded-lg" />
                  <div className="h-3 bg-neutral-800 rounded mt-2 w-4/5" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="lg:col-span-4 xl:col-span-3 space-y-4">
          <div className="border-b border-neutral-900/80 pb-3 space-y-2">
            <div className="h-3 w-28 bg-neutral-800 rounded" />
            <div className="h-3.5 w-40 bg-neutral-800 rounded" />
          </div>
          <div className="flex flex-col gap-2">
            {sidebarItems.map((_, idx) => (
              <div key={idx} className="flex gap-3 p-1.5">
                <div className="w-32 sm:w-36 aspect-video bg-neutral-900 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 bg-neutral-800 rounded w-11/12" />
                  <div className="h-3 bg-neutral-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
