"use client";
import { useEffect, useState } from "react";
import { getImage, isRefKey } from "@/lib/image-store";

interface ImgFromIdbProps {
  src: string;
  alt?: string;
  className?: string;
}

export function ImgFromIdb({ src, alt, className }: ImgFromIdbProps) {
  const [resolved, setResolved] = useState("");
  useEffect(() => {
    if (!src) { setResolved(""); return; }
    if (isRefKey(src)) {
      getImage(src).then((img) => { if (img) setResolved(img); }).catch(() => setResolved(""));
    } else {
      setResolved(src);
    }
  }, [src]);
  if (!resolved) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={resolved} alt={alt || ""} className={className} />;
}
