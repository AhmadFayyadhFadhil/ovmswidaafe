import type { CSSProperties } from "react";

export function Icon({ name, className = "", style, size }: { name: string; className?: string; style?: CSSProperties; size?: string | number }) {
  return (
    <span 
      className={`material-symbols-outlined select-none leading-none notranslate ${className}`}
      translate="no"
      data-no-translation="true"
      style={{ 
        fontFamily: "'Material Symbols Outlined', sans-serif",
        fontVariationSettings: "'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24", 
        fontSize: size, 
        ...style 
      }}
    >
      {name}
    </span>
  );
}
  
