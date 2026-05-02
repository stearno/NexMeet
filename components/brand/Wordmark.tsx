"use client";

import { Mark } from "./Mark";

interface Props {
  size?: number;
  className?: string;
  tone?: "default" | "primary";
}

export function Wordmark({ size = 22, className, tone = "default" }: Props) {
  const color = tone === "primary" ? "var(--primary)" : "currentColor";
  return (
    <span
      className={"inline-flex items-center leading-none " + (className ?? "")}
      style={{ color, height: size }}
      aria-label="PROCESS4HIGHROI"
    >
      <Mark size={size} />
      <span
        style={{
          fontWeight: 700,
          letterSpacing: "-0.04em",
          fontSize: Math.round(size * 0.72),
          lineHeight: 1,
          marginLeft: Math.round(size * 0.1),
        }}
      >
        PROCESS4HIGHROI
      </span>
    </span>
  );
}
