import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

export interface Vehicle {
  id: string;
  name: string;
  plate: string;
  transmission: string;
  seats: number;
  fuel: number;
  image: string;
  status: "Available" | "On Trip" | "In Use";
  location: string;
  stnkPhotoUrl?: string;
}

interface VehiclePageProps {
  vehicles: Vehicle[];
  onSelectVehicle?: (vehicleId: string) => void;
  selectedAssignmentId?: string | null;
  selectedAssignmentRef?: string | null;
}

function StatusBadge({ s }: { s: Vehicle["status"] }) {
  const map: Record<Vehicle["status"], string> = {
    "Available": "bg-green-500 text-white",
    "On Trip":   "bg-blue-500 text-white",
    "In Use":    "bg-orange-500 text-white",
  };
  return (
    <span className={`absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full ${map[s] || "bg-gray-500 text-white"}`}>
      {s}
    </span>
  );
}

function VehicleDetailModal({ vehicle, assignmentRef, onCancel }: {
  vehicle: Vehicle;
  assignmentRef?: string | null;
  onCancel: () => void;
}) {
  const [showStnkLightbox, setShowStnkLightbox] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fadein relative" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#f1f5f9]">
          <div>
            <h3 className="text-[18px] font-bold text-[#0f172a]">Vehicle Detail</h3>
            <p className="text-[12px] text-[#94a3b8]">Informasi & spesifikasi kendaraan operasional</p>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f1f5f9] transition-colors cursor-pointer"
          >
            <Icon name="close" className="text-[20px] text-[#64748b]" />
          </button>
        </div>

        <div className="px-6 py-5">
          {assignmentRef && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-100 text-[#1e3a8a] text-[13px] font-semibold rounded-xl flex items-center gap-2">
              <Icon name="info" className="text-[18px]" />
              <span>Accepting assignment {assignmentRef} with this vehicle.</span>
            </div>
          )}

          {/* Vehicle card */}
          <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4 flex items-center gap-4 mb-5">
            <img
              src={vehicle.image} alt={vehicle.name}
              className="w-20 h-16 object-cover rounded-lg flex-shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/80x64?text=Car"; }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-bold text-[#0f172a]">{vehicle.name}</div>
              <div className="text-[12px] text-[#64748b] mb-2">Plate: {vehicle.plate}</div>
              <div className="flex gap-2 flex-wrap">
                <span className="text-[10px] font-bold bg-[#dbeafe] text-[#1d4ed8] px-2.5 py-0.5 rounded-full">
                  {vehicle.transmission}
                </span>
                <span className="text-[10px] font-bold bg-[#e2e8f0] text-[#334155] px-2.5 py-0.5 rounded-full">
                  {vehicle.seats} Seats
                </span>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between py-2.5 border-b border-[#f1f5f9]">
              <span className="text-[13px] text-[#64748b]">Transmission</span>
              <span className="text-[13px] font-semibold text-[#0f172a]">{vehicle.transmission}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-[#f1f5f9]">
              <span className="text-[13px] text-[#64748b]">Seats Capacity</span>
              <span className="text-[13px] font-semibold text-[#0f172a]">{vehicle.seats} seats</span>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-[#f1f5f9]">
              <span className="text-[13px] text-[#64748b]">Pickup Location</span>
              <span className="text-[13px] font-semibold text-[#0f172a]">{vehicle.location}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-[#f1f5f9]">
              <span className="text-[13px] text-[#64748b]">Status</span>
              <span className={`text-[12px] font-bold px-2.5 py-0.5 rounded-full ${
                vehicle.status === "Available" ? "bg-emerald-100 text-emerald-800" :
                vehicle.status === "On Trip" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"
              }`}>
                {vehicle.status}
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-[#f1f5f9]">
              <span className="text-[13px] text-[#64748b]">Dokumen STNK</span>
              {vehicle.stnkPhotoUrl ? (
                <button
                  type="button"
                  onClick={() => setShowStnkLightbox(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#eef2ff] hover:bg-[#dbeafe] text-[#1e3a8a] text-[11.5px] font-bold transition active:scale-95 cursor-pointer"
                >
                  <Icon name="visibility" className="text-[14px]" /> Lihat STNK
                </button>
              ) : (
                <span className="text-[11.5px] text-slate-400 font-medium italic">Belum Ada STNK</span>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end">
            <button
              onClick={onCancel}
              className="w-full h-11 bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-[13.5px] font-bold rounded-xl active:scale-95 transition-all shadow-xs cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        {/* Inner STNK Lightbox */}
        {showStnkLightbox && vehicle.stnkPhotoUrl && (
          <div className="fixed inset-0 bg-black/75 z-[99999] flex items-center justify-center p-4 animate-fadein" onClick={() => setShowStnkLightbox(false)}>
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative animate-fadein" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">Pratinjau STNK Armada</h3>
                  <p className="text-xs text-slate-400">{vehicle.name} • Plat: {vehicle.plate}</p>
                </div>
                <button onClick={() => setShowStnkLightbox(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 cursor-pointer">
                  <Icon name="close" className="text-lg" />
                </button>
              </div>

              <div className="bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center p-2 min-h-[220px]">
                <img
                  src={vehicle.stnkPhotoUrl}
                  alt={`STNK ${vehicle.name}`}
                  className="max-h-[380px] w-auto object-contain rounded-lg shadow-md"
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-[11px] text-slate-400 italic">Dokumen resmi STNK armada operasional</span>
                <button
                  onClick={() => setShowStnkLightbox(false)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function VehicleCard({ vehicle, onSelect }: { vehicle: Vehicle; onSelect: () => void }) {
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden hover:border-[#93c5fd] hover:shadow-md transition-all">
      {/* Image */}
      <div className="relative h-40 overflow-hidden bg-[#f1f5f9]">
        <img
          src={vehicle.image} alt={vehicle.name}
          className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x160?text=Vehicle"; }}
        />
        <StatusBadge s={vehicle.status} />
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="text-[15px] font-bold text-[#0f172a] mb-0.5">{vehicle.name}</div>
        <div className="text-[12px] text-[#64748b] mb-3">{vehicle.plate}</div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-[#64748b]">Transmission</span>
            <span className="font-semibold text-[#334155]">{vehicle.transmission}</span>
          </div>
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-[#64748b]">Seats</span>
            <span className="font-semibold text-[#334155]">{vehicle.seats} seats</span>
          </div>
        </div>

        <button
          onClick={onSelect}
          className="w-full h-10 text-[13px] font-bold rounded-xl transition-all bg-[#1e3a8a] text-white hover:bg-[#1e40af] active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Icon name="visibility" className="text-[16px]" />
          View Detail
        </button>
      </div>
    </div>
  );
}

export default function VehiclePage({ vehicles, selectedAssignmentId, selectedAssignmentRef }: VehiclePageProps) {
  const [tab, setTab]               = useState<"All Vehicles" | "Available" | "On Trip">("All Vehicles");
  const [search, setSearch]         = useState("");
  const [confirmVehicle, setConfirm] = useState<Vehicle | null>(null);

  const filtered = vehicles.filter((v) => {
    const matchTab =
      tab === "All Vehicles" ||
      (tab === "Available" && v.status === "Available") ||
      (tab === "On Trip"   && v.status === "On Trip");
    const q = search.toLowerCase();
    const matchQ = v.name.toLowerCase().includes(q) || v.plate.toLowerCase().includes(q);
    return matchTab && matchQ;
  });

  return (
    <div className="p-4 sm:p-8">
      {/* Search Input bar */}
      <div className="relative mb-6 max-w-md">
        <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-[18px]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search vehicle, plate..."
          className="w-full h-10 pl-9 pr-4 bg-white border border-[#e2e8f0] rounded-xl text-[13px] text-[#475569] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
        />
      </div>

      {selectedAssignmentId && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 text-[#1e3a8a] rounded-2xl flex items-center gap-3">
          <Icon name="info" className="text-[24px] flex-shrink-0" />
          <div>
            <div className="font-bold text-[14px]">Accepting Assignment {selectedAssignmentRef}</div>
            <div className="text-[12.5px] opacity-85">Please select an available vehicle from the list below to complete this approval.</div>
          </div>
        </div>
      )}

      <div>
        <div className="text-[18px] font-bold text-[#0f172a]">Operational Vehicles</div>
        <div className="text-[13px] text-[#64748b]">Daftar armada kendaraan operasional PT Widatra Bhakti.</div>
      </div>

      {/* Tab filter */}
      <div className="flex flex-wrap gap-2 mt-5 mb-6">
        {(["All Vehicles", "Available", "On Trip"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 h-9 rounded-xl text-[13px] font-semibold transition-all ${
              tab === t
                ? "bg-[#1e3a8a] text-white shadow-sm"
                : "bg-white border border-[#e2e8f0] text-[#64748b] hover:border-[#93c5fd] hover:text-[#334155]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-[#e2e8f0] rounded-2xl py-16 flex flex-col items-center">
          <Icon name="commute" className="text-[40px] text-[#cbd5e1] mb-2" />
          <p className="font-bold text-[#0f172a]">No vehicles found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filtered.map((v) => (
            <VehicleCard key={v.id} vehicle={v} onSelect={() => setConfirm(v)} />
          ))}
        </div>
      )}

      {/* Vehicle detail modal */}
      {confirmVehicle && (
        <VehicleDetailModal
          vehicle={confirmVehicle}
          assignmentRef={selectedAssignmentRef}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
