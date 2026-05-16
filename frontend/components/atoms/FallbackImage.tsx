"use client";

import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";

type FallbackImageProps = {
  src: string;
  fallbackSrc: string;
  height: number;
  width: number;
  className?: string;
  blurDataURL?: string;
  onLoaded?: () => void;
};

type ImageExistsResponse = {
  exists: boolean;
};

const DEFAULT_BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSIjRUFFRUYyIi8+PC9zdmc+";

export default function FallbackImage({
  src,
  fallbackSrc,
  height,
  width,
  className,
  blurDataURL = DEFAULT_BLUR_DATA_URL,
  onLoaded,
}: FallbackImageProps) {
  const safeSrc = src?.trim();
  const safeFallbackSrc = fallbackSrc?.trim();
  const [currentSrc, setCurrentSrc] = useState(safeSrc || safeFallbackSrc || "");
  const [loaded, setLoaded] = useState(false);
  const isLocalSrc = useMemo(() => safeSrc?.startsWith("/"), [safeSrc]);
  const [isChecked, setIsChecked] = useState(!isLocalSrc);

  useEffect(() => {
    setCurrentSrc(safeSrc || safeFallbackSrc || "");
    setLoaded(false);
    setIsChecked(!safeSrc || !safeSrc.startsWith("/"));
  }, [safeSrc, safeFallbackSrc]);

  useEffect(() => {
    if (!isLocalSrc || !safeSrc) return;

    const controller = new AbortController();
    const checkLocalImage = async () => {
      try {
        const response = await fetch(
          `/api/image-exists?src=${encodeURIComponent(safeSrc)}`,
          { signal: controller.signal },
        );
        const data = (await response.json()) as ImageExistsResponse;
        if (!data?.exists) {
          setCurrentSrc(safeFallbackSrc || "");
        }
        setIsChecked(true);
      } catch (_error) {
        if (!controller.signal.aborted) {
          setCurrentSrc(safeFallbackSrc || "");
          setIsChecked(true);
        }
      }
    };

    checkLocalImage();
    return () => controller.abort();
  }, [safeFallbackSrc, isLocalSrc, safeSrc]);

  if (!isChecked || !currentSrc) return null;

  return (
    <Image
      src={currentSrc}
      alt=""
      height={height}
      width={width}
      placeholder={blurDataURL ? "blur" : undefined}
      blurDataURL={blurDataURL}
      className={`transition-all duration-700 ${className ?? ""} ${
        loaded
          ? "opacity-100 blur-0 scale-100"
          : "opacity-100 blur-md scale-105"
      }`}
      onLoadingComplete={() => {
        setLoaded(true);
        onLoaded?.();
      }}
      onError={() => {
        if (currentSrc !== (safeFallbackSrc || "")) {
          setCurrentSrc(safeFallbackSrc || "");
          setLoaded(false);
        }
      }}
    />
  );
}
