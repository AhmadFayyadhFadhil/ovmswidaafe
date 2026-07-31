// src/utils/exportHelper.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
 * DIRECT AUTOMATIC PDF FILE DOWNLOAD (1-Click)
 * Generates an ultra-neat, publication-grade official PDF document directly into the browser Downloads folder.
 */
export function downloadItemPDF(title: string, item: Record<string, any>) {
  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    // Top Header Banner
    doc.setFillColor(30, 58, 138); // #1e3a8a
    doc.rect(0, 0, 210, 26, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.text("PT. WIDATRA BHAKTI", 14, 12);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.text("OPERATIONAL VEHICLE MANAGEMENT SYSTEM (OVMS)", 14, 18);

    doc.setFontSize(8);
    doc.text("Dokumen Resmi Penugasan & Keputusan Operasional", 14, 22);

    // Decorative Accent Line
    doc.setFillColor(234, 179, 8); // Gold accent
    doc.rect(0, 26, 210, 1.5, "F");

    // Document Title Box
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(title.toUpperCase(), 14, 37);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`Waktu Cetak: ${new Date().toLocaleString("id-ID")} WIB  |  Status: VERIFIED & OFFICIAL`, 14, 43);

    // Table Contents Format
    const tableData = Object.entries(item)
      .filter(([_, val]) => val !== null && val !== undefined && val !== "")
      .map(([key, val]) => [key.replace(/_/g, " ").toUpperCase(), String(val)]);

    autoTable(doc, {
      startY: 48,
      head: [["PARAMETER DOKUMEN", "DETAIL INFORMASI & SPESIFIKASI"]],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9.5,
        halign: "left",
        cellPadding: { top: 4, bottom: 4, left: 6, right: 6 }
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [15, 23, 42],
        lineColor: [226, 232, 240],
        lineWidth: 0.3,
        cellPadding: { top: 3.5, bottom: 3.5, left: 6, right: 6 }
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 65, fillColor: [248, 250, 252], textColor: [71, 85, 105] },
        1: { cellWidth: "auto" }
      },
      margin: { left: 14, right: 14 }
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 160;

    // Official Verification Block & Signature Line
    if (finalY + 35 < 280) {
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(14, finalY + 8, 196, finalY + 8);

      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "normal");
      doc.text("Disetujui Oleh System OVMS", 14, finalY + 14);
      doc.text("PT Widatra Bhakti Operational Command", 14, finalY + 18);

      doc.text("Tanda Tangan Digital / QR Verified", 140, finalY + 14);
      doc.text("PT. WIDATRA BHAKTI AUTHORIZED", 140, finalY + 18);
    }

    // Official Footer Notice
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      "Dokumen resmi ini diterbitkan secara sah dan otomatis oleh Sistem OVMS PT Widarta Bhakti. Hak Cipta Dilindungi.",
      14,
      287
    );

    // DIRECT AUTOMATIC DOWNLOAD TO BROWSER DOWNLOADS FOLDER (1-CLICK)
    const cleanFilename = (title.endsWith(".pdf") ? title : `${title}.pdf`).replace(/[^a-zA-Z0-9_.-]/g, "_");
    doc.save(cleanFilename);
  } catch (err) {
    console.error("Gagal mendownload PDF langsung:", err);
  }
}
