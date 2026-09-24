import { useState, useEffect } from "react";
import { Icon } from "@/components/layout/RoleLayout";
import { gaTeamApproverService, type GaTeamApproverItem } from "@/services/modules/gaTeamApproverService";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export function GaTeamApproverMasterModal({ isOpen, onClose, onUpdated }: Props) {
  const [approvers, setApprovers] = useState<GaTeamApproverItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [position, setPosition] = useState("");

  const fetchApprovers = async () => {
    setLoading(true);
    try {
      const res = await gaTeamApproverService.getAll({ active_only: false });
      setApprovers(res.data || []);
    } catch (err) {
      console.error("Gagal memuat master penyetujui GA Team:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchApprovers();
      setName("");
      setPosition("");
      setEditingId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      if (editingId) {
        await gaTeamApproverService.update(editingId, {
          name: name.trim(),
          position: position.trim() || undefined,
        });
      } else {
        await gaTeamApproverService.create({
          name: name.trim(),
          position: position.trim() || undefined,
        });
      }
      setName("");
      setPosition("");
      setEditingId(null);
      await fetchApprovers();
      if (onUpdated) onUpdated();
    } catch (err) {
      console.error("Gagal menyimpan data penyetujui:", err);
      alert("Gagal menyimpan data penyetujui GA Team.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item: GaTeamApproverItem) => {
    setEditingId(item.id);
    setName(item.name);
    setPosition(item.position || "");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName("");
    setPosition("");
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data penyetujui ini?")) return;
    try {
      await gaTeamApproverService.delete(id);
      await fetchApprovers();
      if (onUpdated) onUpdated();
    } catch (err) {
      console.error("Gagal menghapus:", err);
      alert("Gagal menghapus data penyetujui.");
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      await gaTeamApproverService.toggleActive(id);
      await fetchApprovers();
      if (onUpdated) onUpdated();
    } catch (err) {
      console.error("Gagal mengubah status:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadein">
      <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden border border-slate-200 shadow-2xl flex flex-col animate-scaleup">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Icon name="badge" className="text-xl" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Master Data Penyetujui GA Team
              </h3>
              <p className="text-xs text-slate-500">
                Kelola daftar resmi penyetujui alokasi armada (Akun GA Team Backup)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-white/60 transition-colors cursor-pointer"
          >
            <Icon name="close" className="text-xl" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-left">
          {/* Add / Edit Form */}
          <form onSubmit={handleSubmit} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Icon name={editingId ? "edit" : "add_circle"} className="text-blue-600 text-base" />
              <span>{editingId ? "Edit Penyetujui GA Team" : "Tambah Penyetujui Baru"}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Penyetujui <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Pak Agus / Melodi Bella Astria..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jabatan / Keterangan (Opsional)
                </label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="Contoh: GA Supervisor / GA Head..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-600 transition-colors cursor-pointer"
                >
                  Batal Edit
                </button>
              )}
              <button
                type="submit"
                disabled={submitting || !name.trim()}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                <Icon name={editingId ? "check" : "add"} className="text-sm" />
                <span>{editingId ? "Simpan Perubahan" : "Tambah Penyetujui"}</span>
              </button>
            </div>
          </form>

          {/* Table / List */}
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
              <span>Daftar Penyetujui GA Team Terdaftar ({approvers.length})</span>
            </div>

            {loading ? (
              <div className="py-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span>Memuat data master...</span>
              </div>
            ) : approvers.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                Belum ada data penyetujui GA Team. Silakan tambahkan melalui form di atas.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {approvers.map((item) => (
                  <div key={item.id} className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${item.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                        <Icon name="person" className="text-sm" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                          <span>{item.name}</span>
                          {item.position && (
                            <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                              {item.position}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Status: <span className={item.is_active ? "text-emerald-600 font-bold" : "text-slate-400"}>{item.is_active ? "Aktif" : "Non-Aktif"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(item.id)}
                        className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold cursor-pointer transition-colors ${item.is_active ? "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100" : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"}`}
                      >
                        {item.is_active ? "Non-aktifkan" : "Aktifkan"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Data"
                      >
                        <Icon name="edit" className="text-sm" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Data"
                      >
                        <Icon name="delete" className="text-sm" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Selesai / Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
