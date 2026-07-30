// src/utils/exportHelper.ts

/**
 * Exports data array to a downloadable UTF-8 CSV file (with BOM for native Excel support)
 */
export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(","))
  ].join("\n");

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
 * Triggers a formatted PDF document print/download window for a single item or report
 */
export function downloadItemPDF(title: string, item: Record<string, any>) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const fieldsHtml = Object.entries(item)
    .filter(([_, val]) => val !== null && val !== undefined && val !== "")
    .map(([key, val]) => `
      <div style="margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
        <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">${key.replace(/_/g, ' ')}</div>
        <div style="font-size: 13px; font-weight: 600; color: #0f172a; margin-top: 2px;">${val}</div>
      </div>
    `).join("");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #0f172a; }
          .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #1e3a8a; padding-bottom: 16px; margin-bottom: 24px; }
          .logo { font-size: 24px; font-weight: 900; color: #1e3a8a; }
          .sub { font-size: 12px; color: #64748b; font-weight: 600; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; }
          .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">OVMS Enterprise</div>
            <div class="sub">Operational Vehicle Management System</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 16px; font-weight: 800; color: #1e3a8a;">${title}</div>
            <div style="font-size: 11px; color: #64748b;">Generated: ${new Date().toLocaleString('id-ID')}</div>
          </div>
        </div>

        <div class="card">
          ${fieldsHtml}
        </div>

        <div class="footer">
          Dokumen resmi yang diterbitkan oleh sistem OVMS PT Widarta Bhakti.
        </div>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); }
          }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
