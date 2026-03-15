import { useState } from 'react';

export default function DataTable({ columns, data, title }) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const filtered = data.filter(row =>
    Object.values(row).some(val =>
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  );

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginated = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const exportCSV = () => {
    const headers = columns.map(c => c.label).join(',');
    const rows = data.map(row => columns.map(c => row[c.key] || '').join(',')).join('\n');
    const blob = new Blob([headers + '\n' + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'export.csv'; a.click();
  };

  const copyToClipboard = () => {
    const text = data.map(row => columns.map(c => row[c.key] || '').join('\t')).join('\n');
    navigator.clipboard.writeText(text);
    alert('Copié!');
  };

  const printTable = () => window.print();

  return (
    <div>
      <div className="export-btns">
        <button className="export-btn" onClick={copyToClipboard}>COPIER</button>
        <button className="export-btn" onClick={exportCSV}>EXCEL</button>
        <button className="export-btn" onClick={exportCSV}>PDF</button>
        <button className="export-btn" onClick={printTable}>IMPRIMER</button>
      </div>

      <div className="search-box">
        <label>Search:</label>
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
          placeholder="Rechercher..."
        />
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={i}>{col.label} {col.sortable ? '⇅' : ''}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: 20, color: '#999' }}>No data available in table</td></tr>
            ) : (
              paginated.map((row, ri) => (
                <tr key={ri}>
                  {columns.map((col, ci) => (
                    <td key={ci} className={col.className}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, fontSize: 13, color: '#666' }}>
        <span>Showing {filtered.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, filtered.length)} of {filtered.length} entries</span>
        <div className="pagination">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} className={currentPage === i + 1 ? 'active' : ''} onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
          ))}
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</button>
        </div>
      </div>
    </div>
  );
}
