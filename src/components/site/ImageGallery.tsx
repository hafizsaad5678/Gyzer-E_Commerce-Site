import { useState } from "react";
import { X, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";

type ImageGalleryProps = {
  images: { url: string; alt?: string | null }[];
  productName: string;
};

export function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  const imgs = images.length > 0 ? images : [{ url: "", alt: null }];
  const current = imgs[active];

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!zoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  }

  function prev() {
    setActive((a) => (a - 1 + imgs.length) % imgs.length);
  }
  function next() {
    setActive((a) => (a + 1) % imgs.length);
  }

  return (
    <>
      {/* Main image */}
      <div className="surface-card overflow-hidden">
        <div
          className="relative aspect-square bg-steel/30 overflow-hidden cursor-zoom-in select-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setZoomed(false)}
          onClick={() => setZoomed((v) => !v)}
        >
          {current.url ? (
            <img
              src={current.url}
              alt={current.alt ?? productName}
              width={800}
              height={800}
              className={`h-full w-full object-cover transition-transform duration-200 ${zoomed ? "scale-[1.8]" : "scale-100"}`}
              style={zoomed ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : undefined}
              draggable={false}
            />
          ) : (
            <div className="grid h-full place-items-center text-muted-foreground text-sm">
              No image
            </div>
          )}

          {/* Zoom hint */}
          {!zoomed && current.url && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-md bg-background/80 backdrop-blur-sm px-2.5 py-1.5 text-xs text-muted-foreground pointer-events-none">
              <ZoomIn className="h-3.5 w-3.5" /> Click to zoom
            </div>
          )}

          {/* Arrow nav */}
          {imgs.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full bg-background/80 backdrop-blur-sm shadow text-foreground hover:bg-background transition"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full bg-background/80 backdrop-blur-sm shadow text-foreground hover:bg-background transition"
                aria-label="Next image"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnails */}
        {imgs.length > 1 && (
          <div className="flex gap-2 p-3 overflow-x-auto">
            {imgs.map((img, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`shrink-0 h-16 w-16 rounded-md overflow-hidden border-2 transition ${i === active ? "border-copper" : "border-transparent hover:border-border"}`}
                aria-label={`View image ${i + 1}`}
              >
                {img.url ? (
                  <img
                    src={img.url}
                    alt={img.alt ?? `${productName} ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-steel/40" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {zoomed && current.url && (
        <div
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setZoomed(false)}
        >
          <button
            className="absolute top-4 right-4 grid h-10 w-10 place-items-center rounded-full bg-secondary text-foreground hover:bg-border"
            onClick={() => setZoomed(false)}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          {imgs.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-secondary text-foreground hover:bg-border"
                aria-label="Previous"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-secondary text-foreground hover:bg-border"
                aria-label="Next"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
          <img
            src={current.url}
            alt={current.alt ?? productName}
            className="max-h-[85vh] max-w-full rounded-xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
