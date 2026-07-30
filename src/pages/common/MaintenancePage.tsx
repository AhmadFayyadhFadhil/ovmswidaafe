import { useNavigate } from "react-router-dom";

export default function MaintenancePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="max-w-lg w-full bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-center space-y-6 animate-fadein">
        {/* Header Icon */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 rounded-3xl flex items-center justify-center shadow-inner">
            <span className="material-symbols-outlined text-[44px] text-amber-400 animate-pulse">
              construction
            </span>
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center text-[10px] font-black shadow-md">
            ⚙️
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <span className="inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-extrabold tracking-wider uppercase rounded-full">
            Tahap Pemeliharaan Sistem
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Halaman Dalam Tahap Maintenance
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
            Halaman atau fitur ini sedang dalam tahap pemeliharaan / pengembangan sistem oleh tim IT. Silakan coba kembali beberapa saat lagi.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-2xl shadow-lg transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Coba Muat Ulang
          </button>

          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-6 py-3 bg-slate-700/80 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-2xl border border-slate-600 transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Kembali ke Halaman Sebelumnya
          </button>
        </div>

        {/* Footer Notice */}
        <div className="pt-4 border-t border-slate-700/50 text-[11px] text-slate-400">
          PT Widarta Bhakti • Operational Vehicle Management System
        </div>
      </div>
    </div>
  );
}
