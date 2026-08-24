import React from "react";
import { getVehicleStatusInfo } from "@/utils/vehicleStatusHelper";

export interface VehicleStatusBadgeProps {
  status: string | undefined | null;
  className?: string;
  showDot?: boolean;
}

export function VehicleStatusBadge({
  status,
  className = "",
  showDot = true,
}: VehicleStatusBadgeProps) {
  const info = getVehicleStatusInfo(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-extrabold uppercase tracking-wide border shadow-2xs ${info.badgeClass} ${className}`}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${info.dotColor}`} />
      )}
      <span>{info.label}</span>
    </span>
  );
}
