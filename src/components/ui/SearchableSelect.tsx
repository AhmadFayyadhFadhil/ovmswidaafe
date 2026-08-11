import { useState, useRef, useEffect } from "react";

interface SearchableSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
  icon?: string;
  customOptionLabel?: string;
  disabled?: boolean;
}

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span
      className={`material-symbols-outlined select-none leading-none notranslate ${className}`}
      translate="no"
      style={{ fontVariationSettings: "'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24" }}
    >
      {name}
    </span>
  );
}

export function SearchableSelect({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Pilih atau cari...",
  required = false,
  icon,
  disabled = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const query = (value || "").trim().toLowerCase();
  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(query)
  );

  const handleSelectOption = (opt: string) => {
    onChange(opt);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && (
        <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        {icon && (
          <Icon
            name={icon}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-[17px] pointer-events-none z-10"
          />
        )}

        <div
          className={`w-full h-10 ${icon ? "pl-9" : "pl-3"} pr-14 border border-[#e2e8f0] rounded-xl text-[13px] bg-[#f8fafc] focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 flex items-center transition-all ${
            disabled ? "opacity-60 pointer-events-none" : ""
          }`}
        >
          <input
            required={required && !value}
            disabled={disabled}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => {
              if (!disabled) setIsOpen(true);
            }}
            placeholder={placeholder}
            className="w-full bg-transparent text-[#0f172a] focus:outline-none placeholder:text-slate-400 text-[13px] font-medium"
          />

          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setIsOpen(true);
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                title="Bersihkan teks"
              >
                <Icon name="cancel" className="text-base" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="text-[#94a3b8] hover:text-[#475569] cursor-pointer p-0.5"
            >
              <Icon
                name={isOpen ? "arrow_drop_up" : "arrow_drop_down"}
                className="text-[20px]"
              />
            </button>
          </div>
        </div>
      </div>

      {/* Autocomplete Recommendation Dropdown Popup */}
      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto py-1.5 divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 flex items-center justify-between">
            <span>Rekomendasi Master Data</span>
            {options.length > 0 && <span>{filteredOptions.length} pilihan</span>}
          </div>

          <div className="py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-[12px] text-slate-500 italic flex items-center gap-1.5 bg-blue-50/50">
                <Icon name="edit_note" className="text-base text-blue-600" />
                <span>
                  {value.trim() ? `Input kustom: "${value}"` : "Ketik untuk memilih atau menambah data..."}
                </span>
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = value.toLowerCase() === opt.toLowerCase();
                return (
                  <div
                    key={opt}
                    onClick={() => handleSelectOption(opt)}
                    className={`px-3 py-2 text-[12.5px] cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected
                        ? "bg-blue-50 text-blue-800 font-bold"
                        : "text-slate-700 hover:bg-slate-50 hover:text-blue-700"
                    }`}
                  >
                    <span>{opt}</span>
                    {isSelected && <Icon name="check" className="text-base text-blue-700" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
