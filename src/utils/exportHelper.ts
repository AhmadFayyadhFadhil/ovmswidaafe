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
 * Generates a native binary PDF file and downloads it instantly to the browser Downloads folder.
 * Zero print dialogs, zero step popups, zero prompt inputs!
 */
export function downloadItemPDF(title: string, item: Record<string, any>) {
  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    // Header Banner
    doc.setFillColor(30, 58, 138); // #1e3a8a
    doc.rect(0, 0, 210, 22, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("PT. WIDATRA BHAKTI", 14, 11);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("OPERATIONAL VEHICLE MANAGEMENT SYSTEM (OVMS)", 14, 17);

    // Document Title & Timestamp
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(title.toUpperCase(), 14, 32);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`Waktu Cetak: ${new Date().toLocaleString("id-ID")}`, 14, 37);

    // Table Contents
    const tableData = Object.entries(item)
      .filter(([_, val]) => val !== null && val !== undefined && val !== "")
      .map(([key, val]) => [key.replace(/_/g, " ").toUpperCase(), String(val)]);

    autoTable(doc, {
      startY: 42,
      head: [["PARAMETER DOCUMENT", "DETAIL INFORMASI VERIFIKASI"]],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9.5
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [15, 23, 42]
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 60, fillColor: [248, 250, 252] },
        1: { cellWidth: "auto" }
      },
      margin: { left: 14, right: 14 }
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 140;

    // Official Footer Notice
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      "Dokumen resmi ini diterbitkan secara otomatis oleh Sistem OVMS PT Widarta Bhakti dan berlaku sah.",
      14,
      finalY + 10
    );

    // DIRECT AUTOMATIC DOWNLOAD TO BROWSER DOWNLOADS FOLDER (1-CLICK)
    const cleanFilename = (title.endsWith(".pdf") ? title : `${title}.pdf`).replace(/[^a-zA-Z0-9_.-]/g, "_");
    doc.save(cleanFilename);
  } catch (err) {
    console.error("Gagal mendownload PDF langsung:", err);
  }
}
