import React, { useState, useEffect } from 'react';

interface UiImgProps {
  src?: string;
  alt?: string;
  lazy?: boolean;
  contain?: boolean;
  onError?: () => void;
  onLoad?: () => void;
  children?: React.ReactNode;
}

export default function UiImg({
  src = '',
  alt = '',
  lazy = false,
  contain = false,
  onError,
  onLoad,
  children,
}: UiImgProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  function loadImage() {
    const img = new Image();
    img.onload = () => {
      setLoading(false);
      setError(false);
      onLoad?.();
    };
    img.onerror = () => {
      setLoading(false);
      setError(true);
      onError?.();
    };
    img.src = src;
  }

  useEffect(() => {
    if (!src) {
      setLoading(false);
      return;
    }

    if (lazy && containerRef.current) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadImage();
            observer.unobserve(entry.target);
          }
        });
      });
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    } else {
      loadImage();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  return (
    <div ref={containerRef} className="ui-image relative">
      <div className="flex items-center justify-center">
        {loading ? (
          <div className="bg-input-dark absolute h-full w-full animate-pulse rounded-lg" />
        ) : error ? (
          <p className="text-lighter text-center">Failed to load image</p>
        ) : (
          <div
            style={{
              backgroundImage: `url(${src})`,
              backgroundSize: contain ? 'contain' : 'cover',
            }}
            role={alt ? 'img' : undefined}
            aria-label={alt || undefined}
            className="absolute top-0 left-0 h-full w-full bg-center bg-no-repeat"
          >
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
