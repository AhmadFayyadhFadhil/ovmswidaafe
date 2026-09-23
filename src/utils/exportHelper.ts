// src/utils/exportHelper.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * EXPORT HIGH-QUALITY NATIVE EXCEL (.xls/.xlsx) WITH NEAT NAVY BLUE HEADERS, CELL BORDERS, AND COLORED BADGES
 * Matches corporate spreadsheet design (Navy Blue Header #1E3A8A, White Bold Text, Status & Priority Colors).
 */
export function exportToExcel(filename: string, headers: string[], rows: (string | number | boolean | null | undefined)[][]) {
  const clean = (val: any) => (val === null || val === undefined ? "" : String(val));

  const tableHeader = headers
    .map(h => `<th style="background-color:#1e3a8a; color:#ffffff; font-weight:bold; text-align:center; padding:10px 14px; border:1px solid #0f172a; font-size:11pt; vertical-align:middle;">${h}</th>`)
    .join("");

  const tableRows = rows
    .map(row => {
      const cells = row.map((cell, idx) => {
        const val = clean(cell);
        const headerName = (headers[idx] || "").toLowerCase();

        let cellStyle = "border:1px solid #cbd5e1; padding:8px 12px; font-size:10pt; vertical-align:middle;";

        if (headerName.includes("id request") || idx === 0) {
          cellStyle += " text-align:center; font-weight:bold; color:#1e3a8a;";
        } else if (headerName.includes("status")) {
          const upper = val.toUpperCase();
          if (upper.includes("APPROV")) {
            cellStyle += " background-color:#dcfce7; color:#15803d; font-weight:bold; text-align:center;";
          } else if (upper.includes("PEND")) {
            cellStyle += " background-color:#fef3c7; color:#b45309; font-weight:bold; text-align:center;";
          } else if (upper.includes("CANCEL") || upper.includes("REJECT")) {
            cellStyle += " background-color:#fee2e2; color:#991b1b; font-weight:bold; text-align:center;";
          } else {
            cellStyle += " text-align:center;";
          }
        } else if (headerName.includes("prior")) {
          const upper = val.toUpperCase();
          if (upper.includes("HIGH") || upper.includes("URGENT") || upper.includes("CRITIC")) {
            cellStyle += " background-color:#fee2e2; color:#991b1b; font-weight:bold; text-align:center;";
          } else if (upper.includes("NORM")) {
            cellStyle += " background-color:#e0f2fe; color:#0369a1; font-weight:bold; text-align:center;";
          } else {
            cellStyle += " background-color:#f1f5f9; color:#475569; font-weight:bold; text-align:center;";
          }
        } else if (headerName.includes("jadwal") || headerName.includes("date")) {
          cellStyle += " text-align:center;";
        } else {
          cellStyle += " text-align:left; color:#0f172a;";
        }

        return `<td style="${cellStyle}">${val}</td>`;
      }).join("");

      return `<tr>${cells}</tr>`;
    })
    .join("");

  const excelTemplate = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8" />
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Laporan OVMS</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        table { border-collapse: collapse; width: 100%; font-family: 'Segoe UI', Arial, sans-serif; }
      </style>
    </head>
    <body>
      <table>
        <thead>
          <tr>${tableHeader}</tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(["\uFEFF" + excelTemplate], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const cleanName = filename.endsWith(".xls") || filename.endsWith(".xlsx") ? filename : `${filename}.xls`;
  link.setAttribute("download", cleanName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports data array to a downloadable UTF-8 CSV file (with BOM & semicolon delimiter for seamless Excel support)
 */
export function exportToCSV(filename: string, headers: string[], rows: (string | number | boolean | null | undefined)[][], delimiter: string = ";") {
  const cleanStr = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvContent = [
    headers.map(cleanStr).join(delimiter),
    ...rows.map(row => row.map(cleanStr).join(delimiter))
  ].join("\r\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * DIRECT AUTOMATIC PDF FILE DOWNLOAD FOR VEHICLE REQUEST (1-Click)
 * Generates an ultra-neat, publication-grade official PDF document with QR Code & Passenger Details.
 */
export async function exportRequestPDF(request: any) {
  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Top Header Banner (Navy Blue #1E3A8A)
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, 210, 26, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.text("PT. WIDATRA BHAKTI", 14, 11);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.text("OPERATIONAL VEHICLE MANAGEMENT SYSTEM (OVMS)", 14, 17);

    doc.setFontSize(8);
    doc.text("Dokumen Resmi Penugasan & Keputusan Perjalanan Operasional", 14, 22);

    // Decorative Accent Line (Gold Accent)
    doc.setFillColor(234, 179, 8);
    doc.rect(0, 26, 210, 1.5, "F");

    // Document Title Box (Clean without underscores)
    const reqIdStr = `REQ-${request.id}`;
    const docTitle = `SURAT TUGAS PERJALANAN OPERASIONAL (#${reqIdStr})`;

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(docTitle, 14, 36);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`Waktu Cetak: ${new Date().toLocaleString("id-ID")} WIB  |  Status: VERIFIED & OFFICIAL`, 14, 41);

    // Format Passenger List
    let passengerStr = "";
    if (Array.isArray(request.passengers) && request.passengers.length > 0) {
      const firstPicIdx = request.passengers.findIndex((p: any) => p.is_pic === true || p.is_pic === 1 || p.is_pic === "1");
      const activePicIdx = firstPicIdx !== -1 ? firstPicIdx : 0;

      passengerStr = request.passengers
        .map((p: any, i: number) => {
          const isPic = i === activePicIdx;
          const picBadge = isPic ? " (PIC Penumpang)" : "";
          const dept = p.department_name || p.department_id || request.department || "";
          return `${i + 1}. ${p.name}${dept ? ` - ${dept}` : ""}${picBadge}`;
        })
        .join("\n");
    } else {
      passengerStr = `1. ${request.employee || "Pemohon"} - ${request.department || "General"} (PIC Penumpang)`;
    }

    // Format Approvals List
    let approvalText = "";
    if (Array.isArray(request.approvals) && request.approvals.length > 0) {
      approvalText = request.approvals
        .map((app: any) => {
          const isGaTeamStep = app.role === "ga_team" || app.role === "GA Team Backup" || (app.role === "hrd_head" && request.ga_approval_source === "ga_team");
          const roleName = isGaTeamStep ? "GA Team Backup" : (app.role === "dept_head" ? "Dep Head" : "GA Head");
          let approverName = app.approver?.name || "System";
          if (isGaTeamStep) {
            const spec = request.ga_approved_by_name || request.ga_approved_name;
            approverName = spec ? `GA Team oleh ${spec}` : "GA Team Backup";
          }
          return `${roleName}: ${app.status === "approved" ? "Disetujui" : app.status} (${approverName})`;
        })
        .join("\n");
    } else {
      approvalText = request.ga_approval_display_text || `Disetujui oleh GA Coordinator (${request.ga_approved_by_name || "Melodi Bella Astria"})`;
    }

    const rawSt = String(request.rawStatus || request.status || "APPROVED").toLowerCase();
    const idnStatus = rawSt === "completed" ? "SELESAI" : (rawSt === "on_going" ? "SEDANG PERJALANAN" : (rawSt === "rejected" ? "DITOLAK" : (rawSt === "cancelled" ? "DIBATALKAN" : "DISETUJUI / TERJADWAL")));

    const tableData: [string, string][] = [
      ["ID PERMOHONAN", `#${reqIdStr}`],
      ["STATUS PERJALANAN", idnStatus],
      ["NAMA PEMOHON", `${request.employee || "-"} (${request.department || "-"})`],
      ["NO. HP / WA PEMOHON", request.userPhone || request.email || "-"],
      ["TUJUAN PERJALANAN", request.destination || "-"],
      ["JADWAL KEBERANGKATAN", `${request.date || "-"} ${request.time || "09:00"}`],
      ["TIPE PERMOHONAN", Array.isArray(request.itineraries) && request.itineraries.length > 0 ? `Multi-Day Itinerary (${request.itineraries.length} Hari)` : (request.is_external ? "Pihak Ketiga (Sewa Eksternal)" : "Armada Internal")],
      ["DRIVER / PENGEMUDI", request.is_external ? (request.external_driver_name || "Sewa Eksternal") : (request.driverName || "Driver Internal")],
      ["KENDARAAN / ARMADA", request.is_external ? (request.external_provider ? `Sewa (${request.external_provider})` : "Sewa Eksternal") : (request.vehicleModel || "Armada Internal")],
      ["KEPERLUAN PERJALANAN", request.purpose || "-"],
      [`DAFTAR PENUMPANG (${request.passengerCount || (request.passengers?.length || 1)} ORANG)`, passengerStr],
      ["CATATAN / GA NOTES", request.notes || "-"],
      ["RIWAYAT PERSETUJUAN", approvalText],
    ];

    const fallbackStartKm = request.start_km ?? request.operational_trip?.start_km ?? (Array.isArray(request.operational_trips) && request.operational_trips[0]?.start_km) ?? (Array.isArray(request.itineraries) && request.itineraries[0]?.start_km);
    const fallbackEndKm = request.end_km ?? request.operational_trip?.end_km ?? (Array.isArray(request.operational_trips) && request.operational_trips[0]?.end_km) ?? (Array.isArray(request.itineraries) && request.itineraries[request.itineraries.length - 1]?.end_km);
    const fallbackTotalKm = request.total_km ?? request.operational_trip?.total_km ?? (Array.isArray(request.operational_trips) && request.operational_trips[0]?.total_km) ?? ((fallbackStartKm && fallbackEndKm) ? Math.max(0, Number(fallbackEndKm) - Number(fallbackStartKm)) : null);

    if (fallbackStartKm || fallbackEndKm) {
      const startKmStr = fallbackStartKm ? `${Number(fallbackStartKm).toLocaleString('id-ID')} km` : '-';
      const endKmStr = fallbackEndKm ? `${Number(fallbackEndKm).toLocaleString('id-ID')} km` : '-';
      const totalKmStr = fallbackTotalKm ? `${Number(fallbackTotalKm).toLocaleString('id-ID')} km` : '-';
      tableData.push(["DATA ODOMETER PERJALANAN", `KM Keluar: ${startKmStr} | KM Masuk: ${endKmStr} | Total Tempuh: ${totalKmStr}`]);
    }

    autoTable(doc, {
      startY: 46,
      head: [["PARAMETER DOKUMEN", "DETAIL INFORMASI & SPESIFIKASI"]],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
        halign: "left",
        cellPadding: { top: 3.5, bottom: 3.5, left: 5, right: 5 },
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [15, 23, 42],
        lineColor: [226, 232, 240],
        lineWidth: 0.3,
        cellPadding: { top: 3, bottom: 3, left: 5, right: 5 },
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 55, fillColor: [248, 250, 252], textColor: [71, 85, 105] },
        1: { cellWidth: "auto" },
      },
      margin: { left: 14, right: 14 },
    });

    let finalY = (doc as any).lastAutoTable?.finalY || 180;

    // QR Code Section
    const qrToken = request.qr_code_token || `REQ-${request.id}`;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/security/dashboard?token=${qrToken}`)}`;

    try {
      const qrDataUrl = await new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/png"));
          } else {
            reject(new Error("Canvas context null"));
          }
        };
        img.onerror = (e) => reject(e);
        img.src = qrApiUrl;
      });

      if (finalY + 36 > 275) {
        doc.addPage();
        finalY = 15;
      }

      // Draw QR Card Box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, finalY + 4, 182, 32, 3, 3, "FD");

      doc.addImage(qrDataUrl, "PNG", 18, finalY + 7, 26, 26);

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 58, 138);
      doc.text("QR CODE TIKET VERIFIKASI SECURITY POS GERBANG", 48, finalY + 13);

      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(`Token Verifikasi: ${qrToken}`, 48, finalY + 18);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("Tunjukkan QR Code ini kepada Petugas Pos Security saat Keluar / Masuk Gerbang.", 48, finalY + 23);

      finalY += 38;
    } catch (e) {
      if (finalY + 20 > 275) {
        doc.addPage();
        finalY = 15;
      }
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 58, 138);
      doc.text(`QR TOKEN VERIFIKASI SECURITY: ${qrToken}`, 14, finalY + 10);
      finalY += 15;
    }

    // Official Verification Line
    if (finalY + 22 < 280) {
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(14, finalY + 4, 196, finalY + 4);

      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "normal");
      doc.text("Disetujui Oleh System OVMS", 14, finalY + 9);
      doc.text("PT Widatra Bhakti Operational Command", 14, finalY + 13);

      doc.text("Tanda Tangan Digital / QR Verified", 140, finalY + 9);
      doc.text("PT. WIDATRA BHAKTI AUTHORIZED", 140, finalY + 13);
    }

    // Official Footer Notice
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      "Dokumen resmi ini diterbitkan secara sah dan otomatis oleh Sistem OVMS PT Widatra Bhakti. Hak Cipta Dilindungi.",
      14,
      287
    );

    const cleanFilename = `Surat_Tugas_REQ_${request.id}.pdf`;
    doc.save(cleanFilename);
  } catch (err) {
    console.error("Gagal mendownload PDF permohonan:", err);
    alert("Gagal mendownload PDF permohonan.");
  }
}

