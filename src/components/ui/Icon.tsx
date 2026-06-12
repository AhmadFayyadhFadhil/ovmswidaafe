import type { CSSProperties } from "react";

export function Icon({ name, className = "", style, size }: { name: string; className?: string; style?: CSSProperties; size?: string | number }) {
  return (
    <span className={`material-symbols-outlined select-none leading-none notranslate ${className}`}
      translate="no"
      style={{ fontVariationSettings: "'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24", fontSize: size, ...style }}>
      {name}
    </span>
  );
}
  
