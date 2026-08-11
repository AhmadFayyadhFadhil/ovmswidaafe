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
  customOptionLabel = "Lainnya (Tulis Sendiri...)",
  disabled = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Synchronize internal state with external value
  useEffect(() => {
    if (!value) {
      return;
    }
    // Check if value exists in standard options
    const match = options.find((o) => o.toLowerCase() === value.toLowerCase());
    if (!match && value.trim() !== "") {
      setIsCustom(true);
    } else if (match) {
      setIsCustom(false);
    }
  }, [value, options]);

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

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectOption = (opt: string) => {
    if (opt === "__CUSTOM__") {
      setIsCustom(true);
      const initialVal = searchTerm.trim();
      onChange(initialVal);
      setSearchTerm("");
      setIsOpen(false);
      return;
    }
    setIsCustom(false);
    onChange(opt);
    setSearchTerm("");
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    if (isCustom) {
      onChange(text);
    } else {
      setSearchTerm(text);
      if (!isOpen) setIsOpen(true);
    }
  };

  const handleInputFocus = () => {
    if (!disabled && !isCustom) {
      setIsOpen(true);
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && (
        <label className="block text-[12px] font-semibold text-[#475569] mb-1.5 flex items-center justify-between">
          <span>
            {label} {required && <span className="text-red-500">*</span>}
          </span>
          {isCustom && (
            <button
              type="button"
              onClick={() => {
                setIsCustom(false);
                onChange("");
                setSearchTerm("");
                setIsOpen(true);
              }}
              className="text-[11px] text-blue-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <Icon name="list" className="text-xs" /> Pilih dari Master Data
            </button>
          )}
        </label>
      )}

      <div className="relative">
        {icon && (
          <Icon
            name={icon}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-[17px] pointer-events-none z-10"
          />
        )}

        {isCustom ? (
          /* Input Text Bebas Kustom */
          <div className="relative">
            <input
              required={required}
              disabled={disabled}
              value={value}
              onChange={handleInputChange}
              placeholder="Ketik kustom di sini..."
              className={`w-full h-10 ${icon ? "pl-9" : "pl-3"} pr-9 border-2 border-blue-400 bg-white rounded-xl text-[13px] text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium`}
            />
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <Icon name="cancel" className="text-base" />
              </button>
            )}
          </div>
        ) : (
          /* Searchable Select Input */
          <div
            onClick={handleInputFocus}
            className={`w-full h-10 ${icon ? "pl-9" : "pl-3"} pr-8 border border-[#e2e8f0] rounded-xl text-[13px] bg-[#f8fafc] hover:bg-white focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 flex items-center transition-all cursor-pointer ${
              disabled ? "opacity-60 pointer-events-none" : ""
            }`}
          >
            <input
              required={required && !value}
              disabled={disabled}
              value={isOpen ? searchTerm : value}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              placeholder={value || placeholder}
              className="w-full bg-transparent text-[#0f172a] focus:outline-none placeholder:text-slate-400 text-[13px] cursor-pointer"
            />

            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {value && !isOpen && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange("");
                    setSearchTerm("");
                  }}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer mr-0.5"
                >
                  <Icon name="cancel" className="text-base" />
                </button>
              )}
              <Icon
                name={isOpen ? "arrow_drop_up" : "arrow_drop_down"}
                className="text-[#94a3b8] text-[20px] pointer-events-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Dropdown Options Popup */}
      {isOpen && !isCustom && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto py-1.5 divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 flex items-center justify-between">
            <span>Daftar Pilihan Master Data</span>
            {searchTerm && <span>{filteredOptions.length} hasil</span>}
          </div>

          <div className="py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-[12px] text-slate-400 italic text-center">
                Tidak ada data yang cocok dengan "{searchTerm}"
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

          {/* Special Custom Option */}
          <div className="p-1 bg-slate-50/80">
            <div
              onClick={() => handleSelectOption("__CUSTOM__")}
              className="px-3 py-2 text-[12px] font-bold text-blue-700 bg-blue-50/60 hover:bg-blue-100/70 border border-blue-200/80 rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              <Icon name="edit_note" className="text-base text-blue-700" />
              <span>{customOptionLabel}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
