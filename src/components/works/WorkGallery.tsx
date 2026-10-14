"use client";
import { useState } from "react";

/** Main image + thumbnails; keyboard accessible. */
export default function WorkGallery({ images, title, label }: { images: string[]; title: string; label: string }) {
  const [i, setI] = useState(0);
  if (!images.length) return <div className="aspect-[16/10] rounded-card bg-brand-mesh" aria-hidden />;
  return (
    <section aria-label={label} className="space-y-3" data-testid="work-gallery">
      <div className="overflow-hidden rounded-card bg-slate-100 shadow-card ring-1 ring-line dark:bg-slate-900 dark:ring-slate-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={images[i]} src={images[i]} alt={`${title} — ${i + 1}/${images.length}`} className="aspect-[16/10] w-full animate-fade-in object-cover" />
      </div>
      {images.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, k) => (
            <li key={src} className="shrink-0">
              <button type="button" onClick={() => setI(k)} aria-label={`${k + 1}/${images.length}`} aria-pressed={k === i}
                className={`block overflow-hidden rounded-xl transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${k === i ? "ring-2 ring-brand-500" : "opacity-70 ring-1 ring-line hover:opacity-100"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-16 w-24 object-cover sm:h-20 sm:w-32" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
