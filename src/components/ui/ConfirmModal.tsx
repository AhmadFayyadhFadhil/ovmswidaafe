import React from "react";
import { Icon } from "./Icon";

export type ModalVariant = "success" | "danger" | "warning" | "info";

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ModalVariant;
  isLoading?: boolean;
  isAlertOnly?: boolean;
  inputNotes?: {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    label?: string;
  };
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Ya, Lanjutkan",
  cancelText = "Batal",
  variant = "info",
  isLoading = false,
  isAlertOnly = false,
  inputNotes,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return {
          icon: "check_circle",
          iconBg: "bg-emerald-50 text-emerald-600 border border-emerald-100",
          buttonBg: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20",
          ring: "focus:ring-emerald-500/20",
        };
      case "danger":
        return {
          icon: "warning",
          iconBg: "bg-rose-50 text-rose-600 border border-rose-100",
          buttonBg: "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20",
          ring: "focus:ring-rose-500/20",
        };
      case "warning":
        return {
          icon: "error_outline",
          iconBg: "bg-amber-50 text-amber-600 border border-amber-100",
          buttonBg: "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20",
          ring: "focus:ring-amber-500/20",
        };
      case "info":
      default:
        return {
          icon: "info",
          iconBg: "bg-blue-50 text-blue-600 border border-blue-100",
          buttonBg: "bg-[#1e3a8a] hover:bg-[#1e40af] text-white shadow-blue-900/20",
          ring: "focus:ring-blue-500/20",
        };
    }
  };

  const vStyles = getVariantStyles();

  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onConfirm) {
      await onConfirm();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadein">
      <div
        className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 max-w-sm sm:max-w-md w-full border border-slate-100 shadow-2xl animate-fadeup relative overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Icon Badge */}
        <div className="flex justify-center mb-4">
          <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-xs transition-transform hover:scale-105 ${vStyles.iconBg}`}>
            <Icon name={vStyles.icon} className="text-2xl sm:text-3xl" />
          </div>
        </div>

        {/* Content Header */}
        <div className="text-center space-y-1.5 mb-5">
          <h3 className="text-base sm:text-lg font-black text-slate-800 leading-snug">
            {title}
          </h3>
          <p className="text-xs sm:text-[13px] text-slate-500 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Form / Notes if provided */}
        <form onSubmit={handleConfirmSubmit} className="space-y-4">
          {inputNotes && (
            <div className="text-left space-y-1">
              <label className="block text-[11px] font-bold text-slate-700">
                {inputNotes.label || "Catatan Penjelasan (Opsional)"}
              </label>
              <textarea
                value={inputNotes.value}
                onChange={(e) => inputNotes.onChange(e.target.value)}
                placeholder={inputNotes.placeholder || "Tuliskan catatan penjelasan di sini..."}
                rows={3}
                className={`w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 ${vStyles.ring} transition-all`}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-1">
            {!isAlertOnly && (
              <button
                type="button"
                disabled={isLoading}
                onClick={onClose}
                className="w-full sm:flex-1 py-2.5 px-4 text-xs font-extrabold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer disabled:opacity-50 active:scale-95 text-center"
              >
                {cancelText}
              </button>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full sm:flex-1 py-2.5 px-4 text-xs font-extrabold rounded-xl transition-all cursor-pointer disabled:opacity-50 active:scale-95 shadow-md flex items-center justify-center gap-1.5 text-center ${vStyles.buttonBg}`}
            >
              {isLoading && <Icon name="sync" className="text-sm animate-spin" />}
              <span>{isLoading ? "Memproses..." : confirmText}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
