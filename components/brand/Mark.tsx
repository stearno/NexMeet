"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface Props {
  size?: number;
  className?: string;
}

export function Mark({ size = 16, className }: Props) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Transparent-bg logo works on dark backgrounds; white-bg logo works on light backgrounds
  const src = mounted && resolvedTheme === "dark"
    ? "/logo/logo-for-dark-bg.png"
    : "/logo/logo-for-light-bg.png";

  return (
    <img
      src={src}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      className={className}
      style={{ objectFit: "contain" }}
    />
  );
}
