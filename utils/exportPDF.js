/**
 * ═══════════════════════════════════════════════════════════════
 *  UTILITÈ PDF — LA-PROBITE-BORLETTE
 *  Ekspòte tout rapò an PDF pwofesyonèl
 * ═══════════════════════════════════════════════════════════════
 */

export async function exportPDF({ titre, soustTitre='', colonnes=[], donnees=[], filtre='', logo=true }) {
  // Dynamic import pou evite SSR issues
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: colonnes.length > 6 ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const now   = new Date();

  // ── Header ──────────────────────────────────────────────────
  // Bann koulè
  doc.setFillColor(26, 115, 232); // #1a73e8
  doc.rect(0, 0, pageW, 32, 'F');

  // Logo / Nom sistèm
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('LA-PROBITE-BORLETTE', 14, 13);

  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.text('NEXTSTEPDIGITAL — Sistèm Jesyon Borlette', 14, 20);
  doc.text(`Jenere: ${now.toLocaleDateString('fr')} ${now.toLocaleTimeString('fr')}`, 14, 27);

  // Titre rapò (dwat)
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text(titre, pageW - 14, 13, { align: 'right' });
  if (soustTitre) {
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(soustTitre, pageW - 14, 20, { align: 'right' });
  }

  // Filtre info
  if (filtre) {
    doc.setFontSize(8);
    doc.text(filtre, pageW - 14, 27, { align: 'right' });
  }

  // ── Tableau ──────────────────────────────────────────────────
  autoTable(doc, {
    startY: 38,
    head: [colonnes.map(c => c.header || c)],
    body: donnees.map(row =>
      colonnes.map(c => {
        const val = typeof c === 'string' ? row[c] : row[c.key];
        if (val === null || val === undefined) return '—';
        if (c.format) return c.format(val, row);
        return String(val);
      })
    ),
    styles: {
      fontSize: 9,
      cellPadding: 4,
      lineColor: [220, 220, 220],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [26, 115, 232],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: colonnes.reduce((acc, c, i) => {
      if (c.width) acc[i] = { cellWidth: c.width };
      if (c.align) acc[i] = { ...(acc[i]||{}), halign: c.align };
      if (c.color) acc[i] = { ...(acc[i]||{}), textColor: c.color };
      return acc;
    }, {}),
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // Footer chak paj
      const totalPages = doc.internal.getNumberOfPages();
      const pageNum    = doc.internal.getCurrentPageInfo().pageNumber;
      const pageH = doc.internal.pageSize.getHeight();

      doc.setFillColor(245, 245, 245);
      doc.rect(0, pageH - 12, pageW, 12, 'F');
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.setFont(undefined, 'normal');
      doc.text('LA-PROBITE-BORLETTE © 2026 — NEXTSTEPDIGITAL', 14, pageH - 4);
      doc.text(`Paj ${pageNum} / ${totalPages}`, pageW - 14, pageH - 4, { align: 'right' });
      doc.text(now.toLocaleDateString('fr'), pageW / 2, pageH - 4, { align: 'center' });
    },
  });

  // ── Totals sipleman ─────────────────────────────────────────
  const totals = colonnes.filter(c => c.total);
  if (totals.length > 0 && donnees.length > 0) {
    const finalY = doc.lastAutoTable.finalY + 6;
    doc.setFillColor(26, 115, 232);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.rect(14, finalY, pageW - 28, 8, 'F');
    doc.text('TOTAL:', 18, finalY + 5.5);
    totals.forEach(c => {
      const sum = donnees.reduce((s, row) => s + (parseFloat(row[c.key]) || 0), 0);
      const colIdx = colonnes.indexOf(c);
      const colX   = 14 + (colIdx / colonnes.length) * (pageW - 28);
      doc.text(c.format ? c.format(sum) : sum.toLocaleString(), colX, finalY + 5.5);
    });
  }

  // ── Sove ────────────────────────────────────────────────────
  const fileName = `${titre.replace(/\s+/g, '-').toLowerCase()}-${now.toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
  return fileName;
}

/**
 * Bouton PDF reutilizab
 */
export function BoutonPDF({ onClick, label='📄 PDF', disabled=false, loading=false }) {
  return (
    <button onClick={onClick} disabled={disabled || loading}
      style={{
        padding: '8px 16px', background: disabled ? '#ccc' : '#dc2626',
        color: '#fff', border: 'none', borderRadius: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
      }}>
      {loading ? '⏳' : '📄'} {loading ? 'Jenerasyon...' : label}
    </button>
  );
}

/**
 * Ekspòte CSV rapid
 */
export function exportCSV({ titre, colonnes=[], donnees=[] }) {
  const headers = colonnes.map(c => c.header || c);
  const rows = donnees.map(row =>
    colonnes.map(c => {
      const val = typeof c === 'string' ? row[c] : row[c.key];
      if (val === null || val === undefined) return '';
      const str = c.format ? c.format(val, row) : String(val);
      return str.includes(',') ? `"${str}"` : str;
    }).join(',')
  );

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `${titre.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