/**
 * DIRECT AUTOMATIC PDF FILE DOWNLOAD (Legacy Helper fallback)
 */
export function downloadItemPDF(title: string, item: Record<string, any>) {
  if (item && item.id && item.employee) {
    exportRequestPDF(item);
    return;
  }
  // Generic fallback if passed plain dict
  try {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, 210, 26, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.text("PT. WIDATRA BHAKTI", 14, 12);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.text("OPERATIONAL VEHICLE MANAGEMENT SYSTEM (OVMS)", 14, 18);

    doc.setFillColor(234, 179, 8);
    doc.rect(0, 26, 210, 1.5, "F");

    const cleanTitle = title.replace(/_/g, " ").replace(/\.pdf$/i, "");
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(cleanTitle.toUpperCase(), 14, 37);

    const tableData = Object.entries(item)
      .filter(([_, val]) => val !== null && val !== undefined && val !== "")
      .map(([key, val]) => [key.replace(/_/g, " ").toUpperCase(), String(val)]);

    autoTable(doc, {
      startY: 44,
      head: [["PARAMETER DOKUMEN", "DETAIL INFORMASI & SPESIFIKASI"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 8.5, textColor: [15, 23, 42] },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 60, fillColor: [248, 250, 252] } },
      margin: { left: 14, right: 14 },
    });

    const filename = `${cleanTitle.replace(/[^a-zA-Z0-9-]/g, "_")}.pdf`;
    doc.save(filename);
  } catch (e) {
    console.error(e);
  }
}

