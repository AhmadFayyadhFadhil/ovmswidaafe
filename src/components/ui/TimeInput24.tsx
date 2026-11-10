import React, { useState, useRef, useEffect } from "react";
import { Icon } from "./Icon";

export interface TimeInput24Props {
  value?: string; // Formatted "HH:mm" e.g. "08:30" or ""
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  required?: boolean;
  align?: "left" | "right";
}

export function TimeInput24({
  value = "",
  onChange,
  placeholder = "--:--",
  disabled = false,
  className = "",
  id,
  name,
  required = false,
  align = "right",
}: TimeInput24Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [internalText, setInternalText] = useState(value || "");
  const containerRef = useRef<HTMLDivElement>(null);
  const hourListRef = useRef<HTMLDivElement>(null);

  // Sync internal text with incoming value prop
  useEffect(() => {
    setInternalText(value || "");
  }, [value]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Parse current hour and minute
  const currentParts = (internalText || "").split(":");
  const currentHour = currentParts[0] && currentParts[0].length === 2 ? currentParts[0] : "";
  const currentMinute = currentParts[1] && currentParts[1].length === 2 ? currentParts[1] : "";

  // Auto-scroll hour list to selected hour when opened
  useEffect(() => {
    if (isOpen && currentHour && hourListRef.current) {
      const selectedEl = hourListRef.current.querySelector(`[data-hour="${currentHour}"]`) as HTMLElement;
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    }
  }, [isOpen, currentHour]);

  // Helper to handle text typing with 24-hour auto-formatting
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const prev = internalText;

    // Detect deletion
    if (raw.length < prev.length) {
      // If deleted right after colon e.g. "14:" -> "14", remove the last hour digit as well -> "1"
      if (prev.endsWith(":") && raw === prev.slice(0, -1)) {
        const nextVal = prev.slice(0, -2);
        setInternalText(nextVal);
        if (nextVal.length === 5) onChange(nextVal);
        else if (nextVal.length === 0) onChange("");
        return;
      }
      setInternalText(raw);
      if (raw.length === 5) onChange(raw);
      else if (raw.length === 0) onChange("");
      return;
    }

    // Strip anything other than numbers
    const clean = raw.replace(/[^0-9]/g, "");
    if (clean.length === 0) {
      setInternalText("");
      onChange("");
      return;
    }

    let formatted = "";
    if (clean.length === 1) {
      const d = parseInt(clean, 10);
      if (d >= 3) {
        // Digits 3-9 can only be hours 03-09
        formatted = `0${d}:`;
      } else {
        formatted = clean;
      }
    } else if (clean.length === 2) {
      let h = parseInt(clean, 10);
      if (h > 23) h = 23;
      formatted = `${String(h).padStart(2, "0")}:`;
    } else if (clean.length === 3) {
      let h = parseInt(clean.substring(0, 2), 10);
      if (h > 23) h = 23;
      let mTens = parseInt(clean[2], 10);
      if (mTens > 5) mTens = 5;
      formatted = `${String(h).padStart(2, "0")}:${mTens}`;
    } else {
      let h = parseInt(clean.substring(0, 2), 10);
      if (h > 23) h = 23;
      let m = parseInt(clean.substring(2, 4), 10);
      if (m > 59) m = 59;
      formatted = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }

    setInternalText(formatted);
    if (formatted.length === 5) {
      onChange(formatted);
    }
  };

  // On blur, auto-pad incomplete time strings
  const handleBlur = () => {
    if (!internalText) return;
    const clean = internalText.replace(/[^0-9]/g, "");
    if (clean.length === 0) {
      setInternalText("");
      onChange("");
      return;
    }

    let finalTime = "";
    if (clean.length === 1 || clean.length === 2) {
      let h = parseInt(clean, 10);
      if (h > 23) h = 23;
      finalTime = `${String(h).padStart(2, "0")}:00`;
    } else if (clean.length === 3) {
      let h = parseInt(clean.substring(0, 2), 10);
      if (h > 23) h = 23;
      let mTens = parseInt(clean[2], 10);
      if (mTens > 5) mTens = 5;
      finalTime = `${String(h).padStart(2, "0")}:${mTens}0`;
    } else {
      let h = parseInt(clean.substring(0, 2), 10);
      if (h > 23) h = 23;
      let m = parseInt(clean.substring(2, 4), 10);
      if (m > 59) m = 59;
      finalTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }

    setInternalText(finalTime);
    onChange(finalTime);
  };

  const handleSelectHour = (hStr: string) => {
    const minPart = currentMinute || "00";
    const newTime = `${hStr}:${minPart}`;
    setInternalText(newTime);
    onChange(newTime);
  };

  const handleSelectMinute = (mStr: string) => {
    const hourPart = currentHour || "08";
    const newTime = `${hourPart}:${mStr}`;
    setInternalText(newTime);
    onChange(newTime);
    setIsOpen(false);
  };

  const handleSelectPreset = (timeStr: string) => {
    setInternalText(timeStr);
    onChange(timeStr);
    setIsOpen(false);
  };

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const minutes = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];
  const presets = ["07:30", "08:00", "09:00", "12:00", "13:00", "16:00", "17:00"];

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative flex items-center">
        <input
          type="text"
          inputMode="numeric"
          id={id}
          name={name}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          value={internalText}
          onChange={handleInputChange}
          onBlur={handleBlur}
          maxLength={5}
          className={`pr-8 ${className}`}
        />

        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => {
            if (!disabled) setIsOpen(!isOpen);
          }}
          title="Pilih Jam (24 Jam)"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#00236f] focus:outline-none p-0.5 cursor-pointer transition-colors"
        >
          <Icon name="schedule" className="text-[18px]" />
        </button>
      </div>

      {/* Popover 24-Hour Time Picker */}
      {isOpen && !disabled && (
        <div
          className={`absolute top-full mt-1.5 z-50 bg-white border border-slate-200 rounded-xl shadow-2xl p-3 w-[250px] animate-in fade-in zoom-in-95 duration-150 ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5 text-[#00236f] font-bold text-[11.5px]">
              <Icon name="schedule" className="text-[15px]" />
              <span>Format 24 Jam</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer transition-colors"
            >
              <Icon name="close" className="text-[14px]" />
            </button>
          </div>

          {/* Quick Presets */}
          <div className="mb-2.5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Pilihan Cepat
            </div>
            <div className="flex flex-wrap gap-1">
              {presets.map((p) => {
                const isActive = internalText === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className={`px-1.5 py-0.5 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#00236f] text-white shadow-2xs"
                        : "bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dual Columns: Jam & Menit */}
          <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-2">
            {/* Hours Column */}
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 text-center bg-slate-50 py-0.5 rounded">
                Jam (00-23)
              </div>
              <div
                ref={hourListRef}
                className="max-h-36 overflow-y-auto space-y-0.5 pr-1 text-center scrollbar-thin"
              >
                {hours.map((h) => {
                  const isSelected = currentHour === h;
                  return (
                    <button
                      key={h}
                      data-hour={h}
                      type="button"
                      onClick={() => handleSelectHour(h)}
                      className={`w-full py-1 text-[11.5px] rounded-lg transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-[#00236f] text-white font-bold"
                          : "text-slate-700 hover:bg-slate-100 font-medium"
                      }`}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Minutes Column */}
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 text-center bg-slate-50 py-0.5 rounded">
                Menit (00-55)
              </div>
              <div className="max-h-36 overflow-y-auto space-y-0.5 pr-1 text-center scrollbar-thin">
                {minutes.map((m) => {
                  const isSelected = currentMinute === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleSelectMinute(m)}
                      className={`w-full py-1 text-[11.5px] rounded-lg transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-blue-600 text-white font-bold"
                          : "text-slate-700 hover:bg-slate-100 font-medium"
                      }`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>Ketik langsung / pilih daftar</span>
            {internalText && (
              <button
                type="button"
                onClick={() => {
                  setInternalText("");
                  onChange("");
                }}
                className="text-red-500 hover:underline cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
