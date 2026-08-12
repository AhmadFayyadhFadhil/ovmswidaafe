import{n as e,t}from"./vendor-helpers-u9PAKso4.js";function n(e,t,n){let r=e=>e==null?``:String(e),i=`
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
          <tr>${t.map(e=>`<th style="background-color:#1e3a8a; color:#ffffff; font-weight:bold; text-align:center; padding:10px 14px; border:1px solid #0f172a; font-size:11pt; vertical-align:middle;">${e}</th>`).join(``)}</tr>
        </thead>
        <tbody>
          ${n.map(e=>`<tr>${e.map((e,n)=>{let i=r(e),a=(t[n]||``).toLowerCase(),o=`border:1px solid #cbd5e1; padding:8px 12px; font-size:10pt; vertical-align:middle;`;if(a.includes(`id request`)||n===0)o+=` text-align:center; font-weight:bold; color:#1e3a8a;`;else if(a.includes(`status`)){let e=i.toUpperCase();e.includes(`APPROV`)?o+=` background-color:#dcfce7; color:#15803d; font-weight:bold; text-align:center;`:e.includes(`PEND`)?o+=` background-color:#fef3c7; color:#b45309; font-weight:bold; text-align:center;`:e.includes(`CANCEL`)||e.includes(`REJECT`)?o+=` background-color:#fee2e2; color:#991b1b; font-weight:bold; text-align:center;`:o+=` text-align:center;`}else if(a.includes(`prior`)){let e=i.toUpperCase();e.includes(`HIGH`)||e.includes(`URGENT`)||e.includes(`CRITIC`)?o+=` background-color:#fee2e2; color:#991b1b; font-weight:bold; text-align:center;`:e.includes(`NORM`)?o+=` background-color:#e0f2fe; color:#0369a1; font-weight:bold; text-align:center;`:o+=` background-color:#f1f5f9; color:#475569; font-weight:bold; text-align:center;`}else a.includes(`jadwal`)||a.includes(`date`)?o+=` text-align:center;`:o+=` text-align:left; color:#0f172a;`;return`<td style="${o}">${i}</td>`}).join(``)}</tr>`).join(``)}
        </tbody>
      </table>
    </body>
    </html>
  `,a=new Blob([`﻿`+i],{type:`application/vnd.ms-excel;charset=utf-8`}),o=URL.createObjectURL(a),s=document.createElement(`a`);s.href=o;let c=e.endsWith(`.xls`)||e.endsWith(`.xlsx`)?e:`${e}.xls`;s.setAttribute(`download`,c),document.body.appendChild(s),s.click(),document.body.removeChild(s),URL.revokeObjectURL(o)}function r(e,t,n,r=`;`){let i=e=>e==null?`""`:`"${String(e).replace(/"/g,`""`)}"`,a=[t.map(i).join(r),...n.map(e=>e.map(i).join(r))].join(`\r
`),o=new Blob([`﻿`+a],{type:`text/csv;charset=utf-8;`}),s=URL.createObjectURL(o),c=document.createElement(`a`);c.setAttribute(`href`,s),c.setAttribute(`download`,e.endsWith(`.csv`)?e:`${e}.csv`),document.body.appendChild(c),c.click(),document.body.removeChild(c),URL.revokeObjectURL(s)}function i(n,r){try{let i=new e({orientation:`portrait`,unit:`mm`,format:`a4`});i.setFillColor(30,58,138),i.rect(0,0,210,26,`F`),i.setTextColor(255,255,255),i.setFontSize(15),i.setFont(`helvetica`,`bold`),i.text(`PT. WIDATRA BHAKTI`,14,12),i.setFontSize(8.5),i.setFont(`helvetica`,`normal`),i.text(`OPERATIONAL VEHICLE MANAGEMENT SYSTEM (OVMS)`,14,18),i.setFontSize(8),i.text(`Dokumen Resmi Penugasan & Keputusan Operasional`,14,22),i.setFillColor(234,179,8),i.rect(0,26,210,1.5,`F`),i.setTextColor(15,23,42),i.setFontSize(13),i.setFont(`helvetica`,`bold`),i.text(n.toUpperCase(),14,37),i.setFontSize(8.5),i.setFont(`helvetica`,`normal`),i.setTextColor(100,116,139),i.text(`Waktu Cetak: ${new Date().toLocaleString(`id-ID`)} WIB  |  Status: VERIFIED & OFFICIAL`,14,43),t(i,{startY:48,head:[[`PARAMETER DOKUMEN`,`DETAIL INFORMASI & SPESIFIKASI`]],body:Object.entries(r).filter(([e,t])=>t!=null&&t!==``).map(([e,t])=>[e.replace(/_/g,` `).toUpperCase(),String(t)]),theme:`grid`,headStyles:{fillColor:[30,58,138],textColor:[255,255,255],fontStyle:`bold`,fontSize:9.5,halign:`left`,cellPadding:{top:4,bottom:4,left:6,right:6}},bodyStyles:{fontSize:9,textColor:[15,23,42],lineColor:[226,232,240],lineWidth:.3,cellPadding:{top:3.5,bottom:3.5,left:6,right:6}},columnStyles:{0:{fontStyle:`bold`,cellWidth:65,fillColor:[248,250,252],textColor:[71,85,105]},1:{cellWidth:`auto`}},margin:{left:14,right:14}});let a=i.lastAutoTable?.finalY||160;a+35<280&&(i.setDrawColor(226,232,240),i.setLineWidth(.3),i.line(14,a+8,196,a+8),i.setFontSize(8),i.setTextColor(100,116,139),i.setFont(`helvetica`,`normal`),i.text(`Disetujui Oleh System OVMS`,14,a+14),i.text(`PT Widatra Bhakti Operational Command`,14,a+18),i.text(`Tanda Tangan Digital / QR Verified`,140,a+14),i.text(`PT. WIDATRA BHAKTI AUTHORIZED`,140,a+18)),i.setFontSize(7.5),i.setTextColor(148,163,184),i.text(`Dokumen resmi ini diterbitkan secara sah dan otomatis oleh Sistem OVMS PT Widarta Bhakti. Hak Cipta Dilindungi.`,14,287);let o=(n.endsWith(`.pdf`)?n:`${n}.pdf`).replace(/[^a-zA-Z0-9_.-]/g,`_`);i.save(o)}catch(e){console.error(`Gagal mendownload PDF langsung:`,e)}}export{r as n,n as r,i as t};