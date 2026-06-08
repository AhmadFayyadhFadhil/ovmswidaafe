import { useState } from "react";
import { Layout, Icon } from "@/components/layout/RoleLayout";
import { useApi } from "@/hooks/useApi";
import { vehicleService } from "@/services/modules/vehicleService";

const getVehicleImage = (imageType: string) => {
  const map: Record<string, string> = {
    tesla: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=80&h=60&fit=crop",
    truck: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80&h=60&fit=crop",
    rav4: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=80&h=60&fit=crop",
    ranger: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=80&h=60&fit=crop",
    generic: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=80&h=60&fit=crop",
  };
  return map[imageType] || map.generic;
};

const getStatusColor = (status: string) => {
  return status === "AVAILABLE" ? "bg-[#dcfce7] text-[#16a34a]" : "bg-[#dbeafe] text-[#1d4ed8]";
};

export default function Vehicle({ onNavigate = () => {} }: { onNavigate?: (p: string) => void }) {
  const { data: vehicles, loading, error, refetch } = useApi(() => vehicleService.getAll());
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All Statuses");
  const [adding, setAdding] = useState(false);

  const handleDelete = async (id: string) => {
    try {
      await vehicleService.delete(id);
      refetch();
    } catch (err) {
      console.error("Failed to delete vehicle", err);
    }
  };

  const handleAddVehicle = async () => {
    setAdding(true);
    try {
      const newId = `V-${Math.floor(1000 + Math.random() * 9000)}`;
      await vehicleService.create({
        id: newId,
        model: "Tesla Model Y",
        plate: `B-${Math.floor(1000 + Math.random() * 9000)}-YYY`,
        type: "Electric SUV",
        driverId: "",
        driverName: "Unassigned",
        status: "AVAILABLE",
        battery: 100,
        fuelType: "Electric",
        odometer: 0,
        nextMaint: "Dec 12, 2024",
        imageType: "tesla",
      });
      refetch();
    } catch (err) {
      console.error("Failed to add vehicle", err);
    } finally {
      setAdding(false);
    }
  };

  const list = vehicles || [];

  const filtered = list
    .filter(v => status === "All Statuses" || v.status === status)
    .filter(v => v.model.toLowerCase().includes(search.toLowerCase()) || v.plate.toLowerCase().includes(search.toLowerCase()));

  const totalVehiclesCount = list.length;
  const availableCount = list.filter(v => v.status === "AVAILABLE").length;
  const inTransitCount = list.filter(v => v.status === "IN TRANSIT").length;

  return (
    <Layout
      activeNav="Vehicle Management"
      onNavigate={onNavigate}
      topbarTitle="Vehicle Management"
      searchPlaceholder="Search vehicles..."
    >
      <div className="p-6 space-y-5 animate-fadein">
        {/* Page Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[26px] font-bold text-[#0f172a]">Vehicle Fleet</h2>
            <p className="text-[13px] text-[#64748b] mt-1">Real-time oversight and asset optimization for your enterprise fleet.</p>
          </div>
          <button
            onClick={handleAddVehicle}
            disabled={adding}
            className="flex items-center gap-2 bg-[#1e3a8a] hover:bg-[#1e40af] text-white px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50"
          >
            <Icon name="add" className="text-[18px]" />
            {adding ? "Adding..." : "Add Vehicle"}
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Vehicles", value: totalVehiclesCount,  badgeColor: "bg-[#dcfce7] text-[#16a34a]", icon: "directions_car" },
            { label: "Active / In Transit", value: inTransitCount, badgeColor: "bg-[#dbeafe] text-[#1d4ed8]", icon: "commute" },
            { label: "Available", value: availableCount,           badgeColor: "bg-[#dcfce7] text-[#16a34a]", icon: "check_circle" },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-[#e8edf8] rounded-xl flex items-center justify-center">
                  <Icon name={c.icon} className="text-[#1e3a8a] text-[20px]" />
                </div>
              </div>
              <div className="text-[13px] text-[#64748b] font-medium">{c.label}</div>
              <div className="text-[32px] font-bold text-[#0f172a] leading-tight">{loading ? "..." : c.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#f1f5f9] flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-[16px]" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search fleet by ID, driver or model..."
                className="w-full h-9 pl-9 pr-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
              />
            </div>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="h-9 px-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[12px] font-semibold text-[#475569] focus:outline-none"
            >
              {["All Statuses", "AVAILABLE", "IN TRANSIT"].map(s => <option key={s}>{s}</option>)}
            </select>
            <select className="h-9 px-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[12px] font-semibold text-[#475569] focus:outline-none">
              <option>All Types</option>
              <option>Sedan</option>
              <option>SUV</option>
              <option>Truck</option>
            </select>
            <button
              onClick={() => { setSearch(""); setStatus("All Statuses"); }}
              className="h-9 px-4 border border-[#e2e8f0] rounded-lg text-[12px] font-bold text-[#475569] hover:bg-[#f1f5f9] transition-colors"
            >
              Reset
            </button>
          </div>

          {/* Table */}
          {loading ? (
            <div className="p-8 text-center text-[14px] text-[#64748b]">Loading vehicles...</div>
          ) : error ? (
            <div className="p-8 text-center text-[14px] text-red-500">Failed to load vehicles data.</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-[#f8fafc]">
                  {["VEHICLE INFO", "TYPE", "STATUS", "ODOMETER", "ACTIONS"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[10.5px] font-bold text-[#94a3b8] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(v => (
                  <tr key={v.id} className="border-t border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors group animate-slidein">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={getVehicleImage(v.imageType)}
                          alt=""
                          className="w-14 h-10 rounded-lg object-cover border border-[#e2e8f0]"
                          onError={e => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='40'%3E%3Crect width='56' height='40' fill='%23e2e8f0'/%3E%3C/svg%3E"; }}
                        />
                        <div>
                          <div className="text-[13px] font-bold text-[#0f172a]">{v.model}</div>
                          <div className="text-[11px] text-[#94a3b8]">{v.plate}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-[#475569]">{v.type}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(v.status)}`}>{v.status}</span>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] font-semibold text-[#0f172a]">{v.odometer.toLocaleString()} km</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button className="w-8 h-8 rounded-lg hover:bg-[#eff6ff] flex items-center justify-center transition-colors">
                          <Icon name="visibility" className="text-[#1e3a8a] text-[17px]" />
                        </button>
                        <button
                          onClick={() => handleDelete(v.id)}
                          className="w-8 h-8 rounded-lg hover:bg-[#fff1f2] flex items-center justify-center transition-colors"
                        >
                          <Icon name="delete" className="text-[#ef4444] text-[17px]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          <div className="px-5 py-3 border-t border-[#f1f5f9] flex items-center justify-between bg-[#fafbfc]">
            <span className="text-[12px] text-[#94a3b8]">Showing <b>1–{filtered.length}</b> of <b>{totalVehiclesCount}</b> vehicles</span>
            <div className="flex items-center gap-1.5">
              <button className="w-7 h-7 rounded border border-[#e2e8f0] flex items-center justify-center opacity-40" disabled>
                <Icon name="chevron_left" className="text-[18px]" />
              </button>
              {[1, 2, 3].map((n, i) => (
                <button key={i} className={`w-7 h-7 rounded text-[12px] font-semibold border transition-colors ${n === 1 ? "bg-[#1e3a8a] text-white border-[#1e3a8a]" : "border-[#e2e8f0] text-[#475569] hover:bg-[#f1f5f9]"}`}>{n}</button>
              ))}
              <button className="w-7 h-7 rounded border border-[#e2e8f0] flex items-center justify-center hover:bg-[#f1f5f9]">
                <Icon name="chevron_right" className="text-[18px]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}