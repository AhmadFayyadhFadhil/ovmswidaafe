// src/utils/exportHelper.ts

/**
 * Exports data array to a downloadable UTF-8 CSV file (with BOM & semicolon delimiter for seamless Excel support in Indonesia/Global locale)
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
 * Direct 1-Touch PDF Print/Download window helper using invisible iframe
 * Eliminates browser popup blocker restrictions for instant 1-click execution.
 */
export function downloadItemPDF(title: string, item: Record<string, any>) {
  // Create hidden iframe to bypass popup blocker
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.visibility = "hidden";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!iframeDoc) return;

  const fieldsHtml = Object.entries(item)
    .filter(([_, val]) => val !== null && val !== undefined && val !== "")
    .map(([key, val]) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569; width: 35%; background: #f8fafc;">${key.replace(/_/g, ' ')}</td>
        <td style="padding: 10px 14px; font-size: 13px; font-weight: 600; color: #0f172a;">${val}</td>
      </tr>
    `).join("");

  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 24px; color: #0f172a; }
          .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #1e3a8a; padding-bottom: 16px; margin-bottom: 20px; }
          .logo { font-size: 22px; font-weight: 900; color: #1e3a8a; letter-spacing: -0.5px; }
          .sub { font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-top: 2px; }
          .table-box { border: 1px solid #cbd5e1; border-radius: 10px; overflow: hidden; }
          table { width: 100%; border-collapse: collapse; text-align: left; }
          .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">PT. WIDATRA BHAKTI</div>
            <div class="sub">Operational Vehicle Management System (OVMS)</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 15px; font-weight: 800; color: #1e3a8a;">${title}</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 3px;">Tanggal Cetak: ${new Date().toLocaleString('id-ID')}</div>
          </div>
        </div>

        <div class="table-box">
          <table>
            <tbody>
              ${fieldsHtml}
            </tbody>
          </table>
        </div>

        <div class="footer">
          Dokumen resmi ini diterbitkan secara otomatis oleh Sistem OVMS PT Widarta Bhakti.
        </div>
      </body>
    </html>
  `);
  iframeDoc.close();

  // Trigger print dialog smoothly
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.error("PDF iframe print error", e);
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 3000);
    }
  }, 300);
}
