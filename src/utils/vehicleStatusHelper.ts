export interface VehicleStatusInfo {
  label: string;
  rawStatus: string;
  badgeClass: string;
  dotColor: string;
}

export function getVehicleStatusInfo(status: string | undefined | null): VehicleStatusInfo {
  const s = String(status || "").toLowerCase().trim();

  if (s === "available" || s === "tersedia") {
    return {
      label: "Tersedia",
      rawStatus: "Available",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      dotColor: "bg-emerald-500",
    };
  }

  if (
    s === "on trip" ||
    s === "ontrip" ||
    s === "in use" ||
    s === "in_use" ||
    s === "in transit" ||
    s === "in_transit" ||
    s === "dipakai" ||
    s === "sedang jalan" ||
    s === "on_going" ||
    s === "assigned"
  ) {
    return {
      label: "Sedang Berjalan",
      rawStatus: "On Trip",
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
      dotColor: "bg-blue-500 animate-pulse",
    };
  }

  if (s === "maintenance" || s === "servis" || s === "perbaikan") {
    return {
      label: "Dalam Perbaikan",
      rawStatus: "Maintenance",
      badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
      dotColor: "bg-amber-500",
    };
  }

  if (
    s === "decommissioned" ||
    s === "inactive" ||
    s === "tidak aktif" ||
    s === "afkir"
  ) {
    return {
      label: "Tidak Aktif",
      rawStatus: "Decommissioned",
      badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
      dotColor: "bg-slate-400",
    };
  }

  // Fallback
  return {
    label: status ? String(status) : "Tersedia",
    rawStatus: status ? String(status) : "Available",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    dotColor: "bg-slate-400",
  };
}
