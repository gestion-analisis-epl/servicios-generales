'use client';

import { useRef, useState } from 'react';
import { MultiSelectFilter } from '@/components/MultiSelectFilter';
import type { GastoServicioRow } from '@/domain/usecases/GetGastosServicios';

type ColumnKey = keyof GastoServicioRow;

const SERVICIOS_COLUMNS: { key: ColumnKey; label: string; align?: 'right'; width?: number }[] = [
  { key: 'folio', label: 'Folio' },
  { key: 'fecha', label: 'Fecha' },
  { key: 'estatus', label: 'Estatus' },
  { key: 'codigo', label: 'Código' },
  { key: 'empresa', label: 'Empresa', width: 100 },
  { key: 'ciudad', label: 'Ciudad' },
  { key: 'categoria', label: 'Categoría' },
  { key: 'montoSolicitado', label: 'Solicitado', align: 'right' },
  { key: 'monto', label: 'Depositado', align: 'right' }
];

const DEFAULT_COL_WIDTH = 150;
const MIN_COL_WIDTH = 80;
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function displayValue(row: GastoServicioRow, key: ColumnKey): string {
  switch (key) {
    case 'monto':
      return formatMoney(row.monto);
    case 'montoSolicitado':
      return formatMoney(row.montoSolicitado);
    case 'fecha':
      return formatDate(row.fecha);
    case 'categoria':
      return row.categoria.toUpperCase();
    default:
      return String(row[key] ?? '');
  }
}

// Primera y última página siempre visibles, más la actual y sus vecinas; el resto se colapsa en "…".
function getPageItems(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set([1, total, current - 1, current, current + 1]);
  if (current <= 3) { pages.add(2); pages.add(3); pages.add(4); }
  if (current >= total - 2) { pages.add(total - 1); pages.add(total - 2); pages.add(total - 3); }

  const sorted = Array.from(pages).filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const items: (number | '…')[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) items.push('…');
    items.push(p);
  });
  return items;
}

export function ServiciosTable({ rows, onRowClick }: { rows: GastoServicioRow[]; onRowClick?: (row: GastoServicioRow) => void }) {
  const [sortKey, setSortKey] = useState<ColumnKey>('fecha');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [columnFilters, setColumnFilters] = useState<Partial<Record<ColumnKey, string[]>>>({});
  const [colWidths, setColWidths] = useState<Partial<Record<ColumnKey, number>>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const resizing = useRef<{ key: ColumnKey; startX: number; startWidth: number } | null>(null);

  const filtered = rows.filter((row) =>
    SERVICIOS_COLUMNS.every((col) => {
      const active = columnFilters[col.key];
      return !active || active.includes(displayValue(row, col.key));
    })
  );

  const sorted = [...filtered].sort((a, b) => {
    const va = a[sortKey];
    const vb = b[sortKey];
    const result = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), 'es');
    return sortDir === 'asc' ? result : -result;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pageRows = sorted.slice(start, start + pageSize);

  function toggleSort(key: ColumnKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  }

  function uniqueColumnValues(key: ColumnKey): string[] {
    return Array.from(new Set(rows.map((r) => displayValue(r, key)))).sort();
  }

  function onResizeStart(e: React.MouseEvent, key: ColumnKey) {
    e.preventDefault();
    e.stopPropagation();
    resizing.current = { key, startX: e.clientX, startWidth: colWidths[key] ?? SERVICIOS_COLUMNS.find((c) => c.key === key)?.width ?? DEFAULT_COL_WIDTH };
    document.addEventListener('mousemove', onResizeMove);
    document.addEventListener('mouseup', onResizeEnd);
  }

  function onResizeMove(e: MouseEvent) {
    const r = resizing.current;
    if (!r) return;
    const width = Math.max(MIN_COL_WIDTH, r.startWidth + (e.clientX - r.startX));
    setColWidths((w) => ({ ...w, [r.key]: width }));
  }

  function onResizeEnd() {
    resizing.current = null;
    document.removeEventListener('mousemove', onResizeMove);
    document.removeEventListener('mouseup', onResizeEnd);
  }

  return (
    <div>
      <div className="overflow-auto">
        <table
          className="text-[13px] border-collapse table-fixed"
          style={{ width: '100%', minWidth: SERVICIOS_COLUMNS.reduce((sum, col) => sum + (colWidths[col.key] ?? col.width ?? DEFAULT_COL_WIDTH), 0) }}
        >
          <colgroup>
            {SERVICIOS_COLUMNS.map((col) => (
              <col key={col.key} style={{ width: colWidths[col.key] ?? col.width ?? DEFAULT_COL_WIDTH }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {SERVICIOS_COLUMNS.map((col) => {
                const options = uniqueColumnValues(col.key);
                return (
                  <th key={col.key} className="relative text-left px-3 py-2.5 border-b border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-between gap-2 pr-2">
                      <span onClick={() => toggleSort(col.key)} className="cursor-pointer select-none text-slate-400 uppercase text-[11px] font-semibold whitespace-nowrap truncate">
                        {col.label} {sortKey === col.key ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                      </span>
                      <MultiSelectFilter
                        label=""
                        options={options}
                        value={columnFilters[col.key] ?? options}
                        onChange={(v) => { setColumnFilters((f) => ({ ...f, [col.key]: v })); setPage(1); }}
                        compact
                      />
                    </div>
                    <span
                      onMouseDown={(e) => onResizeStart(e, col.key)}
                      className="absolute top-0 -right-1.5 z-10 h-full w-3 cursor-col-resize flex justify-center group"
                    >
                      <span className="h-full w-0.5 group-hover:bg-indigo-400" />
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => (
              <tr
                key={`${row.folio}-${row.categoria}-${start + i}`}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={onRowClick ? 'cursor-pointer hover:bg-indigo-50/60' : undefined}
              >
                {SERVICIOS_COLUMNS.map((col) => (
                  <td
                    key={col.key}
                    className={`px-3 py-2.5 border-b border-slate-200 truncate ${col.align === 'right' ? 'text-right tabular-nums' : ''} ${col.key === 'codigo' ? 'font-semibold' : ''}`}
                  >
                    {displayValue(row, col.key) || '-'}
                  </td>
                ))}
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={SERVICIOS_COLUMNS.length} className="px-3 py-6 text-center text-slate-400">
                  Sin pagos de servicios para mostrar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between pt-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span>Mostrando {pageRows.length ? start + 1 : 0} a {start + pageRows.length} de {sorted.length}</span>
          <span className="text-slate-300">|</span>
          <label className="flex items-center gap-1.5">
            Filas por página
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="border border-slate-200 rounded-md px-1.5 py-1 text-xs"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1} className="min-w-7 h-7 rounded-md border border-slate-200 disabled:opacity-40">‹</button>
          {getPageItems(currentPage, totalPages).map((item, i) =>
            item === '…' ? (
              <span key={`gap-${i}`} className="min-w-7 h-7 flex items-center justify-center text-slate-400">…</span>
            ) : (
              <button key={item} onClick={() => setPage(item)} className={`min-w-7 h-7 rounded-md border text-xs ${item === currentPage ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200'}`}>{item}</button>
            )
          )}
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="min-w-7 h-7 rounded-md border border-slate-200 disabled:opacity-40">›</button>
        </div>
      </div>
    </div>
  );
}

export function formatMoney(value: number): string {
  return value.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
}

export function formatDate(value: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}
